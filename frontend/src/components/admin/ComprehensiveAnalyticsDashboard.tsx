'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  description: string;
  category: 'revenue' | 'operations' | 'customer' | 'quality';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  trend: number[];
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface ComprehensiveAnalyticsDashboardProps {
  className?: string;
  realTimeEnabled?: boolean;
}

const kpiMetrics: KPIMetric[] = [
  {
    id: 'revenue_total',
    title: 'Total Revenue',
    value: '£47,230',
    change: 18.5,
    changeType: 'positive',
    description: 'Monthly revenue including all services',
    category: 'revenue',
    period: 'monthly',
    trend: [32000, 35000, 38000, 42000, 45000, 47230]
  },
  {
    id: 'repairs_completed',
    title: 'Repairs Completed',
    value: 127,
    change: 12.3,
    changeType: 'positive',
    description: 'Successfully completed repairs this month',
    category: 'operations',
    period: 'monthly',
    trend: [95, 108, 115, 119, 124, 127]
  },
  {
    id: 'customer_satisfaction',
    title: 'Customer Satisfaction',
    value: '4.8/5',
    change: 4.2,
    changeType: 'positive',
    description: 'Average customer rating across all services',
    category: 'quality',
    period: 'monthly',
    trend: [4.5, 4.6, 4.7, 4.7, 4.8, 4.8]
  },
  {
    id: 'response_time',
    title: 'Avg Response Time',
    value: '2.1 hours',
    change: -15.7,
    changeType: 'positive',
    description: 'Average time to first customer response',
    category: 'operations',
    period: 'weekly',
    trend: [3.2, 2.8, 2.5, 2.3, 2.2, 2.1]
  }
];

const repairTrendsData: ChartData[] = [
  { label: 'Screen Repairs', value: 45, color: '#3B82F6' },
  { label: 'Battery Issues', value: 28, color: '#10B981' },
  { label: 'Water Damage', value: 18, color: '#F59E0B' },
  { label: 'Software Issues', value: 23, color: '#8B5CF6' },
  { label: 'Hardware Faults', value: 13, color: '#EF4444' }
];

const technicianPerformanceData: ChartData[] = [
  { label: 'Sarah M.', value: 92, color: '#10B981' },
  { label: 'James L.', value: 88, color: '#3B82F6' },
  { label: 'Alex R.', value: 85, color: '#8B5CF6' },
  { label: 'Mike T.', value: 91, color: '#F59E0B' },
  { label: 'Emma W.', value: 94, color: '#06B6D4' }
];

const revenueByServiceData: ChartData[] = [
  { label: 'iPhone Repairs', value: 35, color: '#3B82F6' },
  { label: 'MacBook Services', value: 28, color: '#10B981' },
  { label: 'iPad Repairs', value: 15, color: '#F59E0B' },
  { label: 'Data Recovery', value: 12, color: '#8B5CF6' },
  { label: 'Other Services', value: 10, color: '#6B7280' }
];

export const ComprehensiveAnalyticsDashboard: React.FC<ComprehensiveAnalyticsDashboardProps> = ({
  className,
  realTimeEnabled = true
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<KPIMetric[]>(kpiMetrics);

  const timeRanges = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '3m', label: '3 Months' },
    { id: '1y', label: '1 Year' }
  ];

  const categories = [
    { id: 'all', label: 'All Metrics', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'customer', label: 'Customer', icon: '👥' },
    { id: 'quality', label: 'Quality', icon: '⭐' }
  ];

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      
      // Simulate small changes in metrics
      setMetrics(currentMetrics => 
        currentMetrics.map(metric => ({
          ...metric,
          value: typeof metric.value === 'number' 
            ? metric.value + (Math.random() - 0.5) * 2
            : metric.value,
          change: metric.change + (Math.random() - 0.5) * 0.5
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const filteredMetrics = metrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

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

  const exportData = () => {
    const dataToExport = {
      metrics: filteredMetrics,
      repairTrends: repairTrendsData,
      technicianPerformance: technicianPerformanceData,
      revenueByService: revenueByServiceData,
      exportDate: new Date().toISOString(),
      timeRange: selectedTimeRange
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const MiniChart: React.FC<{ data: number[]; color: string; className?: string }> = ({ 
    data, 
    color, 
    className 
  }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    return (
      <div className={cn('flex items-end space-x-1 h-8', className)}>
        {data.map((value, index) => {
          const height = range > 0 ? ((value - min) / range) * 100 : 50;
          return (
            <div
              key={index}
              className="flex-1 rounded-sm"
              style={{
                backgroundColor: color,
                height: `${Math.max(height, 10)}%`,
                opacity: 0.7
              }}
            />
          );
        })}
      </div>
    );
  };

  const PieChart: React.FC<{ data: ChartData[]; size?: number }> = ({ data, size = 120 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 5}
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * (size / 2 - 5);
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
            
            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 5}
                fill="transparent"
                stroke={item.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const BarChart: React.FC<{ data: ChartData[]; maxHeight?: number }> = ({ 
    data, 
    maxHeight = 100 
  }) => {
    const max = Math.max(...data.map(item => item.value));

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.value / max) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive business intelligence and performance insights
            </p>
            {realTimeEnabled && (
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live data • Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={exportData}>
              📊 Export Data
            </Button>
            <Button variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
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

          <div className="flex gap-2 lg:ml-auto">
            {timeRanges.map((range) => (
              <Button
                key={range.id}
                variant={selectedTimeRange === range.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(range.id)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMetrics.slice(0, 4).map((metric) => (
          <Card key={metric.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={cn(
                  'flex items-center text-xs font-medium px-2 py-1 rounded-full',
                  getChangeColor(metric.changeType),
                  metric.changeType === 'positive' ? 'bg-green-50' : 
                  metric.changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'
                )}>
                  <span className="mr-1">{getChangeIcon(metric.changeType)}</span>
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-3xl font-bold">{metric.value}</div>
                <MiniChart 
                  data={metric.trend} 
                  color={metric.changeType === 'positive' ? '#10B981' : '#EF4444'}
                  className="mt-2"
                />
                <CardDescription className="text-xs">
                  {metric.description}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Repair Trends Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <span className="mr-2">🔧</span>
              Repair Trends
            </CardTitle>
            <CardDescription>
              Distribution of repair types this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <PieChart data={repairTrendsData} size={140} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                {repairTrendsData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <span className="mr-2">👨‍🔧</span>
              Technician Performance
            </CardTitle>
            <CardDescription>
              Performance scores by technician
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={technicianPerformanceData} />
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <span className="mr-2">💰</span>
              Revenue by Service
            </CardTitle>
            <CardDescription>
              Revenue distribution across services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <PieChart data={revenueByServiceData} size={140} />
              <div className="grid grid-cols-1 gap-1 text-xs w-full">
                {revenueByServiceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">🧠</span>
            Business Intelligence Insights
          </CardTitle>
          <CardDescription>
            AI-powered recommendations and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-800">Growth Opportunities</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium text-green-800">Screen Repair Demand</p>
                  <p className="text-xs text-green-600">
                    45% increase in screen repairs. Consider expanding screen repair capacity.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-blue-800">Customer Retention</p>
                  <p className="text-xs text-blue-600">
                    87% retention rate exceeds industry average. Implement referral program.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-orange-800">Areas for Improvement</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="text-sm font-medium text-orange-800">Response Time</p>
                  <p className="text-xs text-orange-600">
                    2.1 hour average response time. Target: under 2 hours for better satisfaction.
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm font-medium text-red-800">Service Diversification</p>
                  <p className="text-xs text-red-600">
                    70% revenue from iPhone/MacBook. Consider expanding other device services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg text-white mr-4">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">+18.5%</p>
                <p className="text-sm text-green-700">Monthly Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg text-white mr-4">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">96.4%</p>
                <p className="text-sm text-blue-700">Efficiency Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg text-white mr-4">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">4.8/5</p>
                <p className="text-sm text-purple-700">Quality Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg text-white mr-4">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">127</p>
                <p className="text-sm text-orange-700">Repairs Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;