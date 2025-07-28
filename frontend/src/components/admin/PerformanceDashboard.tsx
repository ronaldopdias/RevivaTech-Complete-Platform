'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PerformanceMetrics, 
  PERFORMANCE_BUDGETS,
  performanceMonitor,
  performanceBenchmark,
  generatePerformanceReport,
  runPerformanceTests
} from '@/lib/performance/monitoring';
import { 
  getBundleOptimizationStatus 
} from '@/lib/performance/bundle-optimization';
import { 
  getCSSOptimizationStatus 
} from '@/lib/performance/css-optimization';
import { 
  getApiOptimizationStatus 
} from '@/lib/performance/api-optimization';

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<Record<string, any> | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null);

  useEffect(() => {
    // Load initial metrics
    loadMetrics();
    
    // Load optimization status
    loadOptimizationStatus();

    // Update metrics every 10 seconds
    const interval = setInterval(loadMetrics, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = () => {
    const currentMetrics = performanceMonitor.getMetrics();
    const currentBudgetStatus = performanceMonitor.getBudgetStatus();
    
    setMetrics(currentMetrics);
    setBudgetStatus(currentBudgetStatus);
  };

  const loadOptimizationStatus = () => {
    const status = {
      bundle: getBundleOptimizationStatus(),
      css: getCSSOptimizationStatus(),
      api: getApiOptimizationStatus(),
    };
    setOptimizationStatus(status);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runPerformanceTests();
      setTestResults(results);
    } catch (error) {
      console.error('Performance tests failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const downloadReport = () => {
    const report = generatePerformanceReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMetricStatus = (metric: string, value: number | null, budget: number) => {
    if (value === null) return 'unknown';
    return value <= budget ? 'good' : 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'poor': return 'text-red-600';
      case 'unknown': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return '✅';
      case 'poor': return '❌';
      case 'unknown': return '❓';
      default: return '❓';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={isRunningTests}>
            {isRunningTests ? 'Running Tests...' : 'Run Performance Tests'}
          </Button>
          <Button variant="secondary" onClick={downloadReport}>
            Download Report
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { key: 'fcp', name: 'First Contentful Paint', unit: 'ms' },
            { key: 'lcp', name: 'Largest Contentful Paint', unit: 'ms' },
            { key: 'cls', name: 'Cumulative Layout Shift', unit: '' },
            { key: 'fid', name: 'First Input Delay', unit: 'ms' },
            { key: 'ttfb', name: 'Time to First Byte', unit: 'ms' },
          ].map(({ key, name, unit }) => {
            const value = metrics?.[key as keyof PerformanceMetrics] as number | null;
            const budget = PERFORMANCE_BUDGETS[key as keyof typeof PERFORMANCE_BUDGETS];
            const status = getMetricStatus(key, value, budget);
            
            return (
              <div key={key} className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">{name}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${getStatusColor(status)}`}>
                    {value ? `${value.toFixed(key === 'cls' ? 3 : 0)}${unit}` : 'N/A'}
                  </span>
                  <span>{getStatusIcon(status)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Budget: {budget}{unit}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bundle Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bundle Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Bundle Size</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {metrics?.bundleSize 
                  ? `${(metrics.bundleSize / 1024).toFixed(2)}KB`
                  : 'N/A'
                }
              </span>
              <span>
                {getStatusIcon(getMetricStatus('bundleSize', metrics?.bundleSize || null, PERFORMANCE_BUDGETS.bundleSize))}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Budget: {(PERFORMANCE_BUDGETS.bundleSize / 1024).toFixed(0)}KB
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Chunk Count</div>
            <div className="text-lg font-semibold">
              {metrics?.chunkCount || 'N/A'}
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Memory Usage</div>
            <div className="text-lg font-semibold">
              {metrics?.usedJSHeapSize 
                ? `${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Optimization Status */}
      {optimizationStatus && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Bundle Optimization</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Dynamic Imports:</span>
                  <span>{optimizationStatus.bundle.dynamicImports ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Code Splitting:</span>
                  <span>{optimizationStatus.bundle.codeSplitting ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tree Shaking:</span>
                  <span>{optimizationStatus.bundle.treeShaking ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">CSS Optimization</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Critical CSS:</span>
                  <span>{optimizationStatus.css.criticalCSSInlined ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lazy Loading:</span>
                  <span>{optimizationStatus.css.nonCriticalCSSLazyLoaded ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Minification:</span>
                  <span>{optimizationStatus.css.minification ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">API Optimization</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Compression:</span>
                  <span>{optimizationStatus.api.compressionEnabled ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Caching:</span>
                  <span>{optimizationStatus.api.cachingEnabled ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monitoring:</span>
                  <span>{optimizationStatus.api.performanceMonitoring ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Test Results</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Core Web Vitals</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {Object.entries(testResults.coreWebVitals).map(([metric, value]) => (
                  <div key={metric} className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">{metric.toUpperCase()}</div>
                    <div className="font-medium">{(value as number).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Bundle Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(testResults.bundleMetrics).map(([metric, value]) => (
                  <div key={metric} className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">{metric}</div>
                    <div className="font-medium">
                      {typeof value === 'number' && metric === 'bundleSize' 
                        ? `${(value / 1024).toFixed(2)}KB`
                        : String(value)
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
        <div className="text-sm text-muted-foreground">
          Last updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'Never'}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Metrics are automatically updated every 10 seconds. The page monitors Core Web Vitals, 
          bundle sizes, API performance, and memory usage to ensure optimal user experience.
        </div>
      </Card>
    </div>
  );
}

export default PerformanceDashboard;