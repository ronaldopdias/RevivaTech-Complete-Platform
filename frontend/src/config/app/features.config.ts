import { FeatureFlag } from '@/types/config';

/**
 * Feature flags configuration for RevivaTech platform
 * Controls feature rollouts and toggles across the application
 */
export const features: Record<string, FeatureFlag> = {
  // AI Features
  aiDiagnostics: {
    enabled: true,
    description: 'AI-powered device diagnostics',
    config: {
      modelVersion: 'v2.1',
      confidenceThreshold: 0.8,
      maxProcessingTime: 30000
    }
  },

  aiChatbot: {
    enabled: true,
    description: 'AI customer support chatbot',
    config: {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 500,
      temperature: 0.7
    }
  },

  // Admin Features
  adminAnalytics: {
    enabled: true,
    description: 'Advanced admin analytics dashboard',
    config: {
      refreshInterval: 30000,
      realTimeUpdates: true,
      exportFormats: ['pdf', 'csv', 'excel']
    }
  },

  adminRealtimeNotifications: {
    enabled: true,
    description: 'Real-time admin notifications',
    config: {
      websocketEndpoint: '/api/admin/notifications',
      reconnectInterval: 5000
    }
  },

  // Customer Features
  customerPortal: {
    enabled: true,
    description: 'Customer self-service portal',
    config: {
      enableRepairTracking: true,
      enableFileUploads: true,
      maxFileSize: 10485760 // 10MB
    }
  },

  // Booking Features
  advancedBookingFlow: {
    enabled: true,
    description: 'Multi-step booking with device detection',
    config: {
      enableDeviceDetection: true,
      maxSteps: 5,
      autoSave: true
    }
  },

  // Payment Features
  stripePayments: {
    enabled: false, // Disabled until properly configured
    description: 'Stripe payment processing',
    rollout: {
      strategy: 'percentage',
      percentage: 0 // 0% rollout for now
    },
    config: {
      currency: 'GBP',
      enableSavedCards: true
    }
  },

  // Marketing Features
  marketingAutomation: {
    enabled: true,
    description: 'Automated marketing campaigns',
    config: {
      emailProvider: 'sendgrid',
      enableTracking: true,
      enablePersonalization: true
    }
  },

  // Performance Features
  performanceOptimization: {
    enabled: true,
    description: 'Performance monitoring and optimization',
    config: {
      enableCodeSplitting: true,
      enableLazyLoading: true,
      enableImageOptimization: true
    }
  },

  // Development Features
  debugMode: {
    enabled: process.env.NODE_ENV === 'development',
    description: 'Debug tools and console logging',
    config: {
      enableConsoleLog: true,
      enableNetworkLog: true,
      enablePerformanceLog: true
    }
  }
};

export default features;