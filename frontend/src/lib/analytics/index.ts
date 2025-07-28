/**
 * Customer Intelligence Analytics - Main Export Module
 * Phase 8 R1.1 Implementation: Advanced Browser Fingerprinting + Behavioral Event Tracking
 * 
 * This module provides enterprise-grade customer intelligence capabilities:
 * - Privacy-compliant browser fingerprinting
 * - Comprehensive behavioral event tracking (15+ event types)
 * - Real-time customer insights and scoring
 * - ML-powered segmentation and predictions
 * - GDPR/CCPA compliant consent management
 */

// Core services
export { CustomerFingerprintingService } from './fingerprinting';
export { BehavioralTrackingService } from './behavioral-tracking';
export { CustomerIntelligenceService } from './customer-intelligence';

// Type exports
export type { FingerprintData, FingerprintConfig } from './fingerprinting';
export type { BehavioralEvent, EventConfig } from './behavioral-tracking';
export type { 
  CustomerProfile, 
  CustomerInsight, 
  RealtimeMetrics,
  CustomerIntelligenceConfig 
} from './customer-intelligence';

// Convenience factory function
import { CustomerIntelligenceService, type CustomerIntelligenceConfig } from './customer-intelligence';

/**
 * Initialize Customer Intelligence System
 * 
 * @example
 * ```typescript
 * import { initializeCustomerIntelligence } from '@/lib/analytics';
 * 
 * const analytics = await initializeCustomerIntelligence({
 *   enableFingerprinting: true,
 *   enableBehavioralTracking: true,
 *   consentRequired: true,
 *   debugMode: process.env.NODE_ENV === 'development'
 * });
 * 
 * // Track business events
 * await analytics.trackBookingStarted({
 *   serviceType: 'macbook_repair',
 *   deviceType: 'MacBook Pro',
 *   estimatedValue: 299
 * });
 * ```
 */
export async function initializeCustomerIntelligence(
  config: Partial<CustomerIntelligenceConfig> = {}
): Promise<CustomerIntelligenceService> {
  const intelligence = new CustomerIntelligenceService(config);
  await intelligence.initialize();
  return intelligence;
}

/**
 * Global instance management
 */
let globalInstance: CustomerIntelligenceService | null = null;

/**
 * Get or create global Customer Intelligence instance
 * 
 * @example
 * ```typescript
 * import { getCustomerIntelligence } from '@/lib/analytics';
 * 
 * // Use anywhere in your app
 * const analytics = await getCustomerIntelligence();
 * await analytics.trackPriceCheck({
 *   serviceType: 'screen_replacement',
 *   deviceModel: 'iPhone 14 Pro',
 *   quotedPrice: 179
 * });
 * ```
 */
export async function getCustomerIntelligence(
  config: Partial<CustomerIntelligenceConfig> = {}
): Promise<CustomerIntelligenceService> {
  if (!globalInstance) {
    globalInstance = await initializeCustomerIntelligence(config);
  }
  return globalInstance;
}

/**
 * Reset global instance (useful for testing)
 */
export function resetCustomerIntelligence(): void {
  if (globalInstance) {
    globalInstance.shutdown();
    globalInstance = null;
  }
}

/**
 * Quick tracking functions for common events
 */
export const trackingHelpers = {
  /**
   * Track page view with automatic context
   */
  async trackPageView(additionalData: Record<string, any> = {}) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('page_view', 'Page View', {
      page_title: document.title,
      page_url: window.location.href,
      referrer: document.referrer,
      ...additionalData
    });
  },

  /**
   * Track service interest
   */
  async trackServiceInterest(serviceType: string, deviceType?: string) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('service_interest', 'Service Interest', {
      service_type: serviceType,
      device_type: deviceType,
      page_url: window.location.href
    });
  },

  /**
   * Track pricing interaction
   */
  async trackPricingView(serviceType: string, priceRange?: string) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('pricing_viewed', 'Pricing Viewed', {
      service_type: serviceType,
      price_range: priceRange,
      page_url: window.location.href
    });
  },

  /**
   * Track contact form interaction
   */
  async trackContactInteraction(interactionType: 'view' | 'start' | 'complete') {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('contact_interaction', 'Contact Interaction', {
      interaction_type: interactionType,
      page_url: window.location.href
    });
  },

  /**
   * Track search behavior
   */
  async trackSearch(query: string, resultCount: number) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('search', 'Search Performed', {
      search_query: query,
      result_count: resultCount,
      page_url: window.location.href
    });
  },

  /**
   * Track booking funnel progression
   */
  async trackBookingFunnelStep(step: string, stepData: Record<string, any> = {}) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('booking_funnel', 'Booking Funnel Step', {
      funnel_step: step,
      ...stepData,
      page_url: window.location.href
    });
  },

  /**
   * Track device selection
   */
  async trackDeviceSelection(deviceType: string, deviceModel?: string) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('device_selection', 'Device Selected', {
      device_type: deviceType,
      device_model: deviceModel,
      page_url: window.location.href
    });
  },

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName: string, featureData: Record<string, any> = {}) {
    const analytics = await getCustomerIntelligence();
    await analytics.trackCustomEvent('feature_usage', 'Feature Used', {
      feature_name: featureName,
      ...featureData,
      page_url: window.location.href
    });
  }
};

/**
 * React Hook for Customer Intelligence (if using React)
 */
export function useCustomerIntelligence() {
  const [analytics, setAnalytics] = React.useState<CustomerIntelligenceService | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    
    getCustomerIntelligence({
      debugMode: process.env.NODE_ENV === 'development'
    })
      .then((instance) => {
        if (mounted) {
          setAnalytics(instance);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { analytics, isLoading, error };
}

// React import conditional (only if React is available)
const React = (() => {
  try {
    return require('react');
  } catch {
    return null;
  }
})();

/**
 * Default configuration for production use
 */
export const defaultProductionConfig: CustomerIntelligenceConfig = {
  apiBaseUrl: '/api/analytics',
  enableFingerprinting: true,
  enableBehavioralTracking: true,
  enableRealtimeSync: true,
  consentRequired: true,
  debugMode: false,
  trackingConfig: {
    enableScrollTracking: true,
    enableClickHeatmaps: true,
    enableFormTracking: true,
    enableExitIntent: true,
    enableRageClicks: true,
    enablePerformanceTracking: true,
  }
};

/**
 * Development configuration with enhanced debugging
 */
export const defaultDevelopmentConfig: CustomerIntelligenceConfig = {
  ...defaultProductionConfig,
  debugMode: true,
  consentRequired: false, // For easier testing
};

/**
 * Privacy-focused configuration (minimal tracking)
 */
export const privacyFocusedConfig: CustomerIntelligenceConfig = {
  ...defaultProductionConfig,
  enableFingerprinting: false,
  trackingConfig: {
    enableScrollTracking: true,
    enableClickHeatmaps: false,
    enableFormTracking: false,
    enableExitIntent: true,
    enableRageClicks: false,
    enablePerformanceTracking: true,
  }
};

export default CustomerIntelligenceService;