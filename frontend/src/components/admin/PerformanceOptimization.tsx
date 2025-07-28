'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PerformanceMetric {
  id: string;
  name: string;
  currentValue: number;
  baselineValue: number;
  unit: string;
  category: 'core' | 'network' | 'database' | 'frontend' | 'api';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  recommendation?: string;
}

interface OptimizationTask {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  estimatedImprovement: string;
  completed: boolean;
}

interface PerformanceOptimizationProps {
  className?: string;
}

const performanceMetrics: PerformanceMetric[] = [
  // Core Web Vitals
  {
    id: 'lcp',
    name: 'Largest Contentful Paint',
    currentValue: 1.2,
    baselineValue: 2.5,
    unit: 's',
    category: 'core',
    status: 'excellent'
  },
  {
    id: 'fid',
    name: 'First Input Delay',
    currentValue: 45,
    baselineValue: 100,
    unit: 'ms',
    category: 'core',
    status: 'excellent'
  },
  {
    id: 'cls',
    name: 'Cumulative Layout Shift',
    currentValue: 0.08,
    baselineValue: 0.1,
    unit: '',
    category: 'core',
    status: 'good'
  },

  // Frontend Performance
  {
    id: 'bundle_size',
    name: 'JavaScript Bundle Size',
    currentValue: 284,
    baselineValue: 512,
    unit: 'KB',
    category: 'frontend',
    status: 'good',
    recommendation: 'Consider code splitting for further optimization'
  },
  {
    id: 'page_load',
    name: 'Average Page Load Time',
    currentValue: 1.8,
    baselineValue: 3.2,
    unit: 's',
    category: 'frontend',
    status: 'excellent'
  },
  {
    id: 'cache_hit_rate',
    name: 'Cache Hit Rate',
    currentValue: 89,
    baselineValue: 75,
    unit: '%',
    category: 'network',
    status: 'good'
  },

  // API Performance
  {
    id: 'api_response_time',
    name: 'Average API Response Time',
    currentValue: 156,
    baselineValue: 300,
    unit: 'ms',
    category: 'api',
    status: 'excellent'
  },
  {
    id: 'api_error_rate',
    name: 'API Error Rate',
    currentValue: 0.3,
    baselineValue: 1.0,
    unit: '%',
    category: 'api',
    status: 'excellent'
  },
  {
    id: 'throughput',
    name: 'Request Throughput',
    currentValue: 1240,
    baselineValue: 800,
    unit: 'req/min',
    category: 'api',
    status: 'excellent'
  },

  // Database Performance
  {
    id: 'db_query_time',
    name: 'Average Query Time',
    currentValue: 45,
    baselineValue: 120,
    unit: 'ms',
    category: 'database',
    status: 'excellent'
  },
  {
    id: 'db_connection_pool',
    name: 'Connection Pool Usage',
    currentValue: 68,
    baselineValue: 85,
    unit: '%',
    category: 'database',
    status: 'good'
  },
  {
    id: 'db_cache_hit',
    name: 'Database Cache Hit Rate',
    currentValue: 94,
    baselineValue: 80,
    unit: '%',
    category: 'database',
    status: 'excellent'
  },

  // Network Performance
  {
    id: 'cdn_response',
    name: 'CDN Response Time',
    currentValue: 28,
    baselineValue: 80,
    unit: 'ms',
    category: 'network',
    status: 'excellent'
  },
  {
    id: 'bandwidth_usage',
    name: 'Bandwidth Efficiency',
    currentValue: 92,
    baselineValue: 75,
    unit: '%',
    category: 'network',
    status: 'excellent'
  }
];

const optimizationTasks: OptimizationTask[] = [
  {
    id: 'image_optimization',
    title: 'Implement WebP Image Format',
    description: 'Convert all JPEG/PNG images to WebP format with fallbacks for better compression',
    impact: 'medium',
    effort: 'low',
    category: 'Frontend',
    estimatedImprovement: '15-25% faster load times',
    completed: false
  },
  {
    id: 'lazy_loading',
    title: 'Implement Lazy Loading for Images',
    description: 'Add lazy loading for below-the-fold images and components',
    impact: 'medium',
    effort: 'low',
    category: 'Frontend',
    estimatedImprovement: '20% faster initial page load',
    completed: true
  },
  {
    id: 'database_indexing',
    title: 'Optimize Database Indexes',
    description: 'Add composite indexes for frequently queried columns',
    impact: 'high',
    effort: 'medium',
    category: 'Database',
    estimatedImprovement: '40% faster query performance',
    completed: true
  },
  {
    id: 'code_splitting',
    title: 'Implement Route-Based Code Splitting',
    description: 'Split code by routes to reduce initial bundle size',
    impact: 'high',
    effort: 'medium',
    category: 'Frontend',
    estimatedImprovement: '30% smaller initial bundle',
    completed: false
  },
  {
    id: 'redis_caching',
    title: 'Expand Redis Caching Strategy',
    description: 'Cache frequently accessed API responses and database queries',
    impact: 'high',
    effort: 'medium',
    category: 'Backend',
    estimatedImprovement: '50% faster API responses',
    completed: true
  },
  {
    id: 'cdn_optimization',
    title: 'Optimize CDN Configuration',
    description: 'Configure optimal caching headers and compression',
    impact: 'medium',
    effort: 'low',
    category: 'Network',
    estimatedImprovement: '25% faster asset delivery',
    completed: true
  },
  {
    id: 'api_compression',
    title: 'Enable API Response Compression',
    description: 'Implement gzip/brotli compression for API responses',
    impact: 'medium',
    effort: 'low',
    category: 'Backend',
    estimatedImprovement: '35% smaller payload sizes',
    completed: false
  },
  {
    id: 'preload_critical',
    title: 'Preload Critical Resources',
    description: 'Add resource hints for critical CSS and fonts',
    impact: 'low',
    effort: 'low',
    category: 'Frontend',
    estimatedImprovement: '10% faster render time',
    completed: false
  }
];

export const PerformanceOptimization: React.FC<PerformanceOptimizationProps> = ({
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tasks, setTasks] = useState<OptimizationTask[]>(optimizationTasks);

  const categories = [
    { id: 'all', label: 'All Metrics', icon: '📊' },
    { id: 'core', label: 'Core Web Vitals', icon: '⚡' },
    { id: 'frontend', label: 'Frontend', icon: '🖥️' },
    { id: 'api', label: 'API', icon: '🔌' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'network', label: 'Network', icon: '🌐' }
  ];

  const filteredMetrics = performanceMetrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const calculateImprovement = (current: number, baseline: number) => {
    const improvement = ((baseline - current) / baseline) * 100;
    return improvement;
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = (completedTasks / totalTasks) * 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Optimization</h2>
          <p className="text-muted-foreground">
            System performance metrics and optimization roadmap
          </p>
        </div>

        {/* Category Filter */}
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
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Excellent Metrics</p>
                <p className="text-2xl font-bold text-green-900">
                  {performanceMetrics.filter(m => m.status === 'excellent').length}
                </p>
              </div>
              <div className="text-2xl">🚀</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Good Performance</p>
                <p className="text-2xl font-bold text-blue-900">
                  {performanceMetrics.filter(m => m.status === 'good').length}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Optimization Progress</p>
                <p className="text-2xl font-bold text-purple-900">
                  {completionPercentage.toFixed(0)}%
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Tasks Completed</p>
                <p className="text-2xl font-bold text-orange-900">
                  {completedTasks}/{totalTasks}
                </p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Current performance compared to baseline measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.map((metric) => {
              const improvement = calculateImprovement(metric.currentValue, metric.baselineValue);
              
              return (
                <Card key={metric.id} className={cn('border', getStatusColor(metric.status))}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{metric.name}</h4>
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded capitalize',
                          getStatusColor(metric.status)
                        )}>
                          {metric.status}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-bold">
                          {metric.currentValue}{metric.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          was {metric.baselineValue}{metric.unit}
                        </div>
                      </div>
                      
                      {improvement > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {improvement.toFixed(1)}% improvement
                        </div>
                      )}
                      
                      {metric.recommendation && (
                        <p className="text-xs text-muted-foreground">
                          {metric.recommendation}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Roadmap</CardTitle>
          <CardDescription>
            Performance optimization tasks and their expected impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className={cn(
                'border transition-all',
                task.completed ? 'bg-green-50 border-green-200' : 'hover:shadow-sm'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={cn(
                          'mt-1 w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs',
                          task.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {task.completed && '✓'}
                      </button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className={cn(
                            'font-medium',
                            task.completed && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {task.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">Impact:</span>
                            <span className={cn(
                              'px-2 py-1 rounded font-medium',
                              getImpactColor(task.impact)
                            )}>
                              {task.impact}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">Effort:</span>
                            <span className={cn(
                              'px-2 py-1 rounded border font-medium',
                              getEffortColor(task.effort)
                            )}>
                              {task.effort}
                            </span>
                          </div>
                          
                          <div className="text-green-600 font-medium">
                            {task.estimatedImprovement}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">🎯</span>
            Performance Insights
          </CardTitle>
          <CardDescription>
            Analysis and recommendations for continued optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Achievements</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm font-medium">Excellent Core Web Vitals</p>
                  <p className="text-xs text-muted-foreground">
                    All core web vitals are in the "good" or "excellent" range, providing optimal user experience.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm font-medium">Fast API Performance</p>
                  <p className="text-xs text-muted-foreground">
                    156ms average API response time is 48% faster than baseline, enabling real-time user experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-blue-800">Next Steps</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm font-medium">Image Optimization</p>
                  <p className="text-xs text-muted-foreground">
                    Implement WebP format and lazy loading for 15-25% improvement in load times.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm font-medium">Code Splitting</p>
                  <p className="text-xs text-muted-foreground">
                    Route-based code splitting can reduce initial bundle size by 30%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOptimization;