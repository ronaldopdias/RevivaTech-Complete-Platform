/**
 * Better Auth Logger - Simple Implementation
 * Provides basic logging for authentication events
 * Simplified replacement for removed auth-logger module
 */

export interface AuthLogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  event: string
  message: string
  metadata?: Record<string, any>
  user?: {
    id?: string
    email?: string
  }
}

export interface AuthMetrics {
  totalLogs: number
  errorCount: number
  warningCount: number
  infoCount: number
  recentErrors: number
}

class SimpleAuthLogger {
  private logs: AuthLogEntry[] = []
  private maxLogs = 1000

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private addLog(level: AuthLogEntry['level'], event: string, message: string, metadata?: Record<string, any>, user?: AuthLogEntry['user']): void {
    const entry: AuthLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      metadata,
      user
    }

    this.logs.unshift(entry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
  }

  info(event: string, metadata?: Record<string, any>): void {
    this.addLog('info', event, `Info: ${event}`, metadata)
  }

  warn(event: string, metadata?: Record<string, any>): void {
    this.addLog('warn', event, `Warning: ${event}`, metadata)
  }

  error(event: string, metadata?: Record<string, any>): void {
    this.addLog('error', event, `Error: ${event}`, metadata)
  }

  debug(event: string, metadata?: Record<string, any>): void {
    this.addLog('debug', event, `Debug: ${event}`, metadata)
  }

  getRecentLogs(count: number = 50): AuthLogEntry[] {
    return this.logs.slice(0, count)
  }

  getUserLogs(email: string, count: number = 50): AuthLogEntry[] {
    return this.logs
      .filter(log => log.user?.email === email)
      .slice(0, count)
  }

  getErrorLogs(count: number = 50): AuthLogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(0, count)
  }

  getLogs(count: number = 50): AuthLogEntry[] {
    return this.getRecentLogs(count)
  }

  getLogsByEvent(event: string): AuthLogEntry[] {
    return this.logs.filter(log => log.event === event)
  }

  getMetrics(): AuthMetrics {
    const totalLogs = this.logs.length
    const errorCount = this.logs.filter(log => log.level === 'error').length
    const warningCount = this.logs.filter(log => log.level === 'warn').length
    const infoCount = this.logs.filter(log => log.level === 'info').length
    
    // Count recent errors (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const recentErrors = this.logs.filter(
      log => log.level === 'error' && new Date(log.timestamp) > yesterday
    ).length

    return {
      totalLogs,
      errorCount,
      warningCount,
      infoCount,
      recentErrors
    }
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Export singleton instance
export const authLogger = new SimpleAuthLogger()
export type { AuthLogEntry, AuthMetrics }