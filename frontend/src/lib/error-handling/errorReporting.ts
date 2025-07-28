interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  environment: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: string;
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorReportingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private userId?: string;
  private sessionId: string;
  private buildVersion: string;
  private environment: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || 'development';
    this.environment = process.env.NODE_ENV || 'development';
    
    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          severity: 'high',
          context: {
            type: 'unhandledrejection',
            reason: event.reason,
          },
        }
      );
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        severity: 'high',
        context: {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Track resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.addBreadcrumb({
          message: `Resource failed to load: ${(event.target as any)?.src || (event.target as any)?.href}`,
          category: 'resource',
          level: 'error',
          data: {
            tagName: (event.target as any)?.tagName,
            src: (event.target as any)?.src,
            href: (event.target as any)?.href,
          },
        });
      }
    }, true);
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const timestampedBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    };

    this.breadcrumbs.push(timestampedBreadcrumb);
    
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  async reportError(
    error: Error,
    options: {
      severity?: ErrorReport['severity'];
      context?: Record<string, any>;
      tags?: string[];
    } = {}
  ) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      environment: this.environment,
      severity: options.severity || 'medium',
      context: {
        ...options.context,
        tags: options.tags,
      },
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add to breadcrumbs
    this.addBreadcrumb({
      message: `Error reported: ${error.message}`,
      category: 'error',
      level: 'error',
      data: { severity: errorReport.severity },
    });

    try {
      // Send to backend error reporting endpoint
      await this.sendErrorReport(errorReport);
      
      // Also log to console in development
      if (this.environment === 'development') {
        console.group('🐛 Error Report');
        console.error('Error:', error);
        console.log('Report:', errorReport);
        console.groupEnd();
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      
      // Fallback: store in localStorage for later
      this.storeErrorForLater(errorReport);
    }
  }

  private async sendErrorReport(errorReport: ErrorReport) {
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.status}`);
    }
  }

  private storeErrorForLater(errorReport: ErrorReport) {
    try {
      const stored = localStorage.getItem('pending_error_reports');
      const reports = stored ? JSON.parse(stored) : [];
      reports.push(errorReport);
      
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }
      
      localStorage.setItem('pending_error_reports', JSON.stringify(reports));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }
  }

  async sendPendingReports() {
    try {
      const stored = localStorage.getItem('pending_error_reports');
      if (!stored) return;

      const reports = JSON.parse(stored);
      if (reports.length === 0) return;

      for (const report of reports) {
        try {
          await this.sendErrorReport(report);
        } catch (error) {
          console.error('Failed to send pending error report:', error);
        }
      }

      localStorage.removeItem('pending_error_reports');
    } catch (error) {
      console.error('Failed to process pending error reports:', error);
    }
  }

  // Track user interactions for better error context
  trackInteraction(action: string, element?: string, data?: Record<string, any>) {
    this.addBreadcrumb({
      message: `User ${action}${element ? ` on ${element}` : ''}`,
      category: 'user_interaction',
      level: 'info',
      data,
    });
  }

  // Track API calls
  trackApiCall(method: string, url: string, status?: number, duration?: number) {
    this.addBreadcrumb({
      message: `API ${method} ${url}${status ? ` (${status})` : ''}`,
      category: 'api',
      level: status && status >= 400 ? 'error' : 'info',
      data: { method, url, status, duration },
    });
  }

  // Track navigation
  trackNavigation(from: string, to: string) {
    this.addBreadcrumb({
      message: `Navigation from ${from} to ${to}`,
      category: 'navigation',
      level: 'info',
      data: { from, to },
    });
  }

  // Performance monitoring
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.addBreadcrumb({
      message: `Performance: ${metric} = ${value}${unit}`,
      category: 'performance',
      level: value > 1000 ? 'warning' : 'info',
      data: { metric, value, unit },
    });
  }

  // Clear breadcrumbs (useful for privacy)
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  // Get current breadcrumbs for debugging
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

// Create singleton instance
export const errorReporting = new ErrorReportingService();

// Convenience functions
export const reportError = (error: Error, options?: Parameters<typeof errorReporting.reportError>[1]) => {
  return errorReporting.reportError(error, options);
};

export const addBreadcrumb = (breadcrumb: Parameters<typeof errorReporting.addBreadcrumb>[0]) => {
  return errorReporting.addBreadcrumb(breadcrumb);
};

export const trackInteraction = (action: string, element?: string, data?: Record<string, any>) => {
  return errorReporting.trackInteraction(action, element, data);
};

export const trackApiCall = (method: string, url: string, status?: number, duration?: number) => {
  return errorReporting.trackApiCall(method, url, status, duration);
};

export const trackNavigation = (from: string, to: string) => {
  return errorReporting.trackNavigation(from, to);
};

export const trackPerformance = (metric: string, value: number, unit?: string) => {
  return errorReporting.trackPerformance(metric, value, unit);
};

export default errorReporting;