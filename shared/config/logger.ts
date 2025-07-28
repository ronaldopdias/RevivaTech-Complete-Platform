import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getConfig } from './environment';

const config = getConfig();

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Pretty format for development
const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: config.LOG_FORMAT === 'pretty' ? prettyFormat : logFormat,
    level: config.LOG_LEVEL,
  })
);

// File transports for production
if (config.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      createSymlink: true,
      symlinkName: 'error.log',
    })
  );
  
  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      createSymlink: true,
      symlinkName: 'combined.log',
    })
  );
  
  // Access logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'access.log',
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'revivatech-api',
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
  },
  transports,
  // Exit on handled exceptions only in production
  exitOnError: config.NODE_ENV === 'production',
});

// Handle uncaught exceptions and unhandled rejections
if (config.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
  
  logger.rejections.handle(
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

// Performance logging utility
export class PerformanceLogger {
  private static timers: Map<string, number> = new Map();
  
  static start(operation: string): void {
    this.timers.set(operation, Date.now());
  }
  
  static end(operation: string, metadata?: any): void {
    const startTime = this.timers.get(operation);
    if (startTime) {
      const duration = Date.now() - startTime;
      logger.info('Performance metric', {
        operation,
        duration,
        ...metadata,
      });
      this.timers.delete(operation);
    }
  }
  
  static measure<T>(operation: string, fn: () => T, metadata?: any): T {
    this.start(operation);
    try {
      const result = fn();
      this.end(operation, metadata);
      return result;
    } catch (error) {
      this.end(operation, { ...metadata, error: true });
      throw error;
    }
  }
  
  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation, metadata);
      return result;
    } catch (error) {
      this.end(operation, { ...metadata, error: true });
      throw error;
    }
  }
}

// Security logging utility
export class SecurityLogger {
  static logAuthAttempt(email: string, success: boolean, ip: string, userAgent?: string): void {
    logger.info('Authentication attempt', {
      event: 'auth_attempt',
      email,
      success,
      ip,
      userAgent,
      security: true,
    });
  }
  
  static logPasswordReset(email: string, ip: string): void {
    logger.info('Password reset requested', {
      event: 'password_reset',
      email,
      ip,
      security: true,
    });
  }
  
  static logSuspiciousActivity(event: string, details: any, ip: string): void {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      activity: event,
      details,
      ip,
      security: true,
    });
  }
  
  static logDataAccess(userId: string, resource: string, action: string, ip: string): void {
    logger.info('Data access', {
      event: 'data_access',
      userId,
      resource,
      action,
      ip,
      security: true,
    });
  }
  
  static logPermissionDenied(userId: string, resource: string, action: string, ip: string): void {
    logger.warn('Permission denied', {
      event: 'permission_denied',
      userId,
      resource,
      action,
      ip,
      security: true,
    });
  }
}

// Business logging utility
export class BusinessLogger {
  static logBookingCreated(bookingId: string, userId: string, deviceType: string, serviceType: string): void {
    logger.info('Booking created', {
      event: 'booking_created',
      bookingId,
      userId,
      deviceType,
      serviceType,
      business: true,
    });
  }
  
  static logQuoteApproved(quoteId: string, userId: string, amount: number): void {
    logger.info('Quote approved', {
      event: 'quote_approved',
      quoteId,
      userId,
      amount,
      business: true,
    });
  }
  
  static logPaymentProcessed(paymentId: string, userId: string, amount: number, method: string): void {
    logger.info('Payment processed', {
      event: 'payment_processed',
      paymentId,
      userId,
      amount,
      method,
      business: true,
    });
  }
  
  static logRepairCompleted(repairId: string, userId: string, serviceType: string, duration: number): void {
    logger.info('Repair completed', {
      event: 'repair_completed',
      repairId,
      userId,
      serviceType,
      duration,
      business: true,
    });
  }
  
  static logCustomerFeedback(repairId: string, userId: string, rating: number, feedback?: string): void {
    logger.info('Customer feedback received', {
      event: 'customer_feedback',
      repairId,
      userId,
      rating,
      hasFeedback: !!feedback,
      business: true,
    });
  }
}

// API logging utility
export class ApiLogger {
  static logRequest(method: string, url: string, userId?: string, ip?: string, userAgent?: string): void {
    logger.http('API request', {
      method,
      url,
      userId,
      ip,
      userAgent,
    });
  }
  
  static logResponse(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    logger.http('API response', {
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  }
  
  static logError(method: string, url: string, error: Error, userId?: string, ip?: string): void {
    logger.error('API error', {
      method,
      url,
      error: error.message,
      stack: error.stack,
      userId,
      ip,
    });
  }
  
  static logRateLimitHit(ip: string, endpoint: string, limit: number): void {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      limit,
      security: true,
    });
  }
}

// Database logging utility
export class DatabaseLogger {
  static logQuery(query: string, duration: number, rowCount?: number): void {
    if (config.LOG_LEVEL === 'debug') {
      logger.debug('Database query', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        rowCount,
      });
    }
  }
  
  static logSlowQuery(query: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      logger.warn('Slow database query', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        threshold,
        performance: true,
      });
    }
  }
  
  static logConnection(event: 'connect' | 'disconnect' | 'error', details?: any): void {
    logger.info('Database connection', {
      event: `db_${event}`,
      details,
    });
  }
}

// Error logging with context
export function logError(error: Error, context?: any): void {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    context,
  });
}

// Create child logger with additional context
export function createChildLogger(context: any): winston.Logger {
  return logger.child(context);
}

// Health check for logging system
export function checkLoggerHealth(): { status: 'healthy' | 'unhealthy'; details: any } {
  try {
    const testMessage = 'Logger health check';
    logger.info(testMessage);
    
    return {
      status: 'healthy',
      details: {
        level: config.LOG_LEVEL,
        format: config.LOG_FORMAT,
        transports: transports.length,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export {
  logger as default,
  logger,
  PerformanceLogger,
  SecurityLogger,
  BusinessLogger,
  ApiLogger,
  DatabaseLogger,
};