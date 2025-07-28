'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Eye,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Updated imports for Phase 8 R2.2 Revenue Intelligence integration

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function MetricCard({ title, value, change, changeType, icon: Icon, description }: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <ArrowUpRight className="w-4 h-4" />;
      case 'negative': return <ArrowDownRight className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="ml-1">{Math.abs(change)}%</span>
          <span className="ml-1 text-muted-foreground">from last period</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: '24 Hours', value: '24h', days: 1 },
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '90 Days', value: '90d', days: 90 },
];

interface KPI {
  name: string;
  value: number;
  change: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'danger';
}

interface RevenueAnalytics {
  overview: {
    total_revenue: { current: number; previous: number; change: number };
    total_bookings: { current: number; previous: number; change: number };
    avg_order_value: { current: number; previous: number; change: number };
    paying_customers: { current: number; previous: number; change: number };
  };
  breakdown: {
    by_service: Array<{ service_type: string; revenue: number; bookings: number }>;
    by_device: Array<{ device_type: string; revenue: number; bookings: number }>;
    by_source: Array<{ source: string; revenue: number; bookings: number }>;
  };
  forecasting: {
    next_30_days: { revenue: number; orders: number; customers: number };
    confidence: number;
  };
}

interface BusinessIntelligence {
  overview: {
    unique_visitors: { current: number; previous: number; change: number };
    total_sessions: { current: number; previous: number; change: number };
    page_views: { current: number; previous: number; change: number };
    conversion_rate: { current: number; previous: number };
  };
  traffic: {
    sources: Array<{ source: string; visitors: number; sessions: number }>;
    devices: Array<{ device_type: string; visitors: number; sessions: number }>;
  };
}

export function BusinessMetricsDashboard() {
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence | null>(null);
  const [financialKPIs, setFinancialKPIs] = useState<Record<string, KPI>>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[1]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Load revenue analytics
      const revenueResponse = await fetch(`/api/revenue-intelligence/analytics?timeframe=${selectedTimeRange.value}`, {
        headers: { 'Authorization': 'Bearer admin-api-key' }
      });
      
      // Load business intelligence
      const businessResponse = await fetch(`/api/business-intelligence/dashboard?timeframe=${selectedTimeRange.value}`, {
        headers: { 'Authorization': 'Bearer admin-api-key' }
      });
      
      // Load financial KPIs
      const kpiResponse = await fetch(`/api/revenue-intelligence/kpis?timeframe=${selectedTimeRange.value}`, {
        headers: { 'Authorization': 'Bearer admin-api-key' }
      });
      
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueAnalytics(revenueData.data);
      }
      
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setBusinessIntelligence(businessData.data);
      }
      
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json();
        setFinancialKPIs(kpiData.data);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      revenueAnalytics,
      businessIntelligence,
      financialKPIs,
      timeRange: selectedTimeRange,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-metrics-${selectedTimeRange.value}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !revenueAnalytics && !businessIntelligence) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive business metrics and performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <select
              value={selectedTimeRange.value}
              onChange={(e) => setSelectedTimeRange(timeRanges.find(r => r.value === e.target.value)!)}
              className="px-3 py-1 border rounded-md bg-background"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={loadMetrics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Key Metrics Overview */}
      {(revenueAnalytics || businessIntelligence) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`£${revenueAnalytics?.overview.total_revenue.current.toLocaleString() || 0}`}
            change={revenueAnalytics?.overview.total_revenue.change || 0}
            changeType={revenueAnalytics?.overview.total_revenue.change && revenueAnalytics.overview.total_revenue.change > 0 ? 'positive' : 'negative'}
            icon={DollarSign}
            description={`${revenueAnalytics?.overview.total_bookings.current || 0} bookings`}
          />
          <MetricCard
            title="Unique Visitors"
            value={businessIntelligence?.overview.unique_visitors.current.toLocaleString() || '0'}
            change={businessIntelligence?.overview.unique_visitors.change || 0}
            changeType={businessIntelligence?.overview.unique_visitors.change && businessIntelligence.overview.unique_visitors.change > 0 ? 'positive' : 'negative'}
            icon={Users}
            description={`${businessIntelligence?.overview.total_sessions.current || 0} sessions`}
          />
          <MetricCard
            title="Average Order Value"
            value={`£${revenueAnalytics?.overview.avg_order_value.current.toFixed(2) || '0.00'}`}
            change={revenueAnalytics?.overview.avg_order_value.change || 0}
            changeType={revenueAnalytics?.overview.avg_order_value.change && revenueAnalytics.overview.avg_order_value.change > 0 ? 'positive' : 'negative'}
            icon={ShoppingCart}
            description={`${revenueAnalytics?.overview.paying_customers.current || 0} customers`}
          />
          <MetricCard
            title="Page Views"
            value={businessIntelligence?.overview.page_views.current.toLocaleString() || '0'}
            change={businessIntelligence?.overview.page_views.change || 0}
            changeType={businessIntelligence?.overview.page_views.change && businessIntelligence.overview.page_views.change > 0 ? 'positive' : 'negative'}
            icon={Eye}
            description={`${businessIntelligence?.overview.conversion_rate.current.toFixed(1) || '0.0'}% conversion rate`}
          />
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <span className="font-bold">${metrics?.revenue.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transactions</span>
                  <span className="font-bold">{metrics?.revenue.transactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Order Value</span>
                  <span className="font-bold">${metrics?.revenue.averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Growth Rate</span>
                  <Badge variant={metrics?.revenue.growth && metrics.revenue.growth > 0 ? 'default' : 'secondary'}>
                    {metrics?.revenue.growth.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-8 h-8 mr-2" />
                  Revenue chart would render here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Direct Bookings</span>
                    <span className="font-bold">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Referrals</span>
                    <span className="font-bold">20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Social Media</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Search Ads</span>
                    <span className="font-bold">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Customers</span>
                  <span className="font-bold">{metrics?.customers.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>New Customers</span>
                  <span className="font-bold">{metrics?.customers.new}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Returning Customers</span>
                  <span className="font-bold">{metrics?.customers.returning}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Churn Rate</span>
                  <Badge variant={metrics?.customers.churnRate && metrics.customers.churnRate < 5 ? 'default' : 'destructive'}>
                    {metrics?.customers.churnRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Lifetime Value</span>
                  <span className="font-bold">${metrics?.customers.lifetimeValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mr-2" />
                  Customer acquisition chart
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="w-8 h-8 mr-2" />
                  Customer segmentation chart
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bookings Analytics */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Booking Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Bookings</span>
                  <span className="font-bold">{metrics?.bookings.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <span className="font-bold">{metrics?.bookings.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cancelled</span>
                  <span className="font-bold">{metrics?.bookings.cancelled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Conversion Rate</span>
                  <Badge variant={metrics?.bookings.conversionRate && metrics.bookings.conversionRate > 50 ? 'default' : 'secondary'}>
                    {metrics?.bookings.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Value</span>
                  <span className="font-bold">${metrics?.bookings.averageValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-8 h-8 mr-2" />
                  Booking trends chart
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Screen Repairs</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Battery Replacement</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Data Recovery</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Other Services</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Website Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Page Views</span>
                  <span className="font-bold">{metrics?.performance.pageViews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sessions</span>
                  <span className="font-bold">{metrics?.performance.sessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bounce Rate</span>
                  <Badge variant={metrics?.performance.bounceRate && metrics.performance.bounceRate < 40 ? 'default' : 'secondary'}>
                    {metrics?.performance.bounceRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Session Duration</span>
                  <span className="font-bold">{Math.round((metrics?.performance.avgSessionDuration || 0) / 1000)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pages per Session</span>
                  <span className="font-bold">{metrics?.performance.pagesPerSession.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Direct</span>
                    <span className="font-bold">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Organic Search</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Social Media</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Referrals</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Mobile</span>
                    <span className="font-bold">60%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Desktop</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tablet</span>
                    <span className="font-bold">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Funnel */}
        <TabsContent value="funnel" className="space-y-4">
          {conversionFunnel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Conversion Funnel Analysis
                </CardTitle>
                <CardDescription>
                  Track user journey from landing page to conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {conversionFunnel.totalConversions}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {conversionFunnel.overallConversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Conversion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {conversionFunnel.bottlenecks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Bottlenecks Identified</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {conversionFunnel.stages.map((stage, index) => (
                      <div key={stage.name} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{stage.name}</h4>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                {stage.users} users
                              </span>
                              <Badge variant={stage.conversionRate > 70 ? 'default' : stage.conversionRate > 40 ? 'secondary' : 'destructive'}>
                                {stage.conversionRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stage.conversionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {conversionFunnel.bottlenecks.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Identified Bottlenecks</h4>
                      <div className="space-y-1">
                        {conversionFunnel.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className="text-sm text-red-700">
                            • {bottleneck} - High drop-off rate detected
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-8 h-8 mr-2" />
                  Growth trends chart would render here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Monthly Recurring Revenue</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">$12,450</span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Acquisition Cost</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">$45</span>
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Return on Ad Spend</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">4.2x</span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Net Promoter Score</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">72</span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}