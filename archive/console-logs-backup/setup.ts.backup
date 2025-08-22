/**
 * Analytics Setup Script
 * RevivaTech Analytics Initialization
 * 
 * Handles the initialization and configuration of all analytics services
 * Ensures proper environment-based activation and consent management
 */

import { getThirdPartyAnalytics } from './ThirdPartyAnalytics';
import { analyticsConfig, isAnalyticsEnabled } from '@/config/analytics.config';

// Global analytics instance
let analyticsInstance: any = null;

/**
 * Initialize analytics services
 * Call this once during app initialization
 */
export const initializeAnalytics = async (): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('Analytics: Server-side environment detected, skipping initialization');
    return false;
  }

  // Check if analytics should be enabled
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Disabled for current environment');
    return false;
  }

  // Check for required environment variables
  const missingEnvVars = validateEnvironmentVariables();
  if (missingEnvVars.length > 0) {
    console.warn('Analytics: Missing environment variables:', missingEnvVars);
    // Continue with initialization but some services may not work
  }

  try {
    // Get analytics instance with current configuration
    analyticsInstance = getThirdPartyAnalytics(analyticsConfig);
    
    // Initialize the service (this will check for consent)
    await analyticsInstance.initialize();
    
    console.log('Analytics: Successfully initialized');
    return true;
  } catch (error) {
    console.error('Analytics: Failed to initialize:', error);
    return false;
  }
};

/**
 * Validate that required environment variables are present
 */
const validateEnvironmentVariables = (): string[] => {
  const required = [
    { key: 'NEXT_PUBLIC_GA_TRACKING_ID', service: 'Google Analytics' },
    { key: 'NEXT_PUBLIC_FB_PIXEL_ID', service: 'Facebook Pixel' },
    { key: 'NEXT_PUBLIC_POSTHOG_KEY', service: 'PostHog' }
  ];

  const missing: string[] = [];

  required.forEach(({ key, service }) => {
    if (!process.env[key] || process.env[key] === 'G-XXXXXXXXXX' || process.env[key]?.includes('your-')) {
      missing.push(`${key} (${service})`);
    }
  });

  return missing;
};

/**
 * Get analytics summary for debugging
 */
export const getAnalyticsSummary = () => {
  if (!analyticsInstance) {
    return {
      status: 'not_initialized',
      services: {
        googleAnalytics: false,
        facebookPixel: false,
        postHog: false
      },
      environment: process.env.NODE_ENV,
      consent: false
    };
  }

  return {
    status: 'initialized',
    ...analyticsInstance.getAnalyticsSummary(),
    environment: process.env.NODE_ENV,
    consent: localStorage.getItem('analytics_consent') === 'true'
  };
};

/**
 * Manually trigger consent update
 */
export const updateAnalyticsConsent = (granted: boolean) => {
  if (analyticsInstance) {
    analyticsInstance.updateConsent(granted);
  }
  
  // Update localStorage for persistence
  localStorage.setItem('analytics_consent', granted.toString());
  localStorage.setItem('analytics_consent_timestamp', Date.now().toString());
};

/**
 * Track a custom event manually
 */
export const trackAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!analyticsInstance) {
    console.warn('Analytics: Instance not initialized');
    return;
  }

  analyticsInstance.trackEvent({
    name: eventName,
    parameters,
    timestamp: Date.now()
  });
};

/**
 * Track a conversion event manually
 */
export const trackAnalyticsConversion = (eventName: string, value?: number, currency: string = 'GBP') => {
  if (!analyticsInstance) {
    console.warn('Analytics: Instance not initialized');
    return;
  }

  analyticsInstance.trackConversion({
    eventName,
    value,
    currency
  });
};

/**
 * Set user properties
 */
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  if (!analyticsInstance) {
    console.warn('Analytics: Instance not initialized');
    return;
  }

  analyticsInstance.setUserProperties(properties);
};

/**
 * Clean up analytics (call on app unmount)
 */
export const cleanupAnalytics = () => {
  if (analyticsInstance) {
    analyticsInstance.destroy();
    analyticsInstance = null;
  }
};

/**
 * Development helper to test analytics configuration
 */
export const testAnalyticsConfiguration = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Analytics: Test function only available in development');
    return;
  }

  console.group('Analytics Configuration Test');
  
  // Test environment variables
  console.log('Environment Variables:');
  console.log('- GA4 Measurement ID:', process.env.NEXT_PUBLIC_GA_TRACKING_ID);
  console.log('- Facebook Pixel ID:', process.env.NEXT_PUBLIC_FB_PIXEL_ID);
  console.log('- PostHog API Key:', process.env.NEXT_PUBLIC_POSTHOG_KEY);
  
  // Test analytics instance
  console.log('\nAnalytics Instance:');
  console.log(getAnalyticsSummary());
  
  // Test event tracking
  console.log('\nTesting Event Tracking...');
  trackAnalyticsEvent('test_event', {
    test_parameter: 'test_value',
    timestamp: new Date().toISOString()
  });
  
  console.log('Test completed - check browser developer tools for analytics requests');
  console.groupEnd();
};

/**
 * Get current analytics configuration
 */
export const getAnalyticsConfiguration = () => {
  return {
    config: analyticsConfig,
    isEnabled: isAnalyticsEnabled(),
    hasConsent: localStorage.getItem('analytics_consent') === 'true',
    environment: process.env.NODE_ENV,
    missingEnvVars: validateEnvironmentVariables()
  };
};

// Export analytics instance getter for advanced use cases
export const getAnalyticsInstance = () => analyticsInstance;

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeAnalytics();
  }, 1000);
}