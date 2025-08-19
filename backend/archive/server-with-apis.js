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
  contentSecurityPolicy: false,
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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

// Database connection test
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.0.0-with-apis'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'RevivaTech API - Full Backend',
    version: '2.0.0-with-apis',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    features: ['authentication', 'bookings', 'devices', 'repairs']
  });
});

// Import API routes
const authRoutes = require('./routes/auth');
const bookingsRoutes = require('./routes/bookings');
const devicesRoutes = require('./routes/devices');
const repairsRoutes = require('./routes/repairs');

// Middleware to add pool and logger to request
const addMiddleware = (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
};

// Add API routes with middleware
app.use('/api/auth', addMiddleware, authRoutes);
app.use('/api/bookings', addMiddleware, bookingsRoutes);
app.use('/api/devices', addMiddleware, devicesRoutes);
app.use('/api/repairs', addMiddleware, repairsRoutes);

// Debug route (temporary)
const debugBookingRoutes = require('./routes/debug-booking');
app.use('/api/debug', addMiddleware, debugBookingRoutes);

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

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`RevivaTech Full Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Available APIs: /api/auth, /api/bookings, /api/devices, /api/repairs`);
});

module.exports = { app, pool };