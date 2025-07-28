/**
 * Behavioral Event Tracking System
 * Comprehensive user interaction tracking for customer intelligence
 * Part of Phase 8 R1.1 implementation - 15+ behavioral events
 */

import { CustomerFingerprintingService, type FingerprintData } from './fingerprinting';

interface BehavioralEvent {
  id: string;
  user_fingerprint: string;
  session_id: string;
  user_id?: string;
  event_type: string;
  event_name: string;
  event_data: Record<string, any>;
  page_url: string;
  referrer_url: string;
  timestamp: number;
  
  // UTM tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Device context
  device_type: string;
  browser: string;
  os: string;
  screen_resolution: string;
  viewport_size: string;
  
  // Interaction context
  element_id?: string;
  element_class?: string;
  element_text?: string;
  element_position?: { x: number; y: number };
  scroll_position?: { x: number; y: number };
  
  // Performance data
  page_load_time?: number;
  time_on_page?: number;
  time_since_last_event?: number;
}

interface EventConfig {
  enableScrollTracking: boolean;
  enableClickHeatmaps: boolean;
  enableFormTracking: boolean;
  enableExitIntent: boolean;
  enableRageClicks: boolean;
  enablePerformanceTracking: boolean;
  batchSize: number;
  flushInterval: number;
  apiEndpoint: string;
  debugMode: boolean;
}

interface ScrollMetrics {
  maxDepthPercent: number;
  averageScrollSpeed: number;
  scrollDirection: 'up' | 'down' | 'idle';
  milestones: number[]; // 25%, 50%, 75%, 100%
  timeToMilestones: { [key: number]: number };
}

interface FormInteraction {
  formId: string;
  fieldName: string;
  fieldType: string;
  action: 'focus' | 'blur' | 'change' | 'submit' | 'abandon';
  value?: string;
  timeSpent: number;
  errors?: string[];
}

class BehavioralTrackingService {
  private config: EventConfig;
  private fingerprintingService: CustomerFingerprintingService;
  private eventQueue: BehavioralEvent[] = [];
  private pageStartTime: number;
  private lastEventTime: number;
  private isTracking: boolean = false;
  private flushTimer?: NodeJS.Timeout;
  
  // Tracking state
  private scrollMetrics: ScrollMetrics;
  private clickSequence: Array<{ timestamp: number; x: number; y: number; element: string }> = [];
  private formInteractions: Map<string, FormInteraction[]> = new Map();
  private performance: PerformanceEntry[] = [];
  
  // Event listeners
  private listeners: { [key: string]: EventListener } = {};

  constructor(fingerprintingService: CustomerFingerprintingService, config: Partial<EventConfig> = {}) {
    this.fingerprintingService = fingerprintingService;
    this.config = {
      enableScrollTracking: true,
      enableClickHeatmaps: true,
      enableFormTracking: true,
      enableExitIntent: true,
      enableRageClicks: true,
      enablePerformanceTracking: true,
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      apiEndpoint: '/api/analytics/events',
      debugMode: false,
      ...config
    };

    this.pageStartTime = Date.now();
    this.lastEventTime = Date.now();
    
    this.scrollMetrics = {
      maxDepthPercent: 0,
      averageScrollSpeed: 0,
      scrollDirection: 'idle',
      milestones: [25, 50, 75, 100],
      timeToMilestones: {}
    };

    this.setupEventListeners();
  }

  /**
   * Start behavioral tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) return;

    // Get fingerprint first
    await this.fingerprintingService.getFingerprint();
    
    this.isTracking = true;
    this.attachEventListeners();
    this.startFlushTimer();
    
    // Track page view
    await this.trackEvent('page_view', 'Page View', {
      page_title: document.title,
      page_load_time: this.getPageLoadTime(),
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });

    if (this.config.debugMode) {
      console.log('Behavioral tracking started');
    }
  }

  /**
   * Stop behavioral tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.detachEventListeners();
    this.stopFlushTimer();
    this.flushEvents(); // Send remaining events
    
    if (this.config.debugMode) {
      console.log('Behavioral tracking stopped');
    }
  }

  /**
   * Track a custom event
   */
  async trackEvent(eventType: string, eventName: string, eventData: Record<string, any> = {}): Promise<void> {
    if (!this.isTracking) return;

    const fingerprint = await this.fingerprintingService.getFingerprint();
    const now = Date.now();
    
    const event: BehavioralEvent = {
      id: this.generateEventId(),
      user_fingerprint: fingerprint.deviceId,
      session_id: fingerprint.sessionId,
      event_type: eventType,
      event_name: eventName,
      event_data: eventData,
      page_url: window.location.href,
      referrer_url: document.referrer,
      timestamp: now,
      device_type: fingerprint.characteristics.device.type,
      browser: fingerprint.characteristics.browser.name,
      os: fingerprint.characteristics.navigator.platform,
      screen_resolution: `${fingerprint.characteristics.screen.width}x${fingerprint.characteristics.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      time_on_page: now - this.pageStartTime,
      time_since_last_event: now - this.lastEventTime,
      ...this.getUTMParameters()
    };

    this.eventQueue.push(event);
    this.lastEventTime = now;

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flushEvents();
    }

    if (this.config.debugMode) {
      console.log('Event tracked:', event);
    }
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Page lifecycle events
    this.listeners.beforeunload = this.handleBeforeUnload.bind(this);
    this.listeners.visibilitychange = this.handleVisibilityChange.bind(this);
    
    // Scroll tracking
    if (this.config.enableScrollTracking) {
      this.listeners.scroll = this.throttle(this.handleScroll.bind(this), 100);
    }
    
    // Click tracking and heatmaps
    if (this.config.enableClickHeatmaps) {
      this.listeners.click = this.handleClick.bind(this);
      this.listeners.mousedown = this.handleMouseDown.bind(this);
    }
    
    // Form tracking
    if (this.config.enableFormTracking) {
      this.listeners.focus = this.handleFormFocus.bind(this);
      this.listeners.blur = this.handleFormBlur.bind(this);
      this.listeners.change = this.handleFormChange.bind(this);
      this.listeners.submit = this.handleFormSubmit.bind(this);
    }
    
    // Exit intent detection
    if (this.config.enableExitIntent) {
      this.listeners.mouseleave = this.handleMouseLeave.bind(this);
    }
    
    // Performance tracking
    if (this.config.enablePerformanceTracking) {
      this.listeners.load = this.handlePageLoad.bind(this);
    }
  }

  /**
   * Attach event listeners to DOM
   */
  private attachEventListeners(): void {
    Object.entries(this.listeners).forEach(([event, handler]) => {
      if (event === 'focus' || event === 'blur' || event === 'change') {
        document.addEventListener(event, handler, true); // Use capture for form events
      } else if (event === 'submit') {
        document.addEventListener(event, handler, true);
      } else {
        window.addEventListener(event, handler);
      }
    });
  }

  /**
   * Detach event listeners from DOM
   */
  private detachEventListeners(): void {
    Object.entries(this.listeners).forEach(([event, handler]) => {
      if (event === 'focus' || event === 'blur' || event === 'change' || event === 'submit') {
        document.removeEventListener(event, handler, true);
      } else {
        window.removeEventListener(event, handler);
      }
    });
  }

  /**
   * Handle page scroll events
   */
  private async handleScroll(): Promise<void> {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
    
    // Update scroll metrics
    if (scrollPercent > this.scrollMetrics.maxDepthPercent) {
      this.scrollMetrics.maxDepthPercent = Math.min(scrollPercent, 100);
    }
    
    // Track milestone achievements
    this.scrollMetrics.milestones.forEach(milestone => {
      if (scrollPercent >= milestone && !this.scrollMetrics.timeToMilestones[milestone]) {
        this.scrollMetrics.timeToMilestones[milestone] = Date.now() - this.pageStartTime;
        
        this.trackEvent('scroll_milestone', 'Scroll Milestone Reached', {
          milestone_percent: milestone,
          time_to_milestone: this.scrollMetrics.timeToMilestones[milestone],
          current_scroll_percent: scrollPercent
        });
      }
    });
    
    // Track significant scroll depths
    if ([25, 50, 75, 100].includes(scrollPercent)) {
      this.trackEvent('scroll_depth', 'Scroll Depth', {
        depth_percent: scrollPercent,
        max_depth: this.scrollMetrics.maxDepthPercent,
        scroll_position: { x: window.pageXOffset, y: scrollTop }
      });
    }
  }

  /**
   * Handle click events and rage click detection
   */
  private async handleClick(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement;
    const clickData = {
      x: event.clientX,
      y: event.clientY,
      element: this.getElementSelector(target),
      timestamp: Date.now()
    };
    
    this.clickSequence.push(clickData);
    
    // Rage click detection (3+ clicks in same area within 2 seconds)
    if (this.config.enableRageClicks) {
      const recentClicks = this.clickSequence.filter(
        click => Date.now() - click.timestamp < 2000
      );
      
      const sameAreaClicks = recentClicks.filter(
        click => Math.abs(click.x - clickData.x) < 50 && Math.abs(click.y - clickData.y) < 50
      );
      
      if (sameAreaClicks.length >= 3) {
        await this.trackEvent('rage_click', 'Rage Click Detected', {
          click_count: sameAreaClicks.length,
          element: clickData.element,
          position: { x: clickData.x, y: clickData.y },
          time_span: recentClicks[recentClicks.length - 1].timestamp - recentClicks[0].timestamp
        });
      }
    }
    
    // Track regular click
    await this.trackEvent('click', 'Element Click', {
      element_selector: this.getElementSelector(target),
      element_text: target.textContent?.substring(0, 100) || '',
      element_tag: target.tagName.toLowerCase(),
      click_position: { x: event.clientX, y: event.clientY },
      element_position: this.getElementPosition(target),
      is_link: target.tagName.toLowerCase() === 'a',
      href: target.tagName.toLowerCase() === 'a' ? (target as HTMLAnchorElement).href : undefined
    });
    
    // Clean old clicks (keep last 10)
    if (this.clickSequence.length > 10) {
      this.clickSequence = this.clickSequence.slice(-10);
    }
  }

  /**
   * Handle mouse down for click depth tracking
   */
  private handleMouseDown(event: MouseEvent): void {
    // Track click pressure if available
    const pressure = (event as any).pressure || 0;
    if (pressure > 0) {
      this.trackEvent('click_pressure', 'Click Pressure', {
        pressure: pressure,
        position: { x: event.clientX, y: event.clientY }
      });
    }
  }

  /**
   * Handle form field focus
   */
  private handleFormFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    if (!this.isFormField(target)) return;

    const formId = this.getFormId(target);
    const interaction: FormInteraction = {
      formId,
      fieldName: target.name || target.id || 'unnamed',
      fieldType: target.type || 'unknown',
      action: 'focus',
      timeSpent: 0
    };

    if (!this.formInteractions.has(formId)) {
      this.formInteractions.set(formId, []);
    }
    this.formInteractions.get(formId)!.push(interaction);

    this.trackEvent('form_field_focus', 'Form Field Focus', {
      form_id: formId,
      field_name: interaction.fieldName,
      field_type: interaction.fieldType,
      field_value_length: target.value?.length || 0
    });
  }

  /**
   * Handle form field blur
   */
  private handleFormBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    if (!this.isFormField(target)) return;

    const formId = this.getFormId(target);
    const interactions = this.formInteractions.get(formId) || [];
    const lastInteraction = interactions[interactions.length - 1];
    
    if (lastInteraction && lastInteraction.action === 'focus') {
      lastInteraction.timeSpent = Date.now() - this.lastEventTime;
      lastInteraction.action = 'blur';
    }

    this.trackEvent('form_field_blur', 'Form Field Blur', {
      form_id: formId,
      field_name: target.name || target.id || 'unnamed',
      field_type: target.type || 'unknown',
      field_value_length: target.value?.length || 0,
      time_spent: lastInteraction?.timeSpent || 0,
      has_value: !!target.value
    });
  }

  /**
   * Handle form field changes
   */
  private handleFormChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!this.isFormField(target)) return;

    this.trackEvent('form_field_change', 'Form Field Change', {
      form_id: this.getFormId(target),
      field_name: target.name || target.id || 'unnamed',
      field_type: target.type || 'unknown',
      field_value_length: target.value?.length || 0,
      change_type: this.getChangeType(target)
    });
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    const formId = form.id || form.name || 'unnamed';
    const formData = new FormData(form);
    const fields: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      fields[key] = value.toString().length; // Store only length for privacy
    });

    this.trackEvent('form_submit', 'Form Submit', {
      form_id: formId,
      form_action: form.action,
      form_method: form.method,
      field_count: Object.keys(fields).length,
      fields: fields,
      interactions: this.formInteractions.get(formId)?.length || 0
    });
  }

  /**
   * Handle mouse leave (exit intent)
   */
  private handleMouseLeave(event: MouseEvent): void {
    // Only trigger on top boundary exit
    if (event.clientY <= 0) {
      this.trackEvent('exit_intent', 'Exit Intent Detected', {
        time_on_page: Date.now() - this.pageStartTime,
        scroll_depth: this.scrollMetrics.maxDepthPercent,
        page_interactions: this.eventQueue.length
      });
    }
  }

  /**
   * Handle page load completion
   */
  private handlePageLoad(): void {
    const loadTime = this.getPageLoadTime();
    
    this.trackEvent('page_load_complete', 'Page Load Complete', {
      load_time_ms: loadTime,
      dom_content_loaded: this.getDOMContentLoadedTime(),
      first_contentful_paint: this.getFirstContentfulPaint(),
      largest_contentful_paint: this.getLargestContentfulPaint()
    });
  }

  /**
   * Handle page unload
   */
  private handleBeforeUnload(): void {
    const timeOnPage = Date.now() - this.pageStartTime;
    
    this.trackEvent('page_unload', 'Page Unload', {
      time_on_page: timeOnPage,
      max_scroll_depth: this.scrollMetrics.maxDepthPercent,
      total_events: this.eventQueue.length,
      bounce: timeOnPage < 30000 && this.scrollMetrics.maxDepthPercent < 25
    });
    
    // Force flush remaining events
    this.flushEvents();
  }

  /**
   * Handle visibility change (tab switching)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.trackEvent('page_hidden', 'Page Hidden', {
        time_visible: Date.now() - this.pageStartTime
      });
    } else {
      this.trackEvent('page_visible', 'Page Visible', {
        time_hidden: Date.now() - this.lastEventTime
      });
    }
  }

  /**
   * Flush events to server
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.apiEndpoint + '/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true // Important for page unload
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.debugMode) {
        console.log(`Flushed ${events.length} events successfully`);
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add events to queue for retry (limit to prevent memory issues)
      this.eventQueue.unshift(...events.slice(-this.config.batchSize));
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Utility functions
   */
  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private getElementPosition(element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.pageXOffset,
      y: rect.top + window.pageYOffset
    };
  }

  private isFormField(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return ['input', 'textarea', 'select'].includes(tagName);
  }

  private getFormId(element: HTMLElement): string {
    const form = element.closest('form');
    return form?.id || form?.name || 'unnamed_form';
  }

  private getChangeType(element: HTMLInputElement): string {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked ? 'checked' : 'unchecked';
    }
    return 'text_change';
  }

  private getPageLoadTime(): number {
    const timing = performance.timing;
    return timing.loadEventEnd - timing.navigationStart;
  }

  private getDOMContentLoadedTime(): number {
    const timing = performance.timing;
    return timing.domContentLoadedEventEnd - timing.navigationStart;
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByName('first-contentful-paint');
    return entries.length > 0 ? entries[0].startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
  }

  private getUTMParameters(): Partial<BehavioralEvent> {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined
    };
  }

  private throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

export { BehavioralTrackingService, type BehavioralEvent, type EventConfig };