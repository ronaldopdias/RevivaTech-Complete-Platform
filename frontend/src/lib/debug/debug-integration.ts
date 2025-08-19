/**
 * Debug Integration Layer
 * Connects all debugging systems together for unified data access
 * Provides correlation between auth errors, console logs, and network requests
 * Centralizes debug data management and cross-system analysis
 * Auto-uploads correlation events for analysis
 */

// Import existing systems
import { authLogger, type AuthLogEntry } from '@/lib/auth/logger';
import { errorReporting, type ErrorReport } from '@/lib/error-handling/errorReporting';
import { consoleManager, type ConsoleEntry } from '@/lib/console/console-manager';
import { networkInterceptor, type NetworkRequest } from '@/lib/network/network-interceptor';
import { debugUploadService, type DebugEvent as UploadDebugEvent } from './debug-upload-service';

export interface DebugEvent {
  id: string;
  timestamp: string;
  type: 'auth' | 'error' | 'console' | 'network' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  message: string;
  data: any;
  correlationId?: string;
  sessionId: string;
  userId?: string;
  context?: {
    url: string;
    userAgent: string;
    component?: string;
    function?: string;
    line?: number;
  };
  metadata?: {
    duration?: number;
    retryCount?: number;
    errorCode?: string;
    networkStatus?: number;
    performance?: {
      memory: number;
      timing: number;
    };
  };
}

export interface DebugSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  userId?: string;
  events: DebugEvent[];
  summary: {
    totalEvents: number;
    errorCount: number;
    warningCount: number;
    networkFailures: number;
    averageResponseTime: number;
    memoryPeakUsage?: number;
  };
  patterns: {
    frequentErrors: Array<{ message: string; count: number }>;
    slowRequests: Array<{ url: string; duration: number }>;
    memoryLeaks: Array<{ component: string; growth: number }>;
  };
}

export interface DebugCorrelation {
  id: string;
  type: 'error_chain' | 'request_error' | 'performance_impact' | 'user_journey';
  events: DebugEvent[];
  probability: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface DebugAnalytics {
  timeRange: { start: string; end: string };
  totalEvents: number;
  eventsByType: Record<DebugEvent['type'], number>;
  eventsBySeverity: Record<DebugEvent['severity'], number>;
  topErrors: Array<{ message: string; count: number; impact: string }>;
  topComponents: Array<{ component: string; errorCount: number; logCount: number }>;
  networkStats: {
    totalRequests: number;
    failureRate: number;
    averageResponseTime: number;
    slowestEndpoints: Array<{ url: string; avgDuration: number }>;
  };
  performanceTrends: {
    memoryUsage: Array<{ timestamp: string; usage: number }>;
    responseTimesTrend: Array<{ timestamp: string; avgTime: number }>;
  };
  userImpact: {
    affectedUsers: number;
    criticalErrors: number;
    userJourneyIssues: Array<{ journey: string; issues: number }>;
  };
}

class DebugIntegration {
  private events: DebugEvent[] = [];
  private sessions: Map<string, DebugSession> = new Map();
  private correlations: DebugCorrelation[] = [];
  private currentSessionId: string;
  private subscribers: Array<(event: DebugEvent) => void> = [];
  private maxEvents = 5000;
  private correlationThreshold = 10000; // 10 seconds for event correlation

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initializeIntegration();
  }

  private initializeIntegration(): void {
    this.startSession();
    this.setupAuthIntegration();
    this.setupErrorIntegration();
    this.setupConsoleIntegration();
    this.setupNetworkIntegration();
    this.setupPerformanceIntegration();
    this.startCorrelationAnalysis();
  }

  private setupAuthIntegration(): void {
    // Subscribe to auth logger events
    if (authLogger) {
      // We'll poll for auth events since the auth logger doesn't have a subscribe method
      setInterval(() => {
        const authLogs = authLogger.getLogs(1); // Get latest log
        if (authLogs.length > 0) {
          const latestLog = authLogs[0];
          const existingEvent = this.events.find(e => 
            e.type === 'auth' && 
            e.data.event === latestLog.event && 
            e.timestamp === latestLog.timestamp
          );
          
          if (!existingEvent) {
            this.addDebugEvent({
              type: 'auth',
              severity: latestLog.level === 'error' ? 'high' : 
                       latestLog.level === 'warn' ? 'medium' : 'low',
              source: 'auth-logger',
              message: latestLog.event,
              data: latestLog,
              userId: latestLog.userId,
            });
          }
        }
      }, 1000);
    }
  }

  private setupErrorIntegration(): void {
    // Subscribe to global error reporting
    if (errorReporting) {
      const originalReportError = errorReporting.reportError.bind(errorReporting);
      errorReporting.reportError = async (error: Error, options: any = {}) => {
        // Call original method first
        await originalReportError(error, options);
        
        // Add to our debug events
        this.addDebugEvent({
          type: 'error',
          severity: options.severity || 'high',
          source: 'error-reporting',
          message: error.message,
          data: {
            error,
            options,
            stack: error.stack,
          },
          metadata: {
            errorCode: error.name,
          },
        });
      };
    }
  }

  private setupConsoleIntegration(): void {
    if (consoleManager) {
      consoleManager.subscribe((entry: ConsoleEntry) => {
        this.addDebugEvent({
          type: 'console',
          severity: entry.level === 'error' ? 'high' :
                   entry.level === 'warn' ? 'medium' : 'low',
          source: 'console-manager',
          message: entry.message,
          data: entry,
          context: entry.context ? {
            url: entry.context.url,
            userAgent: entry.context.userAgent,
            component: entry.context.component,
            function: entry.context.function,
            line: entry.context.line,
          } : undefined,
          metadata: entry.metadata ? {
            performance: entry.metadata.performance,
          } : undefined,
        });
      });
    }
  }

  private setupNetworkIntegration(): void {
    if (networkInterceptor) {
      networkInterceptor.subscribe((request: NetworkRequest) => {
        const isError = request.error || (request.status && request.status >= 400);
        
        this.addDebugEvent({
          type: 'network',
          severity: request.error ? 'high' :
                   request.status && request.status >= 500 ? 'high' :
                   request.status && request.status >= 400 ? 'medium' : 'low',
          source: 'network-interceptor',
          message: `${request.method} ${request.url}${request.status ? ` (${request.status})` : ''}`,
          data: request,
          metadata: {
            duration: request.duration,
            networkStatus: request.status,
          },
        });
      });
    }
  }

  private setupPerformanceIntegration(): void {
    // Monitor performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.addDebugEvent({
              type: 'performance',
              severity: navEntry.loadEventEnd - navEntry.navigationStart > 3000 ? 'medium' : 'low',
              source: 'performance-observer',
              message: `Page load completed in ${Math.round(navEntry.loadEventEnd - navEntry.navigationStart)}ms`,
              data: navEntry,
              metadata: {
                duration: navEntry.loadEventEnd - navEntry.navigationStart,
              },
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        // Performance Observer not supported
      }
    }

    // Memory monitoring
    if (typeof window !== 'undefined' && (performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const usagePercent = (usedMB / limitMB) * 100;

        if (usagePercent > 80) {
          this.addDebugEvent({
            type: 'performance',
            severity: usagePercent > 90 ? 'high' : 'medium',
            source: 'memory-monitor',
            message: `High memory usage: ${usedMB}MB (${Math.round(usagePercent)}%)`,
            data: { memory, usagePercent },
            metadata: {
              performance: {
                memory: memory.usedJSHeapSize,
                timing: performance.now(),
              },
            },
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private startCorrelationAnalysis(): void {
    // Run correlation analysis every 30 seconds
    setInterval(() => {
      this.analyzeCorrelations();
    }, 30000);
  }

  private addDebugEvent(eventData: Omit<DebugEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    const event: DebugEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      ...eventData,
    };

    this.events.push(event);

    // Trim events if we exceed max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Add to current session
    const currentSession = this.sessions.get(this.currentSessionId);
    if (currentSession) {
      currentSession.events.push(event);
      this.updateSessionSummary(currentSession);
    }

    // Upload to debug capture system for analysis
    this.uploadToDebugCapture(event);

    // Check for immediate correlations
    this.checkImmedateCorrelations(event);

    // Notify subscribers
    this.notifySubscribers(event);

    // Persist to storage
    this.persistToStorage();
  }

  private uploadToDebugCapture(event: DebugEvent): void {
    // Convert debug integration event to upload service format
    const uploadEvent: UploadDebugEvent = {
      type: event.type as UploadDebugEvent['type'],
      severity: event.severity,
      source: `debug-integration-${event.source}`,
      message: `[CORRELATION] ${event.message}`,
      data: {
        ...event.data,
        debugIntegrationId: event.id,
        sessionId: event.sessionId,
        correlationType: 'debug-integration',
      },
      timestamp: event.timestamp,
    };

    // Upload to debug capture system
    debugUploadService.addEvent(uploadEvent);
  }

  private checkImmedateCorrelations(newEvent: DebugEvent): void {
    // Look for events within correlation threshold
    const recentEvents = this.events.filter(event => 
      event.id !== newEvent.id &&
      new Date(newEvent.timestamp).getTime() - new Date(event.timestamp).getTime() < this.correlationThreshold
    );

    // Error followed by network request
    if (newEvent.type === 'network' && newEvent.severity === 'high') {
      const recentError = recentEvents.find(e => e.type === 'error' || e.type === 'console' && e.severity === 'high');
      if (recentError) {
        this.createCorrelation('request_error', [recentError, newEvent], 0.8, 
          'Network error may be related to recent application error');
      }
    }

    // Console error followed by auth failure
    if (newEvent.type === 'auth' && newEvent.message.includes('FAILED')) {
      const recentConsoleError = recentEvents.find(e => e.type === 'console' && e.severity === 'high');
      if (recentConsoleError) {
        this.createCorrelation('error_chain', [recentConsoleError, newEvent], 0.7,
          'Authentication failure may be caused by application error');
      }
    }
  }

  private createCorrelation(
    type: DebugCorrelation['type'], 
    events: DebugEvent[], 
    probability: number, 
    description: string
  ): void {
    const correlation: DebugCorrelation = {
      id: this.generateCorrelationId(),
      type,
      events,
      probability,
      description,
      impact: this.calculateCorrelationImpact(events),
      recommendations: this.generateRecommendations(type, events),
    };

    this.correlations.push(correlation);

    // Keep only last 100 correlations
    if (this.correlations.length > 100) {
      this.correlations = this.correlations.slice(-100);
    }
  }

  private calculateCorrelationImpact(events: DebugEvent[]): 'low' | 'medium' | 'high' {
    const highSeverityCount = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;
    const hasNetworkError = events.some(e => e.type === 'network' && e.severity === 'high');
    const hasAuthError = events.some(e => e.type === 'auth' && e.severity === 'high');

    if (highSeverityCount >= 2 || hasAuthError || hasNetworkError) {
      return 'high';
    } else if (highSeverityCount === 1) {
      return 'medium';
    }
    return 'low';
  }

  private generateRecommendations(type: DebugCorrelation['type'], events: DebugEvent[]): string[] {
    const recommendations: string[] = [];

    switch (type) {
      case 'request_error':
        recommendations.push('Check network connectivity');
        recommendations.push('Verify API endpoint availability');
        recommendations.push('Implement request retry logic');
        break;
      case 'error_chain':
        recommendations.push('Fix root cause error first');
        recommendations.push('Add better error handling');
        recommendations.push('Implement graceful degradation');
        break;
      case 'performance_impact':
        recommendations.push('Optimize resource usage');
        recommendations.push('Implement lazy loading');
        recommendations.push('Consider caching strategy');
        break;
      case 'user_journey':
        recommendations.push('Improve user experience flow');
        recommendations.push('Add better error messages');
        recommendations.push('Implement progressive enhancement');
        break;
    }

    return recommendations;
  }

  private analyzeCorrelations(): void {
    const recentEvents = this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const now = Date.now();
      return now - eventTime < 300000; // Last 5 minutes
    });

    // Pattern detection
    this.detectErrorPatterns(recentEvents);
    this.detectPerformancePatterns(recentEvents);
    this.detectUserJourneyPatterns(recentEvents);
  }

  private detectErrorPatterns(events: DebugEvent[]): void {
    const errorMessages = new Map<string, DebugEvent[]>();
    
    events
      .filter(e => e.severity === 'high' || e.severity === 'critical')
      .forEach(event => {
        const key = event.message;
        if (!errorMessages.has(key)) {
          errorMessages.set(key, []);
        }
        errorMessages.get(key)!.push(event);
      });

    // Find repeated errors
    errorMessages.forEach((eventList, message) => {
      if (eventList.length >= 3) { // 3+ occurrences
        this.createCorrelation('error_chain', eventList.slice(-3), 0.9,
          `Repeated error pattern detected: ${message}`);
      }
    });
  }

  private detectPerformancePatterns(events: DebugEvent[]): void {
    const performanceEvents = events.filter(e => e.type === 'performance' || e.type === 'network');
    
    // Detect slow requests pattern
    const slowRequests = performanceEvents.filter(e => 
      e.metadata?.duration && e.metadata.duration > 2000
    );

    if (slowRequests.length >= 2) {
      this.createCorrelation('performance_impact', slowRequests.slice(-2), 0.7,
        'Multiple slow operations detected');
    }
  }

  private detectUserJourneyPatterns(events: DebugEvent[]): void {
    // Group events by user session/journey
    const journeyEvents = events.filter(e => 
      e.type === 'auth' || e.type === 'network' || (e.type === 'error' && e.severity === 'high')
    );

    if (journeyEvents.length >= 3) {
      // Check for auth -> error -> network pattern
      const authEvents = journeyEvents.filter(e => e.type === 'auth');
      const errorEvents = journeyEvents.filter(e => e.type === 'error');
      const networkEvents = journeyEvents.filter(e => e.type === 'network');

      if (authEvents.length > 0 && errorEvents.length > 0 && networkEvents.length > 0) {
        this.createCorrelation('user_journey', 
          [authEvents[0], errorEvents[0], networkEvents[0]], 
          0.6, 'User journey disruption detected');
      }
    }
  }

  private updateSessionSummary(session: DebugSession): void {
    const events = session.events;
    
    session.summary = {
      totalEvents: events.length,
      errorCount: events.filter(e => e.severity === 'high' || e.severity === 'critical').length,
      warningCount: events.filter(e => e.severity === 'medium').length,
      networkFailures: events.filter(e => e.type === 'network' && e.severity === 'high').length,
      averageResponseTime: this.calculateAverageResponseTime(events),
      memoryPeakUsage: this.calculatePeakMemoryUsage(events),
    };

    session.patterns = {
      frequentErrors: this.getFrequentErrors(events),
      slowRequests: this.getSlowRequests(events),
      memoryLeaks: this.detectMemoryLeaks(events),
    };
  }

  private calculateAverageResponseTime(events: DebugEvent[]): number {
    const networkEvents = events.filter(e => e.type === 'network' && e.metadata?.duration);
    if (networkEvents.length === 0) return 0;
    
    const totalTime = networkEvents.reduce((sum, e) => sum + (e.metadata!.duration || 0), 0);
    return Math.round(totalTime / networkEvents.length);
  }

  private calculatePeakMemoryUsage(events: DebugEvent[]): number | undefined {
    const memoryEvents = events.filter(e => e.metadata?.performance?.memory);
    if (memoryEvents.length === 0) return undefined;
    
    return Math.max(...memoryEvents.map(e => e.metadata!.performance!.memory));
  }

  private getFrequentErrors(events: DebugEvent[]): Array<{ message: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    events
      .filter(e => e.severity === 'high' || e.severity === 'critical')
      .forEach(event => {
        const count = errorCounts.get(event.message) || 0;
        errorCounts.set(event.message, count + 1);
      });

    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getSlowRequests(events: DebugEvent[]): Array<{ url: string; duration: number }> {
    return events
      .filter(e => e.type === 'network' && e.metadata?.duration && e.metadata.duration > 1000)
      .map(e => ({
        url: e.data.url || e.message,
        duration: e.metadata!.duration!,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }

  private detectMemoryLeaks(events: DebugEvent[]): Array<{ component: string; growth: number }> {
    // Simple memory leak detection based on component memory growth
    const componentMemory = new Map<string, number[]>();
    
    events
      .filter(e => e.metadata?.performance?.memory && e.context?.component)
      .forEach(event => {
        const component = event.context!.component!;
        if (!componentMemory.has(component)) {
          componentMemory.set(component, []);
        }
        componentMemory.get(component)!.push(event.metadata!.performance!.memory);
      });

    const leaks: Array<{ component: string; growth: number }> = [];
    
    componentMemory.forEach((memoryValues, component) => {
      if (memoryValues.length >= 3) {
        const start = memoryValues[0];
        const end = memoryValues[memoryValues.length - 1];
        const growth = ((end - start) / start) * 100;
        
        if (growth > 50) { // 50% memory growth
          leaks.push({ component, growth: Math.round(growth) });
        }
      }
    });

    return leaks.sort((a, b) => b.growth - a.growth).slice(0, 3);
  }

  private notifySubscribers(event: DebugEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in debug subscriber:', error);
      }
    });
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const recentEvents = this.events.slice(-100); // Store last 100 events
      const recentCorrelations = this.correlations.slice(-20); // Store last 20 correlations
      
      localStorage.setItem('revivatech_debug_integration', JSON.stringify({
        events: recentEvents,
        correlations: recentCorrelations,
        sessionId: this.currentSessionId,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      // Storage full or unavailable
    }
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('revivatech_debug_integration');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.correlations = data.correlations || [];
        
        // Start new session but preserve old events
        this.startSession();
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  private startSession(): void {
    const session: DebugSession = {
      sessionId: this.currentSessionId,
      startTime: new Date().toISOString(),
      events: [],
      summary: {
        totalEvents: 0,
        errorCount: 0,
        warningCount: 0,
        networkFailures: 0,
        averageResponseTime: 0,
      },
      patterns: {
        frequentErrors: [],
        slowRequests: [],
        memoryLeaks: [],
      },
    };

    this.sessions.set(this.currentSessionId, session);
  }

  private generateSessionId(): string {
    return `debug_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `debug_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `debug_corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API

  /**
   * Get all debug events
   */
  getEvents(limit?: number, type?: DebugEvent['type']): DebugEvent[] {
    let events = type ? this.events.filter(e => e.type === type) : this.events;
    return limit ? events.slice(-limit) : [...events];
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: DebugEvent['severity']): DebugEvent[] {
    return this.events.filter(e => e.severity === severity);
  }

  /**
   * Get current session
   */
  getCurrentSession(): DebugSession | undefined {
    return this.sessions.get(this.currentSessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get correlations
   */
  getCorrelations(limit?: number): DebugCorrelation[] {
    return limit ? this.correlations.slice(-limit) : [...this.correlations];
  }

  /**
   * Get debug analytics
   */
  getAnalytics(timeRange?: { start: string; end: string }): DebugAnalytics {
    let events = this.events;
    
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      events = events.filter(e => {
        const eventTime = new Date(e.timestamp).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }

    const analytics: DebugAnalytics = {
      timeRange: timeRange || {
        start: events.length > 0 ? events[0].timestamp : new Date().toISOString(),
        end: events.length > 0 ? events[events.length - 1].timestamp : new Date().toISOString(),
      },
      totalEvents: events.length,
      eventsByType: this.groupEventsByType(events),
      eventsBySeverity: this.groupEventsBySeverity(events),
      topErrors: this.getTopErrors(events),
      topComponents: this.getTopComponents(events),
      networkStats: this.getNetworkStats(events),
      performanceTrends: this.getPerformanceTrends(events),
      userImpact: this.getUserImpact(events),
    };

    return analytics;
  }

  private groupEventsByType(events: DebugEvent[]): Record<DebugEvent['type'], number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<DebugEvent['type'], number>);
  }

  private groupEventsBySeverity(events: DebugEvent[]): Record<DebugEvent['severity'], number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<DebugEvent['severity'], number>);
  }

  private getTopErrors(events: DebugEvent[]): Array<{ message: string; count: number; impact: string }> {
    const errorCounts = new Map<string, number>();
    
    events
      .filter(e => e.severity === 'high' || e.severity === 'critical')
      .forEach(event => {
        const count = errorCounts.get(event.message) || 0;
        errorCounts.set(event.message, count + 1);
      });

    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({
        message,
        count,
        impact: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopComponents(events: DebugEvent[]): Array<{ component: string; errorCount: number; logCount: number }> {
    const componentStats = new Map<string, { errorCount: number; logCount: number }>();
    
    events
      .filter(e => e.context?.component)
      .forEach(event => {
        const component = event.context!.component!;
        if (!componentStats.has(component)) {
          componentStats.set(component, { errorCount: 0, logCount: 0 });
        }
        
        const stats = componentStats.get(component)!;
        if (event.severity === 'high' || event.severity === 'critical') {
          stats.errorCount++;
        }
        if (event.type === 'console') {
          stats.logCount++;
        }
      });

    return Array.from(componentStats.entries())
      .map(([component, stats]) => ({ component, ...stats }))
      .sort((a, b) => (b.errorCount + b.logCount) - (a.errorCount + a.logCount))
      .slice(0, 10);
  }

  private getNetworkStats(events: DebugEvent[]) {
    const networkEvents = events.filter(e => e.type === 'network');
    const failedRequests = networkEvents.filter(e => e.severity === 'high');
    
    const totalDuration = networkEvents
      .filter(e => e.metadata?.duration)
      .reduce((sum, e) => sum + (e.metadata!.duration || 0), 0);
      
    const averageResponseTime = networkEvents.length > 0 ? totalDuration / networkEvents.length : 0;
    
    // Get slowest endpoints
    const endpointTimes = new Map<string, number[]>();
    networkEvents
      .filter(e => e.metadata?.duration)
      .forEach(event => {
        const url = new URL(event.data.url || event.message).pathname;
        if (!endpointTimes.has(url)) {
          endpointTimes.set(url, []);
        }
        endpointTimes.get(url)!.push(event.metadata!.duration!);
      });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([url, times]) => ({
        url,
        avgDuration: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalRequests: networkEvents.length,
      failureRate: networkEvents.length > 0 ? (failedRequests.length / networkEvents.length) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime),
      slowestEndpoints,
    };
  }

  private getPerformanceTrends(events: DebugEvent[]) {
    const performanceEvents = events
      .filter(e => e.metadata?.performance)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const memoryUsage = performanceEvents
      .filter(e => e.metadata?.performance?.memory)
      .map(e => ({
        timestamp: e.timestamp,
        usage: Math.round(e.metadata!.performance!.memory / 1024 / 1024), // MB
      }));

    const networkEvents = events
      .filter(e => e.type === 'network' && e.metadata?.duration)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Group by hour for trends
    const responseTimesByHour = new Map<string, number[]>();
    networkEvents.forEach(event => {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13);
      if (!responseTimesByHour.has(hour)) {
        responseTimesByHour.set(hour, []);
      }
      responseTimesByHour.get(hour)!.push(event.metadata!.duration!);
    });

    const responseTimesTrend = Array.from(responseTimesByHour.entries())
      .map(([timestamp, times]) => ({
        timestamp: timestamp + ':00:00.000Z',
        avgTime: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
      }));

    return {
      memoryUsage,
      responseTimesTrend,
    };
  }

  private getUserImpact(events: DebugEvent[]) {
    const userIds = new Set(events.map(e => e.userId).filter(Boolean));
    const criticalErrors = events.filter(e => e.severity === 'critical').length;
    
    // Simple user journey analysis
    const journeyIssues = new Map<string, number>();
    events
      .filter(e => e.type === 'auth' || (e.type === 'network' && e.severity === 'high'))
      .forEach(event => {
        const journey = event.type === 'auth' ? 'authentication' : 'api_requests';
        journeyIssues.set(journey, (journeyIssues.get(journey) || 0) + 1);
      });

    return {
      affectedUsers: userIds.size,
      criticalErrors,
      userJourneyIssues: Array.from(journeyIssues.entries())
        .map(([journey, issues]) => ({ journey, issues }))
        .sort((a, b) => b.issues - a.issues),
    };
  }

  /**
   * Subscribe to debug events
   */
  subscribe(callback: (event: DebugEvent) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all debug data
   */
  clear(): void {
    this.events = [];
    this.correlations = [];
    this.sessions.clear();
    this.startSession();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('revivatech_debug_integration');
    }
  }

  /**
   * Export all debug data
   */
  export(): string {
    return JSON.stringify({
      events: this.events,
      sessions: Array.from(this.sessions.values()),
      correlations: this.correlations,
      analytics: this.getAnalytics(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Create singleton instance
export const debugIntegration = new DebugIntegration();

// Convenience exports
export const getDebugEvents = (limit?: number, type?: DebugEvent['type']) => 
  debugIntegration.getEvents(limit, type);
export const getDebugAnalytics = () => debugIntegration.getAnalytics();
export const getDebugCorrelations = () => debugIntegration.getCorrelations();
export const subscribeToDebugEvents = (callback: (event: DebugEvent) => void) => 
  debugIntegration.subscribe(callback);
export const exportDebugData = () => debugIntegration.export();
export const clearDebugData = () => debugIntegration.clear();

export default debugIntegration;