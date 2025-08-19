/**
 * Comprehensive Authentication Logger for RevivaTech
 * Provides structured logging for all authentication events
 * Integrates with Better Auth system for security monitoring
 */

class AuthLogger {
  constructor() {
    this.logLevel = process.env.AUTH_LOG_LEVEL || 'info';
    this.enableConsole = process.env.AUTH_LOG_CONSOLE !== 'false';
    this.enableDatabase = process.env.AUTH_LOG_DATABASE !== 'false';
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(pool, eventType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: details.userId || null,
      email: details.email || null,
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null,
      sessionId: details.sessionId || null,
      success: details.success || false,
      errorCode: details.errorCode || null,
      errorMessage: details.errorMessage || null,
      metadata: details.metadata || {}
    };

    // Console logging with appropriate level
    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Database logging for audit trail
    if (this.enableDatabase && pool) {
      await this.logToDatabase(pool, logEntry);
    }

    return logEntry;
  }

  /**
   * Console logging with structured format
   */
  logToConsole(logEntry) {
    const { eventType, success, email, ipAddress, errorCode } = logEntry;
    const level = success ? 'info' : 'warn';
    const status = success ? '✅' : '❌';
    const message = `${status} [AUTH][${eventType.toUpperCase()}] ${email || 'Unknown'} from ${ipAddress || 'Unknown IP'}`;
    
    const details = {
      timestamp: logEntry.timestamp,
      eventType,
      success,
      ...(errorCode && { errorCode }),
      ...(logEntry.errorMessage && { error: logEntry.errorMessage }),
      ...(Object.keys(logEntry.metadata).length > 0 && { metadata: logEntry.metadata })
    };

    switch (level) {
      case 'error':
        console.error(message, details);
        break;
      case 'warn':
        console.warn(message, details);
        break;
      case 'info':
      default:
        console.info(message, details);
        break;
    }
  }

  /**
   * Database logging for audit trail
   */
  async logToDatabase(pool, logEntry) {
    try {
      const query = `
        INSERT INTO auth_events (
          event_type, user_id, email, ip_address, user_agent, 
          session_id, success, error_code, error_message, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await pool.query(query, [
        logEntry.eventType,
        logEntry.userId,
        logEntry.email,
        logEntry.ipAddress,
        logEntry.userAgent,
        logEntry.sessionId,
        logEntry.success,
        logEntry.errorCode,
        logEntry.errorMessage,
        JSON.stringify(logEntry.metadata),
        logEntry.timestamp
      ]);
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Auth logging to database failed:', error);
    }
  }

  /**
   * Specific logging methods for common auth events
   */
  
  async logSignIn(pool, { userId, email, ipAddress, userAgent, sessionId, success, errorCode, errorMessage, metadata = {} }) {
    return await this.logAuthEvent(pool, 'sign_in', {
      userId, email, ipAddress, userAgent, sessionId, success, errorCode, errorMessage, 
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logSignUp(pool, { userId, email, ipAddress, userAgent, success, errorCode, errorMessage, metadata = {} }) {
    return await this.logAuthEvent(pool, 'sign_up', {
      userId, email, ipAddress, userAgent, success, errorCode, errorMessage,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logSignOut(pool, { userId, email, ipAddress, userAgent, sessionId, success, metadata = {} }) {
    return await this.logAuthEvent(pool, 'sign_out', {
      userId, email, ipAddress, userAgent, sessionId, success: success !== false,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logSessionValidation(pool, { userId, email, sessionId, ipAddress, success, errorCode, metadata = {} }) {
    return await this.logAuthEvent(pool, 'session_validation', {
      userId, email, sessionId, ipAddress, success, errorCode,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logPasswordReset(pool, { userId, email, ipAddress, userAgent, success, errorCode, metadata = {} }) {
    return await this.logAuthEvent(pool, 'password_reset', {
      userId, email, ipAddress, userAgent, success, errorCode,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logEmailVerification(pool, { userId, email, ipAddress, success, errorCode, metadata = {} }) {
    return await this.logAuthEvent(pool, 'email_verification', {
      userId, email, ipAddress, success, errorCode,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  }

  async logSuspiciousActivity(pool, { userId, email, ipAddress, userAgent, activityType, metadata = {} }) {
    return await this.logAuthEvent(pool, 'suspicious_activity', {
      userId, email, ipAddress, userAgent, success: false,
      errorCode: 'SUSPICIOUS_ACTIVITY',
      errorMessage: `Suspicious activity detected: ${activityType}`,
      metadata: { ...metadata, activityType, severity: 'high', timestamp: Date.now() }
    });
  }

  async logRateLimitExceeded(pool, { email, ipAddress, userAgent, endpoint, metadata = {} }) {
    return await this.logAuthEvent(pool, 'rate_limit_exceeded', {
      email, ipAddress, userAgent, success: false,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorMessage: `Rate limit exceeded for endpoint: ${endpoint}`,
      metadata: { ...metadata, endpoint, severity: 'medium', timestamp: Date.now() }
    });
  }

  /**
   * Query authentication logs for analysis
   */
  async getAuthLogs(pool, filters = {}) {
    try {
      let query = `
        SELECT * FROM auth_events 
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (filters.userId) {
        query += ` AND user_id = $${++paramCount}`;
        params.push(filters.userId);
      }

      if (filters.email) {
        query += ` AND email = $${++paramCount}`;
        params.push(filters.email);
      }

      if (filters.eventType) {
        query += ` AND event_type = $${++paramCount}`;
        params.push(filters.eventType);
      }

      if (filters.ipAddress) {
        query += ` AND ip_address = $${++paramCount}`;
        params.push(filters.ipAddress);
      }

      if (filters.success !== undefined) {
        query += ` AND success = $${++paramCount}`;
        params.push(filters.success);
      }

      if (filters.startDate) {
        query += ` AND created_at >= $${++paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND created_at <= $${++paramCount}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Auth logs query failed:', error);
      return [];
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats(pool, timeframe = '24h') {
    try {
      let timeCondition;
      switch (timeframe) {
        case '1h':
          timeCondition = "created_at >= NOW() - INTERVAL '1 hour'";
          break;
        case '24h':
          timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
          break;
        default:
          timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
      }

      const query = `
        SELECT 
          event_type,
          success,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM auth_events 
        WHERE ${timeCondition}
        GROUP BY event_type, success
        ORDER BY event_type, success
      `;

      const result = await pool.query(query);
      
      // Process results into a more readable format
      const stats = {
        timeframe,
        events: {},
        totals: {
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          uniqueUsers: new Set(),
          uniqueIPs: new Set()
        }
      };

      result.rows.forEach(row => {
        const eventType = row.event_type;
        if (!stats.events[eventType]) {
          stats.events[eventType] = { successful: 0, failed: 0, uniqueUsers: 0, uniqueIPs: 0 };
        }

        if (row.success) {
          stats.events[eventType].successful = parseInt(row.count);
          stats.totals.successfulEvents += parseInt(row.count);
        } else {
          stats.events[eventType].failed = parseInt(row.count);
          stats.totals.failedEvents += parseInt(row.count);
        }

        stats.events[eventType].uniqueUsers = Math.max(stats.events[eventType].uniqueUsers, parseInt(row.unique_users));
        stats.events[eventType].uniqueIPs = Math.max(stats.events[eventType].uniqueIPs, parseInt(row.unique_ips));
        
        stats.totals.totalEvents += parseInt(row.count);
      });

      return stats;
    } catch (error) {
      console.error('Auth stats query failed:', error);
      return null;
    }
  }
}

// Export singleton instance
const authLogger = new AuthLogger();
module.exports = authLogger;