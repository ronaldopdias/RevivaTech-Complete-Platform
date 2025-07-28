/**
 * Analytics Types Definition
 * 
 * Comprehensive type definitions for RevivaTech advanced analytics system
 * with 15+ event types and real-time capture capabilities
 * 
 * Session 4 - RevivaTech Analytics Implementation
 */

import { DeviceFingerprint } from '../services/BrowserFingerprinting';

// Core event types (15+ as per requirements)
export enum AnalyticsEventType {
  // Core Navigation Events
  PAGE_VIEW = 'page_view',
  PAGE_UNLOAD = 'page_unload',
  SCROLL_MILESTONE = 'scroll_milestone',
  
  // User Interaction Events
  CLICK_EVENT = 'click_event',
  FORM_INTERACT = 'form_interact',
  FORM_SUBMIT = 'form_submit',
  FORM_ERROR = 'form_error',
  
  // Business-Specific Events
  SERVICE_VIEW = 'service_view',
  PRICING_CHECK = 'pricing_check',
  BOOKING_START = 'booking_start',
  BOOKING_STEP = 'booking_step',
  BOOKING_COMPLETE = 'booking_complete',
  BOOKING_ABANDON = 'booking_abandon',
  
  // Engagement Events
  EXIT_INTENT = 'exit_intent',
  RAGE_CLICK = 'rage_click',
  SEARCH_PERFORM = 'search_perform',
  SEARCH_RESULT_CLICK = 'search_result_click',
  
  // Performance Events
  PERFORMANCE_TIMING = 'performance_timing',
  ERROR_BOUNDARY = 'error_boundary',
  
  // Marketing Events
  CTA_CLICK = 'cta_click',
  SOCIAL_SHARE = 'social_share',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  
  // Technical Events
  PWA_INSTALL = 'pwa_install',
  OFFLINE_USAGE = 'offline_usage',
  DEVICE_ORIENTATION = 'device_orientation',
  
  // Custom Events
  CUSTOM_EVENT = 'custom_event'
}

// Base event structure
export interface BaseAnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceFingerprint?: DeviceFingerprint;
  url: string;
  referrer?: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  metadata?: Record<string, any>;
}

// Page view event
export interface PageViewEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.PAGE_VIEW;
  data: {
    title: string;
    path: string;
    loadTime: number;
    previousPage?: string;
    isInitialLoad: boolean;
    navigationTiming?: PerformanceNavigationTiming;
  };
}

// Scroll milestone event
export interface ScrollMilestoneEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.SCROLL_MILESTONE;
  data: {
    percentage: number;
    depth: number;
    timeToScroll: number;
    scrollDirection: 'up' | 'down';
    documentHeight: number;
    viewportHeight: number;
  };
}

// Click event
export interface ClickEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.CLICK_EVENT;
  data: {
    elementType: string;
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    elementHref?: string;
    coordinates: {
      x: number;
      y: number;
    };
    pageCoordinates: {
      x: number;
      y: number;
    };
    isRightClick: boolean;
    modifierKeys: {
      ctrl: boolean;
      alt: boolean;
      shift: boolean;
      meta: boolean;
    };
  };
}

// Form interaction event
export interface FormInteractEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.FORM_INTERACT;
  data: {
    formId?: string;
    formName?: string;
    fieldName?: string;
    fieldType?: string;
    action: 'focus' | 'blur' | 'change' | 'input';
    value?: string; // Sanitized/hashed for privacy
    validationErrors?: string[];
    timeSpent?: number;
  };
}

// Service view event
export interface ServiceViewEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.SERVICE_VIEW;
  data: {
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    servicePrice?: number;
    viewDuration?: number;
    scrollDepth?: number;
    cta_interactions?: number;
  };
}

// Booking events
export interface BookingEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.BOOKING_START | AnalyticsEventType.BOOKING_STEP | 
        AnalyticsEventType.BOOKING_COMPLETE | AnalyticsEventType.BOOKING_ABANDON;
  data: {
    bookingId?: string;
    serviceType?: string;
    deviceType?: string;
    currentStep?: number;
    totalSteps?: number;
    stepName?: string;
    formData?: Record<string, any>; // Sanitized
    abandonReason?: string;
    completionTime?: number;
    estimatedValue?: number;
  };
}

// Search event
export interface SearchEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.SEARCH_PERFORM | AnalyticsEventType.SEARCH_RESULT_CLICK;
  data: {
    query: string;
    resultsCount?: number;
    resultPosition?: number;
    resultId?: string;
    resultTitle?: string;
    timeToClick?: number;
    refinedQuery?: boolean;
  };
}

// Performance timing event
export interface PerformanceTimingEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.PERFORMANCE_TIMING;
  data: {
    metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'TTI';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
    connectionType?: string;
    effectiveConnectionType?: string;
  };
}

// Error boundary event
export interface ErrorBoundaryEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.ERROR_BOUNDARY;
  data: {
    errorMessage: string;
    errorStack?: string;
    componentStack?: string;
    errorBoundary?: string;
    userId?: string;
    recovered: boolean;
    errorHash: string; // For grouping similar errors
  };
}

// Exit intent event
export interface ExitIntentEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.EXIT_INTENT;
  data: {
    timeOnPage: number;
    scrollDepth: number;
    interactionCount: number;
    exitMethod: 'mouse_leave' | 'tab_close' | 'navigation' | 'refresh';
    lastInteraction?: string;
    sessionDuration: number;
  };
}

// Rage click event
export interface RageClickEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.RAGE_CLICK;
  data: {
    elementType: string;
    elementId?: string;
    elementClass?: string;
    clickCount: number;
    timeSpan: number;
    coordinates: {
      x: number;
      y: number;
    };
    possibleIssue?: string;
  };
}

// Custom event
export interface CustomEvent extends BaseAnalyticsEvent {
  type: AnalyticsEventType.CUSTOM_EVENT;
  data: {
    eventName: string;
    eventCategory?: string;
    eventAction?: string;
    eventLabel?: string;
    eventValue?: number;
    customData?: Record<string, any>;
  };
}

// Union type for all events
export type AnalyticsEvent = 
  | PageViewEvent
  | ScrollMilestoneEvent
  | ClickEvent
  | FormInteractEvent
  | ServiceViewEvent
  | BookingEvent
  | SearchEvent
  | PerformanceTimingEvent
  | ErrorBoundaryEvent
  | ExitIntentEvent
  | RageClickEvent
  | CustomEvent;

// Event queue and batch processing
export interface EventQueue {
  events: AnalyticsEvent[];
  maxSize: number;
  flushInterval: number;
  lastFlush: number;
  priority: 'high' | 'medium' | 'low';
}

export interface BatchProcessingOptions {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  compression: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface EventProcessor {
  process(events: AnalyticsEvent[]): Promise<ProcessingResult>;
  validate(event: AnalyticsEvent): ValidationResult;
  sanitize(event: AnalyticsEvent): AnalyticsEvent;
  enrich(event: AnalyticsEvent): Promise<AnalyticsEvent>;
}

export interface ProcessingResult {
  processed: number;
  failed: number;
  errors: ProcessingError[];
  processingTime: number;
  batchId: string;
}

export interface ProcessingError {
  eventId: string;
  errorType: string;
  errorMessage: string;
  retryable: boolean;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Real-time streaming
export interface StreamingOptions {
  endpoint: string;
  apiKey?: string;
  compress: boolean;
  timeout: number;
  retryAttempts: number;
  bufferSize: number;
  flushOnClose: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface StreamingStats {
  eventsSent: number;
  eventsQueued: number;
  eventsFailed: number;
  averageLatency: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastActivity: number;
  bufferUtilization: number;
}

// Configuration
export interface AnalyticsConfig {
  endpoint: string;
  apiKey?: string;
  debug: boolean;
  enableConsent: boolean;
  respectDNT: boolean;
  sampleRate: number;
  queueOptions: {
    maxSize: number;
    flushInterval: number;
    priority: 'high' | 'medium' | 'low';
  };
  batchProcessing: BatchProcessingOptions;
  streaming: StreamingOptions;
  privacy: {
    maskPII: boolean;
    hashSensitiveData: boolean;
    excludeFields: string[];
    anonymizeIPs: boolean;
  };
  performance: {
    trackWebVitals: boolean;
    trackNavigation: boolean;
    trackResources: boolean;
    maxEventSize: number;
    throttleEvents: boolean;
  };
  filters: {
    excludeEvents: AnalyticsEventType[];
    includeEvents: AnalyticsEventType[];
    excludeUrls: string[];
    includeUrls: string[];
  };
}

// Session management
export interface AnalyticsSession {
  sessionId: string;
  userId?: string;
  deviceFingerprint?: DeviceFingerprint;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  eventCount: number;
  referrer?: string;
  utmParameters?: Record<string, string>;
  isNewSession: boolean;
  sessionDuration: number;
}

// Analytics tracker interface
export interface AnalyticsTracker {
  track(event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void>;
  trackPageView(data: PageViewEvent['data']): Promise<void>;
  trackClick(element: HTMLElement, event: MouseEvent): Promise<void>;
  trackScroll(percentage: number, depth: number): Promise<void>;
  trackForm(formData: FormInteractEvent['data']): Promise<void>;
  trackService(serviceData: ServiceViewEvent['data']): Promise<void>;
  trackBooking(bookingData: BookingEvent['data']): Promise<void>;
  trackSearch(searchData: SearchEvent['data']): Promise<void>;
  trackPerformance(performanceData: PerformanceTimingEvent['data']): Promise<void>;
  trackError(errorData: ErrorBoundaryEvent['data']): Promise<void>;
  trackCustom(eventName: string, data: any): Promise<void>;
  
  // Queue and batch management
  flush(): Promise<void>;
  getQueueSize(): number;
  getStats(): StreamingStats;
  
  // Configuration
  updateConfig(config: Partial<AnalyticsConfig>): void;
  getConfig(): AnalyticsConfig;
  
  // Session management
  startSession(): Promise<AnalyticsSession>;
  endSession(): Promise<void>;
  getSession(): AnalyticsSession | null;
  
  // Privacy and consent
  updateConsent(consent: boolean): void;
  clearData(): void;
  
  // Health and monitoring
  isHealthy(): boolean;
  getHealthStatus(): HealthStatus;
}

export interface HealthStatus {
  isHealthy: boolean;
  uptime: number;
  eventsProcessed: number;
  errorRate: number;
  averageLatency: number;
  queueHealth: {
    size: number;
    utilization: number;
    oldestEvent: number;
  };
  connectionHealth: {
    status: 'connected' | 'disconnected' | 'reconnecting';
    lastSuccess: number;
    failureCount: number;
  };
  performanceHealth: {
    cpuUsage: number;
    memoryUsage: number;
    processingTime: number;
  };
}

// Event throttling
export interface ThrottleOptions {
  maxEventsPerSecond: number;
  maxEventsPerMinute: number;
  burstAllowance: number;
  throttleStrategy: 'drop' | 'queue' | 'sample';
  priorityTiers: {
    high: AnalyticsEventType[];
    medium: AnalyticsEventType[];
    low: AnalyticsEventType[];
  };
}

export interface ThrottleState {
  eventsThisSecond: number;
  eventsThisMinute: number;
  lastSecondReset: number;
  lastMinuteReset: number;
  burstUsed: number;
  throttledEvents: number;
  droppedEvents: number;
}

// Privacy compliance
export interface PrivacySettings {
  consentGiven: boolean;
  consentTimestamp: number;
  consentVersion: string;
  trackingEnabled: boolean;
  fingerprintingEnabled: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  respectDNT: boolean;
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
}

// Export convenience types
export type EventData<T extends AnalyticsEventType> = 
  T extends AnalyticsEventType.PAGE_VIEW ? PageViewEvent['data'] :
  T extends AnalyticsEventType.SCROLL_MILESTONE ? ScrollMilestoneEvent['data'] :
  T extends AnalyticsEventType.CLICK_EVENT ? ClickEvent['data'] :
  T extends AnalyticsEventType.FORM_INTERACT ? FormInteractEvent['data'] :
  T extends AnalyticsEventType.SERVICE_VIEW ? ServiceViewEvent['data'] :
  T extends AnalyticsEventType.BOOKING_START ? BookingEvent['data'] :
  T extends AnalyticsEventType.SEARCH_PERFORM ? SearchEvent['data'] :
  T extends AnalyticsEventType.PERFORMANCE_TIMING ? PerformanceTimingEvent['data'] :
  T extends AnalyticsEventType.ERROR_BOUNDARY ? ErrorBoundaryEvent['data'] :
  T extends AnalyticsEventType.EXIT_INTENT ? ExitIntentEvent['data'] :
  T extends AnalyticsEventType.RAGE_CLICK ? RageClickEvent['data'] :
  T extends AnalyticsEventType.CUSTOM_EVENT ? CustomEvent['data'] :
  any;

// Constants
export const ANALYTICS_CONSTANTS = {
  MAX_EVENT_SIZE: 64 * 1024, // 64KB
  MAX_QUEUE_SIZE: 1000,
  DEFAULT_FLUSH_INTERVAL: 5000, // 5 seconds
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  PERFORMANCE_OVERHEAD_LIMIT: 100, // 100ms
  CAPTURE_RATE_TARGET: 0.95, // 95%
  SCROLL_MILESTONES: [25, 50, 75, 90, 100],
  RAGE_CLICK_THRESHOLD: 5,
  RAGE_CLICK_TIMESPAN: 2000, // 2 seconds
  EXIT_INTENT_THRESHOLD: 10, // 10px from top
  INTERACTION_DEBOUNCE: 100, // 100ms
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10%
  ERROR_SAMPLE_RATE: 1.0, // 100%
} as const;

export default AnalyticsEventType;