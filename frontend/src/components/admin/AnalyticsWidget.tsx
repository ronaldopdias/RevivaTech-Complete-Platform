/**
 * Analytics Widget Component
 * Embeddable analytics widget for admin pages
 */

'use client';

import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion'; // Temporarily disabled
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Clock,
  Star,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AnalyticsWidgetProps {
  className?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
  showRefresh?: boolean;
  showViewAll?: boolean;
  categories?: ('revenue' | 'customers' | 'repairs' | 'performance')[];
  maxItems?: number;
  refreshInterval?: number;
}

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
  color: string;
  category: string;
  description: string;
}

// Mock analytics data (in real app, this would come from API)
const generateMockMetrics = (): MetricData[] => [
  {
    id: 'revenue-today',
    title: 'Revenue Today',
    value: `£${(Math.random() * 2000 + 1000).toFixed(0)}`,
    change: `+${(Math.random() * 20 + 5).toFixed(1)}%`,
    changeType: 'positive',
    icon: DollarSign,
    color: 'text-green-600',
    category: 'revenue',
    description: 'Compared to yesterday'
  },
  {
    id: 'active-repairs',
    title: 'Active Repairs',
    value: Math.floor(Math.random() * 50 + 20),
    change: `+${Math.floor(Math.random() * 10 + 1)}`,
    changeType: 'positive',
    icon: Activity,
    color: 'text-blue-600',
    category: 'repairs',
    description: 'Currently in progress'
  },
  {
    id: 'new-customers',
    title: 'New Customers',
    value: Math.floor(Math.random() * 15 + 5),
    change: `+${Math.floor(Math.random() * 5 + 1)}`,
    changeType: 'positive',
    icon: Users,
    color: 'text-purple-600',
    category: 'customers',
    description: 'This week'
  },
  {
    id: 'avg-completion',
    title: 'Avg Completion',
    value: `${(Math.random() * 2 + 1).toFixed(1)}h`,
    change: `-${(Math.random() * 30 + 10).toFixed(0)}min`,
    changeType: 'positive',
    icon: Clock,
    color: 'text-orange-600',
    category: 'performance',
    description: 'Average repair time'
  },
  {
    id: 'satisfaction',
    title: 'Satisfaction',
    value: `${(Math.random() * 5 + 92).toFixed(1)}%`,
    change: `+${(Math.random() * 2 + 1).toFixed(1)}%`,
    changeType: 'positive',
    icon: Star,
    color: 'text-yellow-600',
    category: 'customers',
    description: 'Customer rating'
  },
  {
    id: 'queue-length',
    title: 'Queue Length',
    value: Math.floor(Math.random() * 20 + 5),
    change: `-${Math.floor(Math.random() * 3 + 1)}`,
    changeType: 'positive',
    icon: Activity,
    color: 'text-indigo-600',
    category: 'repairs',
    description: 'Pending repairs'
  },
  {
    id: 'monthly-revenue',
    title: 'Monthly Revenue',
    value: `£${(Math.random() * 30000 + 50000).toFixed(0)}`,
    change: `+${(Math.random() * 15 + 5).toFixed(1)}%`,
    changeType: 'positive',
    icon: TrendingUp,
    color: 'text-green-600',
    category: 'revenue',
    description: 'This month vs last'
  },
  {
    id: 'technician-efficiency',
    title: 'Technician Efficiency',
    value: `${(Math.random() * 10 + 85).toFixed(1)}%`,
    change: `+${(Math.random() * 5 + 1).toFixed(1)}%`,
    changeType: 'positive',
    icon: TrendingUp,
    color: 'text-cyan-600',
    category: 'performance',
    description: 'Team productivity'
  },
];

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  className = '',
  variant = 'compact',
  showRefresh = true,
  showViewAll = true,
  categories = ['revenue', 'customers', 'repairs', 'performance'],
  maxItems = 6,
  refreshInterval = 60000, // 1 minute
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate/fetch metrics
  const fetchMetrics = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const allMetrics = generateMockMetrics();
    const filteredMetrics = selectedCategory === 'all' 
      ? allMetrics 
      : allMetrics.filter(metric => categories.includes(metric.category as any));
    
    setMetrics(filteredMetrics.slice(0, maxItems));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  // Initial load and refresh interval
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedCategory, maxItems, refreshInterval]);

  // Category filters
  const categoryOptions = [
    { id: 'all', label: 'All', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'repairs', label: 'Repairs', icon: Activity },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  // Render variants
  const renderCompact = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.id}
          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg bg-gray-50`}>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${
              metric.changeType === 'positive' ? 'text-green-600' : 
              metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.changeType === 'positive' ? 
                <TrendingUp className="w-3 h-3" /> : 
                <TrendingDown className="w-3 h-3" />
              }
              {metric.change}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="text-sm font-medium text-gray-900">{metric.title}</div>
            <div className="text-xs text-gray-500">{metric.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.id}
          className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gray-50`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <div>
              <div className="font-medium text-gray-900">{metric.title}</div>
              <div className="text-sm text-gray-500">{metric.description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className={`text-sm font-medium flex items-center gap-1 ${
              metric.changeType === 'positive' ? 'text-green-600' : 
              metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.changeType === 'positive' ? 
                <TrendingUp className="w-3 h-3" /> : 
                <TrendingDown className="w-3 h-3" />
              }
              {metric.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMinimal = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.slice(0, 4).map((metric, index) => (
        <div
          key={metric.id}
          className="bg-white border rounded-lg p-3 text-center hover:shadow-md transition-shadow"
        >
          <div className={`inline-flex p-2 rounded-full bg-gray-50 mb-2`}>
            <metric.icon className={`w-4 h-4 ${metric.color}`} />
          </div>
          <div className="text-lg font-bold">{metric.value}</div>
          <div className="text-xs text-gray-500">{metric.title}</div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics Dashboard
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Real-time business metrics and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMetrics}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {showViewAll && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-2 mt-3">
          {categoryOptions.map(option => (
            <Button
              key={option.id}
              variant={selectedCategory === option.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(option.id)}
              className="h-7 px-3 text-xs"
            >
              <option.icon className="w-3 h-3 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading analytics...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {variant === 'compact' && renderCompact()}
            {variant === 'detailed' && renderDetailed()}
            {variant === 'minimal' && renderMinimal()}
            
            {/* Last Updated */}
            <div className="text-xs text-gray-400 text-center pt-2 border-t">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;