// Performance Optimization Dashboard
// Comprehensive performance monitoring and optimization tools for admin users

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  PhotoIcon, 
  CodeBracketIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { codeSplittingManager } from '@/lib/performance/codeSplitting';

interface PerformanceDashboardProps {
  className?: string;
}

interface PerformanceMetrics {
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  };
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  resources: {
    totalSize: number;
    imageSize: number;
    jsSize: number;
    cssSize: number;
    cacheHitRate: number;
  };
  optimization: {
    webpUsage: number;
    lazyLoadingEnabled: boolean;
    codeSplittingActive: boolean;
    gzipEnabled: boolean;
    cacheConfigured: boolean;
  };
}

interface OptimizationAction {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'images' | 'code' | 'caching' | 'network';
  implemented: boolean;
  estimatedImprovement: string;
}

export function PerformanceOptimizationDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [actions] = useState<OptimizationAction[]>([
    {
      id: 'webp-conversion',
      title: 'WebP Image Conversion',
      description: 'Convert all images to WebP format for 25-35% smaller file sizes',
      impact: 'high',
      difficulty: 'medium',
      category: 'images',
      implemented: true,
      estimatedImprovement: '30% faster image loading'
    },
    {
      id: 'lazy-loading',
      title: 'Implement Lazy Loading',
      description: 'Load images only when they enter the viewport',
      impact: 'high',
      difficulty: 'easy',
      category: 'images',
      implemented: true,
      estimatedImprovement: '40% faster initial page load'
    },
    {
      id: 'code-splitting',
      title: 'Route-based Code Splitting',
      description: 'Split JavaScript bundles by routes to reduce initial bundle size',
      impact: 'high',
      difficulty: 'medium',
      category: 'code',
      implemented: true,
      estimatedImprovement: '50% smaller initial bundle'
    },
    {
      id: 'component-splitting',
      title: 'Component-level Code Splitting',
      description: 'Lazy load heavy components like charts and admin panels',
      impact: 'medium',
      difficulty: 'medium',
      category: 'code',
      implemented: true,
      estimatedImprovement: '20% faster page interactions'
    },
    {
      id: 'cdn-optimization',
      title: 'CDN Configuration',
      description: 'Optimize CDN settings for better global performance',
      impact: 'high',
      difficulty: 'easy',
      category: 'network',
      implemented: false,
      estimatedImprovement: '60% faster global loading'
    },
    {
      id: 'cache-headers',
      title: 'Aggressive Caching Headers',
      description: 'Implement long-term caching for static assets',
      impact: 'medium',
      difficulty: 'easy',
      category: 'caching',
      implemented: false,
      estimatedImprovement: '90% faster repeat visits'
    }
  ]);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Load performance metrics
      const response = await fetch('/api/performance?action=health-check');
      const result = await response.json();
      
      // Simulate comprehensive metrics (in production, this would come from real monitoring)
      const mockMetrics: PerformanceMetrics = {
        overall: {
          score: 87,
          grade: 'B',
          recommendations: [
            'Enable CDN for static assets',
            'Implement service worker caching',
            'Optimize largest contentful paint'
          ]
        },
        webVitals: {
          lcp: 2.1, // Good: < 2.5s
          fid: 45,   // Good: < 100ms
          cls: 0.08, // Needs improvement: < 0.1
          fcp: 1.3,  // Good: < 1.8s
          ttfb: 280  // Good: < 300ms
        },
        resources: {
          totalSize: 2.8, // MB
          imageSize: 1.2,
          jsSize: 0.9,
          cssSize: 0.3,
          cacheHitRate: 76
        },
        optimization: {
          webpUsage: 85,
          lazyLoadingEnabled: true,
          codeSplittingActive: true,
          gzipEnabled: true,
          cacheConfigured: false
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async (actionId: string) => {
    try {
      setOptimizing(true);
      
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call actual optimization APIs
      console.log(`Running optimization: ${actionId}`);
      
      await loadPerformanceData();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const clearCaches = async () => {
    try {
      setOptimizing(true);
      
      // Clear performance caches
      await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });

      // Clear code splitting cache
      codeSplittingManager.clearCache();
      
      await loadPerformanceData();
    } catch (error) {
      console.error('Failed to clear caches:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVitalStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600' };
    if (value <= thresholds.needsImprovement) return { status: 'needs-improvement', color: 'text-yellow-600' };
    return { status: 'poor', color: 'text-red-600' };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-gray-500 py-8">
        Failed to load performance metrics
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BoltIcon className="h-5 w-5 mr-2" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Current site performance metrics and optimization status
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(metrics.overall.score)}`}>
                  {metrics.overall.score}
                </div>
                <div className="text-sm text-gray-500">Performance Score</div>
              </div>
              <Badge 
                variant={metrics.overall.grade === 'A' ? "default" : 
                        metrics.overall.grade === 'B' ? "secondary" : "destructive"}
                className="text-lg px-3 py-1"
              >
                Grade {metrics.overall.grade}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.resources.totalSize.toFixed(1)}MB
              </div>
              <div className="text-sm text-gray-600">Total Page Size</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.resources.cacheHitRate}%
              </div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.optimization.webpUsage}%
              </div>
              <div className="text-sm text-gray-600">WebP Usage</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.webVitals.lcp.toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600">Largest Contentful Paint</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="optimization">Optimizations</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>
                Key performance metrics that affect user experience and SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Largest Contentful Paint */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Largest Contentful Paint (LCP)</div>
                  <div className="text-sm text-gray-500">Main content loading time</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-lg font-bold ${getVitalStatus(metrics.webVitals.lcp, { good: 2.5, needsImprovement: 4.0 }).color}`}>
                    {metrics.webVitals.lcp.toFixed(1)}s
                  </div>
                  <Badge variant={metrics.webVitals.lcp <= 2.5 ? "default" : "secondary"}>
                    {getVitalStatus(metrics.webVitals.lcp, { good: 2.5, needsImprovement: 4.0 }).status}
                  </Badge>
                </div>
              </div>

              {/* First Input Delay */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">First Input Delay (FID)</div>
                  <div className="text-sm text-gray-500">Interactivity response time</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-lg font-bold ${getVitalStatus(metrics.webVitals.fid, { good: 100, needsImprovement: 300 }).color}`}>
                    {metrics.webVitals.fid}ms
                  </div>
                  <Badge variant={metrics.webVitals.fid <= 100 ? "default" : "secondary"}>
                    {getVitalStatus(metrics.webVitals.fid, { good: 100, needsImprovement: 300 }).status}
                  </Badge>
                </div>
              </div>

              {/* Cumulative Layout Shift */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Cumulative Layout Shift (CLS)</div>
                  <div className="text-sm text-gray-500">Visual stability score</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-lg font-bold ${getVitalStatus(metrics.webVitals.cls, { good: 0.1, needsImprovement: 0.25 }).color}`}>
                    {metrics.webVitals.cls.toFixed(3)}
                  </div>
                  <Badge variant={metrics.webVitals.cls <= 0.1 ? "default" : "secondary"}>
                    {getVitalStatus(metrics.webVitals.cls, { good: 0.1, needsImprovement: 0.25 }).status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Status Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CpuChipIcon className="h-5 w-5 mr-2" />
                Optimization Status
              </CardTitle>
              <CardDescription>
                Current optimization features and their implementation status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <PhotoIcon className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">WebP Images</div>
                      <div className="text-sm text-gray-500">{metrics.optimization.webpUsage}% converted</div>
                    </div>
                  </div>
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <CodeBracketIcon className="h-5 w-5 mr-3 text-purple-600" />
                    <div>
                      <div className="font-medium">Code Splitting</div>
                      <div className="text-sm text-gray-500">Route & component level</div>
                    </div>
                  </div>
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-3 text-green-600" />
                    <div>
                      <div className="font-medium">Lazy Loading</div>
                      <div className="text-sm text-gray-500">Images & components</div>
                    </div>
                  </div>
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <CloudIcon className="h-5 w-5 mr-3 text-orange-600" />
                    <div>
                      <div className="font-medium">CDN Optimization</div>
                      <div className="text-sm text-gray-500">Not configured</div>
                    </div>
                  </div>
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Action Items</CardTitle>
              <CardDescription>
                Recommended optimizations to improve performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="font-medium">{action.title}</div>
                        <Badge className={getImpactColor(action.impact)}>
                          {action.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {action.difficulty}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{action.description}</div>
                      <div className="text-sm font-medium text-blue-600">
                        Expected: {action.estimatedImprovement}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {action.implemented ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <Button
                          onClick={() => runOptimization(action.id)}
                          disabled={optimizing}
                          size="sm"
                        >
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tools</CardTitle>
              <CardDescription>
                Tools and utilities for performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={clearCaches}
                  disabled={optimizing}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <ArrowPathIcon className="h-6 w-6 mb-2" />
                  Clear All Caches
                </Button>

                <Button
                  onClick={() => runOptimization('analyze-bundle')}
                  disabled={optimizing}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <ChartBarIcon className="h-6 w-6 mb-2" />
                  Analyze Bundle Size
                </Button>

                <Button
                  onClick={() => runOptimization('optimize-images')}
                  disabled={optimizing}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <PhotoIcon className="h-6 w-6 mb-2" />
                  Optimize Images
                </Button>

                <Button
                  onClick={() => runOptimization('performance-audit')}
                  disabled={optimizing}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <CpuChipIcon className="h-6 w-6 mb-2" />
                  Run Performance Audit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}