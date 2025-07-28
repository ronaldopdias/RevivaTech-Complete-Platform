'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Activity,
  Users,
  MousePointer,
  Eye,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Refresh,
  Download,
  Filter,
  Calendar,
} from 'lucide-react';

// Types
interface RealTimeMetrics {
  activeUsers: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  topPages: Array<{ url: string; views: number; uniqueViews: number }>;
  topEvents: Array<{ name: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  geographicData: Array<{ country: string; users: number; percentage: number }>;
  deviceTypes: Array<{ type: string; users: number; percentage: number }>;
  recentEvents: Array<{
    id: string;
    type: string;
    user: string;
    page: string;
    timestamp: Date;
    properties: Record<string, any>;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

interface CustomerSegment {
  id: string;
  name: string;
  users: number;
  conversionRate: number;
  avgValue: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimeRange {
  label: string;
  value: string;
  hours: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last Hour', value: '1h', hours: 1 },
  { label: 'Last 6 Hours', value: '6h', hours: 6 },
  { label: 'Last 24 Hours', value: '24h', hours: 24 },
  { label: 'Last 7 Days', value: '7d', hours: 168 },
  { label: 'Last 30 Days', value: '30d', hours: 720 },
];

const RealtimeAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[2]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, segmentsRes] = await Promise.all([
        fetch(`/api/analytics/realtime?timeRange=${selectedTimeRange.value}`),
        fetch('/api/analytics/segments'),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }

      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json();
        setSegments(segmentsData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange.value]);

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh]);

  // Mock data for development
  useEffect(() => {
    if (!metrics) {
      setMetrics({
        activeUsers: 127,
        pageViews: 1543,
        uniqueVisitors: 892,
        bounceRate: 34.5,
        avgSessionDuration: 245, // seconds
        conversionRate: 2.8,
        topPages: [
          { url: '/book-repair', views: 245, uniqueViews: 180 },
          { url: '/', views: 198, uniqueViews: 150 },
          { url: '/services', views: 156, uniqueViews: 120 },
          { url: '/about', views: 89, uniqueViews: 75 },
          { url: '/contact', views: 67, uniqueViews: 55 },
        ],
        topEvents: [
          { name: 'page_view', count: 1543, trend: 'up' },
          { name: 'click', count: 892, trend: 'up' },
          { name: 'form_focus', count: 234, trend: 'stable' },
          { name: 'scroll', count: 167, trend: 'down' },
          { name: 'conversion', count: 25, trend: 'up' },
        ],
        geographicData: [
          { country: 'United Kingdom', users: 458, percentage: 51.2 },
          { country: 'United States', users: 123, percentage: 13.8 },
          { country: 'Germany', users: 89, percentage: 10.0 },
          { country: 'France', users: 67, percentage: 7.5 },
          { country: 'Other', users: 155, percentage: 17.5 },
        ],
        deviceTypes: [
          { type: 'Desktop', users: 512, percentage: 57.4 },
          { type: 'Mobile', users: 289, percentage: 32.4 },
          { type: 'Tablet', users: 91, percentage: 10.2 },
        ],
        recentEvents: [
          {
            id: '1',
            type: 'conversion',
            user: 'Anonymous',
            page: '/book-repair',
            timestamp: new Date(Date.now() - 30000),
            properties: { value: 125 },
          },
          {
            id: '2',
            type: 'form_submit',
            user: 'john@example.com',
            page: '/contact',
            timestamp: new Date(Date.now() - 120000),
            properties: { form: 'contact-form' },
          },
          {
            id: '3',
            type: 'rage_click',
            user: 'Anonymous',
            page: '/book-repair',
            timestamp: new Date(Date.now() - 180000),
            properties: { element: '.price-calculator' },
          },
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'Unusual increase in bounce rate detected',
            timestamp: new Date(Date.now() - 300000),
          },
          {
            id: '2',
            type: 'info',
            message: 'Peak traffic detected - monitoring performance',
            timestamp: new Date(Date.now() - 600000),
          },
        ],
      });

      setSegments([
        { id: '1', name: 'High Value', users: 45, conversionRate: 8.5, avgValue: 285, trend: 'up' },
        { id: '2', name: 'Frequent', users: 123, conversionRate: 5.2, avgValue: 165, trend: 'stable' },
        { id: '3', name: 'At Risk', users: 67, conversionRate: 1.8, avgValue: 95, trend: 'down' },
        { id: '4', name: 'New Prospects', users: 234, conversionRate: 2.1, avgValue: 0, trend: 'up' },
      ]);
    }
  }, [metrics]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Analytics</h1>
          <p className="text-gray-600">
            Live insights into customer behavior and website performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange.value}
            onChange={(e) => {
              const range = timeRanges.find(r => r.value === e.target.value);
              if (range) setSelectedTimeRange(range);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>

          {/* Manual Refresh */}
          <Button variant="secondary" size="sm" onClick={fetchMetrics}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {/* Export */}
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.activeUsers?.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.pageViews?.toLocaleString()}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.uniqueVisitors?.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {metrics?.bounceRate}%
              </p>
            </div>
            <MousePointer className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Session</p>
              <p className="text-2xl font-bold text-teal-600">
                {metrics?.avgSessionDuration ? formatDuration(metrics.avgSessionDuration) : '0s'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-teal-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.conversionRate}%
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Charts and Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
          <div className="space-y-3">
            {metrics?.topPages?.map((page, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.url}
                  </p>
                  <p className="text-xs text-gray-500">
                    {page.uniqueViews} unique of {page.views} total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{page.views}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Events</h3>
          <div className="space-y-3">
            {metrics?.topEvents?.map((event, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 flex-1">
                  {getTrendIcon(event.trend)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.name.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {event.trend} trend
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{event.count.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Segments */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 flex-1">
                  {getTrendIcon(segment.trend)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {segment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {segment.users} users • {segment.conversionRate}% conversion
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">£{segment.avgValue}</p>
                  <p className="text-xs text-gray-500">avg value</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Real-Time Activity Feed */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics?.recentEvents?.map((event) => (
              <div key={event.id} className="flex items-start gap-3 py-2">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{event.user}</span> performed{' '}
                    <span className="font-medium text-blue-600">
                      {event.type.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {event.page} • {formatTimeAgo(event.timestamp)}
                  </p>
                  {event.properties.value && (
                    <p className="text-xs text-green-600 font-medium">
                      Value: £{event.properties.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {metrics.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Device & Geographic Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Types</h3>
          <div className="space-y-3">
            {metrics?.deviceTypes?.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{device.type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {device.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            {metrics?.geographicData?.map((geo, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{geo.country}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${geo.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {geo.users}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RealtimeAnalyticsDashboard;