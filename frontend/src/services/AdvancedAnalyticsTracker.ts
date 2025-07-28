/**
 * Advanced Analytics Tracker
 * 
 * Comprehensive event tracking system with 15+ event types,
 * real-time streaming, event queue, and batch processing
 * 
 * Session 4 - RevivaTech Analytics Implementation
 */

import { 
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsConfig,
  AnalyticsSession,
  AnalyticsTracker,
  EventQueue,
  ProcessingResult,
  StreamingStats,
  HealthStatus,
  BaseAnalyticsEvent,
  PageViewEvent,
  ScrollMilestoneEvent,
  ClickEvent,
  FormInteractEvent,
  ServiceViewEvent,
  BookingEvent,
  SearchEvent,
  PerformanceTimingEvent,
  ErrorBoundaryEvent,
  ExitIntentEvent,
  RageClickEvent,
  CustomEvent,
  PrivacySettings,
  ANALYTICS_CONSTANTS
} from '../types/analytics';

import { browserFingerprintingService, DeviceFingerprint } from './BrowserFingerprinting';
import { EventThrottler, EventDebouncer, EventRateLimiter } from '../utils/eventThrottling';

/**
 * Advanced Analytics Tracker Implementation
 */
export class AdvancedAnalyticsTracker implements AnalyticsTracker {
  private config: AnalyticsConfig;
  private session: AnalyticsSession | null = null;
  private eventQueue: EventQueue;
  private throttler: EventThrottler;
  private debouncer: EventDebouncer;
  private rateLimiter: EventRateLimiter;
  private deviceFingerprint: DeviceFingerprint | null = null;
  private privacySettings: PrivacySettings;
  private streamingStats: StreamingStats;
  private healthStatus: HealthStatus;
  private isInitialized = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private performanceObserver: PerformanceObserver | null = null;

  // Event listeners and observers
  private scrollHandler: ((event: Event) => void) | null = null;
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private formHandlers: Map<string, (event: Event) => void> = new Map();
  private exitIntentHandler: ((event: MouseEvent) => void) | null = null;
  private rageClickTracker: Map<string, { count: number; lastClick: number }> = new Map();
  private scrollMilestones: Set<number> = new Set();
  private pageStartTime = Date.now();
  private lastActivity = Date.now();
  private interactionCount = 0;
  private currentScrollDepth = 0;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      endpoint: 'ws://localhost:3011/analytics',
      debug: false,
      enableConsent: true,
      respectDNT: true,
      sampleRate: 1.0,
      queueOptions: {
        maxSize: ANALYTICS_CONSTANTS.MAX_QUEUE_SIZE,
        flushInterval: ANALYTICS_CONSTANTS.DEFAULT_FLUSH_INTERVAL,
        priority: 'medium'
      },
      batchProcessing: {
        batchSize: ANALYTICS_CONSTANTS.BATCH_SIZE,
        flushInterval: ANALYTICS_CONSTANTS.DEFAULT_FLUSH_INTERVAL,
        maxRetries: ANALYTICS_CONSTANTS.MAX_RETRIES,
        retryDelay: ANALYTICS_CONSTANTS.RETRY_DELAY,
        compression: true,
        priority: 'medium'
      },
      streaming: {
        endpoint: 'ws://localhost:3011/analytics/stream',
        compress: true,
        timeout: 5000,
        retryAttempts: 3,
        bufferSize: 1024,
        flushOnClose: true,
        priority: 'high'
      },
      privacy: {
        maskPII: true,
        hashSensitiveData: true,
        excludeFields: ['password', 'ssn', 'creditCard'],
        anonymizeIPs: true
      },
      performance: {
        trackWebVitals: true,
        trackNavigation: true,
        trackResources: false,
        maxEventSize: ANALYTICS_CONSTANTS.MAX_EVENT_SIZE,
        throttleEvents: true
      },
      filters: {
        excludeEvents: [],
        includeEvents: Object.values(AnalyticsEventType),
        excludeUrls: [],
        includeUrls: []
      },
      ...config
    };

    this.eventQueue = {
      events: [],
      maxSize: this.config.queueOptions.maxSize,
      flushInterval: this.config.queueOptions.flushInterval,
      lastFlush: Date.now(),
      priority: this.config.queueOptions.priority
    };

    this.throttler = new EventThrottler({
      maxEventsPerSecond: 10,
      maxEventsPerMinute: 300,
      burstAllowance: 5,
      throttleStrategy: 'queue'
    });

    this.debouncer = new EventDebouncer();
    this.rateLimiter = new EventRateLimiter();

    this.privacySettings = {
      consentGiven: false,
      consentTimestamp: 0,
      consentVersion: '1.0',
      trackingEnabled: false,
      fingerprintingEnabled: false,
      dataRetentionDays: 365,
      anonymizeData: true,
      respectDNT: true,
      gdprCompliant: true,
      ccpaCompliant: true
    };

    this.streamingStats = {
      eventsSent: 0,
      eventsQueued: 0,
      eventsFailed: 0,
      averageLatency: 0,
      connectionStatus: 'disconnected',
      lastActivity: Date.now(),
      bufferUtilization: 0
    };

    this.healthStatus = {
      isHealthy: false,
      uptime: 0,
      eventsProcessed: 0,
      errorRate: 0,
      averageLatency: 0,
      queueHealth: {
        size: 0,
        utilization: 0,
        oldestEvent: 0
      },
      connectionHealth: {
        status: 'disconnected',
        lastSuccess: 0,
        failureCount: 0
      },
      performanceHealth: {
        cpuUsage: 0,
        memoryUsage: 0,
        processingTime: 0
      }
    };

    this.initialize();
  }

  /**
   * Initialize the analytics tracker
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check consent
      await this.checkConsent();

      // Initialize device fingerprint
      if (this.privacySettings.fingerprintingEnabled) {
        this.deviceFingerprint = await browserFingerprintingService.getDeviceFingerprint();
      }

      // Start session
      await this.startSession();

      // Initialize WebSocket connection
      this.initializeWebSocket();

      // Set up event listeners
      this.setupEventListeners();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Start flush interval
      this.startFlushInterval();

      this.isInitialized = true;
      this.log('Analytics tracker initialized successfully');

    } catch (error) {
      this.log('Failed to initialize analytics tracker:', error);
      this.healthStatus.isHealthy = false;
    }
  }

  /**
   * Check user consent for tracking
   */
  private async checkConsent(): Promise<void> {
    const consent = localStorage.getItem('revivatech-privacy-consent');
    if (consent) {
      try {
        const consentData = JSON.parse(consent);
        this.privacySettings = {
          ...this.privacySettings,
          ...consentData,
          consentGiven: consentData.analytics && consentData.trackingEnabled
        };
      } catch (error) {
        this.log('Failed to parse consent data:', error);
      }
    }

    // Respect Do Not Track
    if (this.config.respectDNT && this.isDNTEnabled()) {
      this.privacySettings.trackingEnabled = false;
    }
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDNTEnabled(): boolean {
    return navigator.doNotTrack === '1' || 
           navigator.doNotTrack === 'yes' || 
           (window as any).doNotTrack === '1';
  }

  /**
   * Initialize WebSocket connection for real-time streaming
   */
  private initializeWebSocket(): void {
    if (!this.privacySettings.trackingEnabled) return;

    try {
      this.websocket = new WebSocket(this.config.streaming.endpoint);
      
      this.websocket.onopen = () => {
        this.streamingStats.connectionStatus = 'connected';
        this.healthStatus.connectionHealth.status = 'connected';
        this.healthStatus.connectionHealth.lastSuccess = Date.now();
        this.reconnectAttempts = 0;
        this.log('WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleWebSocketMessage(response);
        } catch (error) {
          this.log('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        this.streamingStats.connectionStatus = 'disconnected';
        this.healthStatus.connectionHealth.status = 'disconnected';
        this.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        this.streamingStats.connectionStatus = 'disconnected';
        this.healthStatus.connectionHealth.status = 'disconnected';
        this.healthStatus.connectionHealth.failureCount++;
        this.log('WebSocket error:', error);
      };

    } catch (error) {
      this.log('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(response: any): void {
    if (response.type === 'ack') {
      this.streamingStats.eventsSent++;
      this.streamingStats.averageLatency = response.latency || 0;
    } else if (response.type === 'error') {
      this.streamingStats.eventsFailed++;
      this.log('Server error:', response.message);
    }
  }

  /**
   * Schedule WebSocket reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      return;
    }

    this.streamingStats.connectionStatus = 'reconnecting';
    this.healthStatus.connectionHealth.status = 'reconnecting';
    this.reconnectAttempts++;

    setTimeout(() => {
      this.initializeWebSocket();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Scroll tracking
    this.scrollHandler = this.throttleHandler(() => {
      this.handleScrollEvent();
    }, 100);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Click tracking
    this.clickHandler = (event: MouseEvent) => {
      this.handleClickEvent(event);
    };
    document.addEventListener('click', this.clickHandler, true);

    // Exit intent tracking
    this.exitIntentHandler = (event: MouseEvent) => {
      this.handleExitIntent(event);
    };
    document.addEventListener('mouseleave', this.exitIntentHandler);

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageUnload();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.trackPageUnload();
      this.flush();
    });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (!this.config.performance.trackWebVitals) return;

    try {
      // Performance observer for Core Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceEntry(entry);
        }
      });

      // Observe different performance metrics
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

      // Track Core Web Vitals
      this.trackCoreWebVitals();

    } catch (error) {
      this.log('Failed to start performance monitoring:', error);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePerformanceMetric('first-contentful-paint', 'FCP');

    // Largest Contentful Paint (LCP)
    this.observePerformanceMetric('largest-contentful-paint', 'LCP');

    // First Input Delay (FID)
    this.observePerformanceMetric('first-input', 'FID');

    // Cumulative Layout Shift (CLS)
    this.observePerformanceMetric('layout-shift', 'CLS');
  }

  /**
   * Observe performance metric
   */
  private observePerformanceMetric(entryType: string, metricName: string): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance({
            metric: metricName as any,
            value: entry.startTime || (entry as any).value,
            rating: this.getRating(metricName, entry.startTime || (entry as any).value),
            navigationType: 'navigate',
            connectionType: (navigator as any).connection?.type,
            effectiveConnectionType: (navigator as any).connection?.effectiveType
          });
        }
      });

      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      this.log(`Failed to observe ${entryType}:`, error);
    }
  }

  /**
   * Get performance rating
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track performance entry
   */
  private trackPerformanceEntry(entry: PerformanceEntry): void {
    this.trackPerformance({
      metric: entry.name as any,
      value: entry.duration || entry.startTime,
      rating: 'good',
      navigationType: 'navigate'
    });
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.queueOptions.flushInterval);
  }

  /**
   * Throttle handler
   */
  private throttleHandler(fn: Function, delay: number): () => void {
    let lastCall = 0;
    return () => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn();
      }
    };
  }

  /**
   * Handle scroll events
   */
  private handleScrollEvent(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

    this.currentScrollDepth = Math.max(this.currentScrollDepth, scrollPercentage);

    // Track scroll milestones
    ANALYTICS_CONSTANTS.SCROLL_MILESTONES.forEach(milestone => {
      if (scrollPercentage >= milestone && !this.scrollMilestones.has(milestone)) {
        this.scrollMilestones.add(milestone);
        this.trackScroll(milestone, scrollTop);
      }
    });
  }

  /**
   * Handle click events
   */
  private handleClickEvent(event: MouseEvent): void {
    this.interactionCount++;
    this.lastActivity = Date.now();

    const target = event.target as HTMLElement;
    if (!target) return;

    // Check for rage clicks
    const elementKey = this.getElementKey(target);
    const rageClick = this.rageClickTracker.get(elementKey);
    const now = Date.now();

    if (rageClick && now - rageClick.lastClick < ANALYTICS_CONSTANTS.RAGE_CLICK_TIMESPAN) {
      rageClick.count++;
      rageClick.lastClick = now;

      if (rageClick.count >= ANALYTICS_CONSTANTS.RAGE_CLICK_THRESHOLD) {
        this.trackRageClick(target, event, rageClick.count);
        this.rageClickTracker.delete(elementKey);
      }
    } else {
      this.rageClickTracker.set(elementKey, { count: 1, lastClick: now });
    }

    // Clean up old rage click entries
    this.cleanupRageClickTracker();

    // Track regular click
    this.trackClick(target, event);
  }

  /**
   * Handle exit intent
   */
  private handleExitIntent(event: MouseEvent): void {
    if (event.clientY <= ANALYTICS_CONSTANTS.EXIT_INTENT_THRESHOLD) {
      this.trackExitIntent();
    }
  }

  /**
   * Get element key for tracking
   */
  private getElementKey(element: HTMLElement): string {
    return `${element.tagName}:${element.id || ''}:${element.className || ''}`;
  }

  /**
   * Clean up rage click tracker
   */
  private cleanupRageClickTracker(): void {
    const now = Date.now();
    this.rageClickTracker.forEach((value, key) => {
      if (now - value.lastClick > ANALYTICS_CONSTANTS.RAGE_CLICK_TIMESPAN * 2) {
        this.rageClickTracker.delete(key);
      }
    });
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create base event
   */
  private createBaseEvent(type: AnalyticsEventType): BaseAnalyticsEvent {
    return {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      sessionId: this.session?.sessionId || '',
      userId: this.session?.userId,
      deviceFingerprint: this.deviceFingerprint || undefined,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      },
      metadata: {}
    };
  }

  /**
   * Process and queue event
   */
  private async processEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.privacySettings.trackingEnabled) return;

    // Apply filters
    if (this.config.filters.excludeEvents.includes(event.type)) return;
    if (this.config.filters.includeEvents.length > 0 && !this.config.filters.includeEvents.includes(event.type)) return;

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return;

    // Throttle event
    const throttleResult = this.throttler.throttle(event);
    if (!throttleResult.canProcess) {
      this.streamingStats.eventsQueued++;
      return;
    }

    // Add to queue
    this.eventQueue.events.push(event);
    this.streamingStats.eventsQueued++;

    // Check if immediate flush is needed
    if (this.eventQueue.events.length >= this.config.batchProcessing.batchSize) {
      await this.flush();
    }

    // Send high-priority events immediately
    if (throttleResult.priority === 3) {
      await this.sendEvent(event);
    }
  }

  /**
   * Send event via WebSocket
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const startTime = performance.now();
      
      // Sanitize event data
      const sanitizedEvent = this.sanitizeEvent(event);
      
      // Send to WebSocket
      this.websocket.send(JSON.stringify({
        type: 'event',
        data: sanitizedEvent,
        timestamp: Date.now()
      }));

      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

    } catch (error) {
      this.log('Failed to send event:', error);
      this.streamingStats.eventsFailed++;
    }
  }

  /**
   * Sanitize event data for privacy
   */
  private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    const sanitized = { ...event };

    if (this.config.privacy.maskPII) {
      // Remove PII fields
      this.config.privacy.excludeFields.forEach(field => {
        if (sanitized.metadata?.[field]) {
          delete sanitized.metadata[field];
        }
      });
    }

    if (this.config.privacy.anonymizeIPs) {
      // Anonymize IP addresses if present
      if (sanitized.metadata?.ip) {
        sanitized.metadata.ip = this.anonymizeIP(sanitized.metadata.ip);
      }
    }

    return sanitized;
  }

  /**
   * Anonymize IP address
   */
  private anonymizeIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return ip;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.healthStatus.eventsProcessed++;
    this.healthStatus.averageLatency = 
      (this.healthStatus.averageLatency * (this.healthStatus.eventsProcessed - 1) + processingTime) / 
      this.healthStatus.eventsProcessed;

    this.healthStatus.performanceHealth.processingTime = processingTime;
    this.healthStatus.isHealthy = processingTime < ANALYTICS_CONSTANTS.PERFORMANCE_OVERHEAD_LIMIT;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[AdvancedAnalyticsTracker] ${message}`, ...args);
    }
  }

  // Public API methods

  /**
   * Track generic event
   */
  async track(event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    const fullEvent = {
      ...this.createBaseEvent(event.type),
      ...event
    } as AnalyticsEvent;

    await this.processEvent(fullEvent);
  }

  /**
   * Track page view
   */
  async trackPageView(data: PageViewEvent['data']): Promise<void> {
    const event: PageViewEvent = {
      ...this.createBaseEvent(AnalyticsEventType.PAGE_VIEW),
      data
    };

    await this.processEvent(event);
  }

  /**
   * Track click
   */
  async trackClick(element: HTMLElement, mouseEvent: MouseEvent): Promise<void> {
    const event: ClickEvent = {
      ...this.createBaseEvent(AnalyticsEventType.CLICK_EVENT),
      data: {
        elementType: element.tagName.toLowerCase(),
        elementId: element.id || undefined,
        elementClass: element.className || undefined,
        elementText: element.textContent?.substring(0, 100) || undefined,
        elementHref: (element as HTMLAnchorElement).href || undefined,
        coordinates: {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        },
        pageCoordinates: {
          x: mouseEvent.pageX,
          y: mouseEvent.pageY
        },
        isRightClick: mouseEvent.button === 2,
        modifierKeys: {
          ctrl: mouseEvent.ctrlKey,
          alt: mouseEvent.altKey,
          shift: mouseEvent.shiftKey,
          meta: mouseEvent.metaKey
        }
      }
    };

    await this.processEvent(event);
  }

  /**
   * Track scroll
   */
  async trackScroll(percentage: number, depth: number): Promise<void> {
    const event: ScrollMilestoneEvent = {
      ...this.createBaseEvent(AnalyticsEventType.SCROLL_MILESTONE),
      data: {
        percentage,
        depth,
        timeToScroll: Date.now() - this.pageStartTime,
        scrollDirection: 'down',
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      }
    };

    await this.processEvent(event);
  }

  /**
   * Track form interaction
   */
  async trackForm(formData: FormInteractEvent['data']): Promise<void> {
    const event: FormInteractEvent = {
      ...this.createBaseEvent(AnalyticsEventType.FORM_INTERACT),
      data: formData
    };

    await this.processEvent(event);
  }

  /**
   * Track service view
   */
  async trackService(serviceData: ServiceViewEvent['data']): Promise<void> {
    const event: ServiceViewEvent = {
      ...this.createBaseEvent(AnalyticsEventType.SERVICE_VIEW),
      data: serviceData
    };

    await this.processEvent(event);
  }

  /**
   * Track booking
   */
  async trackBooking(bookingData: BookingEvent['data']): Promise<void> {
    const event: BookingEvent = {
      ...this.createBaseEvent(AnalyticsEventType.BOOKING_START),
      data: bookingData
    };

    await this.processEvent(event);
  }

  /**
   * Track search
   */
  async trackSearch(searchData: SearchEvent['data']): Promise<void> {
    const event: SearchEvent = {
      ...this.createBaseEvent(AnalyticsEventType.SEARCH_PERFORM),
      data: searchData
    };

    await this.processEvent(event);
  }

  /**
   * Track performance
   */
  async trackPerformance(performanceData: PerformanceTimingEvent['data']): Promise<void> {
    const event: PerformanceTimingEvent = {
      ...this.createBaseEvent(AnalyticsEventType.PERFORMANCE_TIMING),
      data: performanceData
    };

    await this.processEvent(event);
  }

  /**
   * Track error
   */
  async trackError(errorData: ErrorBoundaryEvent['data']): Promise<void> {
    const event: ErrorBoundaryEvent = {
      ...this.createBaseEvent(AnalyticsEventType.ERROR_BOUNDARY),
      data: errorData
    };

    await this.processEvent(event);
  }

  /**
   * Track exit intent
   */
  async trackExitIntent(): Promise<void> {
    const event: ExitIntentEvent = {
      ...this.createBaseEvent(AnalyticsEventType.EXIT_INTENT),
      data: {
        timeOnPage: Date.now() - this.pageStartTime,
        scrollDepth: this.currentScrollDepth,
        interactionCount: this.interactionCount,
        exitMethod: 'mouse_leave',
        sessionDuration: this.session ? Date.now() - this.session.startTime : 0
      }
    };

    await this.processEvent(event);
  }

  /**
   * Track rage click
   */
  async trackRageClick(element: HTMLElement, mouseEvent: MouseEvent, clickCount: number): Promise<void> {
    const event: RageClickEvent = {
      ...this.createBaseEvent(AnalyticsEventType.RAGE_CLICK),
      data: {
        elementType: element.tagName.toLowerCase(),
        elementId: element.id || undefined,
        elementClass: element.className || undefined,
        clickCount,
        timeSpan: ANALYTICS_CONSTANTS.RAGE_CLICK_TIMESPAN,
        coordinates: {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        },
        possibleIssue: 'unresponsive_element'
      }
    };

    await this.processEvent(event);
  }

  /**
   * Track page unload
   */
  async trackPageUnload(): Promise<void> {
    const event = {
      ...this.createBaseEvent(AnalyticsEventType.PAGE_UNLOAD),
      data: {
        timeOnPage: Date.now() - this.pageStartTime,
        scrollDepth: this.currentScrollDepth,
        interactionCount: this.interactionCount
      }
    };

    await this.processEvent(event);
  }

  /**
   * Track custom event
   */
  async trackCustom(eventName: string, data: any): Promise<void> {
    const event: CustomEvent = {
      ...this.createBaseEvent(AnalyticsEventType.CUSTOM_EVENT),
      data: {
        eventName,
        customData: data
      }
    };

    await this.processEvent(event);
  }

  /**
   * Flush event queue
   */
  async flush(): Promise<void> {
    if (this.eventQueue.events.length === 0) return;

    const eventsToSend = this.eventQueue.events.splice(0, this.config.batchProcessing.batchSize);
    this.eventQueue.lastFlush = Date.now();

    for (const event of eventsToSend) {
      await this.sendEvent(event);
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.eventQueue.events.length;
  }

  /**
   * Get streaming statistics
   */
  getStats(): StreamingStats {
    return { ...this.streamingStats };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Start session
   */
  async startSession(): Promise<AnalyticsSession> {
    this.session = {
      sessionId: this.generateEventId(),
      userId: undefined,
      deviceFingerprint: this.deviceFingerprint || undefined,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      eventCount: 0,
      referrer: document.referrer,
      isNewSession: true,
      sessionDuration: 0
    };

    this.pageStartTime = Date.now();
    this.scrollMilestones.clear();
    this.interactionCount = 0;
    this.currentScrollDepth = 0;

    return this.session;
  }

  /**
   * End session
   */
  async endSession(): Promise<void> {
    if (this.session) {
      this.session.sessionDuration = Date.now() - this.session.startTime;
      await this.flush();
    }
  }

  /**
   * Get current session
   */
  getSession(): AnalyticsSession | null {
    return this.session ? { ...this.session } : null;
  }

  /**
   * Update consent
   */
  updateConsent(consent: boolean): void {
    this.privacySettings.consentGiven = consent;
    this.privacySettings.trackingEnabled = consent;
    this.privacySettings.consentTimestamp = Date.now();

    if (consent && !this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * Clear data
   */
  clearData(): void {
    this.eventQueue.events = [];
    this.streamingStats.eventsQueued = 0;
    this.rageClickTracker.clear();
    this.scrollMilestones.clear();
    
    // Clear storage
    localStorage.removeItem('revivatech-analytics-session');
    localStorage.removeItem('revivatech-analytics-stats');
  }

  /**
   * Check if tracker is healthy
   */
  isHealthy(): boolean {
    return this.healthStatus.isHealthy;
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    // Update queue health
    this.healthStatus.queueHealth = {
      size: this.eventQueue.events.length,
      utilization: this.eventQueue.events.length / this.eventQueue.maxSize,
      oldestEvent: this.eventQueue.events.length > 0 ? 
        Date.now() - this.eventQueue.events[0].timestamp : 0
    };

    // Update uptime
    this.healthStatus.uptime = Date.now() - this.streamingStats.lastActivity;

    return { ...this.healthStatus };
  }

  /**
   * Destroy tracker
   */
  destroy(): void {
    // Clear intervals
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Remove event listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.exitIntentHandler) {
      document.removeEventListener('mouseleave', this.exitIntentHandler);
    }

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
    }

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Clear data
    this.clearData();

    // Destroy throttler
    this.throttler.destroy();
    this.debouncer.clear();
    this.rateLimiter.clear();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const advancedAnalyticsTracker = new AdvancedAnalyticsTracker();

export default advancedAnalyticsTracker;