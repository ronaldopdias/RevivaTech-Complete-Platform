/**
 * Universal Analytics Provider
 * Phase 4 - Analytics & Monitoring Integration
 * 
 * Provides analytics context and services to the entire application
 * Automatically tracks page views, user interactions, and performance metrics
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analytics } from '@/lib/analytics/UniversalAnalyticsManager';

interface AnalyticsContextType {
  isInitialized: boolean;
  userId?: string;
  sessionId: string;
  trackingEnabled: boolean;
  toggleTracking: (enabled: boolean) => void;
  getRealTimeMetrics: () => any;
  getSessionSummary: () => any;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface UniversalAnalyticsProviderProps {
  children: ReactNode;
  trackingEnabled?: boolean;
  debugMode?: boolean;
}

export function UniversalAnalyticsProvider({
  children,
  trackingEnabled = true,
  debugMode = false
}: UniversalAnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [tracking, setTracking] = useState(trackingEnabled);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Initialize analytics when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check user consent (GDPR/CCPA compliance)
    const consent = localStorage.getItem('analytics_consent');
    if (consent === 'false') {
      setTracking(false);
      return;
    }

    // Initialize analytics
    try {
      setIsInitialized(true);

      if (debugMode) {
        console.log('Universal Analytics initialized');
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }, [debugMode]);

  // Track route changes
  useEffect(() => {
    if (!tracking || !isInitialized) return;

    const handleRouteChange = () => {
      // Small delay to ensure page has loaded
      setTimeout(() => {
        analytics.trackEvent('route_change', {
          path: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }, 100);
    };

    // Listen for route changes
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

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [tracking, isInitialized]);

  // Track user sessions
  useEffect(() => {
    if (!tracking || !isInitialized) return;

    // Track session start
    analytics.trackEvent('session_start', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      language: navigator.language
    });

    // Track session end on page unload
    const handleUnload = () => {
      analytics.trackEvent('session_end', {
        timestamp: new Date().toISOString(),
        duration: performance.now()
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [tracking, isInitialized]);

  // Track user engagement
  useEffect(() => {
    if (!tracking || !isInitialized) return;

    let engagementTimer: NodeJS.Timeout;
    let engagementScore = 0;

    const trackEngagement = () => {
      engagementScore += 1;
      analytics.trackEvent('engagement_ping', {
        score: engagementScore,
        timestamp: new Date().toISOString()
      });
    };

    // Track active engagement every 30 seconds
    const startEngagementTracking = () => {
      engagementTimer = setInterval(trackEngagement, 30000);
    };

    const stopEngagementTracking = () => {
      if (engagementTimer) {
        clearInterval(engagementTimer);
      }
    };

    // Start/stop based on visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopEngagementTracking();
      } else {
        startEngagementTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start tracking if page is visible
    if (!document.hidden) {
      startEngagementTracking();
    }

    return () => {
      stopEngagementTracking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tracking, isInitialized]);

  // Track device and browser information
  useEffect(() => {
    if (!tracking || !isInitialized) return;

    const deviceInfo = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };

    analytics.trackEvent('device_info', deviceInfo);
  }, [tracking, isInitialized]);

  // Context value
  const contextValue: AnalyticsContextType = {
    isInitialized,
    userId,
    sessionId: isInitialized ? analytics.getSessionSummary().sessionId : '',
    trackingEnabled: tracking,
    toggleTracking: (enabled: boolean) => {
      setTracking(enabled);
      localStorage.setItem('analytics_consent', enabled.toString());
    },
    getRealTimeMetrics: () => analytics.getRealTimeMetrics(),
    getSessionSummary: () => analytics.getSessionSummary()
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
      {debugMode && <AnalyticsDebugPanel />}
    </AnalyticsContext.Provider>
  );
}

// Debug panel for development
function AnalyticsDebugPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(analytics.getRealTimeMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50"
      >
        Analytics Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Analytics Debug</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      {metrics && (
        <div className="space-y-2 text-sm">
          <div>
            <strong>Active Users:</strong> {metrics.activeUsers}
          </div>
          <div>
            <strong>Performance Score:</strong> {metrics.performanceScore}%
          </div>
          <div>
            <strong>Error Rate:</strong> {metrics.errorRate.toFixed(2)}%
          </div>
          <div>
            <strong>Recent Interactions:</strong> {metrics.recentInteractions.length}
          </div>
          <div>
            <strong>Page Views:</strong>
            <ul className="ml-2 mt-1">
              {metrics.recentPageViews.map((pv: any, idx: number) => (
                <li key={idx} className="text-xs">
                  {pv.page}: {pv.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use analytics context
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an UniversalAnalyticsProvider');
  }
  return context;
}

export default UniversalAnalyticsProvider;