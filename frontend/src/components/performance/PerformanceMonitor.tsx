'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/client';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // Bundle metrics
  bundleSize?: number;
  jsSize?: number;
  cssSize?: number;
  imageSize?: number;
  
  // Runtime metrics
  memoryUsage?: number;
  renderTime?: number;
  hydrationTime?: number;
  
  // User experience
  pageLoadTime?: number;
  timeToInteractive?: number;
}

interface PerformanceData {
  metrics: PerformanceMetrics;
  timestamp: number;
  url: string;
  userAgent: string;
}

export default function PerformanceMonitor() {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run for admin users
    if (!isAdmin()) return;

    let observer: PerformanceObserver;
    
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics: PerformanceMetrics = {};

      // Core Web Vitals
      if (navigation) {
        newMetrics.ttfb = navigation.responseStart - navigation.fetchStart;
        newMetrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      }

      // Paint metrics
      paint.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          newMetrics.fcp = entry.startTime;
        }
      });

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      setMetrics(newMetrics);
    };

    // Collect initial metrics
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Set up performance observer for LCP and FID
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
          }
          if (entry.entryType === 'first-input') {
            setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
          }
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        // Some browsers might not support all entry types
        console.warn('Performance observer failed:', e);
      }
    }

    // Report metrics to analytics service
    const reportMetrics = () => {
      const data: PerformanceData = {
        metrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Send to analytics endpoint (implement as needed)
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {
          // Silently fail analytics reporting
        });
      }
    };

    // Report metrics after page is fully loaded
    const timer = setTimeout(reportMetrics, 3000);

    return () => {
      if (observer) observer.disconnect();
      if (timer) clearTimeout(timer);
      window.removeEventListener('load', collectMetrics);
    };
  }, [isAdmin]);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // Only show for admin users
  if (!isAdmin() || !isVisible) {
    return null;
  }

  const getMetricColor = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
    };

    if (!thresholds[metric]) return 'text-gray-600';
    
    const { good, poor } = thresholds[metric];
    if (value <= good) return 'text-green-600';
    if (value <= poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMetric = (value: number, unit: string = 'ms') => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    }
    if (unit === 'MB') {
      return `${value.toFixed(1)}MB`;
    }
    if (unit === 'score') {
      return value.toFixed(3);
    }
    return value.toString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-y-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Performance Metrics
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            {/* Core Web Vitals */}
            <div className="border-b pb-2">
              <div className="font-medium mb-1">Core Web Vitals</div>
              {metrics.fcp && (
                <div className="flex justify-between">
                  <span>First Contentful Paint:</span>
                  <span className={getMetricColor('fcp', metrics.fcp)}>
                    {formatMetric(metrics.fcp)}
                  </span>
                </div>
              )}
              {metrics.lcp && (
                <div className="flex justify-between">
                  <span>Largest Contentful Paint:</span>
                  <span className={getMetricColor('lcp', metrics.lcp)}>
                    {formatMetric(metrics.lcp)}
                  </span>
                </div>
              )}
              {metrics.fid && (
                <div className="flex justify-between">
                  <span>First Input Delay:</span>
                  <span className={getMetricColor('fid', metrics.fid)}>
                    {formatMetric(metrics.fid)}
                  </span>
                </div>
              )}
              {metrics.cls && (
                <div className="flex justify-between">
                  <span>Cumulative Layout Shift:</span>
                  <span className={getMetricColor('cls', metrics.cls)}>
                    {formatMetric(metrics.cls, 'score')}
                  </span>
                </div>
              )}
            </div>

            {/* Loading Metrics */}
            <div className="border-b pb-2">
              <div className="font-medium mb-1">Loading</div>
              {metrics.ttfb && (
                <div className="flex justify-between">
                  <span>Time to First Byte:</span>
                  <span className={getMetricColor('ttfb', metrics.ttfb)}>
                    {formatMetric(metrics.ttfb)}
                  </span>
                </div>
              )}
              {metrics.pageLoadTime && (
                <div className="flex justify-between">
                  <span>Page Load Time:</span>
                  <span>{formatMetric(metrics.pageLoadTime)}</span>
                </div>
              )}
            </div>

            {/* Runtime Metrics */}
            <div>
              <div className="font-medium mb-1">Runtime</div>
              {metrics.memoryUsage && (
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{formatMetric(metrics.memoryUsage, 'MB')}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t">
              Press Ctrl+Shift+P to toggle
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for component-level performance monitoring
export function usePerformanceMetrics() {
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    };
  }, []);

  const measureAsync = async <T,>(operation: () => Promise<T>, label?: string): Promise<T> => {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };

  const measure = <T,>(operation: () => T, label?: string): T => {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };

  return {
    renderTime,
    measureAsync,
    measure,
  };
}