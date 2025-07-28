/**
 * Admin Dashboard Analytics Component
 * RevivaTech - Comprehensive Admin Analytics Tracking
 * 
 * Features:
 * - Admin action tracking
 * - Performance monitoring
 * - User behavior analytics
 * - System usage metrics
 * - Business intelligence
 */

'use client';

import React, { useEffect, useRef } from 'react';
import useEventTracking from '@/hooks/useEventTracking';
import { useAuth } from '@/lib/auth/client';

interface AdminDashboardAnalyticsProps {
  children: React.ReactNode;
  dashboardSection?: string;
  adminUserId?: string;
  sessionId?: string;
  userRole?: string;
}

export default function AdminDashboardAnalytics({
  children,
  dashboardSection = 'main_dashboard',
  adminUserId,
  sessionId,
  userRole = 'admin'
}: AdminDashboardAnalyticsProps) {
  const { user } = useAuth();
  const { 
    trackPageView, 
    trackCustomEvent, 
    trackFeatureUsage,
    trackError,
    trackPerformanceIssue,
    isTrackingEnabled 
  } = useEventTracking();
  
  const sessionStartTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());

  // Track admin dashboard page view
  useEffect(() => {
    if (isTrackingEnabled) {
      trackPageView({
        page_section: 'admin_dashboard',
        dashboard_section: dashboardSection,
        admin_user_id: adminUserId || user?.id || 'unknown',
        user_role: userRole,
        session_id: sessionId || `admin_session_${Date.now()}`,
        access_level: 'admin_full',
        timestamp: new Date().toISOString()
      });

      // Track admin session start
      trackCustomEvent({
        name: 'admin_session_started',
        parameters: {
          dashboard_section: dashboardSection,
          admin_user_id: adminUserId || user?.id || 'unknown',
          user_role: userRole,
          session_start_time: new Date().toISOString(),
          referrer: document.referrer || 'direct'
        }
      });
    }
  }, [dashboardSection, adminUserId, userRole, sessionId, isTrackingEnabled]);

  // Track admin interactions
  useEffect(() => {
    const trackAdminInteraction = (event: MouseEvent) => {
      if (!isTrackingEnabled) return;

      const target = event.target as HTMLElement;
      interactionCount.current++;
      lastActivityTime.current = Date.now();

      // Track admin button clicks
      if (target.tagName === 'BUTTON') {
        const buttonText = target.textContent || target.getAttribute('aria-label') || 'unknown';
        trackCustomEvent({
          name: 'admin_button_clicked',
          parameters: {
            button_text: buttonText,
            dashboard_section: dashboardSection,
            admin_user_id: adminUserId || user?.id || 'unknown',
            interaction_count: interactionCount.current,
            session_duration: Date.now() - sessionStartTime.current,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Track admin navigation clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') as HTMLAnchorElement;
        const linkText = link.textContent || link.getAttribute('aria-label') || 'unknown';
        const href = link.href;
        
        trackCustomEvent({
          name: 'admin_navigation_clicked',
          parameters: {
            link_text: linkText,
            link_href: href,
            dashboard_section: dashboardSection,
            admin_user_id: adminUserId || user?.id || 'unknown',
            navigation_type: href.includes('/admin/') ? 'internal_admin' : 'external',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Track specific admin actions
      const adminActionElements = target.closest('.admin-action, .quick-action, .analytics-card, .admin-tool');
      if (adminActionElements) {
        const actionType = adminActionElements.className.split(' ').find(cls => 
          cls.includes('admin-') || cls.includes('quick-') || cls.includes('analytics-')
        ) || 'unknown';
        
        trackCustomEvent({
          name: 'admin_action_performed',
          parameters: {
            action_type: actionType,
            action_element: target.textContent?.substring(0, 100) || 'unknown',
            dashboard_section: dashboardSection,
            admin_user_id: adminUserId || user?.id || 'unknown',
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    document.addEventListener('click', trackAdminInteraction);
    
    return () => {
      document.removeEventListener('click', trackAdminInteraction);
    };
  }, [dashboardSection, adminUserId, userRole, isTrackingEnabled]);

  // Track admin dashboard performance
  useEffect(() => {
    if (!isTrackingEnabled) return;

    const startTime = performance.now();
    
    // Track dashboard load performance
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      if (loadTime > 2000) { // Alert if dashboard takes >2 seconds to load
        trackPerformanceIssue('admin_dashboard_slow_load', {
          load_time_ms: loadTime,
          dashboard_section: dashboardSection,
          admin_user_id: adminUserId || user?.id || 'unknown'
        });
      }

      trackCustomEvent({
        name: 'admin_dashboard_loaded',
        parameters: {
          load_time_ms: loadTime,
          dashboard_section: dashboardSection,
          admin_user_id: adminUserId || user?.id || 'unknown',
          performance_rating: loadTime < 1000 ? 'excellent' : loadTime < 2000 ? 'good' : 'poor',
          timestamp: new Date().toISOString()
        }
      });
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [dashboardSection, adminUserId, isTrackingEnabled]);

  // Track admin feature usage
  const trackAdminFeatureUsage = (featureName: string, action: string, context?: any) => {
    if (!isTrackingEnabled) return;

    trackFeatureUsage(`admin_${featureName}`, action, {
      dashboard_section: dashboardSection,
      admin_user_id: adminUserId || user?.id || 'unknown',
      user_role: userRole,
      session_duration: Date.now() - sessionStartTime.current,
      ...context
    });
  };

  // Track admin system monitoring
  const trackAdminSystemAction = (actionType: string, details: any) => {
    if (!isTrackingEnabled) return;

    trackCustomEvent({
      name: 'admin_system_action',
      parameters: {
        action_type: actionType,
        action_details: details,
        dashboard_section: dashboardSection,
        admin_user_id: adminUserId || user?.id || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  };

  // Track data exports and reports
  const trackAdminDataAction = (dataType: string, action: 'export' | 'view' | 'filter', details?: any) => {
    if (!isTrackingEnabled) return;

    trackCustomEvent({
      name: 'admin_data_action',
      parameters: {
        data_type: dataType,
        data_action: action,
        action_details: details || {},
        dashboard_section: dashboardSection,
        admin_user_id: adminUserId || user?.id || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  };

  // Track admin error handling
  const trackAdminError = (errorType: string, errorMessage: string, context?: any) => {
    if (!isTrackingEnabled) return;

    trackError(`admin_${errorType}`, errorMessage, undefined, {
      dashboard_section: dashboardSection,
      admin_user_id: adminUserId || user?.id || 'unknown',
      user_role: userRole,
      ...context
    });
  };

  // Track session end on component unmount
  useEffect(() => {
    return () => {
      if (isTrackingEnabled) {
        const sessionDuration = Date.now() - sessionStartTime.current;
        const timeSinceLastActivity = Date.now() - lastActivityTime.current;
        
        trackCustomEvent({
          name: 'admin_session_ended',
          parameters: {
            session_duration: sessionDuration,
            total_interactions: interactionCount.current,
            time_since_last_activity: timeSinceLastActivity,
            dashboard_section: dashboardSection,
            admin_user_id: adminUserId || user?.id || 'unknown',
            session_end_reason: timeSinceLastActivity > 300000 ? 'timeout' : 'navigation',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }, [dashboardSection, adminUserId, isTrackingEnabled]);

  // Provide analytics context to admin components
  const adminAnalyticsContext = {
    trackAdminFeatureUsage,
    trackAdminSystemAction,
    trackAdminDataAction,
    trackAdminError,
    dashboardSection,
    adminUserId: adminUserId || user?.id || 'unknown',
    sessionId: sessionId || `admin_session_${Date.now()}`,
    isTrackingEnabled
  };

  return (
    <div className="admin-dashboard-analytics" data-dashboard-section={dashboardSection}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Only pass adminAnalytics to custom React components (not DOM elements)
          const childType = child.type;
          const isCustomComponent = typeof childType === 'function' || 
                                   (typeof childType === 'object' && childType !== null);
          
          if (isCustomComponent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              adminAnalytics: adminAnalyticsContext
            });
          }
        }
        return child;
      })}
    </div>
  );
}

// Hook for accessing admin analytics in child components
export function useAdminAnalytics() {
  const contextRef = useRef<any>(null);
  
  return contextRef.current || {
    trackAdminFeatureUsage: () => {},
    trackAdminSystemAction: () => {},
    trackAdminDataAction: () => {},
    trackAdminError: () => {},
    dashboardSection: '',
    adminUserId: '',
    sessionId: '',
    isTrackingEnabled: false
  };
}