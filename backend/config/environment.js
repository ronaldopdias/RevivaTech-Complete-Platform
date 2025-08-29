/**
 * Centralized Environment Configuration for RevivaTech Backend
 * 
 * This module provides validated environment variables and configuration
 * with sensible defaults and type checking.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable validation and defaults
 */
function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  const isProduction = env === 'production';

  // Detect if running inside Docker container
  const isDocker = process.env.DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
  
  // Use localhost for database/redis when running outside Docker, use container names when inside
  const dbHost = isDocker ? (process.env.DB_HOST || 'revivatech_database') : 'localhost';
  const dbPort = isDocker ? parseInt(process.env.DB_PORT || '5432', 10) : 5435;
  const redisHost = isDocker ? (process.env.REDIS_HOST || 'revivatech_redis') : 'localhost';
  const redisPort = isDocker ? parseInt(process.env.REDIS_PORT || '6379', 10) : 6383;

  return {
    // Application Settings
    NODE_ENV: env,
    PORT: parseInt(process.env.PORT || '3011', 10),
    HOST: process.env.HOST || 'localhost',
    
    // Database Configuration
    DATABASE: {
      URL: process.env.DATABASE_URL || 
           `postgresql://${process.env.DB_USER || 'revivatech'}:${process.env.DB_PASSWORD || 'revivatech_password'}@${dbHost}:${dbPort}/${process.env.DB_NAME || 'revivatech'}`,
      HOST: dbHost,
      PORT: dbPort,
      NAME: process.env.DB_NAME || 'revivatech',
      USER: process.env.DB_USER || 'revivatech',
      PASSWORD: process.env.DB_PASSWORD || 'revivatech_password',
      SSL: process.env.DB_SSL === 'true',
      MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
    },

    // Redis Configuration
    REDIS: {
      HOST: redisHost,
      PORT: redisPort,
      PASSWORD: process.env.REDIS_PASSWORD || '',
      URL: process.env.REDIS_URL,
      MAX_RETRIES: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      RETRY_DELAY: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    },

    // Authentication Configuration
    AUTH: {
      SECRET: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production',
      SESSION_EXPIRES_IN: parseInt(process.env.SESSION_EXPIRES_IN || (7 * 24 * 60 * 60).toString(), 10), // 7 days
      TOKEN_EXPIRES_IN: parseInt(process.env.TOKEN_EXPIRES_IN || (24 * 60 * 60).toString(), 10), // 24 hours
      REFRESH_TOKEN_EXPIRES_IN: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || (30 * 24 * 60 * 60).toString(), 10), // 30 days
      BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      TRUST_HOST: process.env.TRUST_HOST === 'true' || isDevelopment,
    },

    // CORS Configuration
    CORS: {
      ORIGINS: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) :
        [
          'http://localhost:3010',
          'http://localhost:3011', 
          'https://revivatech.co.uk',
          'https://www.revivatech.co.uk'
        ],
      CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',
    },

    // Email Configuration
    EMAIL: {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
      FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@revivatech.co.uk',
      FROM_NAME: process.env.EMAIL_FROM_NAME || 'RevivaTech',
      REPLY_TO: process.env.EMAIL_REPLY_TO || 'support@revivatech.co.uk',
    },

    // SMS Configuration (Twilio)
    SMS: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
    },

    // File Upload Configuration
    UPLOAD: {
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || (10 * 1024 * 1024).toString(), 10), // 10MB
      ALLOWED_EXTENSIONS: process.env.UPLOAD_ALLOWED_EXTENSIONS ? 
        process.env.UPLOAD_ALLOWED_EXTENSIONS.split(',').map(ext => ext.trim()) :
        ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
      UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    },

    // Logging Configuration
    LOGGING: {
      LEVEL: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      INCLUDE_STACK: process.env.LOG_INCLUDE_STACK === 'true' || isDevelopment,
      LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
      LOG_FILE_PATH: process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'app.log'),
    },

    // Rate Limiting
    RATE_LIMITING: {
      WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false' && isProduction,
    },

    // Security Configuration
    SECURITY: {
      HELMET_ENABLED: process.env.HELMET_ENABLED !== 'false',
      HTTPS_ONLY: process.env.HTTPS_ONLY === 'true' || isProduction,
      SECURE_COOKIES: process.env.SECURE_COOKIES === 'true' || isProduction,
      SAME_SITE_COOKIES: process.env.SAME_SITE_COOKIES || (isProduction ? 'strict' : 'lax'),
    },

    // API Configuration
    API: {
      BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3011}`,
      PREFIX: process.env.API_PREFIX || '/api',
      VERSION: process.env.API_VERSION || 'v1',
      PAGINATION_DEFAULT_LIMIT: parseInt(process.env.API_PAGINATION_DEFAULT_LIMIT || '20', 10),
      PAGINATION_MAX_LIMIT: parseInt(process.env.API_PAGINATION_MAX_LIMIT || '100', 10),
    },

    // Development/Production Flags
    FLAGS: {
      DEVELOPMENT: isDevelopment,
      PRODUCTION: isProduction,
      DEBUG: process.env.DEBUG === 'true' || isDevelopment,
      ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true' || isDevelopment,
      ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
      ENABLE_HEALTH_CHECK: process.env.ENABLE_HEALTH_CHECK !== 'false',
    },

    // External Service URLs
    SERVICES: {
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3010',
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL || 'https://api.revivatech.co.uk',
    },
  };
}

/**
 * Validate required environment variables
 */
function validateEnvironment(config) {
  const required = [];
  const missing = [];

  // Add required variables based on environment
  if (config.FLAGS.PRODUCTION) {
    required.push(
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'SENDGRID_API_KEY'
    );
  }

  // Check for missing required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate configuration values
  if (config.DATABASE.MAX_CONNECTIONS <= 0) {
    throw new Error('DB_MAX_CONNECTIONS must be greater than 0');
  }

  if (config.AUTH.BCRYPT_ROUNDS < 10 || config.AUTH.BCRYPT_ROUNDS > 15) {
    throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
  }

  if (config.API.PAGINATION_DEFAULT_LIMIT > config.API.PAGINATION_MAX_LIMIT) {
    throw new Error('API_PAGINATION_DEFAULT_LIMIT cannot be greater than API_PAGINATION_MAX_LIMIT');
  }

  console.log('✅ Environment configuration validated successfully');
}

// Create and validate configuration
const config = getEnvironmentConfig();
validateEnvironment(config);

// Log configuration summary (without secrets)
console.log(`🔧 Environment: ${config.NODE_ENV}`);
console.log(`🚀 Server: ${config.HOST}:${config.PORT}`);
console.log(`💾 Database: ${config.DATABASE.HOST}:${config.DATABASE.PORT}/${config.DATABASE.NAME}`);
console.log(`🔴 Redis: ${config.REDIS.HOST}:${config.REDIS.PORT}`);
console.log(`📧 Email: ${config.EMAIL.FROM_EMAIL}`);

module.exports = config;