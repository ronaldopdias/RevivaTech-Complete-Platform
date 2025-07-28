/**
 * Event Throttling Utility
 * 
 * Performance optimization for analytics events with intelligent
 * throttling, priority-based processing, and burst protection
 * 
 * Session 4 - RevivaTech Analytics Implementation
 */

import { 
  AnalyticsEvent, 
  AnalyticsEventType, 
  ThrottleOptions, 
  ThrottleState,
  ANALYTICS_CONSTANTS 
} from '../types/analytics';

/**
 * Advanced event throttling with priority-based processing
 */
export class EventThrottler {
  private state: ThrottleState;
  private options: ThrottleOptions;
  private eventQueue: Array<{ event: AnalyticsEvent; priority: number; timestamp: number }> = [];
  private processTimer: NodeJS.Timeout | null = null;
  private stats = {
    totalEvents: 0,
    processedEvents: 0,
    throttledEvents: 0,
    droppedEvents: 0,
    queuedEvents: 0,
    averageProcessingTime: 0,
    lastReset: Date.now()
  };

  constructor(options: Partial<ThrottleOptions> = {}) {
    this.options = {
      maxEventsPerSecond: 10,
      maxEventsPerMinute: 300,
      burstAllowance: 5,
      throttleStrategy: 'queue',
      priorityTiers: {
        high: [
          AnalyticsEventType.ERROR_BOUNDARY,
          AnalyticsEventType.PERFORMANCE_TIMING,
          AnalyticsEventType.BOOKING_COMPLETE,
          AnalyticsEventType.FORM_SUBMIT
        ],
        medium: [
          AnalyticsEventType.PAGE_VIEW,
          AnalyticsEventType.BOOKING_START,
          AnalyticsEventType.BOOKING_STEP,
          AnalyticsEventType.SERVICE_VIEW,
          AnalyticsEventType.SEARCH_PERFORM,
          AnalyticsEventType.CTA_CLICK
        ],
        low: [
          AnalyticsEventType.SCROLL_MILESTONE,
          AnalyticsEventType.CLICK_EVENT,
          AnalyticsEventType.FORM_INTERACT,
          AnalyticsEventType.CUSTOM_EVENT
        ]
      },
      ...options
    };

    this.state = {
      eventsThisSecond: 0,
      eventsThisMinute: 0,
      lastSecondReset: Date.now(),
      lastMinuteReset: Date.now(),
      burstUsed: 0,
      throttledEvents: 0,
      droppedEvents: 0
    };

    this.startProcessing();
  }

  /**
   * Get event priority level
   */
  private getEventPriority(eventType: AnalyticsEventType): number {
    if (this.options.priorityTiers.high.includes(eventType)) return 3;
    if (this.options.priorityTiers.medium.includes(eventType)) return 2;
    return 1;
  }

  /**
   * Reset rate limiting counters
   */
  private resetCounters(): void {
    const now = Date.now();
    
    // Reset per-second counter
    if (now - this.state.lastSecondReset >= 1000) {
      this.state.eventsThisSecond = 0;
      this.state.lastSecondReset = now;
    }
    
    // Reset per-minute counter
    if (now - this.state.lastMinuteReset >= 60000) {
      this.state.eventsThisMinute = 0;
      this.state.lastMinuteReset = now;
      this.state.burstUsed = 0; // Reset burst allowance
    }
  }

  /**
   * Check if event should be throttled
   */
  private shouldThrottle(priority: number): boolean {
    this.resetCounters();
    
    // High priority events can use burst allowance
    if (priority === 3 && this.state.burstUsed < this.options.burstAllowance) {
      return false;
    }
    
    // Check per-second limit
    if (this.state.eventsThisSecond >= this.options.maxEventsPerSecond) {
      return true;
    }
    
    // Check per-minute limit
    if (this.state.eventsThisMinute >= this.options.maxEventsPerMinute) {
      return true;
    }
    
    return false;
  }

  /**
   * Process event based on throttling strategy
   */
  private processThrottledEvent(event: AnalyticsEvent, priority: number): boolean {
    const shouldThrottle = this.shouldThrottle(priority);
    
    if (!shouldThrottle) {
      // Event can be processed immediately
      this.state.eventsThisSecond++;
      this.state.eventsThisMinute++;
      
      if (priority === 3) {
        this.state.burstUsed++;
      }
      
      return true;
    }
    
    // Event needs to be throttled
    this.state.throttledEvents++;
    
    switch (this.options.throttleStrategy) {
      case 'drop':
        this.state.droppedEvents++;
        return false;
        
      case 'queue':
        this.eventQueue.push({
          event,
          priority,
          timestamp: Date.now()
        });
        this.stats.queuedEvents++;
        return false;
        
      case 'sample':
        // Sample based on priority (higher priority = higher sample rate)
        const sampleRate = priority === 3 ? 0.8 : priority === 2 ? 0.5 : 0.2;
        if (Math.random() < sampleRate) {
          this.eventQueue.push({
            event,
            priority,
            timestamp: Date.now()
          });
          this.stats.queuedEvents++;
        } else {
          this.state.droppedEvents++;
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Process queued events
   */
  private processQueue(): Array<{ event: AnalyticsEvent; priority: number }> {
    if (this.eventQueue.length === 0) return [];
    
    const now = Date.now();
    const processedEvents: Array<{ event: AnalyticsEvent; priority: number }> = [];
    
    // Sort queue by priority (high to low) and timestamp (old to new)
    this.eventQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
    
    // Process events that can fit within current limits
    const availableCapacity = Math.min(
      this.options.maxEventsPerSecond - this.state.eventsThisSecond,
      this.options.maxEventsPerMinute - this.state.eventsThisMinute
    );
    
    if (availableCapacity <= 0) return [];
    
    // Remove stale events (older than 5 minutes)
    this.eventQueue = this.eventQueue.filter(item => now - item.timestamp < 300000);
    
    let processed = 0;
    while (processed < availableCapacity && this.eventQueue.length > 0) {
      const item = this.eventQueue.shift()!;
      
      if (!this.shouldThrottle(item.priority)) {
        processedEvents.push(item);
        this.state.eventsThisSecond++;
        this.state.eventsThisMinute++;
        
        if (item.priority === 3) {
          this.state.burstUsed++;
        }
        
        processed++;
      } else {
        // Put back in queue if still throttled
        this.eventQueue.unshift(item);
        break;
      }
    }
    
    return processedEvents;
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    if (this.processTimer) {
      clearInterval(this.processTimer);
    }
    
    this.processTimer = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Stop background processing
   */
  private stopProcessing(): void {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
  }

  /**
   * Add event to throttler
   */
  throttle(event: AnalyticsEvent): {
    canProcess: boolean;
    event?: AnalyticsEvent;
    priority: number;
    reason?: string;
  } {
    const startTime = performance.now();
    this.stats.totalEvents++;
    
    const priority = this.getEventPriority(event.type);
    const canProcess = this.processThrottledEvent(event, priority);
    
    const processingTime = performance.now() - startTime;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalEvents - 1) + processingTime) / this.stats.totalEvents;
    
    if (canProcess) {
      this.stats.processedEvents++;
      return {
        canProcess: true,
        event,
        priority
      };
    } else {
      return {
        canProcess: false,
        priority,
        reason: 'throttled'
      };
    }
  }

  /**
   * Get queued events ready for processing
   */
  getQueuedEvents(): Array<{ event: AnalyticsEvent; priority: number }> {
    return this.processQueue();
  }

  /**
   * Get throttling statistics
   */
  getStats(): {
    totalEvents: number;
    processedEvents: number;
    throttledEvents: number;
    droppedEvents: number;
    queuedEvents: number;
    queueSize: number;
    averageProcessingTime: number;
    throughputPerSecond: number;
    throughputPerMinute: number;
    throttleRate: number;
    dropRate: number;
    uptime: number;
  } {
    const uptime = Date.now() - this.stats.lastReset;
    const throughputPerSecond = this.stats.processedEvents / (uptime / 1000);
    const throughputPerMinute = this.stats.processedEvents / (uptime / 60000);
    
    return {
      ...this.stats,
      queueSize: this.eventQueue.length,
      throughputPerSecond,
      throughputPerMinute,
      throttleRate: this.stats.totalEvents > 0 ? this.state.throttledEvents / this.stats.totalEvents : 0,
      dropRate: this.stats.totalEvents > 0 ? this.state.droppedEvents / this.stats.totalEvents : 0,
      uptime
    };
  }

  /**
   * Get current throttle state
   */
  getState(): ThrottleState {
    return { ...this.state };
  }

  /**
   * Update throttling options
   */
  updateOptions(options: Partial<ThrottleOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
    this.stats.queuedEvents = 0;
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      throttledEvents: 0,
      droppedEvents: 0,
      queuedEvents: 0,
      averageProcessingTime: 0,
      lastReset: Date.now()
    };
    
    this.state.throttledEvents = 0;
    this.state.droppedEvents = 0;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    queueUtilization: number;
    processingLatency: number;
    errorRate: number;
    issues: string[];
  } {
    const stats = this.getStats();
    const maxQueueSize = 1000;
    const queueUtilization = this.eventQueue.length / maxQueueSize;
    const errorRate = stats.dropRate;
    const issues: string[] = [];
    
    // Check queue health
    if (queueUtilization > 0.8) {
      issues.push('Queue utilization high');
    }
    
    // Check processing latency
    if (stats.averageProcessingTime > 10) {
      issues.push('Processing latency high');
    }
    
    // Check error rate
    if (errorRate > 0.1) {
      issues.push('High drop rate');
    }
    
    // Check throughput
    if (stats.throughputPerSecond < 1 && stats.totalEvents > 10) {
      issues.push('Low throughput');
    }
    
    return {
      isHealthy: issues.length === 0,
      queueUtilization,
      processingLatency: stats.averageProcessingTime,
      errorRate,
      issues
    };
  }

  /**
   * Force process all queued events (emergency flush)
   */
  forceFlush(): Array<{ event: AnalyticsEvent; priority: number }> {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    this.stats.queuedEvents = 0;
    
    return events.map(item => ({
      event: item.event,
      priority: item.priority
    }));
  }

  /**
   * Cleanup and destroy throttler
   */
  destroy(): void {
    this.stopProcessing();
    this.clearQueue();
    this.resetStats();
  }
}

/**
 * Debounce utility for high-frequency events
 */
export class EventDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private eventCounts: Map<string, number> = new Map();

  /**
   * Debounce event by key
   */
  debounce<T extends AnalyticsEvent>(
    key: string,
    event: T,
    delay: number = ANALYTICS_CONSTANTS.INTERACTION_DEBOUNCE
  ): Promise<T | null> {
    return new Promise((resolve) => {
      // Clear existing timer
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Increment event count
      const count = this.eventCounts.get(key) || 0;
      this.eventCounts.set(key, count + 1);

      // Set new timer
      const timer = setTimeout(() => {
        this.timers.delete(key);
        const finalCount = this.eventCounts.get(key) || 1;
        this.eventCounts.delete(key);

        // Enrich event with debounce metadata
        const enrichedEvent = {
          ...event,
          metadata: {
            ...event.metadata,
            debounceCount: finalCount,
            debounceDelay: delay
          }
        };

        resolve(enrichedEvent);
      }, delay);

      this.timers.set(key, timer);
    });
  }

  /**
   * Clear all debounced events
   */
  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.eventCounts.clear();
  }

  /**
   * Get debounce statistics
   */
  getStats(): {
    activeTimers: number;
    totalEvents: number;
    uniqueKeys: number;
  } {
    const totalEvents = Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0);
    
    return {
      activeTimers: this.timers.size,
      totalEvents,
      uniqueKeys: this.eventCounts.size
    };
  }
}

/**
 * Rate limiter for preventing spam
 */
export class EventRateLimiter {
  private windows: Map<string, number[]> = new Map();
  private readonly windowSize: number;
  private readonly maxEvents: number;

  constructor(windowSize: number = 60000, maxEvents: number = 100) {
    this.windowSize = windowSize;
    this.maxEvents = maxEvents;
  }

  /**
   * Check if event should be rate limited
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const events = this.windows.get(key) || [];
    
    // Remove old events outside window
    const validEvents = events.filter(timestamp => now - timestamp < this.windowSize);
    
    // Check if limit exceeded
    if (validEvents.length >= this.maxEvents) {
      return true;
    }
    
    // Add current event
    validEvents.push(now);
    this.windows.set(key, validEvents);
    
    return false;
  }

  /**
   * Get rate limit status
   */
  getStatus(key: string): {
    eventsInWindow: number;
    remainingCapacity: number;
    resetTime: number;
  } {
    const now = Date.now();
    const events = this.windows.get(key) || [];
    const validEvents = events.filter(timestamp => now - timestamp < this.windowSize);
    
    const oldestEvent = validEvents[0];
    const resetTime = oldestEvent ? oldestEvent + this.windowSize : now;
    
    return {
      eventsInWindow: validEvents.length,
      remainingCapacity: Math.max(0, this.maxEvents - validEvents.length),
      resetTime
    };
  }

  /**
   * Clear rate limit data
   */
  clear(): void {
    this.windows.clear();
  }
}

// Export singleton instances
export const defaultEventThrottler = new EventThrottler();
export const defaultEventDebouncer = new EventDebouncer();
export const defaultRateLimiter = new EventRateLimiter();

// Export utility functions
export const throttleEvent = (event: AnalyticsEvent) => defaultEventThrottler.throttle(event);
export const debounceEvent = <T extends AnalyticsEvent>(key: string, event: T, delay?: number) => 
  defaultEventDebouncer.debounce(key, event, delay);
export const isRateLimited = (key: string) => defaultRateLimiter.isRateLimited(key);

export default EventThrottler;