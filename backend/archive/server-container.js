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
  database: process.env.DB_NAME || 'revivatech',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5435,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Trust proxy for nginx
app.set('trust proxy', 1);

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
    
    // Base allowed origins (NO hardcoded Tailscale IPs)
    const baseOrigins = [
      'http://localhost:3010',
      'http://localhost:3000',
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

// Import and mount other essential routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, authRoutes);
} catch (error) {
  logger.warn('Auth routes not available:', error.message);
}

// Import and mount device routes (CRITICAL - replaces MockDeviceService)
try {
  const deviceRoutes = require('./routes/devices');
  app.use('/api/devices', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, deviceRoutes);
  logger.info('Device routes mounted successfully - MockDeviceService can be replaced');
} catch (error) {
  logger.error('Device routes not available:', error.message);
}

// Import and mount customer routes (replaces MockCustomerService)
try {
  const customerRoutes = require('./routes/customers');
  app.use('/api/customers', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, customerRoutes);
  logger.info('Customer routes mounted successfully - MockCustomerService can be replaced');
} catch (error) {
  logger.error('Customer routes not available:', error.message);
}

// Import and mount booking routes (replaces MockBookingService)
try {
  const bookingRoutes = require('./routes/bookings');
  app.use('/api/bookings', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, bookingRoutes);
  logger.info('Booking routes mounted successfully - MockBookingService can be replaced');
} catch (error) {
  logger.error('Booking routes not available:', error.message);
  
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
  logger.info('Pricing routes mounted successfully');
} catch (error) {
  logger.error('Pricing routes not available:', error.message);
}

// Import and mount repair routes
try {
  const repairRoutes = require('./routes/repairs');
  app.use('/api/repairs', (req, res, next) => {
    req.pool = pool;
    req.logger = logger;
    next();
  }, repairRoutes);
  logger.info('Repair routes mounted successfully');
} catch (error) {
  logger.error('Repair routes not available:', error.message);
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