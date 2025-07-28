/**
 * Analytics Overview Component
 * RevivaTech - Real-time Analytics Summary for Admin Dashboard
 * 
 * Features:
 * - Live analytics status monitoring
 * - Cross-platform analytics health
 * - Recent event tracking
 * - Performance metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import useEventTracking from '@/hooks/useEventTracking';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Eye,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsOverviewProps {
  showDetailedMetrics?: boolean;
  refreshInterval?: number;
}

export default function AnalyticsOverview({ 
  showDetailedMetrics = true,
  refreshInterval = 30000 
}: AnalyticsOverviewProps) {
  const { trackCustomEvent, isTrackingEnabled } = useEventTracking();
  const [analyticsStatus, setAnalyticsStatus] = useState({
    googleAnalytics: false,
    facebookPixel: false,
    postHog: false,
    universalTracking: false
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    eventsToday: 0,
    pageViews: 0,
    uniqueUsers: 0,
    conversionRate: 0
  });

  // Check analytics platform status
  useEffect(() => {
    const checkAnalyticsStatus = () => {
      if (typeof window === 'undefined') return;

      const status = {
        googleAnalytics: typeof (window as any).gtag === 'function',
        facebookPixel: typeof (window as any).fbq === 'function',
        postHog: typeof (window as any).posthog === 'object',
        universalTracking: isTrackingEnabled
      };

      setAnalyticsStatus(status);

      // Track analytics health check
      if (isTrackingEnabled) {
        trackCustomEvent({
          name: 'admin_analytics_health_check',
          parameters: {
            ...status,
            health_check_time: new Date().toISOString(),
            all_systems_operational: Object.values(status).every(Boolean)
          }
        });
      }
    };

    checkAnalyticsStatus();
    const interval = setInterval(checkAnalyticsStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [isTrackingEnabled, refreshInterval]);

  // Generate mock recent events for demo
  useEffect(() => {
    const generateRecentEvents = () => {
      const events = [
        {
          type: 'page_view',
          description: 'Customer viewed iPhone repair page',
          timestamp: new Date(Date.now() - Math.random() * 300000).toISOString(),
          platform: 'GA4',
          value: 0
        },
        {
          type: 'quote_requested',
          description: 'MacBook repair quote requested',
          timestamp: new Date(Date.now() - Math.random() * 600000).toISOString(),
          platform: 'Facebook Pixel',
          value: 25
        },
        {
          type: 'booking_completed',
          description: 'iPad screen repair booking completed',
          timestamp: new Date(Date.now() - Math.random() * 900000).toISOString(),
          platform: 'PostHog',
          value: 180
        },
        {
          type: 'contact_interaction',
          description: 'Customer clicked phone number',
          timestamp: new Date(Date.now() - Math.random() * 1200000).toISOString(),
          platform: 'Universal',
          value: 15
        }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentEvents(events);
    };

    generateRecentEvents();
    const interval = setInterval(generateRecentEvents, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Generate mock performance metrics
  useEffect(() => {
    const generateMetrics = () => {
      setPerformanceMetrics({
        eventsToday: Math.floor(Math.random() * 500 + 200),
        pageViews: Math.floor(Math.random() * 300 + 150),
        uniqueUsers: Math.floor(Math.random() * 100 + 50),
        conversionRate: Math.random() * 5 + 2
      });
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'quote_requested': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'booking_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'contact_interaction': return <MousePointer className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'GA4': return 'bg-blue-100 text-blue-800';
      case 'Facebook Pixel': return 'bg-indigo-100 text-indigo-800';
      case 'PostHog': return 'bg-purple-100 text-purple-800';
      case 'Universal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="analytics-overview space-y-6">
      {/* Analytics Platforms Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Platforms Status</h3>
          <Badge variant={Object.values(analyticsStatus).every(Boolean) ? 'success' : 'warning'}>
            {Object.values(analyticsStatus).every(Boolean) ? 'All Active' : 'Partial'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Google Analytics 4</p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsStatus.googleAnalytics ? 'Active' : 'Inactive'}
              </p>
            </div>
            {getStatusIcon(analyticsStatus.googleAnalytics)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Facebook Pixel</p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsStatus.facebookPixel ? 'Active' : 'Inactive'}
              </p>
            </div>
            {getStatusIcon(analyticsStatus.facebookPixel)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">PostHog</p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsStatus.postHog ? 'Active' : 'Inactive'}
              </p>
            </div>
            {getStatusIcon(analyticsStatus.postHog)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Event Tracking</p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsStatus.universalTracking ? 'Active' : 'Inactive'}
              </p>
            </div>
            {getStatusIcon(analyticsStatus.universalTracking)}
          </div>
        </div>
      </Card>

      {showDetailedMetrics && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Events Today</p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.eventsToday}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Page Views</p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.pageViews}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.uniqueUsers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.conversionRate.toFixed(1)}%</p>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Recent Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Analytics Events</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">{event.description}</p>
                      <div className="flex items-center space-x-2">
                        {event.value > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            £{event.value}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPlatformBadgeColor(event.platform)}`}
                        >
                          {event.platform}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/analytics-test" 
            className="admin-action analytics-test-tool flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              🧪
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Test Analytics</h4>
              <p className="text-sm text-gray-600">Run analytics test suite</p>
            </div>
          </a>
          
          <a 
            href="/test-facebook-pixel.html" 
            className="admin-action facebook-pixel-test flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              📘
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Test Facebook Pixel</h4>
              <p className="text-sm text-gray-600">Interactive pixel testing</p>
            </div>
          </a>
          
          <a 
            href="/admin/analytics" 
            className="admin-action analytics-dashboard-link flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              📊
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Full Dashboard</h4>
              <p className="text-sm text-gray-600">Complete analytics view</p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}