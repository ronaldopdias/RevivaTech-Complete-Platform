export interface Environment {
  NODE_ENV: 'development' | 'staging' | 'production';
  
  // Application
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;
  
  // API Configuration
  API_URL: string;
  API_TIMEOUT: number;
  API_RETRY_ATTEMPTS: number;
  
  // Database
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  DATABASE_POOL_SIZE: number;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  
  // External Services
  CHATWOOT_URL?: string;
  CHATWOOT_TOKEN?: string;
  
  // Email Service
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  
  // Cloud Storage
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  
  // Payment Processing
  STRIPE_PUBLIC_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // Analytics
  GA_TRACKING_ID?: string;
  HOTJAR_ID?: string;
  
  // Feature Flags
  FEATURES: {
    enableChat: boolean;
    enablePayments: boolean;
    enableAnalytics: boolean;
    enablePWA: boolean;
    enableOfflineMode: boolean;
    enableRealTimeUpdates: boolean;
    enableAdvancedBooking: boolean;
    enableMultiLocation: boolean;
  };
  
  // Security
  CORS_ORIGINS: string[];
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  BCRYPT_ROUNDS: number;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FORMAT: 'json' | 'pretty';
  
  // Cache
  REDIS_URL?: string;
  CACHE_TTL: number;
  
  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  
  // Performance
  ENABLE_COMPRESSION: boolean;
  ENABLE_STATIC_OPTIMIZATION: boolean;
  BUNDLE_ANALYZER: boolean;
}

// Development environment
const developmentConfig: Environment = {
  NODE_ENV: 'development',
  
  APP_NAME: 'RevivaTech Development',
  APP_VERSION: process.env.npm_package_version || '1.0.0',
  APP_URL: 'http://localhost:3000',
  
  API_URL: 'http://localhost:3001/api',
  API_TIMEOUT: 10000,
  API_RETRY_ATTEMPTS: 3,
  
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/revivatech_dev',
  DATABASE_SSL: false,
  DATABASE_POOL_SIZE: 10,
  
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  JWT_EXPIRES_IN: '1h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  
  CHATWOOT_URL: process.env.CHATWOOT_URL,
  CHATWOOT_TOKEN: process.env.CHATWOOT_TOKEN,
  
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025'), // MailHog for dev
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'dev@revivatech.local',
  
  AWS_REGION: process.env.AWS_REGION || 'eu-west-2',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  GA_TRACKING_ID: undefined, // Disabled in development
  HOTJAR_ID: undefined, // Disabled in development
  
  FEATURES: {
    enableChat: true,
    enablePayments: false, // Disabled in dev to avoid accidental charges
    enableAnalytics: false,
    enablePWA: true,
    enableOfflineMode: true,
    enableRealTimeUpdates: true,
    enableAdvancedBooking: true,
    enableMultiLocation: false,
  },
  
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000, // High limit for development
  BCRYPT_ROUNDS: 10,
  
  LOG_LEVEL: 'debug',
  LOG_FORMAT: 'pretty',
  
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CACHE_TTL: 300, // 5 minutes
  
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  
  ENABLE_COMPRESSION: false, // Let Next.js handle in dev
  ENABLE_STATIC_OPTIMIZATION: false,
  BUNDLE_ANALYZER: process.env.ANALYZE === 'true',
};

// Staging environment
const stagingConfig: Environment = {
  ...developmentConfig,
  NODE_ENV: 'staging',
  
  APP_NAME: 'RevivaTech Staging',
  APP_URL: process.env.APP_URL || 'https://staging.revivatech.com',
  
  API_URL: process.env.API_URL || 'https://api-staging.revivatech.com/api',
  
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_SSL: true,
  DATABASE_POOL_SIZE: 20,
  
  JWT_SECRET: process.env.JWT_SECRET!,
  
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@revivatech.com',
  
  FEATURES: {
    enableChat: true,
    enablePayments: true, // Test payments in staging
    enableAnalytics: true,
    enablePWA: true,
    enableOfflineMode: true,
    enableRealTimeUpdates: true,
    enableAdvancedBooking: true,
    enableMultiLocation: true,
  },
  
  CORS_ORIGINS: [
    'https://staging.revivatech.com',
    'https://crm-staging.revivatech.com'
  ],
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  
  CACHE_TTL: 600, // 10 minutes
  
  ENABLE_COMPRESSION: true,
  ENABLE_STATIC_OPTIMIZATION: true,
  BUNDLE_ANALYZER: false,
};

// Production environment
const productionConfig: Environment = {
  ...stagingConfig,
  NODE_ENV: 'production',
  
  APP_NAME: 'RevivaTech',
  APP_URL: process.env.APP_URL || 'https://revivatech.com',
  
  API_URL: process.env.API_URL || 'https://api.revivatech.com/api',
  API_TIMEOUT: 5000, // Shorter timeout in production
  
  DATABASE_POOL_SIZE: 50, // Larger pool for production
  
  JWT_EXPIRES_IN: '15m', // Shorter expiry in production
  
  GA_TRACKING_ID: process.env.GA_TRACKING_ID,
  HOTJAR_ID: process.env.HOTJAR_ID,
  
  FEATURES: {
    enableChat: true,
    enablePayments: true,
    enableAnalytics: true,
    enablePWA: true,
    enableOfflineMode: true,
    enableRealTimeUpdates: true,
    enableAdvancedBooking: true,
    enableMultiLocation: true,
  },
  
  CORS_ORIGINS: [
    'https://revivatech.com',
    'https://www.revivatech.com',
    'https://revivatech.co.uk',
    'https://www.revivatech.co.uk',
    'https://crm.revivatech.com'
  ],
  RATE_LIMIT_MAX_REQUESTS: 50, // Stricter rate limiting
  BCRYPT_ROUNDS: 12, // Higher security
  
  LOG_LEVEL: 'warn',
  
  CACHE_TTL: 3600, // 1 hour
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in production
};

// Get current environment configuration
function getEnvironmentConfig(): Environment {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Validate required environment variables
function validateEnvironment(config: Environment): void {
  const requiredVars: (keyof Environment)[] = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const productionRequiredVars: (keyof Environment)[] = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  const missing: string[] = [];
  
  // Check always required variables
  requiredVars.forEach(key => {
    if (!config[key]) {
      missing.push(key);
    }
  });
  
  // Check production-specific variables
  if (config.NODE_ENV === 'production') {
    productionRequiredVars.forEach(key => {
      if (!config[key]) {
        missing.push(key);
      }
    });
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

// Get and validate configuration
export function getConfig(): Environment {
  const config = getEnvironmentConfig();
  
  try {
    validateEnvironment(config);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
  
  return config;
}

// Export individual configs for testing
export {
  developmentConfig,
  stagingConfig,
  productionConfig,
  validateEnvironment
};

// Default export
export default getConfig();