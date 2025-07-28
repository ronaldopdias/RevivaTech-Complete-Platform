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
    const allowedOrigins = [
      'http://localhost:3010',
      'http://localhost:3000',
      'https://revivatech.co.uk',
      'https://www.revivatech.co.uk',
      'https://revivatech.com.br',
      'https://www.revivatech.com.br'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
    features: ['analytics', 'bookings']
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

// Basic booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    logger.info('Booking request received:', req.body);
    res.json({
      success: true,
      message: 'Booking endpoint available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Booking error:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

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