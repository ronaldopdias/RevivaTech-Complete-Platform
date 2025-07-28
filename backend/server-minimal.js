const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('redis');
const winston = require('winston');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Communication Services
const NotificationService = require('./services/NotificationService');
const ChatService = require('./services/ChatService');

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3011;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3010',
      'http://localhost:3000',
      'https://revivatech.co.uk',
      'https://www.revivatech.co.uk',
      'https://revivatech.com.br',
      'https://www.revivatech.com.br'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Simple Email Service for booking confirmations
const EmailService = require('./services/EmailService');
let emailService;

// Initialize email service with proper fallback handling
(async () => {
  try {
    emailService = new EmailService({
      provider: 'sendgrid', // Will fallback to nodemailer if SendGrid fails
      enableSandbox: process.env.NODE_ENV !== 'production',
      enableTracking: true
    });
    
    const initialized = await emailService.initialize();
    
    if (initialized) {
      logger.info('✅ Email Service initialized successfully');
    } else {
      logger.warn('⚠️ Email Service using mock mode for development');
      // The service itself handles mock mode internally
    }
  } catch (error) {
    logger.error('❌ Email Service initialization completely failed:', error.message);
    // Create a simple mock email service as last resort
    emailService = {
      sendEmail: async (emailData) => {
        logger.info(`📧 [FALLBACK MOCK] Email would be sent to: ${emailData.to}`);
        logger.info(`📧 [FALLBACK MOCK] Subject: ${emailData.subject}`);
        logger.info(`📧 [FALLBACK MOCK] Email ID: ${emailData.id || 'no-id'}`);
        return {
          success: true,
          messageId: `fallback_mock_${Date.now()}`,
          timestamp: Date.now()
        };
      },
      healthCheck: async () => ({
        status: 'mock',
        provider: 'fallback',
        initialized: false,
        timestamp: Date.now()
      })
    };
  }
})();

// Initialize Communication Services
let notificationService;
let chatService;

(async () => {
  try {
    // Initialize notification service with Socket.IO
    notificationService = new NotificationService(io);
    
    // Initialize chat service with Socket.IO
    chatService = new ChatService(io);
    
    // Make services available to routes
    app.locals.notificationService = notificationService;
    app.locals.chatService = chatService;
    
    logger.info('✅ Communication Services initialized');
  } catch (error) {
    logger.warn('⚠️ Communication Services initialization failed:', error.message);
  }
})();

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

// Redis connection
const redisClient = Redis.createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? ':' + process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6383}`,
});

// Connect to Redis
redisClient.connect().catch(console.error);

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

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

// Redis connection test
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Initialize Analytics WebSocket clients storage
app.locals.wsClients = new Set();

// Routes
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');
    
    // Test Redis connection (simplified)
    let redisStatus = 'unknown';
    try {
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (redisError) {
      redisStatus = 'disconnected';
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
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

// API routes
app.get('/api/info', (req, res) => {
  res.json({
    name: 'RevivaTech New Platform API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    features: ['analytics', 'websockets', 'real-time-tracking']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Import existing API routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices-simple');
const pricingRoutes = require('./routes/pricing-simple');
const bookingRoutes = require('./routes/bookings');
const emailRoutes = require('./routes/email');
const adminEmailRoutes = require('./routes/admin-email');
const emailConfigRoutes = require('./routes/email-config');
const adminRoutes = require('./routes/admin/index');

// Import new Analytics routes
const { router: analyticsRoutes, setupWebSocketServer } = require('./routes/analytics');
// Import AI Chatbot routes
const aiChatbotRoutes = require('./routes/ai-chatbot-simple');
// Import AI Notifications routes
const aiNotificationsRoutes = require('./routes/ai-notifications');
// Import Predictive Analytics routes
const predictiveAnalyticsRoutes = require('./routes/predictive-analytics');

// Middleware to add pool and logger to request
app.use('/api/auth', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, authRoutes);

app.use('/api/devices', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, deviceRoutes);

app.use('/api/pricing', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, pricingRoutes);

app.use('/api/bookings', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.emailService = emailService;
  next();
}, bookingRoutes);

app.use('/api/email', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, emailRoutes);

app.use('/api/admin/email', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, adminEmailRoutes);

app.use('/api/admin/email-config', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, emailConfigRoutes);

// Admin routes with middleware
app.use('/api/admin', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  next();
}, adminRoutes);

// SMS routes temporarily disabled (missing route file)

// Analytics routes with middleware
app.use('/api/analytics', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.app = app; // For WebSocket client access
  next();
}, analyticsRoutes);

// AI Chatbot routes with middleware
app.use('/api/ai-chatbot', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.app = app; // For WebSocket client access
  next();
}, aiChatbotRoutes);

// AI Notifications routes with middleware
app.use('/api/ai-notifications', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.app = app; // For WebSocket client access
  next();
}, aiNotificationsRoutes);

// Predictive Analytics routes with middleware
app.use('/api/predictive-analytics', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.app = app; // For ML services access
  next();
}, predictiveAnalyticsRoutes);

// Setup Analytics WebSocket Server
const { wss: analyticsWss, clients: analyticsClients } = setupWebSocketServer(server);
app.locals.analyticsWss = analyticsWss;
app.locals.wsClients = analyticsClients;

logger.info('Analytics WebSocket server initialized');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close WebSocket servers
  if (analyticsWss) {
    analyticsWss.close();
  }
  
  await pool.end();
  await redisClient.quit();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close WebSocket servers
  if (analyticsWss) {
    analyticsWss.close();
  }
  
  await pool.end();
  await redisClient.quit();
  
  process.exit(0);
});

// Start server with Socket.IO and Analytics WebSocket
server.listen(PORT, () => {
  logger.info(`RevivaTech New Platform Backend running on port ${PORT}`);
  logger.info(`Analytics WebSocket server enabled on /api/analytics/ws`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Features: Real-time analytics, Event tracking, ML scoring`);
});

module.exports = { app, server, io };