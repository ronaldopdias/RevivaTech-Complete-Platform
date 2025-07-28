const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const winston = require('winston');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3011;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'revivatech_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'revivatech_new',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5435,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Trust proxy for nginx
app.set('trust proxy', 1);

// Initialize core services (following RULE 1 - integrating existing services)
try {
  const EmailService = require('./services/EmailService');
  const EmailTemplateEngine = require('./services/EmailTemplateEngine');
  
  // Initialize services and make available to routes via app.locals
  app.locals.emailService = new EmailService();
  app.locals.templateEngine = new EmailTemplateEngine();
  
  // Note: NotificationService requires Socket.IO - will initialize separately
  logger.info('✅ Core services initialized and available via app.locals');
} catch (error) {
  logger.error('❌ Core service initialization failed:', error.message);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    logger.info(`CORS origin check: ${origin || 'undefined'}`);
    
    // Base allowed origins
    const baseOrigins = [
      'http://localhost:3010',
      'http://localhost:3000',
      'http://100.122.130.67:3010',  // Tailscale IP for development
      'https://revivatech.co.uk',
      'https://www.revivatech.co.uk',
      'https://revivatech.com.br',
      'https://www.revivatech.com.br'
    ];
    
    // Add environment-specific origins
    const envOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [];
    const allowedOrigins = [...baseOrigins, ...envOrigins];
    
    // In development mode, be more permissive
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment) {
      // No origin (server-to-server) - always allow
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Allow any localhost or 127.0.0.1 variations
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
      
      // Allow Tailscale IPs (100.x.x.x range)
      if (/^https?:\/\/100\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      
      // Allow Tailscale serve URLs (*.ts.net)
      if (origin.includes('.ts.net')) {
        callback(null, true);
        return;
      }
    }
    
    // Check explicit allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.0.0',
      analytics: 'enabled'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Comprehensive Health Monitoring System
const healthRoutes = require('./routes/health-comprehensive');
app.use('/api/health', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, healthRoutes);

// API info route
app.get('/api/info', (req, res) => {
  res.json({
    name: 'RevivaTech New Platform API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    features: ['analytics', 'auth', 'devices', 'customers', 'bookings', 'pricing', 'repairs']
  });
});

// Import and mount analytics routes
const analyticsRoutes = require('./routes/analytics-clean');
app.use('/api/analytics', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, analyticsRoutes);

// Import and mount print template routes (PHASE 3 - Print Framework)
try {
  const printTemplateRoutes = require('./routes/printTemplateRoutes');
  app.use('/api/print-templates', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, printTemplateRoutes);
  logger.info('✅ Print template routes mounted successfully - Phase 3 print framework activated');
} catch (error) {
  logger.error('❌ Print template routes not available:', error.message);
}

// Import and mount AI template suggestions routes (PHASE 3 - AI Suggestions)
try {
  const aiSuggestionsRoutes = require('./routes/aiTemplateSuggestionsRoutes');
  app.use('/api/ai-suggestions', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, aiSuggestionsRoutes);
  logger.info('✅ AI template suggestions routes mounted successfully - Phase 3 AI recommendations activated');
} catch (error) {
  logger.error('❌ AI template suggestions routes not available:', error.message);
}

// Import and mount Financial Intelligence routes (BUSINESS MODULE - $89K-127K value)
try {
  const revenueIntelligenceRoutes = require('./routes/revenue-intelligence');
  app.use('/api/revenue-intelligence', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, revenueIntelligenceRoutes);
  logger.info('✅ Financial Intelligence routes mounted successfully - Revenue analytics and forecasting activated');
} catch (error) {
  logger.error('❌ Financial Intelligence routes not available:', error.message);
}

// Import and mount Customer Segmentation routes (BUSINESS MODULE - $76K-98K value)
try {
  const customerSegmentationRoutes = require('./routes/customer-segmentation');
  app.use('/api/customer-segmentation', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, customerSegmentationRoutes);
  logger.info('✅ Customer Segmentation routes mounted successfully - Advanced CRM with AI segmentation activated');
} catch (error) {
  logger.error('❌ Customer Segmentation routes not available:', error.message);
}

// Import and mount other essential routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, authRoutes);
  logger.info('✅ Auth routes loaded successfully');
} catch (error) {
  logger.warn('❌ Auth routes not available:', error.message);
  logger.warn('Error details:', error);
}

// Import and mount device routes (CRITICAL - replaces MockDeviceService)
try {
  const deviceRoutes = require('./routes/devices');
  app.use('/api/devices', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, deviceRoutes);
  logger.info('✅ Device routes mounted successfully - MockDeviceService can be replaced');
} catch (error) {
  logger.error('❌ Device routes not available:', error.message);
}

// Import and mount customer routes (replaces MockCustomerService)
try {
  const customerRoutes = require('./routes/customers');
  app.use('/api/customers', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, customerRoutes);
  logger.info('✅ Customer routes mounted successfully - MockCustomerService can be replaced');
} catch (error) {
  logger.error('❌ Customer routes not available:', error.message);
}

// Import and mount booking routes (replaces MockBookingService)
try {
  const bookingRoutes = require('./routes/bookings');
  app.use('/api/bookings', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, bookingRoutes);
  logger.info('✅ Booking routes mounted successfully - MockBookingService can be replaced');
} catch (error) {
  logger.error('❌ Booking routes not available:', error.message);
  
  // Fallback basic booking endpoint if routes fail to load
  app.post('/api/bookings', async (req, res) => {
    try {
      logger.info('Fallback booking endpoint - Booking request received:', req.body);
      res.json({
        success: true,
        message: 'Fallback booking endpoint available',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Booking error:', error);
      res.status(500).json({ error: 'Booking failed' });
    }
  });
}

// Import and mount pricing routes
try {
  const pricingRoutes = require('./routes/pricing');
  app.use('/api/pricing', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, pricingRoutes);
  logger.info('✅ Pricing routes mounted successfully');
} catch (error) {
  logger.error('❌ Pricing routes not available:', error.message);
}

// Import and mount repair routes
try {
  const repairRoutes = require('./routes/repairs');
  app.use('/api/repairs', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, repairRoutes);
  logger.info('✅ Repair routes mounted successfully');
} catch (error) {
  logger.error('❌ Repair routes not available:', error.message);
}

// Import and mount admin routes (CRITICAL - unlocks complete business management platform)
try {
  const adminRoutes = require('./routes/admin/index');
  app.use('/api/admin', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, adminRoutes);
  logger.info('✅ Admin routes mounted successfully - Complete business management platform activated');
} catch (error) {
  logger.error('❌ Admin routes not available:', error.message);
}

// Import authentication middleware once
const { authenticateToken, requireRole } = require('./middleware/authentication');

// Import and mount users routes (CRITICAL - user management system)
try {
  const usersRoutes = require('./routes/users');
  app.use('/api/users', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, usersRoutes);
  logger.info('✅ Users routes mounted successfully - User management API activated');
} catch (error) {
  logger.error('❌ Users routes not available:', error.message);
}

// Import and mount email configuration routes (CRITICAL - email management system)
try {
  const emailConfigRoutes = require('./routes/email-config');
  
  app.use('/api/admin/email-config', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    authenticateToken,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    emailConfigRoutes
  );
  logger.info('✅ Email configuration routes mounted successfully');
} catch (error) {
  logger.error('❌ Email configuration routes not available:', error.message);
}

// Import and mount email accounts management routes (CRITICAL - comprehensive email account CRUD)
try {
  const emailAccountsRoutes = require('./routes/email-accounts');
  
  app.use('/api/admin/email-accounts', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    authenticateToken,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    emailAccountsRoutes
  );
  logger.info('✅ Email accounts management routes mounted successfully');
} catch (error) {
  logger.error('❌ Email accounts management routes not available:', error.message);
}

// Import and mount email template routes (CRITICAL - email template system with send-template endpoint)
try {
  const emailRoutes = require('./routes/email');
  
  app.use('/api/email', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    emailRoutes
  );
  logger.info('✅ Email template routes mounted successfully - /api/email/send-template activated');
} catch (error) {
  logger.error('❌ Email template routes not available:', error.message);
}

// Import and mount admin email routes (CRITICAL - admin email management interface)
try {
  const adminEmailRoutes = require('./routes/admin-email');
  
  app.use('/api/admin/email', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    authenticateToken,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    adminEmailRoutes
  );
  logger.info('✅ Admin email routes mounted successfully');
} catch (error) {
  logger.error('❌ Admin email routes not available:', error.message);
}

// Import and mount unified template routes (CRITICAL - unified template system)
try {
  const templateRoutes = require('./routes/templateRoutes');
  
  app.use('/api/templates', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    templateRoutes
  );
  logger.info('✅ Unified template routes mounted successfully - /api/templates activated');
} catch (error) {
  logger.error('❌ Unified template routes not available:', error.message);
}

// Import and mount email template routes (CRITICAL - EmailTemplateEngine API)
try {
  const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
  
  app.use('/api/email-templates', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    emailTemplateRoutes
  );
  logger.info('✅ Email template routes mounted successfully - EmailTemplateEngine activated');
} catch (error) {
  logger.error('❌ Email template routes not available:', error.message);
}

// Import and mount AI document routes (CRITICAL - AI Documentation Service)
try {
  const documentRoutes = require('./routes/documentRoutes');
  
  app.use('/api/documents', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    documentRoutes
  );
  logger.info('✅ AI document routes mounted successfully - AIDocumentationService activated');
} catch (error) {
  logger.error('❌ AI document routes not available:', error.message);
}

// Import and mount PDF generation routes (CRITICAL - PDF Template Service)
try {
  const pdfRoutes = require('./routes/pdfRoutes');
  
  app.use('/api/pdf', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    pdfRoutes
  );
  logger.info('✅ PDF generation routes mounted successfully - PDFTemplateService activated');
} catch (error) {
  logger.error('❌ PDF generation routes not available:', error.message);
}

// Import and mount multi-format export routes (CRITICAL - CSV/Excel/SMS Export Service)
try {
  const exportRoutes = require('./routes/exportRoutes');
  
  app.use('/api/export', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    exportRoutes
  );
  logger.info('✅ Multi-format export routes mounted successfully - CSV/Excel/SMS Export activated');
} catch (error) {
  logger.error('❌ Multi-format export routes not available:', error.message);
}

// Import and mount notification routes (CRITICAL - Real-time notification system)
try {
  const notificationRoutes = require('./routes/notifications');
  
  app.use('/api/notifications', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    notificationRoutes
  );
  logger.info('✅ Notification routes mounted successfully - Real-time notification system activated');
} catch (error) {
  logger.error('❌ Notification routes not available:', error.message);
}

// Import and mount AI notification routes (CRITICAL - AI-powered notification intelligence)
try {
  const aiNotificationRoutes = require('./routes/ai-notifications');
  
  app.use('/api/ai-notifications', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    aiNotificationRoutes
  );
  logger.info('✅ AI notification routes mounted successfully - AI notification intelligence activated');
} catch (error) {
  logger.error('❌ AI notification routes not available:', error.message);
}

// Import and mount template integration routes (CRITICAL - Template-Service connections)
try {
  const templateIntegrationRoutes = require('./routes/templateIntegrationRoutes');
  
  app.use('/api/template-integration', 
    (req, res, next) => {
      req.pool = pool;
      req.logger = logger;
      next();
    },
    templateIntegrationRoutes
  );
  logger.info('✅ Template integration routes mounted successfully - Template-Service connections activated');
} catch (error) {
  logger.error('❌ Template integration routes not available:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`RevivaTech Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;