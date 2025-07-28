// Performance monitoring and benchmarking system
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import { useState, useEffect } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  domContentLoaded: number | null;
  windowLoad: number | null;
  navigationStart: number | null;
  
  // Bundle metrics
  bundleSize: number | null;
  chunkCount: number | null;
  
  // API metrics
  apiResponseTime: number | null;
  apiErrorRate: number | null;
  
  // Memory metrics
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  
  timestamp: string;
}

// Performance budget thresholds
export const PERFORMANCE_BUDGETS = {
  fcp: 1800, // First Contentful Paint (ms)
  lcp: 2500, // Largest Contentful Paint (ms)
  cls: 0.1,  // Cumulative Layout Shift
  fid: 100,  // First Input Delay (ms)
  ttfb: 800, // Time to First Byte (ms)
  
  // Custom budgets
  domContentLoaded: 2000,
  windowLoad: 3000,
  bundleSize: 250000, // 250KB
  apiResponseTime: 500,
  apiErrorRate: 0.05, // 5%
} as const;

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
    domContentLoaded: null,
    windowLoad: null,
    navigationStart: null,
    bundleSize: null,
    chunkCount: null,
    apiResponseTime: null,
    apiErrorRate: null,
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    timestamp: new Date().toISOString(),
  };

  private observers: PerformanceObserver[] = [];
  private onMetricUpdate?: (metric: keyof PerformanceMetrics, value: number) => void;

  constructor(onMetricUpdate?: (metric: keyof PerformanceMetrics, value: number) => void) {
    this.onMetricUpdate = onMetricUpdate;
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.setupCoreWebVitals();
    
    // Monitor navigation timing
    this.setupNavigationTiming();
    
    // Monitor resource timing
    this.setupResourceTiming();
    
    // Monitor memory usage
    this.setupMemoryMonitoring();
    
    // Monitor custom events
    this.setupCustomEvents();
  }

  private setupCoreWebVitals(): void {
    getFCP((metric) => {
      this.updateMetric('fcp', metric.value);
    });

    getLCP((metric) => {
      this.updateMetric('lcp', metric.value);
    });

    getCLS((metric) => {
      this.updateMetric('cls', metric.value);
    });

    getFID((metric) => {
      this.updateMetric('fid', metric.value);
    });

    getTTFB((metric) => {
      this.updateMetric('ttfb', metric.value);
    });
  }

  private setupNavigationTiming(): void {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    
    // Wait for page load to calculate metrics
    window.addEventListener('load', () => {
      const navigationStart = timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - navigationStart;
      const windowLoad = timing.loadEventEnd - navigationStart;

      this.updateMetric('navigationStart', navigationStart);
      this.updateMetric('domContentLoaded', domContentLoaded);
      this.updateMetric('windowLoad', windowLoad);
    });
  }

  private setupResourceTiming(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      // Calculate bundle metrics
      const jsResources = entries.filter(entry => 
        entry.name.includes('.js') && entry.name.includes('/_next/static/')
      );
      
      if (jsResources.length > 0) {
        const totalSize = jsResources.reduce((sum, entry) => 
          sum + ((entry as any).transferSize || 0), 0
        );
        
        this.updateMetric('bundleSize', totalSize);
        this.updateMetric('chunkCount', jsResources.length);
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const updateMemoryMetrics = () => {
      const memory = (performance as any).memory;
      this.updateMetric('usedJSHeapSize', memory.usedJSHeapSize);
      this.updateMetric('totalJSHeapSize', memory.totalJSHeapSize);
    };

    // Update memory metrics every 30 seconds
    updateMemoryMetrics();
    setInterval(updateMemoryMetrics, 30000);
  }

  private setupCustomEvents(): void {
    // Monitor API response times
    window.addEventListener('api-response', ((event: CustomEvent) => {
      const { responseTime, error } = event.detail;
      this.updateMetric('apiResponseTime', responseTime);
      
      if (error) {
        // Update error rate (would need proper tracking)
        this.updateMetric('apiErrorRate', 0.05);
      }
    }) as EventListener);
  }

  private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
    this.metrics[metric] = value;
    this.onMetricUpdate?.(metric, value);
    
    // Check against budget
    this.checkBudget(metric, value);
  }

  private checkBudget(metric: keyof PerformanceMetrics, value: number): void {
    const budget = PERFORMANCE_BUDGETS[metric as keyof typeof PERFORMANCE_BUDGETS];
    
    if (budget !== undefined && value > budget) {
      console.warn(`Performance budget exceeded for ${metric}: ${value} > ${budget}`);
      
      // Emit budget violation event
      window.dispatchEvent(new CustomEvent('budget-violation', {
        detail: { metric, value, budget }
      }));
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getBudgetStatus(): Record<string, { value: number | null; budget: number; passed: boolean }> {
    const status: Record<string, { value: number | null; budget: number; passed: boolean }> = {};
    
    for (const [metric, budget] of Object.entries(PERFORMANCE_BUDGETS)) {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      status[metric] = {
        value,
        budget,
        passed: value === null || value <= budget,
      };
    }
    
    return status;
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const budgetStatus = this.getBudgetStatus();
    
    const report = [
      '📊 Performance Report',
      '==================',
      '',
      '🚀 Core Web Vitals:',
      `  FCP: ${metrics.fcp || 'N/A'}ms (budget: ${PERFORMANCE_BUDGETS.fcp}ms)`,
      `  LCP: ${metrics.lcp || 'N/A'}ms (budget: ${PERFORMANCE_BUDGETS.lcp}ms)`,
      `  CLS: ${metrics.cls || 'N/A'} (budget: ${PERFORMANCE_BUDGETS.cls})`,
      `  FID: ${metrics.fid || 'N/A'}ms (budget: ${PERFORMANCE_BUDGETS.fid}ms)`,
      `  TTFB: ${metrics.ttfb || 'N/A'}ms (budget: ${PERFORMANCE_BUDGETS.ttfb}ms)`,
      '',
      '📦 Bundle Metrics:',
      `  Size: ${metrics.bundleSize ? (metrics.bundleSize / 1024).toFixed(2) + 'KB' : 'N/A'} (budget: ${PERFORMANCE_BUDGETS.bundleSize / 1024}KB)`,
      `  Chunks: ${metrics.chunkCount || 'N/A'}`,
      '',
      '💻 Memory Usage:',
      `  Used: ${metrics.usedJSHeapSize ? (metrics.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`,
      `  Total: ${metrics.totalJSHeapSize ? (metrics.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`,
      '',
      '🏆 Budget Status:',
      ...Object.entries(budgetStatus).map(([metric, status]) => 
        `  ${metric}: ${status.passed ? '✅' : '❌'} (${status.value || 'N/A'} / ${status.budget})`
      ),
      '',
      `Generated: ${metrics.timestamp}`,
    ];
    
    return report.join('\n');
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Benchmark specific features
export class PerformanceBenchmark {
  private benchmarks = new Map<string, number[]>();

  async benchmarkFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    iterations: number = 10
  ): Promise<{ result: T; averageTime: number; allTimes: number[] }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // Store benchmark results
    this.benchmarks.set(name, times);

    return {
      result: result!,
      averageTime,
      allTimes: times,
    };
  }

  async benchmarkComponentRender(
    componentName: string,
    renderFn: () => Promise<void> | void,
    iterations: number = 5
  ): Promise<{ averageTime: number; allTimes: number[] }> {
    const { averageTime, allTimes } = await this.benchmarkFunction(
      `component-render-${componentName}`,
      renderFn,
      iterations
    );

    return { averageTime, allTimes };
  }

  async benchmarkApiCall(
    endpoint: string,
    callFn: () => Promise<any>,
    iterations: number = 3
  ): Promise<{ averageTime: number; allTimes: number[] }> {
    const { averageTime, allTimes } = await this.benchmarkFunction(
      `api-call-${endpoint}`,
      callFn,
      iterations
    );

    return { averageTime, allTimes };
  }

  getBenchmarkResults(name?: string): Map<string, number[]> | number[] | undefined {
    if (name) {
      return this.benchmarks.get(name);
    }
    return this.benchmarks;
  }

  clearBenchmarks(): void {
    this.benchmarks.clear();
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor((metric, value) => {
  // Log significant performance events
  if (metric === 'lcp' && value > PERFORMANCE_BUDGETS.lcp) {
    console.warn(`LCP budget exceeded: ${value}ms`);
  }
});

export const performanceBenchmark = new PerformanceBenchmark();

// React hook for performance monitoring (import React where this is used)
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const monitor = new PerformanceMonitor((metric, value) => {
      setMetrics(monitor.getMetrics());
      setBudgetStatus(monitor.getBudgetStatus());
    });

    // Initial load
    setTimeout(() => {
      setMetrics(monitor.getMetrics());
      setBudgetStatus(monitor.getBudgetStatus());
    }, 1000);

    return () => monitor.destroy();
  }, []);

  return { metrics, budgetStatus };
}

// Performance report generator
export function generatePerformanceReport(): string {
  return performanceMonitor.generateReport();
}

// Automated performance testing
export async function runPerformanceTests(): Promise<{
  coreWebVitals: Record<string, number>;
  bundleMetrics: Record<string, number>;
  benchmarks: Record<string, { averageTime: number; allTimes: number[] }>;
}> {
  const results = {
    coreWebVitals: {} as Record<string, number>,
    bundleMetrics: {} as Record<string, number>,
    benchmarks: {} as Record<string, { averageTime: number; allTimes: number[] }>,
  };

  // Wait for Core Web Vitals to be collected
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const metrics = performanceMonitor.getMetrics();
  
  // Extract Core Web Vitals
  if (metrics.fcp) results.coreWebVitals.fcp = metrics.fcp;
  if (metrics.lcp) results.coreWebVitals.lcp = metrics.lcp;
  if (metrics.cls) results.coreWebVitals.cls = metrics.cls;
  if (metrics.fid) results.coreWebVitals.fid = metrics.fid;
  if (metrics.ttfb) results.coreWebVitals.ttfb = metrics.ttfb;

  // Extract bundle metrics
  if (metrics.bundleSize) results.bundleMetrics.bundleSize = metrics.bundleSize;
  if (metrics.chunkCount) results.bundleMetrics.chunkCount = metrics.chunkCount;

  // Run component benchmarks
  const componentBenchmark = await performanceBenchmark.benchmarkComponentRender(
    'test-component',
    () => new Promise(resolve => setTimeout(resolve, 10))
  );
  results.benchmarks['component-render'] = componentBenchmark;

  return results;
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start monitoring on page load
  window.addEventListener('load', () => {
    console.log('🚀 Performance monitoring initialized');
  });
}