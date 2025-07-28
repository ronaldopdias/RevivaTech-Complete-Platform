/**
 * Design System Analytics and Performance Monitoring
 * Comprehensive analytics system for tracking design system usage and performance
 */

export interface ComponentUsageMetrics {
  componentName: string;
  variant?: string;
  size?: string;
  renderTime: number;
  interactionCount: number;
  errorCount: number;
  memoryUsage: number;
  timestamp: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  sessionId: string;
  userId?: string;
}

export interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
}

export interface AccessibilityMetrics {
  componentName: string;
  contrastRatio: number;
  keyboardNavigable: boolean;
  screenReaderCompatible: boolean;
  focusManagement: boolean;
  ariaCompliance: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
  timestamp: number;
}

export interface UsageAnalytics {
  totalComponents: number;
  totalRenders: number;
  averageRenderTime: number;
  mostUsedComponents: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  mostUsedVariants: Array<{
    component: string;
    variant: string;
    count: number;
    percentage: number;
  }>;
  performanceIssues: Array<{
    component: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    count: number;
  }>;
  accessibilityScore: number;
  errorRate: number;
  userSatisfaction: number;
}

class DesignSystemAnalytics {
  private metrics: ComponentUsageMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private accessibilityMetrics: AccessibilityMetrics[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private performanceObserver?: PerformanceObserver;
  private mutationObserver?: MutationObserver;
  private analyticsEndpoint?: string;
  private batchSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds

  constructor(config?: {
    enabled?: boolean;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
  }) {
    this.sessionId = this.generateSessionId();
    this.isEnabled = config?.enabled ?? true;
    this.analyticsEndpoint = config?.endpoint;
    this.batchSize = config?.batchSize ?? 100;
    this.flushInterval = config?.flushInterval ?? 30000;

    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializePerformanceObserver();
      this.initializeMutationObserver();
      this.startBatchFlush();
    }
  }

  private generateSessionId(): string {
    return `ds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('design-system')) {
            this.recordPerformanceMetric({
              componentName: entry.name,
              loadTime: entry.duration,
              renderTime: entry.duration,
              interactionDelay: 0,
              memoryUsage: this.getMemoryUsage(),
              bundleSize: 0,
              cacheHitRate: 0,
              errorRate: 0,
              timestamp: Date.now(),
            });
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  private initializeMutationObserver(): void {
    if (typeof window !== 'undefined') {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.className && element.className.includes('ds-')) {
                  this.trackComponentRender(element.className);
                }
              }
            });
          }
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-component'],
      });
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  private getMemoryUsage(): number {
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getViewport(): { width: number; height: number } {
    return {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    };
  }

  // Public API methods
  public trackComponentUsage(
    componentName: string,
    variant?: string,
    size?: string,
    additionalData?: Partial<ComponentUsageMetrics>
  ): void {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    
    // Simulate component render tracking
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      const metric: ComponentUsageMetrics = {
        componentName,
        variant,
        size,
        renderTime,
        interactionCount: 0,
        errorCount: 0,
        memoryUsage: this.getMemoryUsage(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        viewport: this.getViewport(),
        sessionId: this.sessionId,
        ...additionalData,
      };

      this.metrics.push(metric);
      this.checkBatchSize();
    });
  }

  public trackComponentInteraction(
    componentName: string,
    interactionType: 'click' | 'hover' | 'focus' | 'keyboard' | 'touch',
    duration?: number
  ): void {
    if (!this.isEnabled) return;

    const existingMetric = this.metrics
      .reverse()
      .find(m => m.componentName === componentName && Date.now() - m.timestamp < 5000);

    if (existingMetric) {
      existingMetric.interactionCount += 1;
    } else {
      this.trackComponentUsage(componentName, undefined, undefined, {
        interactionCount: 1,
      });
    }

    // Track interaction performance
    if (duration) {
      this.recordPerformanceMetric({
        componentName,
        loadTime: 0,
        renderTime: 0,
        interactionDelay: duration,
        memoryUsage: this.getMemoryUsage(),
        bundleSize: 0,
        cacheHitRate: 0,
        errorRate: 0,
        timestamp: Date.now(),
      });
    }
  }

  public trackComponentError(
    componentName: string,
    error: Error,
    context?: string
  ): void {
    if (!this.isEnabled) return;

    const existingMetric = this.metrics
      .reverse()
      .find(m => m.componentName === componentName && Date.now() - m.timestamp < 5000);

    if (existingMetric) {
      existingMetric.errorCount += 1;
    } else {
      this.trackComponentUsage(componentName, undefined, undefined, {
        errorCount: 1,
      });
    }

    // Log error for debugging
    console.error(`Design System Error in ${componentName}:`, error, context);
  }

  public trackAccessibility(
    componentName: string,
    metrics: Partial<AccessibilityMetrics>
  ): void {
    if (!this.isEnabled) return;

    const accessibilityMetric: AccessibilityMetrics = {
      componentName,
      contrastRatio: 0,
      keyboardNavigable: false,
      screenReaderCompatible: false,
      focusManagement: false,
      ariaCompliance: false,
      wcagLevel: 'A',
      timestamp: Date.now(),
      ...metrics,
    };

    this.accessibilityMetrics.push(accessibilityMetric);
    this.checkBatchSize();
  }

  public recordPerformanceMetric(metric: PerformanceMetrics): void {
    if (!this.isEnabled) return;

    this.performanceMetrics.push(metric);
    this.checkBatchSize();
  }

  private trackComponentRender(className: string): void {
    const componentMatch = className.match(/ds-([a-zA-Z]+)/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      this.trackComponentUsage(componentName);
    }
  }

  private checkBatchSize(): void {
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0 && this.performanceMetrics.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      usage: this.metrics.splice(0, this.batchSize),
      performance: this.performanceMetrics.splice(0, this.batchSize),
      accessibility: this.accessibilityMetrics.splice(0, this.batchSize),
    };

    if (this.analyticsEndpoint) {
      try {
        await fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('Failed to send analytics data:', error);
        // Re-add metrics back to queue on failure
        this.metrics.unshift(...payload.usage);
        this.performanceMetrics.unshift(...payload.performance);
        this.accessibilityMetrics.unshift(...payload.accessibility);
      }
    }

    // Also store in localStorage for development
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('ds-analytics') || '[]');
      stored.push(payload);
      localStorage.setItem('ds-analytics', JSON.stringify(stored.slice(-100))); // Keep last 100
    }
  }

  // Analytics retrieval methods
  public getUsageAnalytics(): UsageAnalytics {
    const allMetrics = this.metrics.concat(
      JSON.parse(localStorage.getItem('ds-analytics') || '[]')
        .flatMap((batch: any) => batch.usage || [])
    );

    const componentCounts = new Map<string, number>();
    const variantCounts = new Map<string, number>();
    let totalRenderTime = 0;
    let totalErrors = 0;

    allMetrics.forEach(metric => {
      componentCounts.set(metric.componentName, (componentCounts.get(metric.componentName) || 0) + 1);
      
      if (metric.variant) {
        const key = `${metric.componentName}.${metric.variant}`;
        variantCounts.set(key, (variantCounts.get(key) || 0) + 1);
      }
      
      totalRenderTime += metric.renderTime;
      totalErrors += metric.errorCount;
    });

    const totalComponents = componentCounts.size;
    const totalRenders = allMetrics.length;
    const averageRenderTime = totalRenderTime / totalRenders || 0;

    const mostUsedComponents = Array.from(componentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalRenders) * 100,
      }));

    const mostUsedVariants = Array.from(variantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [component, variant] = key.split('.');
        return {
          component,
          variant,
          count,
          percentage: (count / totalRenders) * 100,
        };
      });

    const performanceIssues = this.performanceMetrics
      .filter(m => m.renderTime > 100) // Components taking more than 100ms
      .reduce((acc, metric) => {
        const existing = acc.find(item => item.component === metric.componentName);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({
            component: metric.componentName,
            issue: 'Slow render time',
            severity: metric.renderTime > 500 ? 'high' : 'medium',
            count: 1,
          });
        }
        return acc;
      }, [] as any[]);

    const accessibilityScore = this.accessibilityMetrics.length > 0
      ? this.accessibilityMetrics.reduce((acc, metric) => {
          let score = 0;
          if (metric.keyboardNavigable) score += 20;
          if (metric.screenReaderCompatible) score += 20;
          if (metric.focusManagement) score += 20;
          if (metric.ariaCompliance) score += 20;
          if (metric.contrastRatio >= 4.5) score += 20;
          return acc + score;
        }, 0) / this.accessibilityMetrics.length
      : 0;

    return {
      totalComponents,
      totalRenders,
      averageRenderTime,
      mostUsedComponents,
      mostUsedVariants,
      performanceIssues,
      accessibilityScore,
      errorRate: (totalErrors / totalRenders) * 100 || 0,
      userSatisfaction: Math.max(0, 100 - (averageRenderTime / 10) - (totalErrors / totalRenders * 100)),
    };
  }

  public getPerformanceReport(): {
    averageRenderTime: number;
    slowestComponents: Array<{ name: string; time: number }>;
    memoryUsage: number;
    errorRate: number;
    recommendations: string[];
  } {
    const metrics = this.performanceMetrics;
    
    if (metrics.length === 0) {
      return {
        averageRenderTime: 0,
        slowestComponents: [],
        memoryUsage: 0,
        errorRate: 0,
        recommendations: [],
      };
    }

    const averageRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    
    const componentTimes = new Map<string, number[]>();
    metrics.forEach(m => {
      if (!componentTimes.has(m.componentName)) {
        componentTimes.set(m.componentName, []);
      }
      componentTimes.get(m.componentName)!.push(m.renderTime);
    });

    const slowestComponents = Array.from(componentTimes.entries())
      .map(([name, times]) => ({
        name,
        time: times.reduce((sum, t) => sum + t, 0) / times.length,
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);

    const memoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const errorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

    const recommendations = [];
    if (averageRenderTime > 50) {
      recommendations.push('Consider optimizing component render times');
    }
    if (memoryUsage > 50) {
      recommendations.push('Memory usage is high, consider component optimization');
    }
    if (errorRate > 1) {
      recommendations.push('Error rate is above threshold, review component implementations');
    }

    return {
      averageRenderTime,
      slowestComponents,
      memoryUsage,
      errorRate,
      recommendations,
    };
  }

  public generateReport(): string {
    const usage = this.getUsageAnalytics();
    const performance = this.getPerformanceReport();

    return `
# Design System Analytics Report
Generated: ${new Date().toISOString()}
Session: ${this.sessionId}

## Usage Statistics
- Total Components: ${usage.totalComponents}
- Total Renders: ${usage.totalRenders}
- Average Render Time: ${usage.averageRenderTime.toFixed(2)}ms
- Error Rate: ${usage.errorRate.toFixed(2)}%
- User Satisfaction: ${usage.userSatisfaction.toFixed(1)}%

## Most Used Components
${usage.mostUsedComponents.map(c => `- ${c.name}: ${c.count} renders (${c.percentage.toFixed(1)}%)`).join('\n')}

## Performance Insights
- Average Render Time: ${performance.averageRenderTime.toFixed(2)}ms
- Memory Usage: ${performance.memoryUsage.toFixed(2)}MB
- Error Rate: ${performance.errorRate.toFixed(2)}%

## Slowest Components
${performance.slowestComponents.map(c => `- ${c.name}: ${c.time.toFixed(2)}ms`).join('\n')}

## Accessibility Score
${usage.accessibilityScore.toFixed(1)}/100

## Recommendations
${performance.recommendations.map(r => `- ${r}`).join('\n')}

## Performance Issues
${usage.performanceIssues.map(i => `- ${i.component}: ${i.issue} (${i.severity} severity, ${i.count} occurrences)`).join('\n')}
`;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public destroy(): void {
    this.isEnabled = false;
    this.performanceObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}

// Create singleton instance
export const designSystemAnalytics = new DesignSystemAnalytics({
  enabled: process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
});

// React hook for analytics
export const useDesignSystemAnalytics = () => {
  const trackUsage = (componentName: string, variant?: string, size?: string) => {
    designSystemAnalytics.trackComponentUsage(componentName, variant, size);
  };

  const trackInteraction = (componentName: string, type: 'click' | 'hover' | 'focus' | 'keyboard' | 'touch') => {
    designSystemAnalytics.trackComponentInteraction(componentName, type);
  };

  const trackError = (componentName: string, error: Error, context?: string) => {
    designSystemAnalytics.trackComponentError(componentName, error, context);
  };

  return {
    trackUsage,
    trackInteraction,
    trackError,
    getAnalytics: () => designSystemAnalytics.getUsageAnalytics(),
    getPerformanceReport: () => designSystemAnalytics.getPerformanceReport(),
    generateReport: () => designSystemAnalytics.generateReport(),
  };
};

export default designSystemAnalytics;