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

logger.info('🟢 Server.js started - logger initialized');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'revivatech',
  host: process.env.DB_HOST || 'revivatech_database',
  database: process.env.DB_NAME || 'revivatech',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5432,
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
      'http://localhost:3010',  // Development frontend
      'http://192.168.1.199:3010',  // Local network IP
      'http://100.122.130.67:3010',  // Tailscale IP
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
logger.info('✅ CORS middleware mounted successfully');

// Better Auth Implementation - Official Custom Express Handler
try {
  console.log('🔄 Starting Better Auth with custom Express handler...');
  
  const { betterAuthHandler } = require('./lib/better-auth-express-handler');
  
  console.log('✅ Better Auth Express handler loaded');
  
  // Add JSON body parsing specifically for Better Auth routes
  app.use('/api/auth/*', express.json());
  console.log('✅ JSON body parsing enabled for Better Auth routes');
  
  // Use custom Express handler that creates proper Web API Request objects
  // This approach uses Better Auth's official handler method
  app.all('/api/auth/*', betterAuthHandler);
  
  console.log('✅ Better Auth mounted at /api/auth/* using official handler API');
  logger.info('✅ Better Auth integration successful - using official APIs');
} catch (error) {
  logger.error('❌ Better Auth integration failed:', error.message);
  console.error('❌ Error details:', error.stack);
}

// Body parsing middleware (AFTER Better Auth)
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Contract Validation Middleware (PRISMA MIGRATION ENHANCEMENT)
try {
  const { checkApiCompliance, handlePrismaErrors, validateHealthEndpoint } = require('./middleware/api-contract-validation');
  
  // Add API compliance headers to all responses
  app.use(checkApiCompliance());
  
  // Add Prisma error handling for all routes
  app.use(handlePrismaErrors);
  
  // Special handling for health endpoints
  app.use('/health', validateHealthEndpoint);
  app.use('/api/health', validateHealthEndpoint);
  
  logger.info('✅ API Contract Validation middleware loaded successfully');
} catch (error) {
  logger.error('❌ API Contract Validation middleware failed to load:', error.message);
}

// Better Auth Test Routes (for development testing) - DISABLED - file not needed
// try {
//   const testBetterAuthRoutes = require('./routes/test-better-auth');
//   app.use('/api/test-auth', (req, res, next) => {
//   
//     req.logger = logger;
//     next();
//   }, testBetterAuthRoutes);
//   logger.info('✅ Better Auth test routes mounted at /api/test-auth');
// } catch (error) {
//   logger.error('❌ Failed to mount Better Auth test routes:', error);
// }

// Prisma Test Routes (for migration testing)
try {
  const testPrismaRoutes = require('./routes/test-prisma');
  app.use('/api/test-prisma', testPrismaRoutes);
  logger.info('✅ Prisma test routes mounted at /api/test-prisma');
} catch (error) {
  logger.error('❌ Failed to mount Prisma test routes:', error);
}

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

  req.logger = logger;
  next();
}, healthRoutes);

// Public analytics routes removed during cleanup - file was deleted

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
const { router: analyticsRoutes } = require('./routes/analytics');
app.use('/api/analytics', (req, res, next) => {

  req.logger = logger;
  next();
}, analyticsRoutes);

// Import and mount print template routes (PHASE 3 - Print Framework)
try {
  const printTemplateRoutes = require('./routes/printTemplateRoutes');
  app.use('/api/print-templates', (req, res, next) => {
  
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
  
    req.logger = logger;
    next();
  }, customerSegmentationRoutes);
  logger.info('✅ Customer Segmentation routes mounted successfully - Advanced CRM with AI segmentation activated');
} catch (error) {
  logger.error('❌ Customer Segmentation routes not available:', error.message);
}

// Better Auth already mounted above before express.json() middleware

// Import and mount device routes (CRITICAL - replaces MockDeviceService)
try {
  const deviceRoutes = require('./routes/devices');
  app.use('/api/devices', (req, res, next) => {
  
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
  
    req.logger = logger;
    next();
  }, customerRoutes);
  logger.info('✅ Customer routes mounted successfully - MockCustomerService can be replaced');
} catch (error) {
  logger.error('❌ Customer routes not available:', error.message);
}

// Import and mount inventory management routes (replaces mock inventory data)
try {
  const inventoryRoutes = require('./routes/inventory-management');
  app.use('/api/inventory', (req, res, next) => {
  
    req.logger = logger;
    next();
  }, inventoryRoutes);
  logger.info('✅ Inventory management routes mounted successfully - Mock inventory data can be replaced');
} catch (error) {
  logger.error('❌ Inventory management routes not available:', error.message);
}

// Import and mount booking routes (replaces MockBookingService)
try {
  const bookingRoutes = require('./routes/bookings');
  app.use('/api/bookings', (req, res, next) => {
  
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
  
    req.logger = logger;
    next();
  }, pricingRoutes);
  logger.info('✅ Pricing routes mounted successfully');
} catch (error) {
  logger.error('❌ Pricing routes not available:', error.message);
}

// Import and mount repair routes (Prisma-based)
try {
  const repairRoutes = require('./routes/repairs');
  app.use('/api/repairs', (req, res, next) => {
    req.logger = logger;
    next();
  }, repairRoutes);
  logger.info('✅ Repair routes (Prisma) mounted successfully');
} catch (error) {
  logger.error('❌ Repair routes not available:', error.message);
}

// Import and mount admin routes (CRITICAL - unlocks complete business management platform)
try {
  const adminRoutes = require('./routes/admin/index');
  app.use('/api/admin', (req, res, next) => {
  
    req.logger = logger;
    next();
  }, adminRoutes);
  logger.info('✅ Admin routes mounted successfully - Complete business management platform activated');
} catch (error) {
  logger.error('❌ Admin routes not available:', error.message);
}

// Development bypass for admin dashboard analytics (temporary)
if (process.env.NODE_ENV === 'development') {
  try {
    const adminAnalyticsRoutes = require('./routes/admin/analytics');
    app.use('/api/dev/admin/analytics', (req, res, next) => {
    
      req.logger = logger;
      console.log('🧪 DEV: Bypassing admin auth for analytics');
      next();
    }, adminAnalyticsRoutes);
    logger.info('🧪 DEV: Admin analytics bypass mounted at /api/dev/admin/analytics');
  } catch (error) {
    logger.error('❌ DEV analytics bypass failed:', error.message);
  }

  // Development bypass for analytics events (temporary)
  try {
    const analyticsDevRoutes = require('./routes/analytics-dev');
    app.use('/api/dev/analytics', (req, res, next) => {
    
      req.logger = logger;
      next();
    }, analyticsDevRoutes);
    logger.info('🧪 DEV: Analytics events bypass mounted at /api/dev/analytics');
  } catch (error) {
    logger.error('❌ DEV analytics events bypass failed:', error.message);
  }

  // Development bypass for admin repairs stats (temporary)
  app.get('/api/dev/admin/repairs/stats/overview', async (req, res) => {
    try {
    
      req.logger = logger;
      console.log('🧪 DEV: Bypassing admin auth for repair stats');
      
      const statsQuery = `
        SELECT 
          COUNT(*) as total_repairs,
          COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending_repairs,
          COUNT(CASE WHEN booking_status = 'in_progress' THEN 1 END) as in_progress_repairs,
          COUNT(CASE WHEN booking_status = 'ready_for_pickup' THEN 1 END) as ready_for_pickup,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_repairs,
          AVG(CASE 
            WHEN booking_status = 'completed' AND actual_completion IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (actual_completion - created_at)) / 3600 
          END) as avg_completion_hours,
          AVG(quote_total_price) as average_price
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;

      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      // Convert strings to numbers
      stats.total_repairs = parseInt(stats.total_repairs);
      stats.pending_repairs = parseInt(stats.pending_repairs);
      stats.in_progress_repairs = parseInt(stats.in_progress_repairs);
      stats.ready_for_pickup = parseInt(stats.ready_for_pickup);
      stats.completed_repairs = parseInt(stats.completed_repairs);
      stats.avg_completion_hours = parseFloat(stats.avg_completion_hours) || 0;
      stats.average_price = parseFloat(stats.average_price) || 0;

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('🔥 DEV REPAIR STATS ERROR:', error);
      res.status(500).json({
        error: 'Failed to fetch repair statistics',
        code: 'FETCH_REPAIR_STATS_ERROR',
        details: error.message
      });
    }
  });

  // Development bypass for admin bookings stats (temporary)
  app.get('/api/dev/admin/bookings/stats/overview', async (req, res) => {
    try {
    
      req.logger = logger;
      console.log('🧪 DEV: Bypassing admin auth for booking stats');
      
      const statsQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(DISTINCT customer_id) as active_customers,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_customers_today,
          COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN booking_status = 'in_progress' THEN 1 END) as in_progress_bookings,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_bookings,
          AVG(CASE 
            WHEN booking_status = 'completed' AND actual_completion IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (actual_completion - created_at)) / 3600 
          END) as avg_completion_time,
          SUM(COALESCE(quote_total_price, 0)) as total_revenue,
          AVG(COALESCE(quote_total_price, 0)) as avg_order_value,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) * 100.0 / COUNT(*)
            ELSE 0 
          END as completion_rate,
          0 as low_stock_items
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;

      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      // Convert strings to numbers
      stats.total_bookings = parseInt(stats.total_bookings);
      stats.active_customers = parseInt(stats.active_customers);
      stats.new_customers_today = parseInt(stats.new_customers_today);
      stats.pending_bookings = parseInt(stats.pending_bookings);
      stats.in_progress_bookings = parseInt(stats.in_progress_bookings);
      stats.completed_bookings = parseInt(stats.completed_bookings);
      stats.cancelled_bookings = parseInt(stats.cancelled_bookings);
      stats.avg_completion_time = parseFloat(stats.avg_completion_time) || 0;
      stats.total_revenue = parseFloat(stats.total_revenue) || 0;
      stats.avg_order_value = parseFloat(stats.avg_order_value) || 0;
      stats.completion_rate = parseFloat(stats.completion_rate) || 0;
      stats.low_stock_items = parseInt(stats.low_stock_items);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('🔥 DEV BOOKING STATS ERROR:', error);
      res.status(500).json({
        error: 'Failed to fetch booking statistics',
        code: 'FETCH_BOOKING_STATS_ERROR',
        details: error.message
      });
    }
  });
}

// Better Auth handles authentication internally - no custom middleware needed
// Old custom middleware removed to follow Better Auth official patterns

// Import and mount users routes (CRITICAL - user management system)
try {
  const usersRoutes = require('./routes/users');
  app.use('/api/users', (req, res, next) => {
  
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
    
      req.logger = logger;
      next();
    },
    // TODO: Add Better Auth middleware for admin routes
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
    
      req.logger = logger;
      next();
    },
    // TODO: Add Better Auth middleware for admin routes
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
    
      req.logger = logger;
      next();
    },
    // TODO: Add Better Auth middleware for admin routes
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
    
      req.logger = logger;
      next();
    },
    emailTemplateRoutes
  );
  logger.info('✅ Email template routes mounted successfully - EmailTemplateEngine activated');
} catch (error) {
  logger.error('❌ Email template routes not available:', error.message);
}

// Import and mount template scanner routes
try {
  const templateScannerRoutes = require('./routes/templateScannerRoutes');
  
  app.use('/api/template-scanner', 
    (req, res, next) => {
    
      req.logger = logger;
      next();
    },
    templateScannerRoutes
  );
  logger.info('✅ Template scanner routes mounted successfully');
} catch (error) {
  logger.error('❌ Template scanner routes not available:', error.message);
}

// Import and mount SMS template routes
try {
  const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
  
  app.use('/api/sms-templates', 
    (req, res, next) => {
    
      req.logger = logger;
      next();
    },
    smsTemplateRoutes
  );
  logger.info('✅ SMS template routes mounted successfully');
} catch (error) {
  logger.error('❌ SMS template routes not available:', error.message);
}

// Import and mount PDF template routes
try {
  const pdfTemplateRoutes = require('./routes/pdfTemplateRoutes');
  
  app.use('/api/pdf-templates', 
    (req, res, next) => {
    
      req.logger = logger;
      next();
    },
    pdfTemplateRoutes
  );
  logger.info('✅ PDF template routes mounted successfully');
} catch (error) {
  logger.error('❌ PDF template routes not available:', error.message);
}

// Import and mount AI document routes (CRITICAL - AI Documentation Service)
try {
  const documentRoutes = require('./routes/documentRoutes');
  
  app.use('/api/documents', 
    (req, res, next) => {
    
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
    
      req.logger = logger;
      next();
    },
    templateIntegrationRoutes
  );
  logger.info('✅ Template integration routes mounted successfully - Template-Service connections activated');
} catch (error) {
  logger.error('❌ Template integration routes not available:', error.message);
}

// PHASE 6 STEP 4: ADVANCED ENTERPRISE FEATURES
// AI Advanced Features (ML-enhanced chatbot, recommendations, personalization)
try {
  const aiAdvancedRoutes = require('./routes/ai-advanced');
  app.use('/api/ai-advanced', (req, res, next) => {
  
    req.logger = logger;
    next();
  }, aiAdvancedRoutes);
  logger.info('✅ AI Advanced Features mounted successfully - ML chatbot, recommendations, and personalization activated');
} catch (error) {
  logger.error('❌ AI Advanced Features not available:', error.message);
}

// Automation Integration (Cross-service workflow automation)
try {
  const automationRoutes = require('./routes/automation-integration');
  app.use('/api/automation', (req, res, next) => {
  
    req.logger = logger;
    next();
  }, automationRoutes);
  logger.info('✅ Automation Integration mounted successfully - Cross-service workflow automation activated');
} catch (error) {
  logger.error('❌ Automation Integration not available:', error.message);
}

// Two-Factor Authentication Routes
try {
  const twoFactorRoutes = require('./routes/two-factor');
  app.use('/api/two-factor', (req, res, next) => {
    req.logger = logger;
    next();
  }, twoFactorRoutes);
  logger.info('✅ Enhanced 2FA system mounted successfully - TOTP, backup codes, and comprehensive management activated');
} catch (error) {
  logger.error('❌ Two-Factor Authentication not available:', error.message);
}

// Advanced Role Management Routes
try {
  const rolesRoutes = require('./routes/roles');
  app.use('/api/roles', (req, res, next) => {
    req.logger = logger;
    next();
  }, rolesRoutes);
  logger.info('✅ Advanced role management system mounted successfully - Dynamic permissions, role inheritance, and resource-based access control activated');
} catch (error) {
  logger.error('❌ Advanced role management not available:', error.message);
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

// Start server with Socket.IO support
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Use same CORS logic as Express
      const baseOrigins = [
        'http://localhost:3010',
        'http://localhost:3000',
        'http://192.168.1.199:3010',
        'http://100.122.130.67:3010',
        'https://revivatech.co.uk',
        'https://www.revivatech.co.uk'
      ];
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      if (isDevelopment || !origin || baseOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true
  },
  path: '/analytics/socket.io/'
});

// Real-time analytics namespace
const analyticsNamespace = io.of('/analytics');
analyticsNamespace.on('connection', (socket) => {
  logger.info(`Analytics WebSocket connected: ${socket.id}`);
  
  socket.on('subscribe_dashboard', () => {
    socket.join('admin_dashboard');
    logger.info(`Socket ${socket.id} subscribed to admin dashboard`);
  });
  
  socket.on('subscribe_metrics', () => {
    socket.join('metrics_updates');
    logger.info(`Socket ${socket.id} subscribed to metrics updates`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Analytics WebSocket disconnected: ${socket.id}`);
  });
});

// Make Socket.IO available to routes
app.locals.io = io;
app.locals.analyticsNamespace = analyticsNamespace;

server.listen(PORT, () => {
  logger.info(`RevivaTech Backend with Socket.IO running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Analytics WebSocket available at /analytics/socket.io/`);
});

module.exports = app;