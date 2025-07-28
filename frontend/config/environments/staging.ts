import { EnvironmentConfig } from '@/types/config';

export const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  
  api: {
    baseURL: 'https://staging-api.revivatech.com',
    version: 'v1',
    timeout: 30000,
  },
  
  features: {
    debug_mode: true,
    test_payments: true,
    mock_data: false,
    hot_reload: false,
    detailed_logging: true,
  },
  
  services: {
    database: {
      url: process.env.DATABASE_URL!,
      enabled: true,
      config: {
        ssl: true,
        poolSize: 10,
        logging: true,
      },
    },
    
    redis: {
      url: process.env.REDIS_URL!,
      enabled: true,
      config: {
        tls: true,
        keyPrefix: 'revivatech:staging:',
      },
    },
    
    email: {
      enabled: true,
      config: {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY!,
        from: 'staging@revivatech.com',
        testMode: true,
      },
    },
    
    sms: {
      enabled: true,
      config: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID!,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        from: process.env.TWILIO_PHONE_NUMBER!,
        testMode: true,
      },
    },
    
    storage: {
      enabled: true,
      config: {
        provider: 'cloudinary',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        folder: 'revivatech-staging',
      },
    },
    
    chatwoot: {
      url: process.env.CHATWOOT_BASE_URL!,
      enabled: true,
      config: {
        websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN!,
        apiToken: process.env.CHATWOOT_API_ACCESS_TOKEN!,
        accountId: parseInt(process.env.CHATWOOT_ACCOUNT_ID!),
        inboxId: parseInt(process.env.CHATWOOT_INBOX_ID!),
      },
    },
    
    stripe: {
      enabled: true,
      config: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        mode: 'test',
      },
    },
    
    analytics: {
      enabled: true,
      config: {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID!,
        debugMode: true,
        testMode: true,
      },
    },
    
    sentry: {
      enabled: true,
      config: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
        environment: 'staging',
        debug: true,
        tracesSampleRate: 1.0,
      },
    },
  },
  
  security: {
    cors: {
      origins: [
        'https://staging.revivatech.com',
        'https://staging-revivatech.vercel.app',
        'http://localhost:3000', // For local testing against staging
      ],
      credentials: true,
    },
    
    rateLimit: {
      windowMs: 900000, // 15 minutes
      max: 500, // Higher limit for testing
    },
    
    encryption: {
      algorithm: 'AES-256-GCM',
    },
  },
  
  monitoring: {
    enabled: true,
    services: [
      'sentry',
      'prometheus',
    ],
    config: {
      alerting: {
        enabled: true,
        channels: ['email', 'slack'],
      },
      metrics: {
        enabled: true,
        retention: '30d',
      },
      logging: {
        enabled: true,
        level: 'debug',
        retention: '7d',
      },
    },
  },
};

export default stagingConfig;