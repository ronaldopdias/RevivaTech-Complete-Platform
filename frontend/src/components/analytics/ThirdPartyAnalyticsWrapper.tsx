/**
 * Third-Party Analytics Wrapper
 * RevivaTech Analytics Integration Component
 * 
 * Integrates Google Analytics 4, Facebook Pixel, and PostHog with the main application
 * Handles consent management and privacy compliance
 */

'use client';

import React, { useEffect, useState } from 'react';
import { getThirdPartyAnalytics } from '@/lib/analytics/ThirdPartyAnalytics';
import { analyticsConfig, eventNames, customDimensions } from '@/config/analytics.config';
import { useConsent } from './ConsentManager';

interface ThirdPartyAnalyticsWrapperProps {
  children: React.ReactNode;
}

const ThirdPartyAnalyticsWrapper: React.FC<ThirdPartyAnalyticsWrapperProps> = ({ children }) => {
  const [analyticsService, setAnalyticsService] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const { hasConsent, consents } = useConsent();

  // Initialize analytics when consent is granted - Hot reload resilient
  useEffect(() => {
    const initializeAnalytics = async () => {
      // Prevent re-initialization on hot reloads
      if (initializationAttempted && (isInitialized || analyticsService)) {
        return;
      }

      // Only initialize if analytics consent is granted
      if (!hasConsent('analytics')) {
        // Reduce console noise - only log once in development
        if (!initializationAttempted && process.env.NODE_ENV === 'development') {
          console.log('ThirdPartyAnalytics: Analytics consent not granted, skipping initialization');
        }
        return;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }

      setInitializationAttempted(true);

      try {
        // Get analytics service instance
        const service = getThirdPartyAnalytics(analyticsConfig);
        
        // Initialize the service with error handling
        await service.initialize();
        
        setAnalyticsService(service);
        setIsInitialized(true);

        // Track initial page view
        service.trackPageView(window.location.href, document.title);

        // Set initial user properties
        service.setUserProperties({
          customerType: 'new', // Will be updated based on actual user data
          devicePreference: getDevicePreference(),
        });

        // Reduce console noise in production
        if (process.env.NODE_ENV === 'development') {
          console.log('ThirdPartyAnalytics: Successfully initialized');
        }
      } catch (error) {
        console.error('ThirdPartyAnalytics: Failed to initialize:', error);
      }
    };

    initializeAnalytics();
  }, [hasConsent, consents.analytics, initializationAttempted, isInitialized, analyticsService]);

  // Update consent when it changes
  useEffect(() => {
    if (analyticsService && isInitialized) {
      analyticsService.updateConsent(hasConsent('analytics'));
    }
  }, [analyticsService, isInitialized, hasConsent]);

  // Track route changes
  useEffect(() => {
    if (!analyticsService || !isInitialized || !hasConsent('analytics')) {
      return;
    }

    const handleRouteChange = () => {
      // Small delay to ensure page has loaded
      setTimeout(() => {
        analyticsService.trackPageView(
          window.location.href,
          document.title,
          document.referrer
        );
      }, 100);
    };

    // Listen for route changes in Next.js
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleRouteChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleRouteChange();
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [analyticsService, isInitialized, hasConsent]);

  // Track scroll depth
  useEffect(() => {
    if (!analyticsService || !isInitialized || !hasConsent('analytics')) {
      return;
    }

    let maxScrollDepth = 0;
    const milestones = [25, 50, 75, 90];
    const trackedMilestones = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;

        // Track milestone events
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
            trackedMilestones.add(milestone);
            analyticsService.trackEvent({
              name: eventNames.SCROLL_MILESTONE,
              parameters: {
                scroll_depth: milestone,
                page_url: window.location.href,
                [customDimensions.VISIT_INTENT]: 'engagement'
              }
            });
          }
        });
      }
    };

    const throttledScroll = throttle(handleScroll, 1000);
    window.addEventListener('scroll', throttledScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [analyticsService, isInitialized, hasConsent]);

  // Provide analytics instance to children via context
  return (
    <ThirdPartyAnalyticsContext.Provider 
      value={{
        analytics: analyticsService,
        isInitialized,
        trackEvent: analyticsService?.trackEvent.bind(analyticsService) || (() => {}),
        trackConversion: analyticsService?.trackConversion.bind(analyticsService) || (() => {}),
        setUserProperties: analyticsService?.setUserProperties.bind(analyticsService) || (() => {})
      }}
    >
      {children}
    </ThirdPartyAnalyticsContext.Provider>
  );
};

// Context for accessing analytics throughout the app
const ThirdPartyAnalyticsContext = React.createContext<{
  analytics: any;
  isInitialized: boolean;
  trackEvent: (event: any) => void;
  trackConversion: (conversion: any) => void;
  setUserProperties: (properties: any) => void;
}>({
  analytics: null,
  isInitialized: false,
  trackEvent: () => {},
  trackConversion: () => {},
  setUserProperties: () => {}
});

// Hook to use analytics throughout the app
export const useThirdPartyAnalytics = () => {
  const context = React.useContext(ThirdPartyAnalyticsContext);
  if (!context) {
    throw new Error('useThirdPartyAnalytics must be used within ThirdPartyAnalyticsWrapper');
  }
  return context;
};

// Utility functions
const getDevicePreference = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'apple';
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('macintosh')) return 'apple';
  if (userAgent.includes('windows')) return 'pc';
  return 'unknown';
};

const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export default ThirdPartyAnalyticsWrapper;