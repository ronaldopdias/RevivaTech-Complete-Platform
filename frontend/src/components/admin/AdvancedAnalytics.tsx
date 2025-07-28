'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsMetric } from '@/services/analyticsApiService';

interface AdvancedAnalyticsProps {
  className?: string;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  
  // Use the analytics hook with real-time updates
  const {
    metrics,
    allMetrics,
    realTimeMetrics,
    isLoading,
    error,
    lastUpdated,
    isWebSocketConnected,
    refreshData,
    getMetricsSummary,
    isHealthy,
    hasData
  } = useAnalytics({
    enableRealTime: true,
    refreshInterval: 30000,
    category: selectedCategory,
    period: selectedPeriod
  });

  const categories = [
    { id: 'all', label: 'All Metrics', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'customer', label: 'Customer', icon: '👥' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'quality', label: 'Quality', icon: '⭐' }
  ];

  const periods = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' }
  ];

  // Metrics are already filtered by the hook based on selectedCategory and selectedPeriod
  const filteredMetrics = metrics;

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive': return '↗️';
      case 'negative': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive business intelligence and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-muted-foreground">
                {isWebSocketConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-sm"
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {periods.map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriod === period.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.id)}
                className="text-xs"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <span className="mr-2">⚠️</span>
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      {!isLoading && hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMetrics.map((metric) => (
            <Card key={metric.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={cn(
                    'flex items-center text-xs font-medium',
                    getChangeColor(metric.changeType)
                  )}>
                    <span className="mr-1">{getChangeIcon(metric.changeType)}</span>
                    {Math.abs(metric.change)}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <CardDescription className="text-xs">
                    {metric.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{metric.period}</span>
                    <span className="capitalize bg-muted px-2 py-1 rounded">
                      {metric.category}
                    </span>
                  </div>
                  {metric.lastUpdated && (
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !hasData && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center">
              <span className="mr-2">📊</span>
              No Analytics Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No analytics data is currently available. This could be because:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
              <li>The analytics service is still initializing</li>
              <li>No events have been recorded yet</li>
              <li>The selected filters don't match any data</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="mt-4"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-800">Metrics Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {getMetricsSummary.positivePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-green-600 mt-1">positive metrics</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800">Total Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {getMetricsSummary.total}
              </div>
              <p className="text-xs text-blue-600 mt-1">data points</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-orange-800">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {isHealthy ? 'Healthy' : 'Issues'}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {isWebSocketConnected ? 'real-time' : 'delayed'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-purple-800">Data Freshness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {lastUpdated 
                  ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000)
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-purple-600 mt-1">minutes ago</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Section */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">💡</span>
              Analytics Insights
            </CardTitle>
            <CardDescription>
              Automated analysis and recommendations based on current metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getMetricsSummary.positive > 0 && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-800">Positive Trends</h4>
                  <p className="text-sm text-green-600">
                    {getMetricsSummary.positive} out of {getMetricsSummary.total} metrics show positive trends.
                    {getMetricsSummary.positivePercentage > 70 && ' Your analytics performance is excellent!'}
                  </p>
                </div>
              )}
              
              {getMetricsSummary.negative > 0 && (
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-orange-800">Areas for Improvement</h4>
                  <p className="text-sm text-orange-600">
                    {getMetricsSummary.negative} metrics show declining trends. 
                    Review these areas to identify optimization opportunities.
                  </p>
                </div>
              )}
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-blue-800">System Health</h4>
                <p className="text-sm text-blue-600">
                  Analytics system is {isHealthy ? 'healthy' : 'experiencing issues'}. 
                  WebSocket connection is {isWebSocketConnected ? 'active' : 'disconnected'}.
                  {!isHealthy && ' Consider checking your backend connection.'}
                </p>
              </div>
              
              {realTimeMetrics && (
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-purple-800">Real-Time Status</h4>
                  <p className="text-sm text-purple-600">
                    Live data shows {realTimeMetrics.activeRepairs} active repairs and {realTimeMetrics.totalBookings} total bookings.
                    Customer satisfaction is at {(realTimeMetrics.customerSatisfaction * 100).toFixed(1)}%.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedAnalytics;