import { AppConfig } from '@/types/config';
import { nordicTheme } from '../theme/nordic.theme';

export const appConfig: AppConfig = {
  site: {
    name: 'RevivaTech',
    tagline: 'Professional Computer Repair Services',
    logo: '/assets/images/revivatech-logo.svg',
    favicon: '/assets/images/favicon.ico',
    languages: [
      {
        code: 'en',
        name: 'English',
        flag: '🇬🇧',
        enabled: true,
      },
      {
        code: 'pt',
        name: 'Português',
        flag: '🇧🇷',
        enabled: true,
      },
    ],
    defaultLanguage: 'en',
  },
  
  features: {
    chat_support: {
      name: 'Live Chat Support',
      description: 'Enable Chatwoot live chat integration',
      enabled: true,
      config: {
        position: 'bottom-right',
        autoOpen: false,
        welcomeMessage: '@content.chat.welcome',
        theme: 'nordic',
      },
    },
    
    advanced_booking: {
      name: 'Advanced Booking Flow',
      description: 'Multi-step booking with device detection',
      enabled: true,
      config: {
        steps: [
          'device-selection',
          'model-selection',
          'repair-selection',
          'customer-details',
          'appointment-scheduling',
          'confirmation',
        ],
        enableDeviceDetection: true,
        enablePriceEstimation: true,
      },
    },
    
    customer_dashboard: {
      name: 'Customer Dashboard',
      description: 'Real-time customer portal with repair tracking',
      enabled: true,
      config: {
        enableRealTimeUpdates: true,
        enableNotifications: true,
        enableFileUploads: true,
        enableChat: true,
      },
    },
    
    admin_dashboard: {
      name: 'Admin Dashboard',
      description: 'Comprehensive admin interface with analytics',
      enabled: true,
      config: {
        enableAnalytics: true,
        enableReports: true,
        enableUserManagement: true,
        enableSystemSettings: true,
      },
    },
    
    nordic_design: {
      name: 'Nordic Design System',
      description: 'Apple-inspired minimalist design',
      enabled: true,
      config: {
        theme: 'nordic',
        enableGlassMorphism: true,
        enableAnimations: true,
        enableDarkMode: true,
      },
    },
    
    multilingual: {
      name: 'Multilingual Support',
      description: 'English and Portuguese language support',
      enabled: true,
      config: {
        defaultLocale: 'en',
        fallbackLocale: 'en',
        enableAutoDetection: true,
      },
    },
    
    pwa: {
      name: 'Progressive Web App',
      description: 'PWA capabilities for mobile app-like experience',
      enabled: true,
      config: {
        enableOffline: true,
        enablePushNotifications: true,
        enableInstallPrompt: true,
      },
    },
    
    seo_optimization: {
      name: 'SEO Optimization',
      description: 'Advanced SEO features and optimization',
      enabled: true,
      config: {
        enableStructuredData: true,
        enableSitemap: true,
        enableRobotsTxt: true,
        enableOpenGraph: true,
      },
    },
  },
  
  theme: nordicTheme,
  
  api: {
    endpoints: {
      bookings: '/api/v1/bookings',
      customers: '/api/v1/customers',
      repairs: '/api/v1/repairs',
      devices: '/api/v1/devices',
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      chat: '/api/v1/chat',
      upload: '/api/v1/upload',
      notifications: '/api/v1/notifications',
    },
    timeout: 30000,
    retryPolicy: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
      retryOn: [408, 429, 500, 502, 503, 504],
    },
  },
  
  integrations: {
    chatwoot: {
      enabled: true,
      config: {
        websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
        baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '',
        enableFileUploads: true,
        enableTypingIndicators: true,
        theme: 'nordic',
      },
    },
    
    analytics: {
      enabled: true,
      config: {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
        enableEcommerce: true,
        enableUserTracking: true,
        cookieConsent: true,
      },
    },
    
    sentry: {
      enabled: true,
      config: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
        environment: process.env.NODE_ENV || 'development',
        enableTracing: true,
        enableUserFeedback: true,
      },
    },
    
    stripe: {
      enabled: true,
      config: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        enableApplePay: true,
        enableGooglePay: true,
      },
    },
    
    cloudinary: {
      enabled: true,
      config: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
        enableTransformation: true,
        enableOptimization: true,
      },
    },
    
    sendgrid: {
      enabled: true,
      config: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@revivatech.com',
        enableTemplates: true,
      },
    },
  },
};

export default appConfig;