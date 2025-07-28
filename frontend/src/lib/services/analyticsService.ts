/**
 * Comprehensive Analytics Tracking Service
 * Tracks user behavior, business metrics, and conversion data
 */

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  event: string;
  category: 'user' | 'business' | 'system' | 'error';
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  metadata: {
    url: string;
    referrer: string;
    userAgent: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    screenResolution: string;
    timezone: string;
    language: string;
  };
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  source: string;
  medium: string;
  campaign?: string;
  exitPage?: string;
  bounced: boolean;
  converted: boolean;
  conversionValue?: number;
}

export interface BusinessMetrics {
  revenue: {
    total: number;
    period: string;
    growth: number;
    transactions: number;
    averageOrderValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churnRate: number;
    lifetimeValue: number;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    conversionRate: number;
    averageValue: number;
  };
  performance: {
    pageViews: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
    pagesPerSession: number;
  };
}

export interface ConversionFunnel {
  stages: Array<{
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
    dropoffRate: number;
    averageTime: number;
  }>;
  totalConversions: number;
  overallConversionRate: number;
  bottlenecks: string[];
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSession: UserSession | null = null;
  private config: {
    enabled: boolean;
    sampleRate: number;
    batchSize: number;
    flushInterval: number;
    persistEvents: boolean;
  };

  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
      sampleRate: parseFloat(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE || '1.0'),
      batchSize: parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE || '50'),
      flushInterval: parseInt(process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL || '30000'),
      persistEvents: process.env.NEXT_PUBLIC_ANALYTICS_PERSIST !== 'false'
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    // Start session tracking
    this.startSession();

    // Track page views
    this.trackPageView();

    // Set up periodic flushing
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.flush();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', 'user', 'visibility');
      } else {
        this.track('page_visible', 'user', 'visibility');
      }
    });

    // Load persisted events
    if (this.config.persistEvents) {
      this.loadPersistedEvents();
    }
  }

  private startSession(): void {
    const sessionId = this.generateSessionId();
    const urlParams = new URLSearchParams(window.location.search);
    
    this.currentSession = {
      id: sessionId,
      userId: this.getCurrentUserId(),
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      source: urlParams.get('utm_source') || document.referrer || 'direct',
      medium: urlParams.get('utm_medium') || 'organic',
      campaign: urlParams.get('utm_campaign') || undefined,
      bounced: true, // Will be set to false if user interacts
      converted: false
    };

    this.sessions.set(sessionId, this.currentSession);
    this.track('session_start', 'user', 'session');
  }

  private endSession(): void {
    if (!this.currentSession) return;

    const endTime = Date.now();
    this.currentSession.endTime = endTime;
    this.currentSession.duration = endTime - this.currentSession.startTime;
    this.currentSession.exitPage = window.location.pathname;

    this.track('session_end', 'user', 'session', undefined, {
      duration: this.currentSession.duration,
      pageViews: this.currentSession.pageViews,
      events: this.currentSession.events
    });
  }

  /**
   * Track a custom event
   */
  track(
    event: string,
    category: AnalyticsEvent['category'],
    action: string,
    label?: string,
    properties: Record<string, any> = {},
    value?: number
  ): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'unknown',
      userId: this.getCurrentUserId(),
      event,
      category,
      action,
      label,
      value,
      properties,
      metadata: this.getEventMetadata()
    };

    this.events.push(analyticsEvent);

    // Update session
    if (this.currentSession) {
      this.currentSession.events++;
      this.currentSession.bounced = false; // User interacted
    }

    // Persist if enabled
    if (this.config.persistEvents) {
      this.persistEvent(analyticsEvent);
    }

    // Flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(page?: string): void {
    const pagePath = page || window.location.pathname;
    
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }

    this.track('page_view', 'user', 'navigation', pagePath, {
      path: pagePath,
      title: document.title,
      referrer: document.referrer,
      search: window.location.search
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(element: string, action: string, properties: Record<string, any> = {}): void {
    this.track('user_interaction', 'user', action, element, {
      element,
      ...properties
    });
  }

  /**
   * Track business event
   */
  trackBusiness(event: string, action: string, value?: number, properties: Record<string, any> = {}): void {
    this.track(event, 'business', action, undefined, properties, value);
  }

  /**
   * Track conversion
   */
  trackConversion(type: string, value?: number, properties: Record<string, any> = {}): void {
    if (this.currentSession) {
      this.currentSession.converted = true;
      this.currentSession.conversionValue = value;
    }

    this.track('conversion', 'business', type, undefined, properties, value);
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', 'error', 'javascript_error', error.message, {
      stack: error.stack,
      name: error.name,
      context
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, properties: Record<string, any> = {}): void {
    this.track('performance', 'system', metric, undefined, properties, value);
  }

  /**
   * Get current analytics data
   */
  getAnalyticsData(): {
    events: AnalyticsEvent[];
    sessions: UserSession[];
    metrics: BusinessMetrics;
  } {
    return {
      events: [...this.events],
      sessions: Array.from(this.sessions.values()),
      metrics: this.calculateBusinessMetrics()
    };
  }

  /**
   * Calculate business metrics
   */
  private calculateBusinessMetrics(): BusinessMetrics {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo);
    const recentSessions = Array.from(this.sessions.values()).filter(s => s.startTime > oneDayAgo);
    
    // Revenue metrics
    const conversionEvents = recentEvents.filter(e => e.event === 'conversion');
    const totalRevenue = conversionEvents.reduce((sum, e) => sum + (e.value || 0), 0);
    
    // Customer metrics
    const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const returningUsers = recentSessions.filter(s => s.userId && this.isReturningUser(s.userId)).length;
    
    // Booking metrics
    const bookingEvents = recentEvents.filter(e => e.event === 'booking_created');
    const completedBookings = recentEvents.filter(e => e.event === 'booking_completed');
    
    // Performance metrics
    const pageViews = recentEvents.filter(e => e.event === 'page_view').length;
    const bouncedSessions = recentSessions.filter(s => s.bounced).length;
    const avgSessionDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length;

    return {
      revenue: {
        total: totalRevenue,
        period: '24h',
        growth: this.calculateGrowth(totalRevenue, 'revenue'),
        transactions: conversionEvents.length,
        averageOrderValue: totalRevenue / Math.max(conversionEvents.length, 1)
      },
      customers: {
        total: uniqueUsers,
        new: uniqueUsers - returningUsers,
        returning: returningUsers,
        churnRate: this.calculateChurnRate(),
        lifetimeValue: this.calculateLifetimeValue()
      },
      bookings: {
        total: bookingEvents.length,
        completed: completedBookings.length,
        cancelled: bookingEvents.length - completedBookings.length,
        conversionRate: (completedBookings.length / Math.max(bookingEvents.length, 1)) * 100,
        averageValue: totalRevenue / Math.max(completedBookings.length, 1)
      },
      performance: {
        pageViews,
        sessions: recentSessions.length,
        bounceRate: (bouncedSessions.length / Math.max(recentSessions.length, 1)) * 100,
        avgSessionDuration: avgSessionDuration || 0,
        pagesPerSession: pageViews / Math.max(recentSessions.length, 1)
      }
    };
  }

  /**
   * Get conversion funnel data
   */
  getConversionFunnel(): ConversionFunnel {
    const funnelStages = [
      { name: 'Landing Page', event: 'page_view' },
      { name: 'Service Selection', event: 'service_selected' },
      { name: 'Booking Form', event: 'booking_started' },
      { name: 'Form Completion', event: 'booking_submitted' },
      { name: 'Payment', event: 'payment_started' },
      { name: 'Conversion', event: 'conversion' }
    ];

    const stages = funnelStages.map((stage, index) => {
      const stageEvents = this.events.filter(e => e.event === stage.event);
      const users = new Set(stageEvents.map(e => e.sessionId)).size;
      const conversions = index < funnelStages.length - 1 ? 
        this.getUsersWhoProgressed(stage.event, funnelStages[index + 1].event) : 
        users;
      
      return {
        name: stage.name,
        users,
        conversions,
        conversionRate: (conversions / Math.max(users, 1)) * 100,
        dropoffRate: ((users - conversions) / Math.max(users, 1)) * 100,
        averageTime: this.getAverageTimeInStage(stage.event)
      };
    });

    const totalConversions = stages[stages.length - 1].users;
    const overallConversionRate = (totalConversions / Math.max(stages[0].users, 1)) * 100;
    const bottlenecks = this.identifyBottlenecks(stages);

    return {
      stages,
      totalConversions,
      overallConversionRate,
      bottlenecks
    };
  }

  /**
   * Flush events to storage/API
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Send to analytics endpoint
      if (typeof window !== 'undefined') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: eventsToFlush,
            session: this.currentSession
          })
        });
      }

      // Remove from local storage
      if (this.config.persistEvents) {
        localStorage.removeItem('analytics_events');
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Put events back for retry
      this.events.unshift(...eventsToFlush);
    }
  }

  // Helper methods
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getCurrentUserId(): string | undefined {
    // Get from local storage or authentication context
    return localStorage.getItem('userId') || undefined;
  }

  private getEventMetadata(): AnalyticsEvent['metadata'] {
    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private persistEvent(event: AnalyticsEvent): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to persist analytics event:', error);
    }
  }

  private loadPersistedEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        const events = JSON.parse(stored);
        this.events.push(...events);
      }
    } catch (error) {
      console.error('Failed to load persisted analytics events:', error);
    }
  }

  private isReturningUser(userId: string): boolean {
    // Check if user has previous sessions
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    return userSessions.length > 1;
  }

  private calculateGrowth(current: number, metric: string): number {
    // Would compare with previous period in real implementation
    return Math.random() * 20 - 10; // Mock growth rate
  }

  private calculateChurnRate(): number {
    // Would calculate based on user retention data
    return Math.random() * 10; // Mock churn rate
  }

  private calculateLifetimeValue(): number {
    // Would calculate based on historical user data
    return Math.random() * 1000 + 500; // Mock LTV
  }

  private getUsersWhoProgressed(fromEvent: string, toEvent: string): number {
    const fromUsers = new Set(this.events.filter(e => e.event === fromEvent).map(e => e.sessionId));
    const toUsers = new Set(this.events.filter(e => e.event === toEvent).map(e => e.sessionId));
    
    return Array.from(fromUsers).filter(userId => toUsers.has(userId)).length;
  }

  private getAverageTimeInStage(event: string): number {
    // Would calculate based on time between events
    return Math.random() * 300000; // Mock average time in ms
  }

  private identifyBottlenecks(stages: ConversionFunnel['stages']): string[] {
    return stages
      .filter(stage => stage.dropoffRate > 50)
      .map(stage => stage.name);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// React hook for analytics
export function useAnalytics() {
  return {
    track: analyticsService.track.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackInteraction: analyticsService.trackInteraction.bind(analyticsService),
    trackBusiness: analyticsService.trackBusiness.bind(analyticsService),
    trackConversion: analyticsService.trackConversion.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    getAnalyticsData: analyticsService.getAnalyticsData.bind(analyticsService),
    getConversionFunnel: analyticsService.getConversionFunnel.bind(analyticsService)
  };
}