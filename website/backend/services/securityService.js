const db = require('../config/database');
const auditLogger = require('./auditLogger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const moment = require('moment');

class SecurityService {
  constructor() {
    this.riskThresholds = {
      failedLogins: 5,
      suspiciousActivity: 3,
      criticalEvents: 1
    };
  }

  // Get security metrics for dashboard
  async getSecurityMetrics(timeRange = '24h') {
    try {
      const startTime = this.getStartTimeFromRange(timeRange);
      
      // Get session metrics
      const sessionMetrics = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
          COUNT(*) FILTER (WHERE status = 'suspicious') as suspicious_sessions,
          COUNT(*) as total_sessions,
          AVG(risk_score) as average_risk_score
        FROM sessions
        WHERE created_at >= $1
      `, [startTime]);

      // Get login metrics
      const loginMetrics = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE success = false) as failed_logins,
          COUNT(*) FILTER (WHERE success = true) as successful_logins
        FROM login_attempts
        WHERE created_at >= $1
      `, [startTime]);

      // Get security event metrics
      const eventMetrics = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
          COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged_alerts
        FROM security_alerts
        WHERE created_at >= $1
      `, [startTime]);

      // Get blocked IPs count
      const blockedIPs = await db.query(`
        SELECT COUNT(*) as blocked_ips
        FROM blocked_ips
        WHERE (expires_at IS NULL OR expires_at > NOW())
      `);

      // Get 2FA metrics
      const twoFactorMetrics = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE two_factor_enabled = true) as two_factor_enabled,
          COUNT(*) as total_users
        FROM users
      `);

      // Get trusted devices count
      const trustedDevices = await db.query(`
        SELECT COUNT(*) as trusted_devices
        FROM trusted_devices
        WHERE is_active = true
      `);

      return {
        totalSessions: parseInt(sessionMetrics.rows[0].total_sessions) || 0,
        activeSessions: parseInt(sessionMetrics.rows[0].active_sessions) || 0,
        suspiciousSessions: parseInt(sessionMetrics.rows[0].suspicious_sessions) || 0,
        averageRiskScore: Math.round(parseFloat(sessionMetrics.rows[0].average_risk_score) || 0),
        failedLogins: parseInt(loginMetrics.rows[0].failed_logins) || 0,
        successfulLogins: parseInt(loginMetrics.rows[0].successful_logins) || 0,
        criticalEvents: parseInt(eventMetrics.rows[0].critical_events) || 0,
        unacknowledgedAlerts: parseInt(eventMetrics.rows[0].unacknowledged_alerts) || 0,
        blockedIPs: parseInt(blockedIPs.rows[0].blocked_ips) || 0,
        twoFactorEnabled: parseInt(twoFactorMetrics.rows[0].two_factor_enabled) || 0,
        totalUsers: parseInt(twoFactorMetrics.rows[0].total_users) || 0,
        trustedDevices: parseInt(trustedDevices.rows[0].trusted_devices) || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  // Get security alerts
  async getSecurityAlerts(filters = {}) {
    try {
      let query = `
        SELECT 
          sa.*,
          u.email as user_email,
          u.name as user_name
        FROM security_alerts sa
        LEFT JOIN users u ON sa.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        query += ` AND sa.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.severity) {
        paramCount++;
        query += ` AND sa.severity = $${paramCount}`;
        params.push(filters.severity);
      }

      query += ` ORDER BY sa.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map(alert => ({
        id: alert.id,
        timestamp: alert.created_at,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        category: alert.category,
        acknowledged: alert.acknowledged,
        acknowledgedAt: alert.acknowledged_at,
        acknowledgedBy: alert.acknowledged_by,
        resolved: alert.resolved,
        resolvedAt: alert.resolved_at,
        resolvedBy: alert.resolved_by,
        resolution: alert.resolution,
        userId: alert.user_id,
        userEmail: alert.user_email,
        userName: alert.user_name,
        sessionId: alert.session_id,
        ipAddress: alert.ip_address,
        metadata: alert.metadata
      }));
    } catch (error) {
      console.error('Error getting security alerts:', error);
      throw error;
    }
  }

  // Get active sessions with security details
  async getActiveSessions(filters = {}) {
    try {
      let query = `
        SELECT 
          s.*,
          u.email as user_email,
          u.name as user_name,
          u.role as user_role,
          td.id as trusted_device_id
        FROM sessions s
        INNER JOIN users u ON s.user_id = u.id
        LEFT JOIN trusted_devices td ON s.device_fingerprint = td.device_fingerprint 
          AND td.user_id = s.user_id AND td.is_active = true
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (filters.userId) {
        paramCount++;
        query += ` AND s.user_id = $${paramCount}`;
        params.push(filters.userId);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND s.status = $${paramCount}`;
        params.push(filters.status);
      } else {
        query += ` AND s.status IN ('active', 'suspicious')`;
      }

      query += ` ORDER BY s.last_activity DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map(session => ({
        id: session.id,
        userId: session.user_id,
        userEmail: session.user_email,
        userName: session.user_name,
        userRole: session.user_role,
        deviceInfo: {
          userAgent: session.user_agent,
          ip: session.ip_address,
          browser: this.parseBrowser(session.user_agent),
          os: this.parseOS(session.user_agent),
          deviceFingerprint: session.device_fingerprint
        },
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at,
        status: session.status,
        securityLevel: session.security_level || 'medium',
        riskScore: session.risk_score || 0,
        activityCount: session.activity_count || 0,
        securityFlags: session.security_flags || [],
        trustedDevice: !!session.trusted_device_id,
        location: session.location || null
      }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  // Get audit logs
  async getAuditLogs(filters = {}) {
    try {
      let query = `
        SELECT 
          al.*,
          u.email as user_email,
          u.name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (filters.category) {
        paramCount++;
        query += ` AND al.category = $${paramCount}`;
        params.push(filters.category);
      }

      if (filters.level) {
        paramCount++;
        query += ` AND al.level = $${paramCount}`;
        params.push(filters.level);
      }

      if (filters.userId) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(filters.userId);
      }

      if (filters.startDate) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(filters.endDate);
      }

      if (filters.search) {
        paramCount++;
        query += ` AND (al.event_type ILIKE $${paramCount} OR al.details ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      query += ` ORDER BY al.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: log.level,
        category: log.category,
        eventType: log.event_type,
        userId: log.user_id,
        userEmail: log.user_email,
        userName: log.user_name,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        details: log.details,
        success: log.success,
        riskScore: log.risk_score || 0,
        metadata: log.metadata,
        correlationId: log.correlation_id,
        sessionId: log.session_id
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Get failed login attempts
  async getFailedLoginAttempts(filters = {}) {
    try {
      let query = `
        SELECT 
          la.*,
          u.email as user_email,
          u.name as user_name
        FROM login_attempts la
        LEFT JOIN users u ON la.user_id = u.id
        WHERE la.success = false
      `;
      const params = [];
      let paramCount = 0;

      if (filters.userId) {
        paramCount++;
        query += ` AND la.user_id = $${paramCount}`;
        params.push(filters.userId);
      }

      if (filters.ipAddress) {
        paramCount++;
        query += ` AND la.ip_address = $${paramCount}`;
        params.push(filters.ipAddress);
      }

      if (filters.startDate) {
        paramCount++;
        query += ` AND la.created_at >= $${paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        paramCount++;
        query += ` AND la.created_at <= $${paramCount}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY la.created_at DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows;
    } catch (error) {
      console.error('Error getting failed login attempts:', error);
      throw error;
    }
  }

  // Create security alert
  async createSecurityAlert(alertData) {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO security_alerts (
          id, title, description, severity, category, 
          user_id, session_id, ip_address, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const result = await db.query(query, [
        id,
        alertData.title,
        alertData.description,
        alertData.severity,
        alertData.category,
        alertData.userId || null,
        alertData.sessionId || null,
        alertData.ipAddress || null,
        JSON.stringify(alertData.metadata || {})
      ]);

      // Log the security alert
      await auditLogger.log({
        level: 'warning',
        category: 'security',
        eventType: 'SECURITY_ALERT_CREATED',
        details: `Security alert created: ${alertData.title}`,
        metadata: { alertId: id, severity: alertData.severity }
      });

      return result.rows[0];
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId, acknowledgedBy) {
    try {
      const query = `
        UPDATE security_alerts 
        SET acknowledged = true, 
            acknowledged_at = NOW(), 
            acknowledged_by = $1
        WHERE id = $2 AND acknowledged = false
        RETURNING *
      `;

      const result = await db.query(query, [acknowledgedBy, alertId]);

      if (result.rowCount > 0) {
        await auditLogger.log({
          level: 'info',
          category: 'security',
          eventType: 'SECURITY_ALERT_ACKNOWLEDGED',
          userId: acknowledgedBy,
          details: `Security alert acknowledged: ${alertId}`,
          metadata: { alertId }
        });
      }

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId, resolution, resolvedBy) {
    try {
      const query = `
        UPDATE security_alerts 
        SET resolved = true, 
            resolved_at = NOW(), 
            resolved_by = $1,
            resolution = $2,
            status = 'resolved'
        WHERE id = $3
        RETURNING *
      `;

      const result = await db.query(query, [resolvedBy, resolution, alertId]);

      if (result.rowCount > 0) {
        await auditLogger.log({
          level: 'info',
          category: 'security',
          eventType: 'SECURITY_ALERT_RESOLVED',
          userId: resolvedBy,
          details: `Security alert resolved: ${alertId}`,
          metadata: { alertId, resolution }
        });
      }

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Terminate session
  async terminateSession(sessionId, terminatedBy, reason) {
    try {
      const query = `
        UPDATE sessions 
        SET status = 'terminated', 
            terminated_at = NOW(), 
            terminated_by = $1,
            termination_reason = $2
        WHERE id = $3
        RETURNING *
      `;

      const result = await db.query(query, [terminatedBy, reason, sessionId]);

      if (result.rowCount > 0) {
        const session = result.rows[0];
        
        await auditLogger.log({
          level: 'warning',
          category: 'security',
          eventType: 'SESSION_TERMINATED',
          userId: terminatedBy,
          details: `Session terminated: ${sessionId}`,
          metadata: { 
            sessionId, 
            targetUserId: session.user_id,
            reason 
          }
        });

        // Create security alert for terminated session
        await this.createSecurityAlert({
          title: 'Session Terminated by Admin',
          description: `Session ${sessionId} was terminated. Reason: ${reason}`,
          severity: 'medium',
          category: 'session_security',
          userId: session.user_id,
          sessionId: sessionId
        });
      }

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  // Block IP address
  async blockIPAddress(ipAddress, reason, duration, blockedBy) {
    try {
      const id = uuidv4();
      const expiresAt = duration ? 
        moment().add(duration, 'hours').toDate() : 
        null; // null means permanent block

      const query = `
        INSERT INTO blocked_ips (
          id, ip_address, reason, blocked_by, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (ip_address) 
        DO UPDATE SET 
          reason = $3,
          blocked_by = $4,
          expires_at = $5,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await db.query(query, [
        id, ipAddress, reason, blockedBy, expiresAt
      ]);

      await auditLogger.log({
        level: 'warning',
        category: 'security',
        eventType: 'IP_ADDRESS_BLOCKED',
        userId: blockedBy,
        ipAddress: ipAddress,
        details: `IP address blocked: ${ipAddress}`,
        metadata: { reason, duration }
      });

      return result.rows[0];
    } catch (error) {
      console.error('Error blocking IP address:', error);
      throw error;
    }
  }

  // Unblock IP address
  async unblockIPAddress(ipAddress, unblockedBy) {
    try {
      const query = `
        DELETE FROM blocked_ips 
        WHERE ip_address = $1
        RETURNING *
      `;

      const result = await db.query(query, [ipAddress]);

      if (result.rowCount > 0) {
        await auditLogger.log({
          level: 'info',
          category: 'security',
          eventType: 'IP_ADDRESS_UNBLOCKED',
          userId: unblockedBy,
          ipAddress: ipAddress,
          details: `IP address unblocked: ${ipAddress}`
        });
      }

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error unblocking IP address:', error);
      throw error;
    }
  }

  // Export audit logs
  async exportAuditLogs(filters = {}, format = 'csv') {
    try {
      const auditLogs = await this.getAuditLogs({ ...filters, limit: 10000 });

      if (format === 'csv') {
        const csvHeader = 'Timestamp,Level,Category,Event Type,User,IP Address,Details,Success,Risk Score\n';
        const csvData = auditLogs.map(log => 
          `"${log.timestamp}","${log.level}","${log.category}","${log.eventType}","${log.userEmail || 'System'}","${log.ipAddress || ''}","${log.details}","${log.success}","${log.riskScore}"`
        ).join('\n');

        return {
          data: csvHeader + csvData,
          filename: `security-audit-logs-${moment().format('YYYY-MM-DD')}.csv`,
          contentType: 'text/csv'
        };
      } else {
        return {
          data: JSON.stringify(auditLogs, null, 2),
          filename: `security-audit-logs-${moment().format('YYYY-MM-DD')}.json`,
          contentType: 'application/json'
        };
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // Get security configuration
  async getSecurityConfig() {
    try {
      const query = `
        SELECT * FROM security_config 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await db.query(query);

      if (result.rows.length === 0) {
        // Return default config
        return {
          maxFailedLogins: 5,
          sessionTimeout: 3600, // 1 hour
          passwordMinLength: 8,
          requireTwoFactor: false,
          ipBlockDuration: 24, // hours
          suspiciousActivityThreshold: 3,
          auditLogRetention: 90, // days
          alertEmailEnabled: true,
          riskScoreThresholds: {
            low: 30,
            medium: 60,
            high: 80,
            critical: 90
          }
        };
      }

      return result.rows[0].config;
    } catch (error) {
      console.error('Error getting security config:', error);
      throw error;
    }
  }

  // Update security configuration
  async updateSecurityConfig(config, updatedBy) {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO security_config (
          id, config, updated_by, is_active, created_at
        ) VALUES ($1, $2, $3, true, NOW())
        RETURNING *
      `;

      // Deactivate previous configs
      await db.query('UPDATE security_config SET is_active = false WHERE is_active = true');

      const result = await db.query(query, [
        id,
        JSON.stringify(config),
        updatedBy
      ]);

      await auditLogger.log({
        level: 'info',
        category: 'security',
        eventType: 'SECURITY_CONFIG_UPDATED',
        userId: updatedBy,
        details: 'Security configuration updated',
        metadata: { configId: id }
      });

      return result.rows[0];
    } catch (error) {
      console.error('Error updating security config:', error);
      throw error;
    }
  }

  // Monitor for suspicious activity
  async checkForSuspiciousActivity(userId, sessionId, activity) {
    try {
      // Check recent failed logins
      const recentFailedLogins = await db.query(`
        SELECT COUNT(*) as count 
        FROM login_attempts 
        WHERE user_id = $1 
          AND success = false 
          AND created_at > NOW() - INTERVAL '1 hour'
      `, [userId]);

      // Check unusual activity patterns
      const unusualActivity = await db.query(`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE user_id = $1 
          AND risk_score > 70 
          AND created_at > NOW() - INTERVAL '1 hour'
      `, [userId]);

      const failedLoginCount = parseInt(recentFailedLogins.rows[0].count);
      const suspiciousActivityCount = parseInt(unusualActivity.rows[0].count);

      if (failedLoginCount >= this.riskThresholds.failedLogins) {
        await this.createSecurityAlert({
          title: 'Multiple Failed Login Attempts',
          description: `User ${userId} has ${failedLoginCount} failed login attempts in the last hour`,
          severity: 'high',
          category: 'authentication',
          userId: userId,
          sessionId: sessionId
        });
      }

      if (suspiciousActivityCount >= this.riskThresholds.suspiciousActivity) {
        await this.createSecurityAlert({
          title: 'Suspicious Activity Detected',
          description: `User ${userId} has triggered ${suspiciousActivityCount} high-risk events`,
          severity: 'critical',
          category: 'security',
          userId: userId,
          sessionId: sessionId
        });

        // Update session status to suspicious
        await db.query(`
          UPDATE sessions 
          SET status = 'suspicious', 
              risk_score = risk_score + 20 
          WHERE id = $1
        `, [sessionId]);
      }

      return {
        failedLogins: failedLoginCount,
        suspiciousActivities: suspiciousActivityCount,
        isHighRisk: failedLoginCount >= this.riskThresholds.failedLogins || 
                    suspiciousActivityCount >= this.riskThresholds.suspiciousActivity
      };
    } catch (error) {
      console.error('Error checking for suspicious activity:', error);
      throw error;
    }
  }

  // Helper methods
  getStartTimeFromRange(timeRange) {
    const now = moment();
    switch (timeRange) {
      case '1h':
        return now.subtract(1, 'hour').toDate();
      case '24h':
        return now.subtract(24, 'hours').toDate();
      case '7d':
        return now.subtract(7, 'days').toDate();
      case '30d':
        return now.subtract(30, 'days').toDate();
      default:
        return now.subtract(24, 'hours').toDate();
    }
  }

  parseBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  parseOS(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }
}

module.exports = new SecurityService();