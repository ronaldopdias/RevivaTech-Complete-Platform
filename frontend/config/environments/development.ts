import { EnvironmentConfig } from '@/types/config';

export const developmentConfig: EnvironmentConfig = {
  name: 'development',
  
  api: {
    baseURL: 'http://localhost:3011',
    version: 'v1',
    timeout: 30000,
  },
  
  features: {
    debug_mode: true,
    test_payments: true,
    mock_data: false,
    hot_reload: true,
    detailed_logging: true,
  },
  
  services: {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/revivatech_dev',
      enabled: true,
      config: {
        ssl: false,
        poolSize: 5,
        logging: true,
      },
    },
    
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      enabled: true,
      config: {
        db: 0,
        keyPrefix: 'revivatech:dev:',
      },
    },
    
    email: {
      enabled: false, // Disabled in development
      config: {
        provider: 'console',
        logEmails: true,
      },
    },
    
    sms: {
      enabled: false, // Disabled in development
      config: {
        provider: 'console',
        logSms: true,
      },
    },
    
    storage: {
      enabled: true,
      config: {
        provider: 'local',
        path: './public/uploads',
        maxSize: '10MB',
      },
    },
    
    chatwoot: {
      url: process.env.CHATWOOT_BASE_URL || 'http://localhost:3000',
      enabled: true,
      config: {
        websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN || 'dev-token',
        apiToken: process.env.CHATWOOT_API_ACCESS_TOKEN || 'dev-api-token',
        accountId: 1,
        inboxId: 1,
      },
    },
    
    stripe: {
      enabled: true,
      config: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dev',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dev',
        mode: 'test',
      },
    },
    
    analytics: {
      enabled: false, // Disabled in development
      config: {
        googleAnalyticsId: '',
        debugMode: true,
      },
    },
    
    sentry: {
      enabled: false, // Disabled in development
      config: {
        dsn: '',
        environment: 'development',
        debug: true,
      },
    },
  },
  
  security: {
    cors: {
      origins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
      credentials: true,
    },
    
    rateLimit: {
      windowMs: 900000, // 15 minutes
      max: 1000, // High limit for development
    },
    
    encryption: {
      algorithm: 'AES-256-GCM',
    },
  },
  
  monitoring: {
    enabled: false,
    services: [],
  },
};

export default developmentConfig;