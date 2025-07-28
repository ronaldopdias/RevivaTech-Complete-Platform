/**
 * Page Analytics Wrapper
 * Phase 4 - Analytics & Monitoring Integration
 * 
 * Wraps any page with universal analytics tracking
 * Automatically tracks page views, performance, and user interactions
 */

'use client';

import React, { ReactNode, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUniversalAnalytics } from '@/lib/analytics/useUniversalAnalytics';
import { useAnalytics } from './UniversalAnalyticsProvider';

interface PageAnalyticsWrapperProps {
  children: ReactNode;
  pageId: string;
  pageName: string;
  pageType: 'landing' | 'service' | 'admin' | 'customer' | 'auth' | 'utility';
  trackingEnabled?: boolean;
  customDimensions?: Record<string, any>;
  sensitiveData?: boolean;
  className?: string;
}

export function PageAnalyticsWrapper({
  children,
  pageId,
  pageName,
  pageType,
  trackingEnabled = true,
  customDimensions = {},
  sensitiveData = false,
  className
}: PageAnalyticsWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isInitialized, trackingEnabled: globalTracking } = useAnalytics();
  
  // Enhanced custom dimensions with route information
  const enhancedDimensions = {
    ...customDimensions,
    pathname,
    searchParams: searchParams.toString(),
    timestamp: new Date().toISOString(),
    pageCategory: pageType,
    hasSearchParams: searchParams.size > 0,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    referrer: typeof document !== 'undefined' ? document.referrer : 'unknown'
  };

  // Initialize analytics for this page
  const {
    trackInteraction,
    trackFeature,
    trackError,
    trackEvent,
    trackConversion,
    trackButtonClick,
    trackFormField,
    trackSearch,
    trackPagePerformance,
    trackUserJourney,
    trackEngagement,
    getSessionMetrics,
    getRealTimeMetrics
  } = useUniversalAnalytics({
    pageId,
    pageName,
    pageType,
    trackingEnabled: trackingEnabled && globalTracking && isInitialized,
    customDimensions: enhancedDimensions,
    sensitiveData,
    autoTrackClicks: true,
    autoTrackScrolls: true,
    autoTrackForms: true
  });

  // Track page load time
  useEffect(() => {
    if (!trackingEnabled || !globalTracking || !isInitialized) return;

    const startTime = performance.now();

    // Track initial page load
    trackEvent('page_load_start', {
      pageId,
      pageName,
      timestamp: new Date().toISOString()
    });

    // Track when page is fully loaded
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      trackPagePerformance('page_load_time', loadTime, {
        pageId,
        pageName,
        loadTime: Math.round(loadTime)
      });
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [pageId, pageName, trackingEnabled, globalTracking, isInitialized, trackEvent, trackPagePerformance]);

  // Track Core Web Vitals
  useEffect(() => {
    if (!trackingEnabled || !globalTracking || !isInitialized) return;

    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          trackPagePerformance('FCP', entry.startTime, {
            pageId,
            pageName,
            metric: 'first-contentful-paint'
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.error('Failed to observe paint entries:', error);
    }

    return () => observer.disconnect();
  }, [pageId, pageName, trackingEnabled, globalTracking, isInitialized, trackPagePerformance]);

  // Track user interactions specific to this page
  useEffect(() => {
    if (!trackingEnabled || !globalTracking || !isInitialized) return;

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackInteraction({
        element: target.tagName.toLowerCase(),
        action: 'contextmenu',
        value: target.textContent?.slice(0, 50) || '',
        metadata: {
          pageId,
          pageName,
          x: event.clientX,
          y: event.clientY
        }
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Track keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        trackInteraction({
          element: 'keyboard',
          action: 'keydown',
          value: `${event.ctrlKey ? 'ctrl+' : 'cmd+'}${event.key}`,
          metadata: {
            pageId,
            pageName,
            key: event.key,
            altKey: event.altKey,
            shiftKey: event.shiftKey
          }
        });
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
        trackFormField(
          target.id || target.name || target.tagName.toLowerCase(),
          target.getAttribute('type') || target.tagName.toLowerCase(),
          'focus'
        );
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
        trackFormField(
          target.id || target.name || target.tagName.toLowerCase(),
          target.getAttribute('type') || target.tagName.toLowerCase(),
          'blur',
          (target as HTMLInputElement).value
        );
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [pageId, pageName, trackingEnabled, globalTracking, isInitialized, trackInteraction, trackFormField]);

  // Track viewport and device information
  useEffect(() => {
    if (!trackingEnabled || !globalTracking || !isInitialized) return;

    const trackViewport = () => {
      trackEvent('viewport_info', {
        pageId,
        pageName,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
          orientation: window.screen.orientation?.type || 'unknown'
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight
        }
      });
    };

    // Track initial viewport
    trackViewport();

    // Track viewport changes
    const handleResize = () => {
      trackViewport();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageId, pageName, trackingEnabled, globalTracking, isInitialized, trackEvent]);

  // Track user engagement time
  useEffect(() => {
    if (!trackingEnabled || !globalTracking || !isInitialized) return;

    let engagementStartTime = Date.now();
    let isEngaged = true;

    const trackEngagementTime = () => {
      if (isEngaged) {
        const engagementTime = Date.now() - engagementStartTime;
        trackEngagement('time_on_page', engagementTime, {
          pageId,
          pageName,
          duration: engagementTime
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEngagementTime();
        isEngaged = false;
      } else {
        engagementStartTime = Date.now();
        isEngaged = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track engagement on page unload
    const handleBeforeUnload = () => {
      trackEngagementTime();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      trackEngagementTime();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageId, pageName, trackingEnabled, globalTracking, isInitialized, trackEngagement]);

  // Provide analytics context to children
  const analyticsContext = {
    pageId,
    pageName,
    pageType,
    trackInteraction,
    trackFeature,
    trackError,
    trackEvent,
    trackConversion,
    trackButtonClick,
    trackFormField,
    trackSearch,
    trackPagePerformance,
    trackUserJourney,
    trackEngagement,
    getSessionMetrics,
    getRealTimeMetrics,
    isTrackingEnabled: trackingEnabled && globalTracking && isInitialized
  };

  // Error boundary for analytics
  const handleError = (error: Error, errorInfo: any) => {
    trackError(error, {
      pageId,
      pageName,
      errorInfo,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className={className} data-analytics-page={pageId}>
      <PageAnalyticsContext.Provider value={analyticsContext}>
        <ErrorBoundary onError={handleError}>
          {children}
        </ErrorBoundary>
      </PageAnalyticsContext.Provider>
    </div>
  );
}

// Context for page analytics
const PageAnalyticsContext = React.createContext<any>(null);

// Hook to use page analytics
export function usePageAnalytics() {
  const context = React.useContext(PageAnalyticsContext);
  if (!context) {
    throw new Error('usePageAnalytics must be used within a PageAnalyticsWrapper');
  }
  return context;
}

// Simple error boundary for analytics
class ErrorBoundary extends React.Component<
  { children: ReactNode; onError: (error: Error, errorInfo: any) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.children;
    }

    return this.props.children;
  }
}

export default PageAnalyticsWrapper;