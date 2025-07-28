/**
 * AlertManager.js - Advanced Alert Management System
 * Session 8: Performance & Monitoring Implementation
 * 
 * Features:
 * - Multi-channel alert delivery (email, Slack, webhook)
 * - Alert aggregation and deduplication
 * - Escalation policies and acknowledgments
 * - Alert correlation and pattern detection
 * - Performance-based alert tuning
 */

const EventEmitter = require('events');
const nodemailer = require('nodemailer');

class AlertManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Alert channels configuration
      channels: {
        email: {
          enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          },
          from: process.env.ALERT_FROM_EMAIL || 'alerts@revivatech.com',
          to: process.env.ALERT_TO_EMAIL?.split(',') || ['admin@revivatech.com']
        },
        
        slack: {
          enabled: process.env.SLACK_WEBHOOK_ENABLED === 'true',
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: 'RevivaTech Monitor'
        },
        
        webhook: {
          enabled: process.env.WEBHOOK_ENABLED === 'true',
          urls: process.env.WEBHOOK_URLS?.split(',') || [],
          timeout: 5000
        }
      },
      
      // Alert behavior
      alertBehavior: {
        aggregationWindow: 300000,    // 5 minutes
        deduplicationWindow: 1800000, // 30 minutes
        escalationDelay: 3600000,     // 1 hour
        maxAlertsPerHour: 20,
        retryAttempts: 3,
        retryDelay: 30000             // 30 seconds
      },
      
      // Alert rules
      alertRules: {
        critical: {
          channels: ['email', 'slack', 'webhook'],
          escalate: true,
          acknowledgmentRequired: true,
          suppressionTime: 900000 // 15 minutes
        },
        
        warning: {
          channels: ['slack'],
          escalate: false,
          acknowledgmentRequired: false,
          suppressionTime: 1800000 // 30 minutes
        },
        
        info: {
          channels: ['slack'],
          escalate: false,
          acknowledgmentRequired: false,
          suppressionTime: 3600000 // 1 hour
        }
      },
      
      ...config
    };

    // Alert state management
    this.activeAlerts = new Map();
    this.suppressedAlerts = new Map();
    this.alertHistory = [];
    this.acknowledgments = new Map();
    this.alertPatterns = new Map();
    
    // Rate limiting
    this.alertCounts = new Map();
    
    // Notification providers
    this.emailTransporter = null;
    
    this.init();
  }

  async init() {
    try {
      console.log('Initializing AlertManager...');
      
      // Setup email transporter
      if (this.config.channels.email.enabled) {
        await this.setupEmailTransporter();
      }
      
      // Start background processes
      this.startAlertProcessing();
      this.startCleanupTasks();
      
      console.log('AlertManager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AlertManager:', error);
      throw error;
    }
  }

  async setupEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter(this.config.channels.email.smtp);
      
      // Verify connection
      await this.emailTransporter.verify();
      console.log('Email transporter configured successfully');
      
    } catch (error) {
      console.error('Failed to setup email transporter:', error);
      this.config.channels.email.enabled = false;
    }
  }

  async sendAlert(alert) {
    try {
      // Validate alert
      const validatedAlert = this.validateAlert(alert);
      
      // Check if alert should be suppressed
      if (this.shouldSuppressAlert(validatedAlert)) {
        console.log(`Alert suppressed: ${validatedAlert.id}`);
        return { success: true, suppressed: true };
      }
      
      // Check rate limiting
      if (this.isRateLimited(validatedAlert)) {
        console.warn(`Alert rate limited: ${validatedAlert.id}`);
        return { success: false, reason: 'rate_limited' };
      }
      
      // Process alert
      const processedAlert = await this.processAlert(validatedAlert);
      
      // Store in active alerts
      this.activeAlerts.set(processedAlert.id, processedAlert);
      
      // Add to history
      this.alertHistory.push({
        ...processedAlert,
        action: 'triggered',
        timestamp: Date.now()
      });
      
      // Send notifications
      const results = await this.sendNotifications(processedAlert);
      
      // Update alert with delivery results
      processedAlert.deliveryResults = results;
      processedAlert.deliveredAt = Date.now();
      
      // Emit event
      this.emit('alertSent', processedAlert);
      
      return { success: true, alert: processedAlert, deliveryResults: results };
      
    } catch (error) {
      console.error('Failed to send alert:', error);
      this.emit('alertError', { alert, error: error.message });
      throw error;
    }
  }

  validateAlert(alert) {
    // Required fields
    const requiredFields = ['title', 'level', 'message'];
    for (const field of requiredFields) {
      if (!alert[field]) {
        throw new Error(`Missing required alert field: ${field}`);
      }
    }
    
    // Validate level
    const validLevels = ['critical', 'warning', 'info'];
    if (!validLevels.includes(alert.level)) {
      throw new Error(`Invalid alert level: ${alert.level}`);
    }
    
    // Generate alert ID if not provided
    const alertId = alert.id || this.generateAlertId(alert);
    
    // Create validated alert object
    return {
      ...alert,
      id: alertId,
      timestamp: alert.timestamp || Date.now(),
      source: alert.source || 'system',
      environment: process.env.NODE_ENV || 'development',
      hostname: require('os').hostname(),
      fingerprint: this.generateFingerprint(alert)
    };
  }

  generateAlertId(alert) {
    const crypto = require('crypto');
    const key = `${alert.title}_${alert.level}_${alert.source || 'system'}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
  }

  generateFingerprint(alert) {
    const crypto = require('crypto');
    const key = `${alert.title}_${alert.message}_${alert.source || 'system'}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  shouldSuppressAlert(alert) {
    // Check if alert is in suppression window
    const suppressed = this.suppressedAlerts.get(alert.fingerprint);
    if (suppressed && (Date.now() - suppressed.timestamp) < suppressed.duration) {
      return true;
    }
    
    // Check if identical alert was recently sent
    const existing = this.activeAlerts.get(alert.id);
    if (existing) {
      const timeDiff = Date.now() - existing.timestamp;
      const rule = this.config.alertRules[alert.level];
      
      if (timeDiff < (rule?.suppressionTime || 900000)) {
        return true;
      }
    }
    
    return false;
  }

  isRateLimited(alert) {
    const hour = Math.floor(Date.now() / 3600000);
    const key = `${hour}_${alert.level}`;
    
    const count = this.alertCounts.get(key) || 0;
    const maxAlerts = this.config.alertBehavior.maxAlertsPerHour;
    
    if (count >= maxAlerts) {
      return true;
    }
    
    this.alertCounts.set(key, count + 1);
    return false;
  }

  async processAlert(alert) {
    // Add processing metadata
    const processedAlert = {
      ...alert,
      processedAt: Date.now(),
      status: 'active',
      escalated: false,
      acknowledged: false
    };
    
    // Check for alert patterns
    this.analyzeAlertPattern(processedAlert);
    
    // Apply alert rules
    const rule = this.config.alertRules[alert.level];
    if (rule) {
      processedAlert.channels = rule.channels;
      processedAlert.requiresAcknowledgment = rule.acknowledgmentRequired;
      processedAlert.canEscalate = rule.escalate;
    }
    
    return processedAlert;
  }

  analyzeAlertPattern(alert) {
    const pattern = this.alertPatterns.get(alert.fingerprint) || {
      count: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      frequency: 0
    };
    
    pattern.count++;
    pattern.lastSeen = Date.now();
    
    // Calculate frequency (alerts per hour)
    const hoursDiff = (pattern.lastSeen - pattern.firstSeen) / 3600000;
    pattern.frequency = hoursDiff > 0 ? pattern.count / hoursDiff : 0;
    
    this.alertPatterns.set(alert.fingerprint, pattern);
    
    // Add pattern metadata to alert
    alert.pattern = {
      isRecurring: pattern.count > 3,
      frequency: pattern.frequency,
      totalOccurrences: pattern.count
    };
    
    // Emit pattern event if high frequency detected
    if (pattern.frequency > 10) { // More than 10 per hour
      this.emit('highFrequencyAlert', { alert, pattern });
    }
  }

  async sendNotifications(alert) {
    const results = {};
    const channels = alert.channels || ['email'];
    
    // Send to each configured channel
    const promises = channels.map(async (channel) => {
      try {
        switch (channel) {
          case 'email':
            results[channel] = await this.sendEmailAlert(alert);
            break;
          case 'slack':
            results[channel] = await this.sendSlackAlert(alert);
            break;
          case 'webhook':
            results[channel] = await this.sendWebhookAlert(alert);
            break;
          default:
            results[channel] = { success: false, error: 'Unknown channel' };
        }
      } catch (error) {
        console.error(`Failed to send ${channel} alert:`, error);
        results[channel] = { success: false, error: error.message };
      }
    });
    
    await Promise.allSettled(promises);
    
    return results;
  }

  async sendEmailAlert(alert) {
    if (!this.config.channels.email.enabled || !this.emailTransporter) {
      return { success: false, error: 'Email not configured' };
    }
    
    try {
      const subject = this.formatEmailSubject(alert);
      const html = this.formatEmailBody(alert);
      
      const mailOptions = {
        from: this.config.channels.email.from,
        to: this.config.channels.email.to,
        subject,
        html
      };
      
      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendSlackAlert(alert) {
    if (!this.config.channels.slack.enabled || !this.config.channels.slack.webhookUrl) {
      return { success: false, error: 'Slack not configured' };
    }
    
    try {
      const fetch = require('node-fetch');
      const payload = this.formatSlackMessage(alert);
      
      const response = await fetch(this.config.channels.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendWebhookAlert(alert) {
    if (!this.config.channels.webhook.enabled || !this.config.channels.webhook.urls.length) {
      return { success: false, error: 'Webhook not configured' };
    }
    
    try {
      const fetch = require('node-fetch');
      const results = [];
      
      for (const url of this.config.channels.webhook.urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
            timeout: this.config.channels.webhook.timeout
          });
          
          results.push({
            url,
            success: response.ok,
            status: response.status
          });
          
        } catch (error) {
          results.push({
            url,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        results,
        successCount,
        totalUrls: results.length
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  formatEmailSubject(alert) {
    const env = alert.environment.toUpperCase();
    const levelIcon = this.getLevelIcon(alert.level);
    
    return `${levelIcon} [${env}] ${alert.title}`;
  }

  formatEmailBody(alert) {
    const levelColor = this.getLevelColor(alert.level);
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background-color: ${levelColor}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">${this.getLevelIcon(alert.level)} ${alert.title}</h2>
        </div>
        
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p><strong>Level:</strong> ${alert.level.toUpperCase()}</p>
          <p><strong>Source:</strong> ${alert.source}</p>
          <p><strong>Environment:</strong> ${alert.environment}</p>
          <p><strong>Hostname:</strong> ${alert.hostname}</p>
          <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          
          <div style="margin: 20px 0;">
            <h3>Message:</h3>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 3px; font-family: monospace;">
              ${alert.message}
            </div>
          </div>
          
          ${alert.details ? `
            <div style="margin: 20px 0;">
              <h3>Details:</h3>
              <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(alert.details, null, 2)}
              </pre>
            </div>
          ` : ''}
          
          ${alert.pattern?.isRecurring ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 3px; margin-top: 15px;">
              <strong>⚠️ Recurring Alert:</strong> This alert has occurred ${alert.pattern.totalOccurrences} times 
              (${alert.pattern.frequency.toFixed(1)} per hour)
            </div>
          ` : ''}
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            Alert ID: ${alert.id} | Generated by RevivaTech Monitoring
          </div>
        </div>
      </div>
    `;
  }

  formatSlackMessage(alert) {
    const levelColor = this.getSlackColor(alert.level);
    const levelIcon = this.getLevelIcon(alert.level);
    
    const attachment = {
      color: levelColor,
      title: `${levelIcon} ${alert.title}`,
      text: alert.message,
      fields: [
        {
          title: 'Level',
          value: alert.level.toUpperCase(),
          short: true
        },
        {
          title: 'Source',
          value: alert.source,
          short: true
        },
        {
          title: 'Environment',
          value: alert.environment,
          short: true
        },
        {
          title: 'Hostname',
          value: alert.hostname,
          short: true
        }
      ],
      footer: 'RevivaTech Monitoring',
      ts: Math.floor(alert.timestamp / 1000)
    };
    
    if (alert.pattern?.isRecurring) {
      attachment.fields.push({
        title: 'Pattern',
        value: `Recurring: ${alert.pattern.totalOccurrences} times (${alert.pattern.frequency.toFixed(1)}/hour)`,
        short: false
      });
    }
    
    return {
      username: this.config.channels.slack.username,
      channel: this.config.channels.slack.channel,
      attachments: [attachment]
    };
  }

  getLevelIcon(level) {
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[level] || '📢';
  }

  getLevelColor(level) {
    const colors = {
      critical: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[level] || '#6c757d';
  }

  getSlackColor(level) {
    const colors = {
      critical: 'danger',
      warning: 'warning',
      info: 'good'
    };
    return colors[level] || '#36a64f';
  }

  async acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
    const alert = this.activeAlerts.get(alertId);
    
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    if (alert.acknowledged) {
      throw new Error(`Alert already acknowledged: ${alertId}`);
    }
    
    // Update alert
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();
    alert.acknowledgmentNotes = notes;
    
    // Store acknowledgment
    this.acknowledgments.set(alertId, {
      alertId,
      acknowledgedBy,
      acknowledgedAt: Date.now(),
      notes
    });
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'acknowledged',
      timestamp: Date.now(),
      acknowledgedBy,
      notes
    });
    
    this.emit('alertAcknowledged', { alert, acknowledgedBy, notes });
    
    return { success: true, alert };
  }

  async resolveAlert(alertId, resolvedBy, resolution = '') {
    const alert = this.activeAlerts.get(alertId);
    
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    // Update alert
    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = Date.now();
    alert.resolution = resolution;
    
    // Add suppression to prevent immediate re-triggering
    this.suppressedAlerts.set(alert.fingerprint, {
      timestamp: Date.now(),
      duration: this.config.alertRules[alert.level]?.suppressionTime || 900000
    });
    
    // Remove from active alerts
    this.activeAlerts.delete(alertId);
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'resolved',
      timestamp: Date.now(),
      resolvedBy,
      resolution
    });
    
    this.emit('alertResolved', { alert, resolvedBy, resolution });
    
    return { success: true, alert };
  }

  startAlertProcessing() {
    // Process escalations
    setInterval(() => {
      this.processEscalations();
    }, 60000); // Every minute
    
    // Clean up rate limiting counters
    setInterval(() => {
      this.cleanupRateLimiting();
    }, 3600000); // Every hour
  }

  processEscalations() {
    const now = Date.now();
    
    for (const [alertId, alert] of this.activeAlerts) {
      // Skip if already escalated or doesn't support escalation
      if (alert.escalated || !alert.canEscalate) continue;
      
      // Check if acknowledgment is required and missing
      if (alert.requiresAcknowledgment && !alert.acknowledged) {
        const timeSinceAlert = now - alert.timestamp;
        
        if (timeSinceAlert > this.config.alertBehavior.escalationDelay) {
          this.escalateAlert(alert);
        }
      }
    }
  }

  async escalateAlert(alert) {
    alert.escalated = true;
    alert.escalatedAt = Date.now();
    
    // Create escalation alert
    const escalationAlert = {
      title: `ESCALATED: ${alert.title}`,
      level: 'critical',
      message: `Alert requires immediate attention. Original alert has been unacknowledged for over ${this.config.alertBehavior.escalationDelay / 60000} minutes.`,
      source: 'escalation',
      originalAlert: alert,
      details: {
        originalAlertId: alert.id,
        escalationReason: 'unacknowledged_timeout'
      }
    };
    
    // Send escalation
    await this.sendAlert(escalationAlert);
    
    this.emit('alertEscalated', { originalAlert: alert, escalationAlert });
    
    console.warn(`Alert escalated: ${alert.id} -> ${escalationAlert.id}`);
  }

  cleanupRateLimiting() {
    const currentHour = Math.floor(Date.now() / 3600000);
    
    // Remove old rate limiting entries
    for (const key of this.alertCounts.keys()) {
      const hour = parseInt(key.split('_')[0]);
      if (hour < currentHour - 1) { // Keep last 2 hours
        this.alertCounts.delete(key);
      }
    }
  }

  startCleanupTasks() {
    // Clean up old data periodically
    setInterval(() => {
      this.performCleanup();
    }, 3600000); // Every hour
  }

  performCleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up old alert history
    this.alertHistory = this.alertHistory.filter(
      entry => (now - entry.timestamp) < maxAge
    );
    
    // Clean up old suppressions
    for (const [fingerprint, suppression] of this.suppressedAlerts) {
      if ((now - suppression.timestamp) > suppression.duration) {
        this.suppressedAlerts.delete(fingerprint);
      }
    }
    
    // Clean up old acknowledgments
    const oldAcks = [];
    for (const [alertId, ack] of this.acknowledgments) {
      if ((now - ack.acknowledgedAt) > maxAge) {
        oldAcks.push(alertId);
      }
    }
    oldAcks.forEach(id => this.acknowledgments.delete(id));
    
    console.log('Alert cleanup completed');
  }

  getMetrics() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    // Calculate recent metrics
    const recentAlerts = this.alertHistory.filter(
      entry => entry.timestamp > hourAgo
    );
    
    const byLevel = recentAlerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {});
    
    const acknowledged = recentAlerts.filter(a => a.acknowledged).length;
    const resolved = recentAlerts.filter(a => a.status === 'resolved').length;
    
    return {
      active: this.activeAlerts.size,
      suppressed: this.suppressedAlerts.size,
      recent: {
        total: recentAlerts.length,
        byLevel,
        acknowledged,
        resolved,
        escalated: recentAlerts.filter(a => a.escalated).length
      },
      patterns: this.alertPatterns.size,
      acknowledgments: this.acknowledgments.size
    };
  }

  async getHealth() {
    const metrics = this.getMetrics();
    
    return {
      status: 'healthy',
      channels: {
        email: this.config.channels.email.enabled && !!this.emailTransporter,
        slack: this.config.channels.slack.enabled && !!this.config.channels.slack.webhookUrl,
        webhook: this.config.channels.webhook.enabled && this.config.channels.webhook.urls.length > 0
      },
      metrics
    };
  }
}

module.exports = { AlertManager };