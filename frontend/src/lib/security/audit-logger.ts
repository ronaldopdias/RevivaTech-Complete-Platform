// Comprehensive Audit Logging System
// Tracks security events, user actions, and system activities

import { SecurityEvent, SecurityEventType } from '@/lib/auth/types';

// Audit log levels
export enum AuditLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Audit event categories
export enum AuditEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  USER_MANAGEMENT = 'user_management',
  DATA_ACCESS = 'data_access',
  SYSTEM_ADMIN = 'system_admin',
  FINANCIAL = 'financial',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

// Extended audit event interface
export interface AuditEvent {
  id: string;
  timestamp: Date;
  level: AuditLogLevel;
  category: AuditEventCategory;
  eventType: SecurityEventType | string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  details: string;
  metadata?: Record<string, any>;
  correlationId?: string; // For tracking related events
  duration?: number; // For performance tracking
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  riskScore?: number; // 0-100, higher = more risky
}

// Audit context for gathering environment info
export interface AuditContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  correlationId?: string;
}

// Audit logging configuration
export const AUDIT_CONFIG = {
  maxBatchSize: 50,
  batchTimeout: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  enableLocalStorage: true,
  enableConsoleOutput: process.env.NODE_ENV === 'development',
  apiEndpoint: '/api/audit/events',
  riskThresholds: {
    low: 30,
    medium: 60,
    high: 80,
  },
};

class AuditLogger {
  private eventQueue: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private context: AuditContext = {};
  private correlationCounter = 0;

  constructor() {
    this.initializeContext();
    this.setupBeforeUnloadHandler();
  }

  // Initialize audit context
  private initializeContext(): void {
    if (typeof window === 'undefined') return;

    this.context = {
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
    };
  }

  // Set audit context
  setContext(context: Partial<AuditContext>): void {
    this.context = { ...this.context, ...context };
  }

  // Generate correlation ID for related events
  generateCorrelationId(): string {
    this.correlationCounter++;
    return `corr_${Date.now()}_${this.correlationCounter}`;
  }

  // Log audit event
  log(
    eventType: SecurityEventType | string,
    level: AuditLogLevel,
    category: AuditEventCategory,
    details: string,
    options: {
      resource?: string;
      action?: string;
      metadata?: Record<string, any>;
      correlationId?: string;
      duration?: number;
      success?: boolean;
      errorCode?: string;
      errorMessage?: string;
      userId?: string;
      riskScore?: number;
    } = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      level,
      category,
      eventType,
      userId: options.userId || this.context.userId,
      sessionId: this.context.sessionId,
      ipAddress: this.context.ipAddress || 'unknown',
      userAgent: this.context.userAgent || 'unknown',
      resource: options.resource || this.context.resource,
      action: options.action,
      details,
      metadata: options.metadata,
      correlationId: options.correlationId || this.context.correlationId,
      duration: options.duration,
      success: options.success !== false,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      riskScore: options.riskScore || this.calculateRiskScore(eventType, level, category),
    };

    this.addToQueue(event);

    // Log to console in development
    if (AUDIT_CONFIG.enableConsoleOutput) {
      this.logToConsole(event);
    }
  }

  // Convenience methods for different log levels
  debug(
    eventType: string,
    category: AuditEventCategory,
    details: string,
    options?: any
  ): void {
    this.log(eventType, AuditLogLevel.DEBUG, category, details, options);
  }

  info(
    eventType: SecurityEventType | string,
    category: AuditEventCategory,
    details: string,
    options?: any
  ): void {
    this.log(eventType, AuditLogLevel.INFO, category, details, options);
  }

  warning(
    eventType: string,
    category: AuditEventCategory,
    details: string,
    options?: any
  ): void {
    this.log(eventType, AuditLogLevel.WARNING, category, details, options);
  }

  error(
    eventType: string,
    category: AuditEventCategory,
    details: string,
    options?: any
  ): void {
    this.log(eventType, AuditLogLevel.ERROR, category, details, { ...options, success: false });
  }

  critical(
    eventType: string,
    category: AuditEventCategory,
    details: string,
    options?: any
  ): void {
    this.log(eventType, AuditLogLevel.CRITICAL, category, details, { ...options, success: false });
  }

  // Specific audit methods for common events
  logAuthentication(
    eventType: SecurityEventType,
    success: boolean,
    details: string,
    options?: any
  ): void {
    this.log(
      eventType,
      success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
      AuditEventCategory.AUTHENTICATION,
      details,
      { ...options, success }
    );
  }

  logAuthorization(
    action: string,
    resource: string,
    success: boolean,
    details: string,
    options?: any
  ): void {
    this.log(
      'AUTHORIZATION_CHECK',
      success ? AuditLogLevel.DEBUG : AuditLogLevel.WARNING,
      AuditEventCategory.AUTHORIZATION,
      details,
      { ...options, action, resource, success }
    );
  }

  logDataAccess(
    resource: string,
    action: string,
    details: string,
    options?: any
  ): void {
    this.log(
      'DATA_ACCESS',
      AuditLogLevel.INFO,
      AuditEventCategory.DATA_ACCESS,
      details,
      { ...options, resource, action }
    );
  }

  logUserAction(
    action: string,
    details: string,
    options?: any
  ): void {
    this.log(
      'USER_ACTION',
      AuditLogLevel.INFO,
      AuditEventCategory.USER_MANAGEMENT,
      details,
      { ...options, action }
    );
  }

  logSecurityEvent(
    eventType: SecurityEventType,
    details: string,
    riskScore: number,
    options?: any
  ): void {
    const level = riskScore >= AUDIT_CONFIG.riskThresholds.high 
      ? AuditLogLevel.CRITICAL
      : riskScore >= AUDIT_CONFIG.riskThresholds.medium
      ? AuditLogLevel.WARNING
      : AuditLogLevel.INFO;

    this.log(
      eventType,
      level,
      AuditEventCategory.SECURITY,
      details,
      { ...options, riskScore }
    );
  }

  logPerformanceEvent(
    action: string,
    duration: number,
    details: string,
    options?: any
  ): void {
    const level = duration > 5000 
      ? AuditLogLevel.WARNING 
      : duration > 2000 
      ? AuditLogLevel.INFO 
      : AuditLogLevel.DEBUG;

    this.log(
      'PERFORMANCE_METRIC',
      level,
      AuditEventCategory.PERFORMANCE,
      details,
      { ...options, action, duration }
    );
  }

  // Add event to queue for batch processing
  private addToQueue(event: AuditEvent): void {
    this.eventQueue.push(event);

    // Store in localStorage as backup
    if (AUDIT_CONFIG.enableLocalStorage) {
      this.storeInLocalStorage(event);
    }

    // Process queue if it's full
    if (this.eventQueue.length >= AUDIT_CONFIG.maxBatchSize) {
      this.flushQueue();
    } else if (!this.batchTimer) {
      // Start batch timer
      this.batchTimer = setTimeout(() => {
        this.flushQueue();
      }, AUDIT_CONFIG.batchTimeout);
    }
  }

  // Flush event queue to server
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await this.sendToServer(events);
      this.clearLocalStorageEvents(events);
    } catch (error) {
      console.error('Failed to send audit events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
      
      // Retry with exponential backoff
      setTimeout(() => this.flushQueue(), AUDIT_CONFIG.retryDelay);
    }
  }

  // Send events to server
  private async sendToServer(events: AuditEvent[]): Promise<void> {
    const response = await fetch(AUDIT_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Store event in localStorage as backup
  private storeInLocalStorage(event: AuditEvent): void {
    try {
      const stored = localStorage.getItem('audit_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('audit_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store audit event in localStorage:', error);
    }
  }

  // Clear events from localStorage after successful send
  private clearLocalStorageEvents(sentEvents: AuditEvent[]): void {
    try {
      const stored = localStorage.getItem('audit_events') || '[]';
      const events = JSON.parse(stored);
      const sentIds = new Set(sentEvents.map(e => e.id));
      const remaining = events.filter((e: AuditEvent) => !sentIds.has(e.id));
      localStorage.setItem('audit_events', JSON.stringify(remaining));
    } catch (error) {
      console.warn('Failed to clear localStorage events:', error);
    }
  }

  // Calculate risk score based on event characteristics
  private calculateRiskScore(
    eventType: SecurityEventType | string,
    level: AuditLogLevel,
    category: AuditEventCategory
  ): number {
    let score = 0;

    // Base score by level
    switch (level) {
      case AuditLogLevel.DEBUG: score += 5; break;
      case AuditLogLevel.INFO: score += 15; break;
      case AuditLogLevel.WARNING: score += 40; break;
      case AuditLogLevel.ERROR: score += 70; break;
      case AuditLogLevel.CRITICAL: score += 90; break;
    }

    // Category multipliers
    switch (category) {
      case AuditEventCategory.SECURITY: score *= 1.5; break;
      case AuditEventCategory.AUTHENTICATION: score *= 1.3; break;
      case AuditEventCategory.AUTHORIZATION: score *= 1.2; break;
      case AuditEventCategory.FINANCIAL: score *= 1.4; break;
    }

    // Event type specific scores
    if (eventType.includes('FAILED') || eventType.includes('ERROR')) {
      score += 20;
    }
    if (eventType.includes('SUSPICIOUS') || eventType.includes('ATTACK')) {
      score += 40;
    }

    return Math.min(100, Math.round(score));
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log to console for development
  private logToConsole(event: AuditEvent): void {
    const color = {
      [AuditLogLevel.DEBUG]: 'color: #6b7280',
      [AuditLogLevel.INFO]: 'color: #3b82f6',
      [AuditLogLevel.WARNING]: 'color: #f59e0b',
      [AuditLogLevel.ERROR]: 'color: #ef4444',
      [AuditLogLevel.CRITICAL]: 'color: #dc2626; font-weight: bold',
    }[event.level];

    console.log(
      `%c[AUDIT] ${event.timestamp.toISOString()} [${event.level.toUpperCase()}] ${event.category}/${event.eventType}`,
      color
    );
    console.log('Details:', event.details);
    if (event.metadata) {
      console.log('Metadata:', event.metadata);
    }
  }

  // Setup beforeunload handler to flush events
  private setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Synchronously send remaining events
      if (this.eventQueue.length > 0) {
        const events = [...this.eventQueue];
        navigator.sendBeacon(
          AUDIT_CONFIG.apiEndpoint,
          JSON.stringify({ events })
        );
      }
    });
  }

  // Manual flush for testing or forced sync
  async flush(): Promise<void> {
    await this.flushQueue();
  }

  // Get queued events count
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  // Get events from localStorage
  getLocalStorageEvents(): AuditEvent[] {
    try {
      const stored = localStorage.getItem('audit_events') || '[]';
      return JSON.parse(stored);
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export utilities
export const auditUtils = {
  // Start performance tracking
  startPerformanceTimer: (): (() => void) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      return duration;
    };
  },

  // Create correlation ID for related operations
  createCorrelationId: (): string => {
    return auditLogger.generateCorrelationId();
  },

  // Format audit event for display
  formatEvent: (event: AuditEvent): string => {
    return `[${event.timestamp.toISOString()}] ${event.level.toUpperCase()} ${event.category}/${event.eventType}: ${event.details}`;
  },

  // Filter events by criteria
  filterEvents: (
    events: AuditEvent[],
    criteria: {
      level?: AuditLogLevel;
      category?: AuditEventCategory;
      eventType?: string;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      riskScoreMin?: number;
    }
  ): AuditEvent[] => {
    return events.filter(event => {
      if (criteria.level && event.level !== criteria.level) return false;
      if (criteria.category && event.category !== criteria.category) return false;
      if (criteria.eventType && !event.eventType.includes(criteria.eventType)) return false;
      if (criteria.userId && event.userId !== criteria.userId) return false;
      if (criteria.dateFrom && event.timestamp < criteria.dateFrom) return false;
      if (criteria.dateTo && event.timestamp > criteria.dateTo) return false;
      if (criteria.riskScoreMin && (event.riskScore || 0) < criteria.riskScoreMin) return false;
      return true;
    });
  },
};

export default auditLogger;