/**
 * Professional authentication logging utility for RevivaTech
 * Enterprise-grade logging for NextAuth.js operations
 */

export interface AuthLogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  event: string
  details: any
  userEmail?: string
  sessionId?: string
}

class AuthLogger {
  private logs: AuthLogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 log entries

  private log(level: AuthLogEntry['level'], event: string, details: any, userEmail?: string, sessionId?: string) {
    const entry: AuthLogEntry = {
      timestamp: new Date(),
      level,
      event,
      details,
      userEmail,
      sessionId
    }

    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console logging with proper formatting
    const prefix = `[NextAuth][${level.toUpperCase()}][${event}]`
    const message = `${prefix} ${userEmail ? `(${userEmail})` : ''}`
    
    switch (level) {
      case 'error':
        console.error(message, details)
        break
      case 'warn':
        console.warn(message, details)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(message, details)
        }
        break
      default:
        console.log(message, details)
    }
  }

  info(event: string, details: any, userEmail?: string, sessionId?: string) {
    this.log('info', event, details, userEmail, sessionId)
  }

  warn(event: string, details: any, userEmail?: string, sessionId?: string) {
    this.log('warn', event, details, userEmail, sessionId)
  }

  error(event: string, details: any, userEmail?: string, sessionId?: string) {
    this.log('error', event, details, userEmail, sessionId)
  }

  debug(event: string, details: any, userEmail?: string, sessionId?: string) {
    this.log('debug', event, details, userEmail, sessionId)
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): AuthLogEntry[] {
    return this.logs.slice(-count)
  }

  // Get logs for specific user
  getUserLogs(userEmail: string, count = 20): AuthLogEntry[] {
    return this.logs
      .filter(log => log.userEmail === userEmail)
      .slice(-count)
  }

  // Get error logs
  getErrorLogs(count = 20): AuthLogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count)
  }

  // Clear logs (for testing)
  clearLogs() {
    this.logs = []
  }
}

// Singleton instance
export const authLogger = new AuthLogger()

// Convenience functions for common auth events
export const logAuthAttempt = (email: string, success: boolean, error?: any) => {
  if (success) {
    authLogger.info('AUTH_ATTEMPT_SUCCESS', { email }, email)
  } else {
    authLogger.error('AUTH_ATTEMPT_FAILED', { email, error: error?.message || error }, email)
  }
}

export const logSessionCreated = (userEmail: string, sessionId: string) => {
  authLogger.info('SESSION_CREATED', { userEmail }, userEmail, sessionId)
}

export const logSessionDestroyed = (userEmail: string, sessionId: string) => {
  authLogger.info('SESSION_DESTROYED', { userEmail }, userEmail, sessionId)
}

export const logConfigurationError = (error: any) => {
  authLogger.error('CONFIGURATION_ERROR', { error: error?.message || error })
}

export const logNetworkError = (endpoint: string, error: any, userEmail?: string) => {
  authLogger.error('NETWORK_ERROR', { endpoint, error: error?.message || error }, userEmail)
}

export const logBackendError = (endpoint: string, status: number, response: any, userEmail?: string) => {
  authLogger.error('BACKEND_ERROR', { endpoint, status, response }, userEmail)
}

export const logCSRFError = (userEmail?: string) => {
  authLogger.error('CSRF_ERROR', { message: 'CSRF token validation failed' }, userEmail)
}

export const logDebugInfo = (event: string, details: any, userEmail?: string) => {
  authLogger.debug(event, details, userEmail)
}