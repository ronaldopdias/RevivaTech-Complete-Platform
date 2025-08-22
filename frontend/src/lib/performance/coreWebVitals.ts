/**
 * Core Web Vitals Performance Monitoring and Optimization
 * Tracks LCP, FID, CLS, FCP, TTFB and provides optimization hints
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceReport {
  metrics: WebVitalsMetric[];
  suggestions: string[];
  score: number;
  timestamp: number;
}

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
};

class CoreWebVitalsMonitor {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private reportCallback?: (report: PerformanceReport) => void;

  constructor() {
    // Only initialize observers on client-side to prevent SSR errors
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    try {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entries) => {
        const lcpEntry = entries[entries.length - 1] as any;
        this.recordMetric('LCP', lcpEntry.startTime);
      });

      // First Input Delay (FID) - deprecated in favor of INP but still tracked
      this.observeMetric('first-input', (entries) => {
        const fidEntry = entries[0] as any;
        const fid = fidEntry.processingStart - fidEntry.startTime;
        this.recordMetric('FID', fid);
      });

      // Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        for (const entry of entries as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('CLS', clsValue);
      });

      // First Contentful Paint (FCP)
      this.observeMetric('paint', (entries) => {
        const fcpEntry = entries.find((entry: any) => entry.name === 'first-contentful-paint') as any;
        if (fcpEntry) {
          this.recordMetric('FCP', fcpEntry.startTime);
        }
      });

      // Time to First Byte (TTFB)
      this.observeMetric('navigation', (entries) => {
        const navEntry = entries[0] as any;
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.recordMetric('TTFB', ttfb);
      });

      // Interaction to Next Paint (INP) - new metric
      if (typeof window !== 'undefined' && 'PerformanceEventTiming' in window) {
        this.observeMetric('event', (entries) => {
          let maxINP = 0;
          for (const entry of entries as any[]) {
            if (entry.interactionId && entry.duration > maxINP) {
              maxINP = entry.duration;
            }
          }
          if (maxINP > 0) {
            this.recordMetric('INP', maxINP);
          }
        });
      }

    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private recordMetric(name: string, value: number) {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    let rating: 'good' | 'needs-improvement' | 'poor' = 'good';

    if (threshold) {
      if (value > threshold.poor) {
        rating = 'poor';
      } else if (value > threshold.good) {
        rating = 'needs-improvement';
      }
    }

    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      delta: value - (this.metrics.get(name)?.value || 0),
      id: `${name}-${Date.now()}`,
      navigationType: this.getNavigationType()
    };

    this.metrics.set(name, metric);
    this.generateReport();
  }

  private getNavigationType(): string {
    if ('navigation' in performance) {
      return (performance as any).navigation.type || 'navigate';
    }
    return 'navigate';
  }

  private generateReport() {
    const metrics = Array.from(this.metrics.values());
    const suggestions = this.generateSuggestions(metrics);
    const score = this.calculateScore(metrics);

    const report: PerformanceReport = {
      metrics,
      suggestions,
      score,
      timestamp: Date.now()
    };

    this.reportCallback?.(report);

    // Store in localStorage for debugging with quota handling
    if (typeof window !== 'undefined') {
      try {
        const reportData = JSON.stringify(report);
        localStorage.setItem('webvitals-report', reportData);
      } catch (error: any) {
        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
          try {
            // Clear old reports and try again
            localStorage.removeItem('webvitals-report');
            
            // Try to store a minimal report
            const minimalReport = {
              score: report.score,
              timestamp: report.timestamp,
              metricsCount: metrics.length
            };
            localStorage.setItem('webvitals-report', JSON.stringify(minimalReport));
          } catch (retryError) {
            // If still fails, clear all webvitals data
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('webvitals')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (clearError) {
                // Ignore clear errors
              }
            });
          }
        }
      }
    }
  }

  private generateSuggestions(metrics: WebVitalsMetric[]): string[] {
    const suggestions: string[] = [];

    for (const metric of metrics) {
      if (metric.rating === 'poor') {
        switch (metric.name) {
          case 'LCP':
            suggestions.push('Optimize your largest contentful element (images, videos, text blocks)');
            suggestions.push('Use modern image formats (WebP, AVIF) and proper sizing');
            suggestions.push('Preload critical resources and implement lazy loading');
            break;
          case 'FID':
          case 'INP':
            suggestions.push('Reduce JavaScript execution time and optimize event handlers');
            suggestions.push('Use web workers for heavy computations');
            suggestions.push('Implement code splitting and defer non-critical scripts');
            break;
          case 'CLS':
            suggestions.push('Reserve space for images and ads to prevent layout shifts');
            suggestions.push('Use CSS transforms instead of animating layout properties');
            suggestions.push('Load fonts efficiently to prevent text layout shifts');
            break;
          case 'FCP':
            suggestions.push('Minimize render-blocking resources (CSS, JavaScript)');
            suggestions.push('Optimize server response times and use CDN');
            suggestions.push('Implement critical CSS inlining');
            break;
          case 'TTFB':
            suggestions.push('Optimize server performance and database queries');
            suggestions.push('Use caching strategies and CDN');
            suggestions.push('Minimize redirects and optimize DNS lookup');
            break;
        }
      } else if (metric.rating === 'needs-improvement') {
        suggestions.push(`${metric.name} could be improved - consider minor optimizations`);
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private calculateScore(metrics: WebVitalsMetric[]): number {
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 75;
        case 'poor': return 50;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  // Public API
  public onReport(callback: (report: PerformanceReport) => void) {
    this.reportCallback = callback;
  }

  public getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  public getScore(): number {
    return this.calculateScore(Array.from(this.metrics.values()));
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Manual performance markers
  public mark(name: string) {
    if ('mark' in performance) {
      performance.mark(name);
    }
  }

  public measure(name: string, startMark: string, endMark?: string) {
    try {
      if ('measure' in performance) {
        performance.measure(name, startMark, endMark);
      }
    } catch (error) {
      console.warn('Failed to measure:', error);
    }
  }

  // Resource timing analysis
  public analyzeResources(): ResourceAnalysis {
    if (!('getEntriesByType' in performance)) {
      return { totalResources: 0, slowResources: [], suggestions: [] };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowThreshold = 1000; // 1 second
    
    const slowResources = resources
      .filter(resource => resource.duration > slowThreshold)
      .map(resource => ({
        name: resource.name,
        duration: Math.round(resource.duration),
        type: this.getResourceType(resource),
        size: resource.transferSize || 0
      }))
      .sort((a, b) => b.duration - a.duration);

    const suggestions: string[] = [];
    
    if (slowResources.length > 0) {
      suggestions.push(`${slowResources.length} slow resources detected`);
      
      const imageResources = slowResources.filter(r => r.type === 'image');
      if (imageResources.length > 0) {
        suggestions.push('Optimize images: use WebP/AVIF, proper sizing, lazy loading');
      }
      
      const scriptResources = slowResources.filter(r => r.type === 'script');
      if (scriptResources.length > 0) {
        suggestions.push('Optimize JavaScript: code splitting, minification, compression');
      }
      
      const fontResources = slowResources.filter(r => r.type === 'font');
      if (fontResources.length > 0) {
        suggestions.push('Optimize fonts: preload, font-display: swap, subset fonts');
      }
    }

    return {
      totalResources: resources.length,
      slowResources,
      suggestions
    };
  }

  private getResourceType(resource: PerformanceResourceTiming): string {
    const url = new URL(resource.name);
    const extension = url.pathname.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(extension || '')) {
      return 'image';
    } else if (['js', 'mjs'].includes(extension || '')) {
      return 'script';
    } else if (['css'].includes(extension || '')) {
      return 'stylesheet';
    } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) {
      return 'font';
    } else if (resource.name.includes('video') || ['mp4', 'webm', 'mov'].includes(extension || '')) {
      return 'video';
    }
    
    return 'other';
  }
}

interface ResourceAnalysis {
  totalResources: number;
  slowResources: Array<{
    name: string;
    duration: number;
    type: string;
    size: number;
  }>;
  suggestions: string[];
}

// Singleton instance
export const webVitalsMonitor = new CoreWebVitalsMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [report, setReport] = React.useState<PerformanceReport | null>(null);
  const [resourceAnalysis, setResourceAnalysis] = React.useState<ResourceAnalysis | null>(null);

  React.useEffect(() => {
    webVitalsMonitor.onReport(setReport);
    
    // Analyze resources after initial load
    const timer = setTimeout(() => {
      setResourceAnalysis(webVitalsMonitor.analyzeResources());
    }, 2000);

    return () => {
      clearTimeout(timer);
      webVitalsMonitor.disconnect();
    };
  }, []);

  return {
    report,
    resourceAnalysis,
    score: report?.score || 0,
    metrics: report?.metrics || [],
    suggestions: report?.suggestions || []
  };
}

// Performance optimization utilities
export const performanceUtils = {
  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      document.head.appendChild(link);
    }
  },

  // Lazy load images with intersection observer
  lazyLoadImages: (selector: string = 'img[data-src]') => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  // Optimize font loading
  optimizeFonts: () => {
    if (typeof window !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
      });
    }
  },

  // Track custom metrics
  trackCustomMetric: (name: string, value: number) => {
    webVitalsMonitor.mark(`${name}-start`);
    setTimeout(() => {
      webVitalsMonitor.mark(`${name}-end`);
      webVitalsMonitor.measure(name, `${name}-start`, `${name}-end`);
    }, value);
  }
};

export default webVitalsMonitor;

// Add React import for the hook
import React from 'react';