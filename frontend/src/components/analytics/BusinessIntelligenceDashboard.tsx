/**
 * Business Intelligence Dashboard Component
 * Advanced analytics dashboard with real-time metrics and custom reports
 * Part of Phase 8 R2 implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer, 
  ShoppingCart,
  DollarSign,
  Activity,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Calendar,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Zap
} from 'lucide-react';

interface DashboardMetrics {
  overview: {
    unique_visitors: { current: number; previous: number; change: number };
    total_sessions: { current: number; previous: number; change: number };
    page_views: { current: number; previous: number; change: number };
    bookings: { current: number; previous: number; change: number };
    conversion_rate: { current: number; previous: number };
    bounce_rate: { current: number };
  };
  traffic: {
    sources: Array<{ source: string; visitors: number; sessions: number }>;
    top_pages: Array<{ page_url: string; views: number; unique_visitors: number }>;
    devices: Array<{ device_type: string; visitors: number; sessions: number }>;
    hourly_pattern: Array<{ hour: number; visitors: number; events: number }>;
  };
  conversion: {
    funnel: Array<{ funnel_name: string; step_name: string; users_entered: number; users_completed: number }>;
    service_conversion: Array<{ service_type: string; interest_events: number; booking_completions: number }>;
    goals: Array<{ event_type: string; completions: number; unique_users: number }>;
  };
  revenue: {
    overview: { total_bookings: number; total_revenue: number; avg_order_value: number };
    by_service: Array<{ service_type: string; bookings: number; revenue: number }>;
    daily_trend: Array<{ date: string; bookings: number; revenue: number }>;
  };
  customers: {
    segments: Array<{ customer_segment: string; count: number; avg_engagement: number }>;
    customer_types: Array<{ customer_type: string; count: number; avg_engagement: number }>;
    clv_distribution: Array<{ value_range: string; customers: number }>;
  };
  performance: {
    page_performance: Array<{ page_url: string; views: number; avg_load_time: number }>;
    errors: Array<{ error_type: string; count: number; affected_users: number }>;
    system_health: { uptime: number; response_time: number; error_rate: number };
  };
}

interface KPI {
  name: string;
  value: number;
  change: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'danger';
}

interface BusinessIntelligenceDashboardProps {
  className?: string;
}

const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  className = ''
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [kpis, setKpis] = useState<Record<string, KPI>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Colors for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    loadDashboardData();
    startAutoRefresh();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard metrics
      const metricsResponse = await fetch(`/api/business-intelligence/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': 'Bearer admin-api-key'
        }
      });
      
      if (!metricsResponse.ok) {
        throw new Error('Failed to load dashboard metrics');
      }
      
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data);
      
      // Load KPIs
      const kpiResponse = await fetch(`/api/business-intelligence/kpis?timeframe=${timeframe}`, {
        headers: {
          'Authorization': 'Bearer admin-api-key'
        }
      });
      
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json();
        setKpis(kpiData.data);
      }
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000); // Refresh every minute
    
    setRefreshInterval(interval);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getKPIStatus = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'danger': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const exportData = () => {
    // TODO: Implement data export functionality
    console.log('Export data functionality');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading business intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error Loading Dashboard</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <Button 
              onClick={loadDashboardData}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`p-8 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-600">Real-time analytics and business insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.overview.unique_visitors.current)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(metrics.overview.unique_visitors.change)}
                  <span className={`text-sm ${getChangeColor(metrics.overview.unique_visitors.change)}`}>
                    {formatPercentage(Math.abs(metrics.overview.unique_visitors.change))}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.overview.page_views.current)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(metrics.overview.page_views.change)}
                  <span className={`text-sm ${getChangeColor(metrics.overview.page_views.change)}`}>
                    {formatPercentage(Math.abs(metrics.overview.page_views.change))}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Eye className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.bookings.current}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(metrics.overview.bookings.change)}
                  <span className={`text-sm ${getChangeColor(metrics.overview.bookings.change)}`}>
                    {formatPercentage(Math.abs(metrics.overview.bookings.change))}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.revenue.overview.total_revenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+12.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      {Object.keys(kpis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Key Performance Indicators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(kpis).map(([key, kpi]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{kpi.name}</span>
                    {getKPIStatus(kpi.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{kpi.value}{kpi.unit}</span>
                    <span className="text-sm text-gray-500">Target: {kpi.target}{kpi.unit}</span>
                  </div>
                  <Progress 
                    value={(kpi.value / kpi.target) * 100} 
                    className="mt-2 h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.traffic.sources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="visitors"
                    >
                      {metrics.traffic.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.conversion.funnel.slice(0, 5).map((step, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{step.step_name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(step.users_completed / step.users_entered) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {step.users_completed}/{step.users_entered}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Traffic Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.traffic.hourly_pattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.traffic.devices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.device_type)}
                        <span className="text-sm font-medium capitalize">{device.device_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(device.visitors / metrics.overview.unique_visitors.current) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{device.visitors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.traffic.top_pages.slice(0, 10).map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-medium truncate flex-1">{page.page_url}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{page.views} views</span>
                      <span className="text-sm text-gray-600">{page.unique_visitors} unique</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.conversion.service_conversion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="interest_events" fill="#3B82F6" name="Interest" />
                    <Bar dataKey="booking_completions" fill="#10B981" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.conversion.goals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completions" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.revenue.by_service}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service_type" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.revenue.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.customers.segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ customer_segment, count }) => `${customer_segment}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.customers.segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.customers.clv_distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="value_range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-lg font-bold text-green-600">
                    {metrics.performance.system_health.uptime}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="text-lg font-bold">
                    {metrics.performance.system_health.response_time}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-lg font-bold text-red-600">
                    {(metrics.performance.system_health.error_rate * 100).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.performance.page_performance.slice(0, 8).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm font-medium truncate flex-1">{page.page_url}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{page.views} views</span>
                        <span className="text-sm text-gray-600">{page.avg_load_time}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceDashboard;