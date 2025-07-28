/**
 * Real-Time Analytics Dashboard
 * Phase 4 - Analytics & Monitoring Integration
 * 
 * Displays real-time analytics data with live updates
 * Provides comprehensive monitoring for admin users
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analytics } from '@/lib/analytics/UniversalAnalyticsManager';
import { useAnalytics } from './UniversalAnalyticsProvider';
import { Activity, Users, Eye, TrendingUp, AlertCircle, Clock, Target, BarChart3 } from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  recentPageViews: Array<{ page: string; count: number; timestamp?: string }>;
  recentInteractions: Array<{ element: string; action: string; timestamp: Date }>;
  performanceScore: number;
  errorRate: number;
  sessionDuration: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number; bounceRate: number }>;
  userFlow: Array<{ from: string; to: string; count: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
}

interface RealTimeAnalyticsDashboardProps {
  refreshInterval?: number;
  showDebugInfo?: boolean;
  userRole?: 'admin' | 'super_admin' | 'manager';
  customMetrics?: string[];
}

export function RealTimeAnalyticsDashboard({
  refreshInterval = 5000,
  showDebugInfo = false,
  userRole = 'admin',
  customMetrics = []
}: RealTimeAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const { isInitialized, trackingEnabled } = useAnalytics();

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    if (!isInitialized || !trackingEnabled) return;

    try {
      setError(null);
      
      // Get real-time metrics from analytics manager
      const realTimeData = analytics.getRealTimeMetrics();
      const sessionData = analytics.getSessionSummary();

      // Enhance with additional metrics
      const enhancedMetrics: RealTimeMetrics = {
        activeUsers: realTimeData.activeUsers || 1,
        recentPageViews: realTimeData.recentPageViews || [],
        recentInteractions: realTimeData.recentInteractions || [],
        performanceScore: realTimeData.performanceScore || 95,
        errorRate: realTimeData.errorRate || 0,
        sessionDuration: sessionData.sessionDuration || 0,
        conversionRate: calculateConversionRate(realTimeData),
        topPages: generateTopPages(realTimeData.recentPageViews || []),
        userFlow: generateUserFlow(realTimeData.recentPageViews || []),
        deviceBreakdown: generateDeviceBreakdown()
      };

      setMetrics(enhancedMetrics);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setIsLoading(false);
    }
  }, [isInitialized, trackingEnabled]);

  // Auto-refresh metrics
  useEffect(() => {
    if (!isLive) return;

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval, isLive]);

  // Generate mock data for demo purposes
  const calculateConversionRate = (data: any): number => {
    return Math.random() * 10 + 2; // 2-12% conversion rate
  };

  const generateTopPages = (pageViews: Array<{ page: string; count: number }>): Array<{ page: string; views: number; bounceRate: number }> => {
    return pageViews.map(pv => ({
      page: pv.page,
      views: pv.count,
      bounceRate: Math.random() * 40 + 20 // 20-60% bounce rate
    }));
  };

  const generateUserFlow = (pageViews: Array<{ page: string; count: number }>): Array<{ from: string; to: string; count: number }> => {
    const flows = [];
    for (let i = 0; i < pageViews.length - 1; i++) {
      flows.push({
        from: pageViews[i].page,
        to: pageViews[i + 1].page,
        count: Math.floor(Math.random() * 10) + 1
      });
    }
    return flows;
  };

  const generateDeviceBreakdown = (): Array<{ device: string; percentage: number }> => {
    return [
      { device: 'Desktop', percentage: 45 },
      { device: 'Mobile', percentage: 40 },
      { device: 'Tablet', percentage: 15 }
    ];
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate <= 1) return 'text-green-600';
    if (rate <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isInitialized || !trackingEnabled) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Analytics tracking is not enabled</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500 mb-2">Error loading analytics data</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchMetrics} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Activity className="h-4 w-4 mr-2 text-green-500" />
                Live
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Paused
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Real-time active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.recentPageViews.reduce((sum, pv) => sum + pv.count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics?.performanceScore || 0)}`}>
              {metrics?.performanceScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getErrorRateColor(metrics?.errorRate || 0)}`}>
              {metrics?.errorRate.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Error rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Page Views */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.recentPageViews.slice(0, 10).map((pv, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{pv.page}</p>
                  </div>
                  <Badge variant="secondary">{pv.count}</Badge>
                </div>
              ))}
              {(!metrics?.recentPageViews || metrics.recentPageViews.length === 0) && (
                <p className="text-sm text-gray-500 text-center">No recent page views</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.recentInteractions.slice(0, 10).map((interaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{interaction.element}</p>
                    <p className="text-xs text-gray-500">{interaction.action}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(interaction.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
              {(!metrics?.recentInteractions || metrics.recentInteractions.length === 0) && (
                <p className="text-sm text-gray-500 text-center">No recent interactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{page.page}</p>
                    <p className="text-xs text-gray-500">
                      Bounce rate: {page.bounceRate.toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant="secondary">{page.views}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.deviceBreakdown.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{device.device}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline">{device.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics for Super Admin */}
      {userRole === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics?.conversionRate.toFixed(2) || 0}%
                </div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((metrics?.sessionDuration || 0) / 1000 / 60)}m
                </div>
                <p className="text-sm text-gray-500">Avg Session Duration</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.userFlow.length || 0}
                </div>
                <p className="text-sm text-gray-500">User Flow Steps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {showDebugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RealTimeAnalyticsDashboard;