/**
 * Authentication Logger
 * Comprehensive logging and monitoring for authentication events
 */

export interface AuthLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  userId?: string;
  email?: string;
  details?: any;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
}

export interface AuthMetrics {
  loginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  errors: number;
  lastActivity: string;
  sessionDuration?: number;
}

class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private metrics: AuthMetrics = {
    loginAttempts: 0,
    successfulLogins: 0,
    failedLogins: 0,
    errors: 0,
    lastActivity: new Date().toISOString(),
  };
  private maxLogs = 1000; // Keep last 1000 log entries
  private sessionStartTime?: number;

  /**
   * Log authentication event
   */
  log(level: AuthLogEntry['level'], event: string, details?: any, userId?: string, email?: string): void {
    const entry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      userId,
      email,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.getSessionId(),
    };

    // Add to logs array
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update metrics
    this.updateMetrics(level, event);

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'debug' ? 'debug' : 'log';
      
      console[consoleMethod](`[AUTH ${level.toUpperCase()}] ${event}`, {
        timestamp: entry.timestamp,
        userId,
        email,
        details,
      });
    }

    // Store in localStorage for persistence
    this.persistLogs();
  }

  /**
   * Log info level event
   */
  info(event: string, details?: any, userId?: string, email?: string): void {
    this.log('info', event, details, userId, email);
  }

  /**
   * Log warning level event
   */
  warn(event: string, details?: any, userId?: string, email?: string): void {
    this.log('warn', event, details, userId, email);
  }

  /**
   * Log error level event
   */
  error(event: string, details?: any, userId?: string, email?: string): void {
    this.log('error', event, details, userId, email);
  }

  /**
   * Log debug level event
   */
  debug(event: string, details?: any, userId?: string, email?: string): void {
    this.log('debug', event, details, userId, email);
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(email: string, success: boolean, details?: any): void {
    if (success) {
      this.info('LOGIN_SUCCESS', details, undefined, email);
      this.sessionStartTime = Date.now();
    } else {
      this.warn('LOGIN_FAILED', details, undefined, email);
    }
  }

  /**
   * Log logout event
   */
  logLogout(userId?: string, email?: string): void {
    const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : undefined;
    this.info('LOGOUT', { sessionDuration }, userId, email);
    this.sessionStartTime = undefined;
  }

  /**
   * Log API request
   */
  logApiRequest(endpoint: string, method: string, success: boolean, details?: any): void {
    const event = success ? 'API_REQUEST_SUCCESS' : 'API_REQUEST_FAILED';
    const level = success ? 'debug' : 'warn';
    
    this.log(level, event, {
      endpoint,
      method,
      ...details,
    });
  }

  /**
   * Log token refresh
   */
  logTokenRefresh(success: boolean, details?: any): void {
    const event = success ? 'TOKEN_REFRESH_SUCCESS' : 'TOKEN_REFRESH_FAILED';
    const level = success ? 'debug' : 'error';
    
    this.log(level, event, details);
  }

  /**
   * Log permission check
   */
  logPermissionCheck(resource: string, action: string, granted: boolean, userId?: string): void {
    this.debug('PERMISSION_CHECK', {
      resource,
      action,
      granted,
    }, userId);
  }

  /**
   * Get current metrics
   */
  getMetrics(): AuthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent logs
   */
  getLogs(limit?: number): AuthLogEntry[] {
    return limit ? this.logs.slice(-limit) : [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: AuthLogEntry['level']): AuthLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by event type
   */
  getLogsByEvent(event: string): AuthLogEntry[] {
    return this.logs.filter(log => log.event === event);
  }

  /**
   * Get logs for specific user
   */
  getLogsByUser(userId: string): AuthLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs within time range
   */
  getLogsByTimeRange(startTime: string, endTime: string): AuthLogEntry[] {
    return this.logs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.metrics = {
      loginAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      errors: 0,
      lastActivity: new Date().toISOString(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('revivatech_auth_logs');
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(): string {
    const totalLogs = this.logs.length;
    const errorLogs = this.getLogsByLevel('error').length;
    const warnLogs = this.getLogsByLevel('warn').length;
    const recentLogs = this.getLogs(10);

    const lines = [
      '=== Authentication Log Summary ===',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Metrics:',
      `- Total Log Entries: ${totalLogs}`,
      `- Login Attempts: ${this.metrics.loginAttempts}`,
      `- Successful Logins: ${this.metrics.successfulLogins}`,
      `- Failed Logins: ${this.metrics.failedLogins}`,
      `- Errors: ${this.metrics.errors}`,
      `- Last Activity: ${this.metrics.lastActivity}`,
      '',
      'Log Level Distribution:',
      `- Errors: ${errorLogs}`,
      `- Warnings: ${warnLogs}`,
      `- Info: ${this.getLogsByLevel('info').length}`,
      `- Debug: ${this.getLogsByLevel('debug').length}`,
      '',
      'Recent Activity (Last 10 entries):',
      '=====================================',
    ];

    recentLogs.forEach((log, index) => {
      lines.push(`${index + 1}. [${log.level.toUpperCase()}] ${log.timestamp}`);
      lines.push(`   Event: ${log.event}`);
      if (log.email) lines.push(`   Email: ${log.email}`);
      if (log.userId) lines.push(`   User ID: ${log.userId}`);
      if (log.details) lines.push(`   Details: ${JSON.stringify(log.details)}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Update metrics based on log entry
   */
  private updateMetrics(level: AuthLogEntry['level'], event: string): void {
    this.metrics.lastActivity = new Date().toISOString();

    if (event === 'LOGIN_ATTEMPT' || event === 'LOGIN_SUCCESS' || event === 'LOGIN_FAILED') {
      this.metrics.loginAttempts++;
    }

    if (event === 'LOGIN_SUCCESS') {
      this.metrics.successfulLogins++;
    }

    if (event === 'LOGIN_FAILED') {
      this.metrics.failedLogins++;
    }

    if (level === 'error') {
      this.metrics.errors++;
    }
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('revivatech_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('revivatech_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const logData = {
        logs: this.logs.slice(-100), // Keep only last 100 logs in storage
        metrics: this.metrics,
        lastUpdated: new Date().toISOString(),
      };
      
      localStorage.setItem('revivatech_auth_logs', JSON.stringify(logData));
    } catch (error) {
      console.warn('Failed to persist auth logs:', error);
    }
  }

  /**
   * Load persisted logs
   */
  private loadPersistedLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('revivatech_auth_logs');
      if (stored) {
        const logData = JSON.parse(stored);
        this.logs = logData.logs || [];
        this.metrics = { ...this.metrics, ...logData.metrics };
      }
    } catch (error) {
      console.warn('Failed to load persisted auth logs:', error);
    }
  }

  /**
   * Initialize logger
   */
  init(): void {
    this.loadPersistedLogs();
    this.info('AUTH_LOGGER_INITIALIZED', {
      logsCount: this.logs.length,
      metrics: this.metrics,
    });
  }
}

// Create singleton instance
export const authLogger = new AuthLogger();

// Initialize on import
if (typeof window !== 'undefined') {
  authLogger.init();
}