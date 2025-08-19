/**
 * Centralized Environment-Aware Logging Utility
 * Provides secure, production-safe logging for RevivaTech
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isDebugEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugEnabled = this.isDevelopment || process.env.ENABLE_DEBUG_LOGS === 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private sanitizeData(data: LogData): LogData {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
      
      // Sanitize nested objects
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  private shouldLog(level: LogLevel): boolean {
    switch (level) {
      case 'debug':
        return this.isDebugEnabled;
      case 'info':
        return this.isDevelopment;
      case 'warn':
      case 'error':
        return true;
      default:
        return false;
    }
  }

  debug(message: string, data?: LogData, context?: string): void {
    if (this.shouldLog('debug')) {
      const formattedMessage = this.formatMessage('debug', message, context);
      if (data) {
        console.log(formattedMessage, this.sanitizeData(data));
      } else {
        console.log(formattedMessage);
      }
    }
  }

  info(message: string, data?: LogData, context?: string): void {
    if (this.shouldLog('info')) {
      const formattedMessage = this.formatMessage('info', message, context);
      if (data) {
        console.info(formattedMessage, this.sanitizeData(data));
      } else {
        console.info(formattedMessage);
      }
    }
  }

  warn(message: string, data?: LogData, context?: string): void {
    if (this.shouldLog('warn')) {
      const formattedMessage = this.formatMessage('warn', message, context);
      if (data) {
        console.warn(formattedMessage, this.sanitizeData(data));
      } else {
        console.warn(formattedMessage);
      }
    }
  }

  error(message: string, error?: Error | LogData, context?: string): void {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message, context);
      if (error instanceof Error) {
        console.error(formattedMessage, {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : '[REDACTED]'
        });
      } else if (error) {
        console.error(formattedMessage, this.sanitizeData(error));
      } else {
        console.error(formattedMessage);
      }
    }
  }

  // Specialized auth logging methods
  auth = {
    debug: (message: string, data?: LogData) => this.debug(message, data, 'Auth'),
    info: (message: string, data?: LogData) => this.info(message, data, 'Auth'),
    warn: (message: string, data?: LogData) => this.warn(message, data, 'Auth'),
    error: (message: string, error?: Error | LogData) => this.error(message, error, 'Auth'),

    // Specific auth events
    signInAttempt: (email: string) => {
      this.debug('Sign-in attempt', { email: this.sanitizeEmail(email) }, 'Auth');
    },

    signInSuccess: (email: string, role?: string) => {
      this.info('Sign-in successful', { 
        email: this.sanitizeEmail(email), 
        role 
      }, 'Auth');
    },

    signInFailure: (email: string, reason: string) => {
      this.warn('Sign-in failed', { 
        email: this.sanitizeEmail(email), 
        reason 
      }, 'Auth');
    },

    signOut: (email?: string) => {
      this.info('User signed out', { 
        email: email ? this.sanitizeEmail(email) : 'unknown' 
      }, 'Auth');
    },

    roleRedirect: (role: string, path: string) => {
      this.debug('Role-based redirect', { role, path, timestamp: new Date().toISOString() }, 'Auth');
    },

    rolePolling: (attempt: number, found: boolean, role?: string) => {
      this.debug('Role polling attempt', { attempt, found, role }, 'Auth');
    },

    roleAvailable: (role: string, source: string, attempts: number) => {
      this.info('Role detected and available', { role, source, attempts }, 'Auth');
    },

    redirectTimingStart: () => {
      this.debug('Redirect timing started', { timestamp: Date.now() }, 'Auth');
    },

    redirectTimingEnd: (startTime: number, success: boolean, path?: string) => {
      const duration = Date.now() - startTime;
      this.debug('Redirect timing completed', { duration, success, path }, 'Auth');
    },

    sessionError: (error: string) => {
      this.error('Session error', { error }, 'Auth');
    }
  };

  private sanitizeEmail(email: string): string {
    if (!this.isDevelopment) {
      // In production, mask email for privacy
      const [username, domain] = email.split('@');
      if (username && domain) {
        const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return `${maskedUsername}@${domain}`;
      }
    }
    return email;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Named exports for convenience
export const authLogger = logger.auth;
export { logger };