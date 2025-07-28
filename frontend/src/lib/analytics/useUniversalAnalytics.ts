/**
 * useUniversalAnalytics Hook
 * Phase 4 - Analytics & Monitoring Integration
 * 
 * React hook for universal analytics tracking
 * Provides easy integration for any component
 */

import { useEffect, useCallback, useRef } from 'react';
import { analytics } from './UniversalAnalyticsManager';
import type { PageAnalyticsConfig, UserInteraction, FeatureUsage } from './UniversalAnalyticsManager';

export interface UseUniversalAnalyticsOptions {
  pageId: string;
  pageName: string;
  pageType: 'landing' | 'service' | 'admin' | 'customer' | 'auth' | 'utility';
  trackingEnabled?: boolean;
  customDimensions?: Record<string, any>;
  sensitiveData?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScrolls?: boolean;
  autoTrackForms?: boolean;
}

export function useUniversalAnalytics(options: UseUniversalAnalyticsOptions) {
  const {
    pageId,
    pageName,
    pageType,
    trackingEnabled = true,
    customDimensions = {},
    sensitiveData = false,
    autoTrackClicks = true,
    autoTrackScrolls = true,
    autoTrackForms = true
  } = options;

  const pageViewTracked = useRef(false);
  const scrollTracked = useRef(new Set<number>());
  const interactionCounts = useRef(new Map<string, number>());

  // Track page view on mount
  useEffect(() => {
    if (!trackingEnabled || pageViewTracked.current) return;

    const config: PageAnalyticsConfig = {
      pageId,
      pageName,
      pageType,
      trackingEnabled,
      customDimensions,
      sensitiveData
    };

    analytics.trackPageView(config);
    pageViewTracked.current = true;
  }, [pageId, pageName, pageType, trackingEnabled, customDimensions, sensitiveData]);

  // Auto-track interactions
  useEffect(() => {
    if (!trackingEnabled) return;

    const handleClick = (event: MouseEvent) => {
      if (!autoTrackClicks) return;

      const target = event.target as HTMLElement;
      const element = target.tagName.toLowerCase();
      const id = target.id;
      const className = target.className;
      const text = target.textContent?.slice(0, 100) || '';

      const interaction: UserInteraction = {
        element: id || className || element,
        action: 'click',
        value: text,
        timestamp: new Date(),
        metadata: {
          tagName: element,
          id,
          className,
          pageX: event.pageX,
          pageY: event.pageY
        }
      };

      analytics.trackInteraction(interaction);
    };

    const handleScroll = () => {
      if (!autoTrackScrolls) return;

      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      // Track scroll milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !scrollTracked.current.has(milestone)) {
          scrollTracked.current.add(milestone);
          
          const interaction: UserInteraction = {
            element: 'page',
            action: 'scroll',
            value: milestone,
            timestamp: new Date(),
            metadata: {
              scrollPercentage: milestone,
              scrollY: window.scrollY,
              documentHeight: document.documentElement.scrollHeight
            }
          };

          analytics.trackInteraction(interaction);
        }
      }
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (!autoTrackForms) return;

      const target = event.target as HTMLFormElement;
      const formId = target.id;
      const formAction = target.action;
      const formMethod = target.method;

      const interaction: UserInteraction = {
        element: formId || 'form',
        action: 'submit',
        value: formAction,
        timestamp: new Date(),
        metadata: {
          formId,
          formAction,
          formMethod,
          formLength: target.elements.length
        }
      };

      analytics.trackInteraction(interaction);
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('submit', handleSubmit);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [trackingEnabled, autoTrackClicks, autoTrackScrolls, autoTrackForms]);

  // Manual tracking functions
  const trackInteraction = useCallback((interaction: Omit<UserInteraction, 'timestamp'>) => {
    if (!trackingEnabled) return;

    analytics.trackInteraction({
      ...interaction,
      timestamp: new Date()
    });
  }, [trackingEnabled]);

  const trackFeature = useCallback((featureId: string, featureName: string, action: string, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    const usage: FeatureUsage = {
      featureId,
      featureName,
      action,
      timestamp: new Date(),
      success: true,
      metadata
    };

    analytics.trackFeatureUsage(usage);
  }, [trackingEnabled]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    if (!trackingEnabled) return;

    analytics.trackError(error, {
      pageId,
      pageName,
      ...context
    });
  }, [trackingEnabled, pageId, pageName]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!trackingEnabled) return;

    analytics.trackEvent(eventName, {
      pageId,
      pageName,
      ...properties
    });
  }, [trackingEnabled, pageId, pageName]);

  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('conversion', {
      type: conversionType,
      value,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackButtonClick = useCallback((buttonId: string, buttonText: string, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackInteraction({
      element: buttonId,
      action: 'click',
      value: buttonText,
      metadata
    });
  }, [trackingEnabled, trackInteraction]);

  const trackFormField = useCallback((fieldId: string, fieldType: string, action: 'focus' | 'blur' | 'change', value?: any) => {
    if (!trackingEnabled) return;

    trackInteraction({
      element: fieldId,
      action,
      value,
      metadata: {
        fieldType,
        fieldId
      }
    });
  }, [trackingEnabled, trackInteraction]);

  const trackSearch = useCallback((query: string, results: number, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('search', {
      query,
      results,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackVideoPlay = useCallback((videoId: string, duration: number, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('video_play', {
      videoId,
      duration,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackDownload = useCallback((fileName: string, fileType: string, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('download', {
      fileName,
      fileType,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackShare = useCallback((platform: string, url: string, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('share', {
      platform,
      url,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackPagePerformance = useCallback((metric: string, value: number, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('performance', {
      metric,
      value,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackUserJourney = useCallback((step: string, completed: boolean, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('user_journey', {
      step,
      completed,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const trackEngagement = useCallback((engagementType: string, value: number, metadata?: Record<string, any>) => {
    if (!trackingEnabled) return;

    trackEvent('engagement', {
      type: engagementType,
      value,
      ...metadata
    });
  }, [trackingEnabled, trackEvent]);

  const getSessionMetrics = useCallback(() => {
    if (!trackingEnabled) return null;
    return analytics.getSessionSummary();
  }, [trackingEnabled]);

  const getRealTimeMetrics = useCallback(() => {
    if (!trackingEnabled) return null;
    return analytics.getRealTimeMetrics();
  }, [trackingEnabled]);

  // Return analytics functions
  return {
    // Manual tracking
    trackInteraction,
    trackFeature,
    trackError,
    trackEvent,
    trackConversion,
    
    // Specific tracking methods
    trackButtonClick,
    trackFormField,
    trackSearch,
    trackVideoPlay,
    trackDownload,
    trackShare,
    trackPagePerformance,
    trackUserJourney,
    trackEngagement,
    
    // Metrics
    getSessionMetrics,
    getRealTimeMetrics,
    
    // Status
    isTrackingEnabled: trackingEnabled
  };
}

export default useUniversalAnalytics;