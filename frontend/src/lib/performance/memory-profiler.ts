/**
 * Memory & Performance Profiler
 * Extends existing Core Web Vitals tracking with comprehensive performance monitoring
 * Detects memory leaks, monitors component lifecycle, and provides performance insights
 * Integrates with the unified debug dashboard
 */

export interface MemorySnapshot {
  timestamp: string;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  components: ComponentMemoryInfo[];
}

export interface ComponentMemoryInfo {
  name: string;
  instances: number;
  averageMemory: number;
  totalMemory: number;
  mountTime: string;
  lastUpdate: string;
  leakSuspicion: 'low' | 'medium' | 'high';
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'navigation' | 'render' | 'api' | 'user' | 'custom';
  metadata?: any;
}

export interface PerformanceAlert {
  type: 'memory_leak' | 'slow_component' | 'large_bundle' | 'long_task' | 'poor_cwv';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: string;
  recommendations: string[];
}

export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  duplicates: Array<{ module: string; size: number; chunks: string[] }>;
  unusedCode: Array<{ file: string; size: number; unusedPercentage: number }>;
  recommendations: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  loadTime?: number;
  cached: boolean;
  modules: string[];
  isInitial: boolean;
}

export interface PerformanceConfig {
  enabled: boolean;
  memoryMonitoring: boolean;
  componentTracking: boolean;
  performanceMarks: boolean;
  bundleAnalysis: boolean;
  coreWebVitals: boolean;
  alertThresholds: {
    memoryUsage: number; // Percentage
    componentRenderTime: number; // Milliseconds
    bundleSize: number; // Bytes
    longTaskThreshold: number; // Milliseconds
  };
  samplingRate: number; // 0-1, how often to collect data
  maxSnapshots: number;
}

class MemoryProfiler {
  private config: PerformanceConfig;
  private memorySnapshots: MemorySnapshot[] = [];
  private performanceMarks: PerformanceMark[] = [];
  private performanceAlerts: PerformanceAlert[] = [];
  private componentRegistry: Map<string, ComponentMemoryInfo> = new Map();
  private bundleAnalysis: BundleAnalysis | null = null;
  private observers: PerformanceObserver[] = [];
  private subscribers: Array<(data: any) => void> = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enabled: true,
      memoryMonitoring: true,
      componentTracking: true,
      performanceMarks: true,
      bundleAnalysis: process.env.NODE_ENV === 'development',
      coreWebVitals: true,
      alertThresholds: {
        memoryUsage: 80, // Alert at 80% memory usage
        componentRenderTime: 16, // Alert if component takes >16ms to render
        bundleSize: 1024 * 1024, // Alert if bundle >1MB
        longTaskThreshold: 50, // Alert for tasks >50ms
      },
      samplingRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      maxSnapshots: 100,
      ...config,
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupMemoryMonitoring();
    this.setupPerformanceObservers();
    this.setupCoreWebVitalsTracking();
    this.startPeriodicAnalysis();

    if (this.config.bundleAnalysis) {
      this.analyzeBundleSize();
    }
  }

  private setupMemoryMonitoring(): void {
    if (!this.config.memoryMonitoring || !('performance' in window)) return;

    // Take memory snapshots periodically
    this.intervalId = setInterval(() => {
      if (Math.random() <= this.config.samplingRate) {
        this.takeMemorySnapshot();
      }
    }, 10000); // Every 10 seconds
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Long Tasks Observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > this.config.alertThresholds.longTaskThreshold) {
            this.addAlert({
              type: 'long_task',
              severity: entry.duration > 100 ? 'high' : 'medium',
              message: `Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`,
              data: {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              },
              timestamp: new Date().toISOString(),
              recommendations: [
                'Break down large synchronous operations',
                'Use requestIdleCallback for non-critical work',
                'Consider web workers for heavy computations',
              ],
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      // LongTask observer not supported
    }

    // Layout Shift Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput && clsEntry.value > 0.1) {
            this.addAlert({
              type: 'poor_cwv',
              severity: clsEntry.value > 0.25 ? 'high' : 'medium',
              message: `High Cumulative Layout Shift detected: ${clsEntry.value.toFixed(3)}`,
              data: {
                value: clsEntry.value,
                sources: clsEntry.sources,
                hadRecentInput: clsEntry.hadRecentInput,
              },
              timestamp: new Date().toISOString(),
              recommendations: [
                'Add explicit dimensions to images and videos',
                'Reserve space for dynamic content',
                'Avoid inserting content above existing content',
              ],
            });
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      // Layout shift observer not supported
    }

    // Resource Observer
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Check for large resources
          if (resourceEntry.transferSize > this.config.alertThresholds.bundleSize / 10) {
            this.addAlert({
              type: 'large_bundle',
              severity: 'medium',
              message: `Large resource loaded: ${resourceEntry.name} (${this.formatBytes(resourceEntry.transferSize)})`,
              data: {
                name: resourceEntry.name,
                size: resourceEntry.transferSize,
                duration: resourceEntry.duration,
              },
              timestamp: new Date().toISOString(),
              recommendations: [
                'Consider code splitting',
                'Implement lazy loading',
                'Compress images and assets',
              ],
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      // Resource observer not supported
    }
  }

  private setupCoreWebVitalsTracking(): void {
    if (!this.config.coreWebVitals) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lcpValue = entry.startTime;
          if (lcpValue > 2500) { // LCP should be < 2.5s
            this.addAlert({
              type: 'poor_cwv',
              severity: lcpValue > 4000 ? 'high' : 'medium',
              message: `Poor Largest Contentful Paint: ${lcpValue.toFixed(0)}ms`,
              data: { lcp: lcpValue, element: (entry as any).element },
              timestamp: new Date().toISOString(),
              recommendations: [
                'Optimize server response times',
                'Implement preloading for critical resources',
                'Optimize and compress images',
              ],
            });
          }
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      // LCP observer not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidValue = (entry as any).processingStart - entry.startTime;
          if (fidValue > 100) { // FID should be < 100ms
            this.addAlert({
              type: 'poor_cwv',
              severity: fidValue > 300 ? 'high' : 'medium',
              message: `Poor First Input Delay: ${fidValue.toFixed(0)}ms`,
              data: { fid: fidValue, eventType: (entry as any).name },
              timestamp: new Date().toISOString(),
              recommendations: [
                'Reduce JavaScript execution time',
                'Split long tasks into smaller chunks',
                'Use web workers for heavy computations',
              ],
            });
          }
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      // FID observer not supported
    }
  }

  private takeMemorySnapshot(): void {
    if (!('performance' in window) || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    const snapshot: MemorySnapshot = {
      timestamp: new Date().toISOString(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      components: Array.from(this.componentRegistry.values()),
    };

    this.memorySnapshots.push(snapshot);

    // Trim snapshots if we exceed max
    if (this.memorySnapshots.length > this.config.maxSnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.config.maxSnapshots);
    }

    // Check for memory alerts
    if (usagePercentage > this.config.alertThresholds.memoryUsage) {
      this.addAlert({
        type: 'memory_leak',
        severity: usagePercentage > 90 ? 'critical' : 'high',
        message: `High memory usage: ${usagePercentage.toFixed(1)}%`,
        data: {
          usagePercentage,
          usedJSHeapSize: memory.usedJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        },
        timestamp: new Date().toISOString(),
        recommendations: [
          'Check for memory leaks in event listeners',
          'Ensure proper cleanup in component unmounts',
          'Review large object allocations',
          'Consider using WeakMap/WeakSet for caches',
        ],
      });
    }

    this.notifySubscribers({ type: 'memory_snapshot', data: snapshot });
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      this.analyzeMemoryTrends();
      this.detectMemoryLeaks();
    }, 30000); // Every 30 seconds
  }

  private analyzeMemoryTrends(): void {
    if (this.memorySnapshots.length < 5) return;

    const recent = this.memorySnapshots.slice(-5);
    const trend = this.calculateMemoryTrend(recent);

    if (trend.slope > 0.05) { // Memory increasing by >5% per snapshot
      this.addAlert({
        type: 'memory_leak',
        severity: 'medium',
        message: `Memory usage trending upward: +${(trend.slope * 100).toFixed(1)}% per measurement`,
        data: { trend, recentSnapshots: recent.length },
        timestamp: new Date().toISOString(),
        recommendations: [
          'Monitor component lifecycle for leaks',
          'Check for unclosed event listeners',
          'Review cache implementations',
        ],
      });
    }
  }

  private calculateMemoryTrend(snapshots: MemorySnapshot[]): { slope: number; correlation: number } {
    const n = snapshots.length;
    if (n < 2) return { slope: 0, correlation: 0 };

    const x = snapshots.map((_, i) => i);
    const y = snapshots.map(s => s.usagePercentage);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return { slope: slope / 100, correlation }; // Normalize slope
  }

  private detectMemoryLeaks(): void {
    this.componentRegistry.forEach((component, name) => {
      const age = Date.now() - new Date(component.mountTime).getTime();
      const ageHours = age / (1000 * 60 * 60);

      // Check for components that have been alive too long with high memory
      if (ageHours > 1 && component.totalMemory > 50 * 1024 * 1024) { // >50MB
        component.leakSuspicion = 'high';
        
        this.addAlert({
          type: 'memory_leak',
          severity: 'high',
          message: `Potential memory leak in component: ${name}`,
          data: {
            component: name,
            age: ageHours,
            memory: component.totalMemory,
            instances: component.instances,
          },
          timestamp: new Date().toISOString(),
          recommendations: [
            `Review ${name} component for memory leaks`,
            'Check event listener cleanup',
            'Verify timers are cleared on unmount',
            'Check for circular references',
          ],
        });
      }
    });
  }

  private analyzeBundleSize(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Analyze loaded resources to estimate bundle size
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js') || r.name.includes('chunk'));
    
    const chunks: ChunkInfo[] = jsResources.map(resource => ({
      name: resource.name.split('/').pop() || resource.name,
      size: resource.transferSize || resource.decodedBodySize || 0,
      loadTime: resource.duration,
      cached: resource.transferSize === 0,
      modules: [], // Would need more sophisticated analysis
      isInitial: resource.name.includes('main') || resource.name.includes('app'),
    }));

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    this.bundleAnalysis = {
      totalSize,
      chunks: chunks.sort((a, b) => b.size - a.size),
      duplicates: [], // Would need source map analysis
      unusedCode: [], // Would need coverage analysis
      recommendations: this.generateBundleRecommendations(totalSize, chunks),
    };

    if (totalSize > this.config.alertThresholds.bundleSize) {
      this.addAlert({
        type: 'large_bundle',
        severity: totalSize > this.config.alertThresholds.bundleSize * 2 ? 'high' : 'medium',
        message: `Large bundle size detected: ${this.formatBytes(totalSize)}`,
        data: { totalSize, chunksCount: chunks.length },
        timestamp: new Date().toISOString(),
        recommendations: this.bundleAnalysis.recommendations,
      });
    }
  }

  private generateBundleRecommendations(totalSize: number, chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = [];

    if (totalSize > 1024 * 1024) { // >1MB
      recommendations.push('Consider implementing code splitting');
      recommendations.push('Use dynamic imports for non-critical features');
    }

    if (chunks.some(c => c.size > 500 * 1024)) { // >500KB chunks
      recommendations.push('Break down large chunks into smaller pieces');
    }

    if (chunks.filter(c => !c.cached).length > 10) {
      recommendations.push('Implement proper caching strategies');
    }

    return recommendations;
  }

  private addAlert(alert: PerformanceAlert): void {
    this.performanceAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts = this.performanceAlerts.slice(-100);
    }

    this.notifySubscribers({ type: 'performance_alert', data: alert });
  }

  private notifySubscribers(data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in performance profiler subscriber:', error);
      }
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public API

  /**
   * Register a React component for memory tracking
   */
  registerComponent(name: string, estimatedMemory: number = 0): void {
    if (!this.config.componentTracking) return;

    const existing = this.componentRegistry.get(name);
    if (existing) {
      existing.instances++;
      existing.totalMemory += estimatedMemory;
      existing.averageMemory = existing.totalMemory / existing.instances;
      existing.lastUpdate = new Date().toISOString();
    } else {
      this.componentRegistry.set(name, {
        name,
        instances: 1,
        averageMemory: estimatedMemory,
        totalMemory: estimatedMemory,
        mountTime: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        leakSuspicion: 'low',
      });
    }
  }

  /**
   * Unregister a React component
   */
  unregisterComponent(name: string, estimatedMemory: number = 0): void {
    if (!this.config.componentTracking) return;

    const existing = this.componentRegistry.get(name);
    if (existing) {
      existing.instances = Math.max(0, existing.instances - 1);
      existing.totalMemory = Math.max(0, existing.totalMemory - estimatedMemory);
      existing.averageMemory = existing.instances > 0 ? existing.totalMemory / existing.instances : 0;
      existing.lastUpdate = new Date().toISOString();

      if (existing.instances === 0) {
        this.componentRegistry.delete(name);
      }
    }
  }

  /**
   * Add a custom performance mark
   */
  mark(name: string, category: PerformanceMark['category'] = 'custom', metadata?: any): void {
    if (!this.config.performanceMarks) return;

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      category,
      metadata,
    };

    this.performanceMarks.push(mark);

    // Use native performance marking if available
    if ('mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.config.performanceMarks) return null;

    const startTime = performance.now();
    let duration: number;

    if (endMark) {
      const start = this.performanceMarks.find(m => m.name === startMark);
      const end = this.performanceMarks.find(m => m.name === endMark);
      
      if (!start || !end) return null;
      duration = end.startTime - start.startTime;
    } else {
      const start = this.performanceMarks.find(m => m.name === startMark);
      if (!start) return null;
      duration = startTime - start.startTime;
    }

    // Update the mark with duration
    const mark = this.performanceMarks.find(m => m.name === startMark);
    if (mark) {
      mark.endTime = startTime;
      mark.duration = duration;
    }

    // Use native performance measurement if available
    if ('measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        // Ignore measurement errors
      }
    }

    return duration;
  }

  /**
   * Get memory snapshots
   */
  getMemorySnapshots(limit?: number): MemorySnapshot[] {
    return limit ? this.memorySnapshots.slice(-limit) : [...this.memorySnapshots];
  }

  /**
   * Get performance marks
   */
  getPerformanceMarks(): PerformanceMark[] {
    return [...this.performanceMarks];
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    return severity ? 
      this.performanceAlerts.filter(a => a.severity === severity) :
      [...this.performanceAlerts];
  }

  /**
   * Get component memory info
   */
  getComponentMemoryInfo(): ComponentMemoryInfo[] {
    return Array.from(this.componentRegistry.values());
  }

  /**
   * Get bundle analysis
   */
  getBundleAnalysis(): BundleAnalysis | null {
    return this.bundleAnalysis;
  }

  /**
   * Subscribe to performance events
   */
  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.memorySnapshots = [];
    this.performanceMarks = [];
    this.performanceAlerts = [];
    this.componentRegistry.clear();
  }

  /**
   * Export performance data
   */
  export(): string {
    return JSON.stringify({
      memorySnapshots: this.memorySnapshots,
      performanceMarks: this.performanceMarks,
      performanceAlerts: this.performanceAlerts,
      components: Array.from(this.componentRegistry.values()),
      bundleAnalysis: this.bundleAnalysis,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    memory: { current: number; peak: number; average: number };
    alerts: Record<PerformanceAlert['severity'], number>;
    components: { total: number; suspicious: number };
    marks: number;
  } {
    const memoryUsages = this.memorySnapshots.map(s => s.usagePercentage);
    const currentMemory = memoryUsages[memoryUsages.length - 1] || 0;
    
    const alertCounts = this.performanceAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<PerformanceAlert['severity'], number>);

    const suspiciousComponents = Array.from(this.componentRegistry.values())
      .filter(c => c.leakSuspicion !== 'low').length;

    return {
      memory: {
        current: currentMemory,
        peak: Math.max(...memoryUsages, 0),
        average: memoryUsages.length > 0 ? 
          memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
      },
      alerts: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        ...alertCounts,
      },
      components: {
        total: this.componentRegistry.size,
        suspicious: suspiciousComponents,
      },
      marks: this.performanceMarks.length,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];

    this.clear();
  }
}

// Create singleton instance
export const memoryProfiler = new MemoryProfiler();

// React Hook for component memory tracking (requires React to be imported in consuming components)
export const useMemoryProfiler = (componentName: string, estimatedMemory: number = 1024) => {
  // Note: This requires React to be imported in the consuming component
  if (typeof window !== 'undefined' && (window as any).React?.useEffect) {
    (window as any).React.useEffect(() => {
      memoryProfiler.registerComponent(componentName, estimatedMemory);
      
      return () => {
        memoryProfiler.unregisterComponent(componentName, estimatedMemory);
      };
    }, [componentName, estimatedMemory]);
  }
};

// HOC for automatic component memory tracking
export const withMemoryProfiler = <P extends object>(
  Component: any, // Using any to avoid React import dependency
  estimatedMemory: number = 1024
) => {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    useMemoryProfiler(displayName, estimatedMemory);
    
    // Use React.createElement if available, otherwise return component directly
    if (typeof window !== 'undefined' && (window as any).React?.createElement) {
      return (window as any).React.createElement(Component, props);
    }
    
    // Fallback for environments where React isn't globally available
    return Component(props);
  };
  
  WrappedComponent.displayName = `withMemoryProfiler(${displayName})`;
  return WrappedComponent;
};

// Convenience exports
export const markPerformance = (name: string, category?: PerformanceMark['category']) => 
  memoryProfiler.mark(name, category);
export const measurePerformance = (name: string, startMark: string) => 
  memoryProfiler.measure(name, startMark);
export const getMemorySnapshots = () => memoryProfiler.getMemorySnapshots();
export const getPerformanceAlerts = () => memoryProfiler.getPerformanceAlerts();
export const getPerformanceSummary = () => memoryProfiler.getSummary();

export default memoryProfiler;