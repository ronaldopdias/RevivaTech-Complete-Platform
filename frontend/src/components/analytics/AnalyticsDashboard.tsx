'use client';

/**
 * Analytics Dashboard
 * Advanced business intelligence dashboard for RevivaTech
 * 
 * Features:
 * - Real-time metrics and KPIs
 * - Revenue analytics with forecasting
 * - Customer behavior insights
 * - Performance monitoring
 * - Interactive charts and visualizations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  Users, 
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter,
  DateRange
} from 'lucide-react';
import { analytics, Metric } from '@/lib/analytics/analyticsCore';
import { clientAnalytics } from '@/lib/analytics/client-analytics';

// Metric Card Component
interface MetricCardProps {
  metric: Metric;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, className = '' }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressPercentage = () => {
    if (!metric.target) return null;
    return Math.min((metric.value / metric.target) * 100, 100);
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {metric.name}
        </CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric.value.toLocaleString()}
          {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
        </div>
        {metric.target && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Target: {metric.target.toLocaleString()}{metric.unit}</span>
              <span>{getProgressPercentage()?.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  (getProgressPercentage() || 0) >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}
        <p className={`text-xs mt-2 ${getTrendColor()}`}>
          {metric.trend === 'up' && '↗ Trending up'}
          {metric.trend === 'down' && '↘ Trending down'}
          {metric.trend === 'stable' && '→ Stable'}
        </p>
      </CardContent>
    </Card>
  );
};

// Chart Component (Simplified for now)
interface ChartProps {
  data: number[];
  labels: string[];
  title: string;
  type: 'line' | 'bar' | 'pie';
}

const SimpleChart: React.FC<ChartProps> = ({ data, labels, title, type }) => {
  const maxValue = Math.max(...data);
  
  if (type === 'line') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="h-64 flex items-end space-x-2">
          {data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 transition-all duration-300 hover:bg-blue-600"
                style={{
                  height: `${(value / maxValue) * 200}px`,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {data.map((value, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm">{labels[index]}</span>
            <span className="font-semibold">{value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Revenue Forecast Component
interface RevenueForecastProps {
  historical: number[];
  forecast: number[];
}

const RevenueForecast: React.FC<RevenueForecastProps> = ({ historical, forecast }) => {
  const combinedData = [...historical, ...forecast];
  const maxValue = Math.max(...combinedData);
  const historicalLength = historical.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Revenue Forecast (Next 30 Days)
        </CardTitle>
        <CardDescription>
          Historical data and predictive analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end space-x-1">
          {combinedData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full transition-all duration-300 ${
                  index < historicalLength 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-green-400 hover:bg-green-500'
                }`}
                style={{
                  height: `${(value / maxValue) * 200}px`,
                  minHeight: '2px'
                }}
              />
              {index % 5 === 0 && (
                <span className="text-xs text-gray-400 mt-1">
                  {index < historicalLength ? 'H' : 'F'}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span>Forecast</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [forecast, setForecast] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const data = await analytics.getDashboardData();
      setMetrics(data.metrics);
      setForecast(data.forecast);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  // Filter metrics by category
  const getMetricsByCategory = (category: string) => {
    return metrics.filter(metric => metric.category === category);
  };

  // Mock data for demonstration
  const mockHistoricalRevenue = [
    1200, 1350, 1100, 1500, 1750, 1650, 1400, 1600, 1850, 1700,
    1550, 1800, 1950, 1700, 1600, 1750, 1900, 2100, 1950, 1800,
    2000, 2200, 2050, 1900, 2100, 2300, 2150, 2000, 2200, 2400
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={loadDashboardData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.slice(0, 8).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Revenue Forecast */}
          <RevenueForecast 
            historical={mockHistoricalRevenue} 
            forecast={forecast.length > 0 ? forecast : [2500, 2600, 2400, 2700, 2800]} 
          />

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>New Bookings</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed Repairs</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Revenue Generated</span>
                  <Badge variant="secondary">£1,240</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Customer Inquiries</span>
                  <Badge variant="secondary">24</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Revenue</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Satisfaction</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Repair Efficiency</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getMetricsByCategory('revenue').map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              data={[1200, 1350, 1500, 1750, 1600, 1800, 1950]}
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              title="Weekly Revenue"
              type="line"
            />
            <SimpleChart
              data={[450, 320, 280, 150]}
              labels={['Apple', 'PC/Laptop', 'Gaming', 'Other']}
              title="Revenue by Category"
              type="bar"
            />
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getMetricsByCategory('customer').map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={[25, 30, 28, 35, 32, 38, 42]}
                  labels={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']}
                  title="New Customers per Week"
                  type="line"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={[40, 35, 15, 10]}
                  labels={['First-time', 'Returning', 'VIP', 'Corporate']}
                  title="Customer Distribution"
                  type="bar"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getMetricsByCategory('booking').concat(getMetricsByCategory('performance')).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;