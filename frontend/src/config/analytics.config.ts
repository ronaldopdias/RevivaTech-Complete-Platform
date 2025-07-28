/**
 * Analytics Configuration
 * RevivaTech Third-Party Analytics Setup
 * 
 * Central configuration for all analytics services
 */

import { type ThirdPartyConfig } from '@/lib/analytics/ThirdPartyAnalytics';

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const analyticsConfig: ThirdPartyConfig = {
  googleAnalytics: {
    enabled: true,
    // Google Analytics 4 Measurement ID
    measurementId: process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-5GE7SMG2S1',
    customDimensions: {
      // Map custom dimensions to GA4 custom parameters
      'customer_type': 'custom_customer_type',
      'device_preference': 'custom_device_preference',
      'repair_category': 'custom_repair_category',
      'service_level': 'custom_service_level',
      'visit_intent': 'custom_visit_intent',
    }
  },

  facebookPixel: {
    enabled: true, // Enable in development for testing
    // Facebook Pixel ID
    pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || '2652169749501',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN, // Server-side only
  },

  postHog: {
    enabled: true, // Enable in development for testing
    // PostHog API key
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_kjLrWSAcadbB7goQDzW6Jhtu5AvbEKEEvvLFktKEyDn',
    hostUrl: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    enableSessionRecording: isProduction, // Only record in production
    enableHeatmaps: isProduction, // Only enable in production
  },

  privacy: {
    requireConsent: true,
    anonymizeIP: true,
    respectDoNotTrack: true,
    cookieExpiryDays: 365,
  },

  performance: {
    loadAsync: true,
    enableBatching: true,
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
  }
};

// Event name mappings for consistency across platforms
export const eventNames = {
  // Page Events
  PAGE_VIEW: 'page_view',
  PAGE_LOAD: 'page_load_complete',
  
  // User Journey Events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  USER_ENGAGEMENT: 'user_engagement',
  
  // Business Events
  QUOTE_REQUESTED: 'quote_requested',
  BOOKING_INITIATED: 'booking_initiated',
  BOOKING_COMPLETED: 'booking_completed',
  DEVICE_SELECTED: 'device_selected',
  SERVICE_VIEWED: 'service_viewed',
  
  // Conversion Events
  LEAD_GENERATED: 'lead_generated',
  CONTACT_SUBMITTED: 'contact_submitted',
  PHONE_CLICKED: 'phone_clicked',
  EMAIL_CLICKED: 'email_clicked',
  
  // E-commerce Events
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  
  // Engagement Events
  SCROLL_MILESTONE: 'scroll_milestone',
  CLICK_HEATMAP: 'click_heatmap',
  FORM_INTERACTION: 'form_interaction',
  VIDEO_PLAY: 'video_play',
  
  // Marketing Events
  CAMPAIGN_CLICK: 'campaign_click',
  AD_IMPRESSION: 'ad_impression',
  SOCIAL_SHARE: 'social_share',
  
  // Technical Events
  ERROR_OCCURRED: 'error_occurred',
  PERFORMANCE_ISSUE: 'performance_issue',
  FEATURE_USED: 'feature_used',
} as const;

// Custom dimensions for enhanced tracking
export const customDimensions = {
  CUSTOMER_TYPE: 'customer_type', // new, returning, premium
  DEVICE_PREFERENCE: 'device_preference', // apple, android, pc, gaming
  REPAIR_CATEGORY: 'repair_category', // screen, battery, water_damage, etc.
  SERVICE_LEVEL: 'service_level', // standard, urgent, emergency
  VISIT_INTENT: 'visit_intent', // research, quote, booking, support
  TRAFFIC_SOURCE: 'traffic_source', // organic, paid, social, direct
  CAMPAIGN_SOURCE: 'campaign_source', // utm_source value
  CUSTOMER_SEGMENT: 'customer_segment', // high_value, frequent, price_sensitive
  DEVICE_CONDITION: 'device_condition', // minor, moderate, severe
  BOOKING_STAGE: 'booking_stage', // device_selection, pricing, confirmation
} as const;

// UTM Parameter configuration
export const utmConfig = {
  parameters: [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_content',
    'utm_term'
  ],
  
  // Common UTM sources for RevivaTech
  sources: {
    GOOGLE_ADS: 'google_ads',
    FACEBOOK_ADS: 'facebook_ads',
    INSTAGRAM_ADS: 'instagram_ads',
    GOOGLE_ORGANIC: 'google_organic',
    FACEBOOK_ORGANIC: 'facebook_organic',
    DIRECT: 'direct',
    REFERRAL: 'referral',
    EMAIL: 'email',
    SMS: 'sms',
    QR_CODE: 'qr_code',
  },
  
  // Campaign mediums
  mediums: {
    CPC: 'cpc', // Cost per click
    CPM: 'cpm', // Cost per mille
    SOCIAL: 'social',
    EMAIL: 'email',
    ORGANIC: 'organic',
    REFERRAL: 'referral',
    DIRECT: 'direct',
    DISPLAY: 'display',
    VIDEO: 'video',
  }
};

// Conversion tracking configuration
export const conversionConfig = {
  // Conversion events with values
  events: {
    QUOTE_REQUEST: {
      name: eventNames.QUOTE_REQUESTED,
      value: 25, // Lead value in GBP
      currency: 'GBP'
    },
    BOOKING_COMPLETED: {
      name: eventNames.BOOKING_COMPLETED,
      value: 100, // Average repair value
      currency: 'GBP'
    },
    PHONE_CONTACT: {
      name: eventNames.PHONE_CLICKED,
      value: 15,
      currency: 'GBP'
    },
    EMAIL_CONTACT: {
      name: eventNames.EMAIL_CLICKED,
      value: 10,
      currency: 'GBP'
    }
  },
  
  // Funnel stages for conversion analysis
  funnels: {
    REPAIR_BOOKING: [
      eventNames.PAGE_VIEW,
      eventNames.SERVICE_VIEWED,
      eventNames.DEVICE_SELECTED,
      eventNames.QUOTE_REQUESTED,
      eventNames.BOOKING_INITIATED,
      eventNames.BOOKING_COMPLETED
    ],
    LEAD_GENERATION: [
      eventNames.PAGE_VIEW,
      eventNames.CONTACT_SUBMITTED,
      eventNames.LEAD_GENERATED
    ]
  }
};

// Enhanced ecommerce configuration
export const ecommerceConfig = {
  currency: 'GBP',
  
  // Service categories for enhanced ecommerce
  categories: {
    REPAIR_SERVICES: 'Repair Services',
    DIAGNOSTIC_SERVICES: 'Diagnostic Services',
    PREVENTIVE_SERVICES: 'Preventive Services',
    EMERGENCY_SERVICES: 'Emergency Services',
    PREMIUM_SERVICES: 'Premium Services',
  },
  
  // Service items with pricing tiers
  items: {
    SCREEN_REPAIR: {
      item_id: 'screen_repair',
      item_name: 'Screen Repair',
      category: 'Repair Services',
      price_range: [50, 250]
    },
    BATTERY_REPLACEMENT: {
      item_id: 'battery_replacement',
      item_name: 'Battery Replacement', 
      category: 'Repair Services',
      price_range: [30, 120]
    },
    DIAGNOSTIC: {
      item_id: 'diagnostic',
      item_name: 'Device Diagnostic',
      category: 'Diagnostic Services',
      price_range: [0, 25] // Often free
    }
  }
};

// Development-only settings
export const debugConfig = {
  enableDebugMode: isDevelopment,
  enableConsoleLogging: isDevelopment,
  enableTestEvents: isDevelopment,
  skipActualTracking: false, // Set to true to test without sending real data
};

// Export environment check helpers
export const isAnalyticsEnabled = () => {
  // Enable analytics if NEXT_PUBLIC_ENABLE_ANALYTICS is true
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
    return true;
  }
  
  // Don't track in development unless explicitly enabled
  if (isDevelopment && !process.env.NEXT_PUBLIC_ENABLE_DEV_ANALYTICS) {
    return false;
  }
  
  return true;
};

export const getEnvironmentSuffix = () => {
  if (isDevelopment) return '_dev';
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'staging') return '_staging';
  return '';
};