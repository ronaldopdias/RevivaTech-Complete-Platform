'use client'

import React from 'react';

/**
 * Real-time Performance Monitoring Service - Core Web Vitals and more
 * Tracks LCP, FID, CLS, TTFB, and custom performance metrics
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  FCP: number | null; // First Contentful Paint
  
  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  timeToInteractive: number | null;
  
  // Resource metrics
  totalResourceCount: number;
  totalResourceSize: number;
  imageResourceCount: number;
  jsResourceCount: number;
  cssResourceCount: number;
  
  // User experience metrics
  navigationTiming: PerformanceNavigationTiming | null;
  memoryUsage: number | null;
  connectionSpeed: string | null;
  
  // Metadata
  url: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
}

export interface PerformanceAlert {
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

export interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  FCP: { good: number; poor: number };
  pageLoadTime: { good: number; poor: number };
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver> = new Map();
  private sessionId: string;
  private thresholds: PerformanceThresholds;
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private alertCallbacks: Set<(alert: PerformanceAlert) => void> = new Set();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.thresholds = this.getThresholds();
    this.metrics = this.initializeMetrics();
    
    if (typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      LCP: null,
      FID: null,
      CLS: null,
      TTFB: null,
      FCP: null,
      pageLoadTime: null,
      domContentLoaded: null,
      timeToInteractive: null,
      totalResourceCount: 0,
      totalResourceSize: 0,
      imageResourceCount: 0,
      jsResourceCount: 0,
      cssResourceCount: 0,
      navigationTiming: null,
      memoryUsage: null,
      connectionSpeed: null,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      sessionId: this.sessionId
    };
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getThresholds(): PerformanceThresholds {
    return {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      FCP: { good: 1800, poor: 3000 },
      pageLoadTime: { good: 3000, poor: 5000 }
    };
  }

  private startMonitoring(): void {
    this.measureNavigationTiming();
    this.measureCoreWebVitals();
    this.measureResourceMetrics();
    this.measureMemoryUsage();
    this.measureConnectionSpeed();
    this.setupPerformanceObservers();
  }

  private measureNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const timing = navigationEntries[0];
        this.metrics.navigationTiming = timing;
        
        // Calculate derived metrics
        this.metrics.TTFB = timing.responseStart - timing.requestStart;
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        this.metrics.pageLoadTime = timing.loadEventEnd - timing.loadEventStart;
        
        this.checkThresholds();
        this.notifyCallbacks();
      }
    }
  }

  private measureCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            this.metrics.LCP = lastEntry.startTime;
            this.checkThresholds();
            this.notifyCallbacks();
          }
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          for (const entry of entries) {
            this.metrics.FID = (entry as any).processingStart - entry.startTime;
            this.checkThresholds();
            this.notifyCallbacks();
          }
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          
          this.metrics.CLS = clsValue;
          this.checkThresholds();
          this.notifyCallbacks();
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.FCP = entry.startTime;
              this.checkThresholds();
              this.notifyCallbacks();
            }
          }
        });
        
        fcpObserver.observe({ type: 'paint', buffered: true });
        this.observers.set('fcp', fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }
  }

  private measureResourceMetrics(): void {
    if ('performance' in window) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalSize = 0;
      let imageCount = 0;
      let jsCount = 0;
      let cssCount = 0;
      
      for (const entry of resourceEntries) {
        // Calculate transfer size
        const transferSize = entry.transferSize || entry.decodedBodySize || 0;
        totalSize += transferSize;
        
        // Count by resource type
        if (entry.initiatorType === 'img' || entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
          imageCount++;
        } else if (entry.initiatorType === 'script' || entry.name.match(/\.js$/i)) {
          jsCount++;
        } else if (entry.initiatorType === 'link' || entry.name.match(/\.css$/i)) {
          cssCount++;
        }
      }
      
      this.metrics.totalResourceCount = resourceEntries.length;
      this.metrics.totalResourceSize = totalSize;
      this.metrics.imageResourceCount = imageCount;
      this.metrics.jsResourceCount = jsCount;
      this.metrics.cssResourceCount = cssCount;
      
      this.notifyCallbacks();
    }
  }

  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      this.notifyCallbacks();
    }
  }

  private measureConnectionSpeed(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionSpeed = connection.effectiveType || 'unknown';
      this.notifyCallbacks();
    }
  }

  private setupPerformanceObservers(): void {
    // Monitor resource loading performance
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          // Update resource metrics when new resources load
          this.measureResourceMetrics();
        });
        
        resourceObserver.observe({ type: 'resource', buffered: true });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  private checkThresholds(): void {
    const checks: Array<{
      metric: keyof PerformanceThresholds;
      value: number | null;
    }> = [
      { metric: 'LCP', value: this.metrics.LCP },
      { metric: 'FID', value: this.metrics.FID },
      { metric: 'CLS', value: this.metrics.CLS },
      { metric: 'TTFB', value: this.metrics.TTFB },
      { metric: 'FCP', value: this.metrics.FCP },
      { metric: 'pageLoadTime', value: this.metrics.pageLoadTime }
    ];

    for (const check of checks) {
      if (check.value !== null) {
        const threshold = this.thresholds[check.metric];
        let severity: PerformanceAlert['severity'];
        
        if (check.value <= threshold.good) {
          severity = 'info';
        } else if (check.value <= threshold.poor) {
          severity = 'warning';
        } else {
          severity = 'critical';
        }

        if (severity !== 'info') {
          const alert: PerformanceAlert = {
            metric: check.metric,
            value: check.value,
            threshold: severity === 'warning' ? threshold.good : threshold.poor,
            severity,
            message: this.generateAlertMessage(check.metric, check.value, severity),
            timestamp: Date.now()
          };

          this.notifyAlertCallbacks(alert);
        }
      }
    }
  }

  private generateAlertMessage(metric: string, value: number, severity: string): string {
    const messages = {
      LCP: `Largest Contentful Paint is ${severity === 'critical' ? 'very slow' : 'slow'} at ${value.toFixed(0)}ms`,
      FID: `First Input Delay is ${severity === 'critical' ? 'very high' : 'high'} at ${value.toFixed(0)}ms`,
      CLS: `Cumulative Layout Shift is ${severity === 'critical' ? 'very high' : 'high'} at ${value.toFixed(3)}`,
      TTFB: `Time to First Byte is ${severity === 'critical' ? 'very slow' : 'slow'} at ${value.toFixed(0)}ms`,
      FCP: `First Contentful Paint is ${severity === 'critical' ? 'very slow' : 'slow'} at ${value.toFixed(0)}ms`,
      pageLoadTime: `Page load time is ${severity === 'critical' ? 'very slow' : 'slow'} at ${value.toFixed(0)}ms`
    };

    return messages[metric as keyof typeof messages] || `${metric} performance issue detected`;
  }

  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Performance callback error:', error);
      }
    }
  }

  private notifyAlertCallbacks(alert: PerformanceAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('Performance alert callback error:', error);
      }
    }
  }

  /**
   * Public API methods
   */
  
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  onPerformanceAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.alertCallbacks.delete(callback);
    };
  }

  measureCustomMetric(name: string, startTime?: number): void {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : endTime;
    
    // Store custom metric
    performance.mark(`custom-${name}-${Date.now()}`);
    
    console.log(`Custom metric ${name}: ${duration.toFixed(2)}ms`);
  }

  startCustomTiming(name: string): () => void {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  getPerformanceScore(): {
    overall: number;
    breakdown: Record<string, number>;
    recommendations: string[];
  } {
    const scores = {
      LCP: this.scoreMetric('LCP', this.metrics.LCP),
      FID: this.scoreMetric('FID', this.metrics.FID),
      CLS: this.scoreMetric('CLS', this.metrics.CLS),
      TTFB: this.scoreMetric('TTFB', this.metrics.TTFB),
      FCP: this.scoreMetric('FCP', this.metrics.FCP)
    };

    const validScores = Object.values(scores).filter(score => score !== null) as number[];
    const overall = validScores.length > 0 
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    const recommendations = this.generateRecommendations();

    return {
      overall,
      breakdown: scores as Record<string, number>,
      recommendations
    };
  }

  private scoreMetric(metric: keyof PerformanceThresholds, value: number | null): number | null {
    if (value === null) return null;
    
    const threshold = this.thresholds[metric];
    
    if (value <= threshold.good) {
      return 100;
    } else if (value <= threshold.poor) {
      // Linear interpolation between 50 and 100
      const ratio = (threshold.poor - value) / (threshold.poor - threshold.good);
      return Math.round(50 + (ratio * 50));
    } else {
      // Linear interpolation between 0 and 50
      const excessRatio = Math.min((value - threshold.poor) / threshold.poor, 1);
      return Math.round(50 * (1 - excessRatio));
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.LCP && this.metrics.LCP > this.thresholds.LCP.good) {
      recommendations.push('Optimize largest content element loading (images, videos, text blocks)');
    }
    
    if (this.metrics.FID && this.metrics.FID > this.thresholds.FID.good) {
      recommendations.push('Reduce JavaScript execution time and optimize main thread work');
    }
    
    if (this.metrics.CLS && this.metrics.CLS > this.thresholds.CLS.good) {
      recommendations.push('Ensure all elements have defined dimensions and avoid layout shifts');
    }
    
    if (this.metrics.TTFB && this.metrics.TTFB > this.thresholds.TTFB.good) {
      recommendations.push('Optimize server response time and consider CDN implementation');
    }
    
    if (this.metrics.totalResourceSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Reduce total page size by optimizing images and removing unused code');
    }
    
    return recommendations;
  }

  disconnect(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.callbacks.clear();
    this.alertCallbacks.clear();
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// React hook for easy integration
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);

  React.useEffect(() => {
    const unsubscribeMetrics = performanceMonitoring.onMetricsUpdate(setMetrics);
    const unsubscribeAlerts = performanceMonitoring.onPerformanceAlert((alert) => {
      setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
    });

    // Get initial metrics
    setMetrics(performanceMonitoring.getCurrentMetrics());

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, []);

  return {
    metrics,
    alerts,
    measureCustom: performanceMonitoring.measureCustomMetric.bind(performanceMonitoring),
    startTiming: performanceMonitoring.startCustomTiming.bind(performanceMonitoring),
    getScore: performanceMonitoring.getPerformanceScore.bind(performanceMonitoring)
  };
}