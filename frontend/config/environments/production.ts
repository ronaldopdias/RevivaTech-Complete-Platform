import { EnvironmentConfig } from '@/types/config';

export const productionConfig: EnvironmentConfig = {
  name: 'production',
  
  api: {
    baseURL: 'https://api.revivatech.com',
    version: 'v1',
    timeout: 30000,
  },
  
  features: {
    debug_mode: false,
    test_payments: false,
    mock_data: false,
    hot_reload: false,
    detailed_logging: false,
  },
  
  services: {
    database: {
      url: process.env.DATABASE_URL!,
      enabled: true,
      config: {
        ssl: true,
        poolSize: 20,
        logging: false,
      },
    },
    
    redis: {
      url: process.env.REDIS_URL!,
      enabled: true,
      config: {
        tls: true,
        keyPrefix: 'revivatech:prod:',
      },
    },
    
    email: {
      enabled: true,
      config: {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY!,
        from: 'support@revivatech.com',
        replyTo: 'noreply@revivatech.com',
      },
    },
    
    sms: {
      enabled: true,
      config: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID!,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        from: process.env.TWILIO_PHONE_NUMBER!,
      },
    },
    
    storage: {
      enabled: true,
      config: {
        provider: 'cloudinary',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        folder: 'revivatech',
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
        mode: 'live',
      },
    },
    
    analytics: {
      enabled: true,
      config: {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID!,
        gtmId: process.env.NEXT_PUBLIC_GTM_ID,
        facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
      },
    },
    
    sentry: {
      enabled: true,
      config: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
        environment: 'production',
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.1,
      },
    },
    
    cloudflare: {
      enabled: true,
      config: {
        zoneId: process.env.CLOUDFLARE_ZONE_ID!,
        apiToken: process.env.CLOUDFLARE_API_TOKEN!,
        enableAnalytics: true,
        enableSecurity: true,
      },
    },
  },
  
  security: {
    cors: {
      origins: [
        'https://revivatech.com',
        'https://www.revivatech.com',
        'https://revivatech.co.uk',
        'https://www.revivatech.co.uk',
        'https://revivatech.com.br',
        'https://www.revivatech.com.br',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
    
    rateLimit: {
      windowMs: 900000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    },
    
    encryption: {
      algorithm: 'AES-256-GCM',
      keyRotation: '30d',
    },
  },
  
  monitoring: {
    enabled: true,
    services: [
      'sentry',
      'prometheus',
      'grafana',
      'datadog',
    ],
    config: {
      alerting: {
        enabled: true,
        channels: ['email', 'slack', 'pagerduty'],
      },
      metrics: {
        enabled: true,
        retention: '90d',
      },
      logging: {
        enabled: true,
        level: 'info',
        retention: '30d',
      },
    },
  },
};

export default productionConfig;