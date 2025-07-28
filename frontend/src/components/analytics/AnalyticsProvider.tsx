/**
 * Analytics Provider Component
 * Context provider for Customer Intelligence throughout the app
 * Part of Phase 8 R1 implementation
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  CustomerIntelligenceService, 
  initializeCustomerIntelligence, 
  type CustomerIntelligenceConfig,
  type CustomerProfile,
  type CustomerInsight
} from '@/lib/analytics';

interface AnalyticsContextType {
  analyticsService: CustomerIntelligenceService | null;
  customerProfile: CustomerProfile | null;
  customerInsights: CustomerInsight[];
  isLoading: boolean;
  error: string | null;
  
  // Tracking functions
  trackPageView: (additionalData?: Record<string, any>) => Promise<void>;
  trackServiceInterest: (serviceType: string, deviceType?: string) => Promise<void>;
  trackPricingView: (serviceType: string, priceRange?: string) => Promise<void>;
  trackBookingStarted: (bookingData: { serviceType: string; deviceType: string; estimatedValue?: number }) => Promise<void>;
  trackBookingCompleted: (bookingData: { bookingId: string; serviceType: string; totalValue: number }) => Promise<void>;
  trackPriceCheck: (priceData: { serviceType: string; deviceModel?: string; quotedPrice?: number }) => Promise<void>;
  trackServiceComparison: (comparisonData: { services: string[]; timeSpent: number }) => Promise<void>;
  trackContactInteraction: (interactionType: 'view' | 'start' | 'complete') => Promise<void>;
  trackDeviceSelection: (deviceType: string, deviceModel?: string) => Promise<void>;
  trackSearch: (query: string, resultCount: number) => Promise<void>;
  trackFeatureUsage: (featureName: string, featureData?: Record<string, any>) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  updateConsent: (consentType: 'analytics' | 'fingerprinting' | 'marketing', granted: boolean) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  config?: Partial<CustomerIntelligenceConfig>;
  enableAutoTracking?: boolean;
  enableConsentManagement?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  config = {},
  enableAutoTracking = true,
  enableConsentManagement = true
}) => {
  const [analyticsService, setAnalyticsService] = useState<CustomerIntelligenceService | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check consent first if required
        if (enableConsentManagement && config.consentRequired !== false) {
          const analyticsConsent = localStorage.getItem('consent_analytics');
          if (analyticsConsent !== 'true') {
            setIsLoading(false);
            return; // Wait for consent
          }
        }

        // Initialize service
        const service = await initializeCustomerIntelligence({
          debugMode: process.env.NODE_ENV === 'development',
          enableFingerprinting: true,
          enableBehavioralTracking: true,
          enableRealtimeSync: true,
          consentRequired: enableConsentManagement,
          ...config
        });

        setAnalyticsService(service);

        // Load initial data
        await loadCustomerData(service);

        // Auto-track page view if enabled
        if (enableAutoTracking) {
          await service.trackCustomEvent('page_view', 'Page View', {
            page_title: document.title,
            page_url: window.location.href,
            referrer: document.referrer,
            auto_tracked: true
          });
        }

      } catch (err) {
        console.error('Failed to initialize analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize analytics');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAnalytics();

    // Cleanup on unmount
    return () => {
      if (analyticsService) {
        analyticsService.shutdown();
      }
    };
  }, [config, enableConsentManagement, enableAutoTracking]);

  // Auto-track route changes
  useEffect(() => {
    if (!analyticsService || !enableAutoTracking) return;

    const handleRouteChange = () => {
      analyticsService.trackCustomEvent('page_view', 'Route Change', {
        page_title: document.title,
        page_url: window.location.href,
        referrer: document.referrer,
        route_change: true
      });
    };

    // Listen for route changes (works with Next.js router)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [analyticsService, enableAutoTracking]);

  // Load customer data
  const loadCustomerData = async (service: CustomerIntelligenceService) => {
    try {
      const [profile, insights] = await Promise.all([
        service.loadCustomerProfile(),
        service.getCustomerInsights()
      ]);

      setCustomerProfile(profile);
      setCustomerInsights(insights);
    } catch (err) {
      console.error('Failed to load customer data:', err);
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (!analyticsService) return;
    
    try {
      setError(null);
      await loadCustomerData(analyticsService);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  };

  // Tracking functions
  const trackPageView = async (additionalData: Record<string, any> = {}) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('page_view', 'Page View', {
      page_title: document.title,
      page_url: window.location.href,
      referrer: document.referrer,
      ...additionalData
    });
  };

  const trackServiceInterest = async (serviceType: string, deviceType?: string) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('service_interest', 'Service Interest', {
      service_type: serviceType,
      device_type: deviceType,
      page_url: window.location.href
    });
  };

  const trackPricingView = async (serviceType: string, priceRange?: string) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('pricing_viewed', 'Pricing Viewed', {
      service_type: serviceType,
      price_range: priceRange,
      page_url: window.location.href
    });
  };

  const trackBookingStarted = async (bookingData: { serviceType: string; deviceType: string; estimatedValue?: number }) => {
    if (!analyticsService) return;
    
    await analyticsService.trackBookingStarted(bookingData);
    await refreshData(); // Refresh to update profile
  };

  const trackBookingCompleted = async (bookingData: { bookingId: string; serviceType: string; totalValue: number }) => {
    if (!analyticsService) return;
    
    await analyticsService.trackBookingCompleted(bookingData);
    await refreshData(); // Refresh to update profile
  };

  const trackPriceCheck = async (priceData: { serviceType: string; deviceModel?: string; quotedPrice?: number }) => {
    if (!analyticsService) return;
    
    await analyticsService.trackPriceCheck(priceData);
  };

  const trackServiceComparison = async (comparisonData: { services: string[]; timeSpent: number }) => {
    if (!analyticsService) return;
    
    await analyticsService.trackServiceComparison(comparisonData);
  };

  const trackContactInteraction = async (interactionType: 'view' | 'start' | 'complete') => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('contact_interaction', 'Contact Interaction', {
      interaction_type: interactionType,
      page_url: window.location.href
    });
  };

  const trackDeviceSelection = async (deviceType: string, deviceModel?: string) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('device_selection', 'Device Selected', {
      device_type: deviceType,
      device_model: deviceModel,
      page_url: window.location.href
    });
  };

  const trackSearch = async (query: string, resultCount: number) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('search', 'Search Performed', {
      search_query: query,
      result_count: resultCount,
      page_url: window.location.href
    });
  };

  const trackFeatureUsage = async (featureName: string, featureData: Record<string, any> = {}) => {
    if (!analyticsService) return;
    
    await analyticsService.trackCustomEvent('feature_usage', 'Feature Used', {
      feature_name: featureName,
      ...featureData,
      page_url: window.location.href
    });
  };

  // Update consent
  const updateConsent = async (consentType: 'analytics' | 'fingerprinting' | 'marketing', granted: boolean) => {
    if (!analyticsService) return;
    
    await analyticsService.updateConsent(consentType, granted);
    
    // If analytics consent is granted and service isn't initialized, initialize it
    if (consentType === 'analytics' && granted && !analyticsService) {
      window.location.reload(); // Reload to reinitialize
    }
  };

  const contextValue: AnalyticsContextType = {
    analyticsService,
    customerProfile,
    customerInsights,
    isLoading,
    error,
    trackPageView,
    trackServiceInterest,
    trackPricingView,
    trackBookingStarted,
    trackBookingCompleted,
    trackPriceCheck,
    trackServiceComparison,
    trackContactInteraction,
    trackDeviceSelection,
    trackSearch,
    trackFeatureUsage,
    refreshData,
    updateConsent
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// HOC for automatically tracking component views
export function withAnalyticsTracking<T extends {}>(
  Component: React.ComponentType<T>,
  trackingConfig: {
    eventName?: string;
    eventData?: Record<string, any>;
    trackOnMount?: boolean;
    trackOnUnmount?: boolean;
  } = {}
) {
  const WrappedComponent = (props: T) => {
    const analytics = useAnalytics();
    const { eventName = 'component_view', eventData = {}, trackOnMount = true, trackOnUnmount = false } = trackingConfig;

    useEffect(() => {
      if (trackOnMount && analytics.analyticsService) {
        analytics.analyticsService.trackCustomEvent('component_view', eventName, {
          component_name: Component.displayName || Component.name,
          ...eventData
        });
      }

      return () => {
        if (trackOnUnmount && analytics.analyticsService) {
          analytics.analyticsService.trackCustomEvent('component_unmount', `${eventName} Unmount`, {
            component_name: Component.displayName || Component.name,
            ...eventData
          });
        }
      };
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalyticsTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default AnalyticsProvider;