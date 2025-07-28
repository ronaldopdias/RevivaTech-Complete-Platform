// Analytics Performance Optimization
'use client';

interface PerformanceConfig {
  // Script loading strategies
  defer: boolean;
  lazy: boolean;
  preload: boolean;
  
  // Batching configuration
  batchSize: number;
  batchInterval: number;
  
  // Rate limiting
  maxEventsPerSecond: number;
  maxEventsPerSession: number;
  
  // Error handling
  maxRetries: number;
  retryDelay: number;
  
  // Performance monitoring
  trackPerformanceMetrics: boolean;
  maxScriptLoadTime: number;
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  defer: true,
  lazy: false,
  preload: true,
  batchSize: 10,
  batchInterval: 2000,
  maxEventsPerSecond: 10,
  maxEventsPerSession: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  trackPerformanceMetrics: true,
  maxScriptLoadTime: 3000
};

// Event batching system
class AnalyticsEventBatcher {
  private batchQueue: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private config: PerformanceConfig;
  
  constructor(config: PerformanceConfig) {
    this.config = config;
  }
  
  addEvent(event: any): void {
    this.batchQueue.push({
      ...event,
      timestamp: Date.now(),
      batchId: this.generateBatchId()
    });
    
    // Check if batch is ready to send
    if (this.batchQueue.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // Set timer for automatic batch flush
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchInterval);
    }
  }
  
  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    try {
      // Send batch to all analytics providers
      await this.sendBatch(batch);
    } catch (error) {
      console.error('Analytics batch send failed:', error);
      // Optionally retry or queue for later
    }
  }
  
  private async sendBatch(events: any[]): Promise<void> {
    const batchPayload = {
      events,
      batchId: this.generateBatchId(),
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };
    
    // Send to internal backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
      await fetch(`${apiUrl}/api/analytics/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload)
      });
    } catch (error) {
      console.error('Backend batch send failed:', error);
    }
    
    // Send individual events to external providers
    events.forEach(event => {
      this.sendToExternalProviders(event);
    });
  }
  
  private sendToExternalProviders(event: any): void {
    // Send to Google Analytics (non-blocking)
    requestIdleCallback(() => {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', event.name, event.data);
      }
    });
    
    // Send to Facebook Pixel (non-blocking)
    requestIdleCallback(() => {
      if (typeof (window as any).fbq === 'function') {
        (window as any).fbq('trackCustom', event.name, event.data);
      }
    });
    
    // Send to PostHog (non-blocking)
    requestIdleCallback(() => {
      if (typeof (window as any).posthog === 'object') {
        (window as any).posthog.capture(event.name, event.data);
      }
    });
  }
  
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getSessionId(): string | null {
    return typeof window !== 'undefined' 
      ? sessionStorage.getItem('revivatech_session_id') 
      : null;
  }
  
  // Force flush all pending events
  async flush(): Promise<void> {
    await this.flushBatch();
  }
}

// Rate limiting system
class AnalyticsRateLimiter {
  private eventCounts: Map<string, number> = new Map();
  private sessionEventCount: number = 0;
  private config: PerformanceConfig;
  
  constructor(config: PerformanceConfig) {
    this.config = config;
    
    // Reset rate limiting every second
    setInterval(() => {
      this.eventCounts.clear();
    }, 1000);
  }
  
  canSendEvent(eventName: string): boolean {
    const currentSecond = Math.floor(Date.now() / 1000);
    const key = `${eventName}_${currentSecond}`;
    
    // Check per-second limit
    const currentCount = this.eventCounts.get(key) || 0;
    if (currentCount >= this.config.maxEventsPerSecond) {
      console.warn(`Rate limit exceeded for event: ${eventName}`);
      return false;
    }
    
    // Check session limit
    if (this.sessionEventCount >= this.config.maxEventsPerSession) {
      console.warn('Session event limit exceeded');
      return false;
    }
    
    // Update counts
    this.eventCounts.set(key, currentCount + 1);
    this.sessionEventCount++;
    
    return true;
  }
  
  getStats(): { currentSecond: number; sessionTotal: number } {
    return {
      currentSecond: Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0),
      sessionTotal: this.sessionEventCount
    };
  }
}

// Error handling and retry system
class AnalyticsErrorHandler {
  private failedEvents: Array<{ event: any; attempts: number }> = [];
  private config: PerformanceConfig;
  
  constructor(config: PerformanceConfig) {
    this.config = config;
  }
  
  handleError(event: any, error: Error): void {
    const existingIndex = this.failedEvents.findIndex(
      item => item.event.id === event.id
    );
    
    if (existingIndex >= 0) {
      this.failedEvents[existingIndex].attempts++;
      
      if (this.failedEvents[existingIndex].attempts >= this.config.maxRetries) {
        console.error('Max retries exceeded for event:', event, error);
        this.failedEvents.splice(existingIndex, 1);
        return;
      }
    } else {
      this.failedEvents.push({ event, attempts: 1 });
    }
    
    // Schedule retry
    setTimeout(() => {
      this.retryEvent(event);
    }, this.config.retryDelay);
  }
  
  private async retryEvent(event: any): Promise<void> {
    try {
      // Attempt to resend the event
      await this.sendEvent(event);
      
      // Remove from failed events on success
      const index = this.failedEvents.findIndex(
        item => item.event.id === event.id
      );
      if (index >= 0) {
        this.failedEvents.splice(index, 1);
      }
    } catch (error) {
      // Will be handled by recursive call
      this.handleError(event, error as Error);
    }
  }
  
  private async sendEvent(event: any): Promise<void> {
    // Implement event sending logic here
    throw new Error('Not implemented');
  }
  
  getFailedEvents(): Array<{ event: any; attempts: number }> {
    return [...this.failedEvents];
  }
}

// Performance monitoring
class AnalyticsPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private config: PerformanceConfig;
  
  constructor(config: PerformanceConfig) {
    this.config = config;
    
    if (config.trackPerformanceMetrics && typeof window !== 'undefined') {
      this.initializePerformanceTracking();
    }
  }
  
  private initializePerformanceTracking(): void {
    // Monitor script loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('analytics') || 
            entry.name.includes('gtag') ||
            entry.name.includes('fbq') ||
            entry.name.includes('posthog')) {
          this.recordMetric('script_load_time', entry.duration);
          
          if (entry.duration > this.config.maxScriptLoadTime) {
            console.warn(`Analytics script loaded slowly: ${entry.name} (${entry.duration}ms)`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    // Monitor Core Web Vitals impact
    this.monitorCoreWebVitals();
  }
  
  private monitorCoreWebVitals(): void {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric('fcp', entry.startTime);
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric('lcp', entry.startTime);
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }
  
  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
  
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((_, name) => {
      const stats = this.getMetricStats(name);
      if (stats) {
        result[name] = stats;
      }
    });
    
    return result;
  }
}

// Main performance optimization manager
export class AnalyticsPerformanceManager {
  private config: PerformanceConfig;
  private batcher: AnalyticsEventBatcher;
  private rateLimiter: AnalyticsRateLimiter;
  private errorHandler: AnalyticsErrorHandler;
  private performanceMonitor: AnalyticsPerformanceMonitor;
  
  constructor(customConfig: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...customConfig };
    this.batcher = new AnalyticsEventBatcher(this.config);
    this.rateLimiter = new AnalyticsRateLimiter(this.config);
    this.errorHandler = new AnalyticsErrorHandler(this.config);
    this.performanceMonitor = new AnalyticsPerformanceMonitor(this.config);
  }
  
  // Optimized event tracking
  async trackEvent(eventName: string, eventData: any): Promise<boolean> {
    // Check rate limiting
    if (!this.rateLimiter.canSendEvent(eventName)) {
      return false;
    }
    
    // Create event with unique ID
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      data: eventData,
      timestamp: Date.now()
    };
    
    try {
      // Add to batch queue
      this.batcher.addEvent(event);
      
      // Record performance metric
      this.performanceMonitor.recordMetric('events_tracked', 1);
      
      return true;
    } catch (error) {
      this.errorHandler.handleError(event, error as Error);
      return false;
    }
  }
  
  // Load analytics scripts with optimization
  loadAnalyticsScripts(): void {
    if (typeof window === 'undefined') return;
    
    const loadScript = (src: string, id: string, async: boolean = true, defer: boolean = true) => {
      if (document.getElementById(id)) return;
      
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = async;
      script.defer = defer;
      
      // Load scripts using requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          document.head.appendChild(script);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          document.head.appendChild(script);
        }, 100);
      }
    };
    
    // Load Google Analytics
    const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    if (ga4Id && ga4Id !== 'G-PLACEHOLDER123456') {
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`, 'ga-script');
      
      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() { (window as any).dataLayer.push(arguments); };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', ga4Id, {
        send_page_view: false, // We'll handle this manually
        transport_type: 'beacon',
        custom_map: {
          'custom_parameter_1': 'session_id'
        }
      });
    }
    
    // Load Facebook Pixel
    const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (fbPixelId && fbPixelId !== '1234567890123456') {
      loadScript('https://connect.facebook.net/en_US/fbevents.js', 'fb-script');
      
      // Initialize Facebook Pixel
      (window as any).fbq = (window as any).fbq || function() { 
        ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments);
      };
      (window as any).fbq('init', fbPixelId);
      (window as any).fbq('track', 'PageView');
    }
    
    // PostHog is now loaded via instrumentation-client.js (official SDK)
    // No need for custom loading here
  }
  
  // Get performance stats
  getPerformanceStats(): {
    rateLimiter: { currentSecond: number; sessionTotal: number };
    failedEvents: number;
    metrics: Record<string, any>;
  } {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      failedEvents: this.errorHandler.getFailedEvents().length,
      metrics: this.performanceMonitor.getAllMetrics()
    };
  }
  
  // Cleanup and flush
  async cleanup(): Promise<void> {
    await this.batcher.flush();
  }
}

// Export singleton instance
export const analyticsPerformanceManager = new AnalyticsPerformanceManager();

// Export configuration and utilities
export { DEFAULT_PERFORMANCE_CONFIG };
export type { PerformanceConfig };