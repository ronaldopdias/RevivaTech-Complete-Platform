import { FeatureFlag } from '@/types/config';

export const features: Record<string, FeatureFlag> = {
  chat_support: {
    name: 'Live Chat Support',
    description: 'Enable Chatwoot live chat integration',
    enabled: true,
    config: {
      position: 'bottom-right',
      autoOpen: false,
      welcomeMessage: 'Hi! How can we help you today?',
      theme: 'nordic',
      enableFileUploads: true,
      enableTypingIndicators: true,
      enableReadReceipts: true,
      offlineMessage: 'We are currently offline. Please leave a message and we will get back to you soon.',
    },
  },
  
  advanced_booking: {
    name: 'Advanced Booking Flow',
    description: 'Multi-step booking with device detection and smart features',
    enabled: true,
    config: {
      enableDeviceDetection: true,
      enableSerialNumberLookup: true,
      enablePriceEstimation: true,
      enableRealTimeAvailability: true,
      enableReminders: true,
      steps: [
        'device-selection',
        'model-selection',
        'repair-selection',
        'customer-details',
        'appointment-scheduling',
        'confirmation',
      ],
    },
  },
  
  customer_dashboard: {
    name: 'Customer Dashboard',
    description: 'Real-time customer portal with comprehensive features',
    enabled: true,
    config: {
      enableRealTimeUpdates: true,
      enableNotifications: true,
      enableFileUploads: true,
      enableChat: true,
      enableRepairHistory: true,
      enableInvoiceDownload: true,
      enableProfileManagement: true,
      enableTwoFactorAuth: true,
      updateInterval: 30000, // 30 seconds
    },
  },
  
  admin_dashboard: {
    name: 'Admin Dashboard',
    description: 'Comprehensive admin interface with business intelligence',
    enabled: true,
    config: {
      enableAnalytics: true,
      enableReports: true,
      enableUserManagement: true,
      enableSystemSettings: true,
      enableBulkOperations: true,
      enableDataExport: true,
      enableAuditLog: true,
      refreshInterval: 60000, // 60 seconds
    },
  },
  
  ai_diagnostics: {
    name: 'AI-Powered Diagnostics',
    description: 'AI assistance for repair diagnostics and recommendations',
    enabled: true,
    rollout: {
      strategy: 'percentage',
      percentage: 100,
    },
    config: {
      model: 'diagnostics-v2',
      confidenceThreshold: 0.85,
      enableImageAnalysis: true,
      enableSymptomAnalysis: true,
      enableRepairSuggestions: true,
    },
  },
  
  voice_booking: {
    name: 'Voice-Enabled Booking',
    description: 'Voice commands for booking process',
    enabled: false,
    config: {
      enableVoiceInput: true,
      enableVoiceConfirmation: true,
      supportedLanguages: ['en', 'pt'],
    },
  },
  
  ar_device_detection: {
    name: 'AR Device Detection',
    description: 'Augmented reality for device identification',
    enabled: false,
    rollout: {
      strategy: 'users',
      users: ['beta-tester-1', 'beta-tester-2'],
    },
    config: {
      enableCameraAccess: true,
      enableModelRecognition: true,
      supportedDevices: ['mobile', 'tablet'],
    },
  },
  
  predictive_maintenance: {
    name: 'Predictive Maintenance',
    description: 'AI-powered predictions for device maintenance',
    enabled: false,
    config: {
      analysisInterval: 'monthly',
      enableNotifications: true,
      riskThreshold: 0.7,
    },
  },
  
  social_login: {
    name: 'Social Media Login',
    description: 'Login with Google, Apple, Facebook',
    enabled: true,
    config: {
      providers: ['google', 'apple', 'facebook'],
      enableAccountLinking: true,
      enableProfileSync: true,
    },
  },
  
  loyalty_program: {
    name: 'Customer Loyalty Program',
    description: 'Points and rewards system for repeat customers',
    enabled: true,
    config: {
      pointsPerRepair: 100,
      pointsPerReview: 50,
      enableReferralBonus: true,
      referralBonus: 200,
      enableTierSystem: true,
      tiers: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    },
  },
  
  express_service: {
    name: 'Express Service',
    description: 'Priority repair service with premium pricing',
    enabled: true,
    config: {
      expressMultiplier: 1.5,
      guaranteedTurnaround: '24h',
      enableSameDayService: true,
      enableRushOrders: true,
    },
  },
  
  device_fingerprinting: {
    name: 'Device Fingerprinting',
    description: 'Enhanced security through device identification',
    enabled: true,
    config: {
      enableBrowserFingerprinting: true,
      enableDeviceTracking: true,
      enableFraudDetection: true,
      trackingDuration: '30d',
    },
  },
  
  inventory_integration: {
    name: 'Real-time Inventory',
    description: 'Live parts availability and automatic reordering',
    enabled: true,
    config: {
      enableRealTimeTracking: true,
      enableAutoReorder: true,
      lowStockThreshold: 10,
      enableSupplierIntegration: true,
    },
  },
  
  video_consultations: {
    name: 'Video Consultations',
    description: 'Video calls for remote diagnostics and consultations',
    enabled: true,
    rollout: {
      strategy: 'percentage',
      percentage: 100,
    },
    config: {
      enableScreenSharing: true,
      enableRecording: false,
      maxDuration: 1800, // 30 minutes
      enableScheduling: true,
    },
  },
  
  warranty_tracking: {
    name: 'Warranty Tracking',
    description: 'Comprehensive warranty management system',
    enabled: true,
    config: {
      defaultWarrantyPeriod: '90d',
      enableWarrantyReminders: true,
      enableExtendedWarranty: true,
      enableWarrantyTransfer: true,
    },
  },
  
  multi_location: {
    name: 'Multi-Location Support',
    description: 'Support for multiple repair shop locations',
    enabled: false,
    config: {
      enableLocationSelection: true,
      enableLocationTransfer: true,
      enableLocationSpecificPricing: true,
      enableCrossLocationInventory: true,
    },
  },
  
  automated_testing: {
    name: 'Automated Device Testing',
    description: 'Automated diagnostic testing for devices',
    enabled: true,
    config: {
      enableHardwareTests: true,
      enableSoftwareTests: true,
      enablePerformanceTests: true,
      generateTestReports: true,
    },
  },
  
  customer_feedback: {
    name: 'Customer Feedback System',
    description: 'Comprehensive feedback and review system',
    enabled: true,
    config: {
      enableReviews: true,
      enableRatings: true,
      enablePhotos: true,
      enableFeedbackRewards: true,
      autoRequestFeedback: true,
      feedbackDelay: '24h',
    },
  },
  
  dark_mode: {
    name: 'Dark Mode',
    description: 'Dark theme support across the application',
    enabled: true,
    config: {
      default: 'system',
      persistence: 'localStorage',
      enableAutoSwitch: true,
      switchTime: {
        dark: '20:00',
        light: '06:00',
      },
    },
  },
  
  offline_mode: {
    name: 'Offline Mode',
    description: 'Limited functionality when offline',
    enabled: true,
    config: {
      enableOfflineBooking: true,
      enableOfflineTracking: true,
      syncOnReconnect: true,
      maxOfflineStorage: '10MB',
    },
  },
};

export default { features };