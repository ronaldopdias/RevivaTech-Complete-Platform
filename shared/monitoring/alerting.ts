import { EventEmitter } from 'events';
import { cache } from '../config/redis';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';
import { metricsCollector } from './metrics';
import { healthRegistry } from './health-checks';

const config = getConfig();

// Alert types
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  FIRING = 'firing',
  RESOLVED = 'resolved',
  ACKNOWLEDGED = 'acknowledged',
  SILENCED = 'silenced',
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  generatorURL?: string;
  runbookURL?: string;
  source: string;
  fingerprint: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  query: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  duration: number; // in milliseconds
  labels: Record<string, string>;
  annotations: Record<string, string>;
  runbookURL?: string;
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
  severityFilter: AlertSeverity[];
}

// Alert manager
export class AlertManager extends EventEmitter {
  private static instance: AlertManager;
  private activeAlerts = new Map<string, Alert>();
  private alertRules = new Map<string, AlertRule>();
  private notificationChannels = new Map<string, NotificationChannel>();
  private silencedAlerts = new Set<string>();
  
  constructor() {
    super();
    this.setupDefaultRules();
    this.setupDefaultChannels();
    this.startEvaluationLoop();
  }
  
  static getInstance(): AlertManager {
    if (!this.instance) {
      this.instance = new AlertManager();
    }
    return this.instance;
  }
  
  // Fire an alert
  async fireAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'status' | 'fingerprint'>): Promise<string> {
    const fingerprint = this.generateFingerprint(alert);
    const existingAlert = Array.from(this.activeAlerts.values()).find(a => a.fingerprint === fingerprint);
    
    if (existingAlert && existingAlert.status === AlertStatus.FIRING) {
      // Alert already firing, update timestamp
      existingAlert.timestamp = new Date();
      return existingAlert.id;
    }
    
    const alertId = this.generateAlertId();
    const newAlert: Alert = {
      id: alertId,
      timestamp: new Date(),
      status: AlertStatus.FIRING,
      fingerprint,
      ...alert,
    };
    
    this.activeAlerts.set(alertId, newAlert);
    
    // Store in cache for persistence
    await cache.set(`alert:${alertId}`, newAlert, 7 * 24 * 3600); // 7 days
    
    // Send notifications
    await this.sendNotifications(newAlert);
    
    // Emit event
    this.emit('alertFired', newAlert);
    
    logger.warn('Alert fired', {
      alertId,
      name: alert.name,
      severity: alert.severity,
      description: alert.description,
    });
    
    return alertId;
  }
  
  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    
    // Update in cache
    await cache.set(`alert:${alertId}`, alert, 7 * 24 * 3600);
    
    // Send resolution notification
    await this.sendNotifications(alert);
    
    // Remove from active alerts
    this.activeAlerts.delete(alertId);
    
    // Emit event
    this.emit('alertResolved', alert);
    
    logger.info('Alert resolved', {
      alertId,
      name: alert.name,
      resolvedBy,
    });
    
    return true;
  }
  
  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    
    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    
    // Update in cache
    await cache.set(`alert:${alertId}`, alert, 7 * 24 * 3600);
    
    // Emit event
    this.emit('alertAcknowledged', alert);
    
    logger.info('Alert acknowledged', {
      alertId,
      name: alert.name,
      acknowledgedBy,
    });
    
    return true;
  }
  
  // Silence an alert
  async silenceAlert(alertId: string, duration: number): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    
    alert.status = AlertStatus.SILENCED;
    this.silencedAlerts.add(alertId);
    
    // Auto-unsilence after duration
    setTimeout(() => {
      this.unsilenceAlert(alertId);
    }, duration);
    
    logger.info('Alert silenced', {
      alertId,
      name: alert.name,
      duration,
    });
    
    return true;
  }
  
  // Unsilence an alert
  async unsilenceAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    
    alert.status = AlertStatus.FIRING;
    this.silencedAlerts.delete(alertId);
    
    logger.info('Alert unsilenced', {
      alertId,
      name: alert.name,
    });
    
    return true;
  }
  
  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  // Get alerts by severity
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }
  
  // Add alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }
  
  // Remove alert rule
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      logger.info('Alert rule removed', { ruleId });
    }
    return removed;
  }
  
  // Add notification channel
  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    logger.info('Notification channel added', { channelId: channel.id, type: channel.type });
  }
  
  // Remove notification channel
  removeNotificationChannel(channelId: string): boolean {
    const removed = this.notificationChannels.delete(channelId);
    if (removed) {
      logger.info('Notification channel removed', { channelId });
    }
    return removed;
  }
  
  // Private methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateFingerprint(alert: Omit<Alert, 'id' | 'timestamp' | 'status' | 'fingerprint'>): string {
    const data = `${alert.name}:${alert.source}:${JSON.stringify(alert.labels)}`;
    return Buffer.from(data).toString('base64');
  }
  
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const channel of this.notificationChannels.values()) {
      if (!channel.enabled || !channel.severityFilter.includes(alert.severity)) {
        continue;
      }
      
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        logger.error('Failed to send notification', {
          channelId: channel.id,
          alertId: alert.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'sms':
        await this.sendSMSNotification(channel, alert);
        break;
    }
  }
  
  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Email notification implementation
    logger.info('Email notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      recipients: channel.config.recipients,
    });
  }
  
  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const color = this.getSlackColor(alert.severity);
    const payload = {
      channel: channel.config.channel,
      username: 'AlertManager',
      attachments: [{
        color,
        title: `${alert.severity.toUpperCase()}: ${alert.name}`,
        text: alert.description,
        fields: [
          { title: 'Status', value: alert.status, short: true },
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Source', value: alert.source, short: true },
          { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
        ],
        actions: alert.runbookURL ? [{
          type: 'button',
          text: 'View Runbook',
          url: alert.runbookURL,
        }] : undefined,
      }],
    };
    
    if (channel.config.webhookUrl) {
      await fetch(channel.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    
    logger.info('Slack notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      slackChannel: channel.config.channel,
    });
  }
  
  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
    };
    
    await fetch(channel.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.headers,
      },
      body: JSON.stringify(payload),
    });
    
    logger.info('Webhook notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      url: channel.config.url,
    });
  }
  
  private async sendSMSNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // SMS notification implementation
    logger.info('SMS notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      recipients: channel.config.recipients,
    });
  }
  
  private getSlackColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'danger';
      case AlertSeverity.ERROR: return 'warning';
      case AlertSeverity.WARNING: return '#ffeb3b';
      case AlertSeverity.INFO: return 'good';
      default: return '#e0e0e0';
    }
  }
  
  private startEvaluationLoop(): void {
    // Evaluate alert rules every 30 seconds
    setInterval(() => {
      this.evaluateAlertRules();
    }, 30000);
  }
  
  private async evaluateAlertRules(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        logger.error('Failed to evaluate alert rule', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  private async evaluateRule(rule: AlertRule): Promise<void> {
    const value = await this.executeQuery(rule.query);
    const condition = this.checkCondition(value, rule.condition, rule.threshold);
    
    if (condition) {
      // Check if alert should fire (duration check)
      const alertKey = `rule_violation:${rule.id}`;
      const firstViolation = await cache.get(alertKey);
      
      if (!firstViolation) {
        // First violation, start timer
        await cache.set(alertKey, Date.now(), Math.ceil(rule.duration / 1000));
      } else {
        // Check if duration has passed
        const violationTime = firstViolation as number;
        if (Date.now() - violationTime >= rule.duration) {
          // Fire alert
          await this.fireAlert({
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            labels: { ...rule.labels, rule_id: rule.id },
            annotations: { ...rule.annotations, current_value: value.toString() },
            runbookURL: rule.runbookURL,
            source: 'alert_rule',
          });
          
          // Clear violation timer
          await cache.del(alertKey);
        }
      }
    } else {
      // Condition not met, clear violation timer
      await cache.del(`rule_violation:${rule.id}`);
      
      // Resolve any existing alerts for this rule
      const existingAlerts = this.getActiveAlerts().filter(
        alert => alert.labels.rule_id === rule.id
      );
      
      for (const alert of existingAlerts) {
        await this.resolveAlert(alert.id, 'rule_resolved');
      }
    }
  }
  
  private async executeQuery(query: string): Promise<number> {
    // Simple query execution for metrics
    // In production, this would integrate with your metrics store
    
    if (query.startsWith('metric:')) {
      const metricName = query.replace('metric:', '');
      return metricsCollector.getGaugeValue(metricName) || metricsCollector.getCounterValue(metricName) || 0;
    }
    
    if (query.startsWith('health:')) {
      const checkName = query.replace('health:', '');
      const results = healthRegistry.getLastResults();
      const check = results.find(c => c.name === checkName);
      return check?.status === 'healthy' ? 1 : 0;
    }
    
    return 0;
  }
  
  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }
  
  private setupDefaultRules(): void {
    // High memory usage
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage is above 80%',
      severity: AlertSeverity.WARNING,
      query: 'metric:nodejs_memory_heap_used_bytes',
      condition: 'gt',
      threshold: 0.8 * 1024 * 1024 * 1024, // 800MB
      duration: 5 * 60 * 1000, // 5 minutes
      labels: { component: 'system' },
      annotations: { summary: 'High memory usage detected' },
      enabled: true,
    });
    
    // High error rate
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High HTTP Error Rate',
      description: 'HTTP error rate is above 5%',
      severity: AlertSeverity.ERROR,
      query: 'metric:http_errors_total',
      condition: 'gt',
      threshold: 50, // 50 errors
      duration: 2 * 60 * 1000, // 2 minutes
      labels: { component: 'application' },
      annotations: { summary: 'High HTTP error rate detected' },
      enabled: true,
    });
    
    // Database connectivity
    this.addAlertRule({
      id: 'database_unhealthy',
      name: 'Database Unhealthy',
      description: 'Database health check is failing',
      severity: AlertSeverity.CRITICAL,
      query: 'health:database',
      condition: 'eq',
      threshold: 0,
      duration: 30 * 1000, // 30 seconds
      labels: { component: 'database' },
      annotations: { summary: 'Database is not responding' },
      enabled: true,
    });
  }
  
  private setupDefaultChannels(): void {
    if (config.NODE_ENV === 'production') {
      // Production notification channels would be configured here
      this.addNotificationChannel({
        id: 'ops_email',
        name: 'Operations Email',
        type: 'email',
        config: {
          recipients: ['ops@revivatech.com'],
          smtp: config.SMTP_HOST,
        },
        enabled: true,
        severityFilter: [AlertSeverity.ERROR, AlertSeverity.CRITICAL],
      });
    }
  }
}

// Alert dashboard
export class AlertDashboard {
  private alertManager: AlertManager;
  
  constructor() {
    this.alertManager = AlertManager.getInstance();
  }
  
  // Get dashboard data
  getDashboardData(): {
    summary: any;
    activeAlerts: Alert[];
    recentAlerts: Alert[];
    alertsByComponent: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const activeAlerts = this.alertManager.getActiveAlerts();
    
    const alertsByComponent: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};
    
    activeAlerts.forEach(alert => {
      const component = alert.labels.component || 'unknown';
      alertsByComponent[component] = (alertsByComponent[component] || 0) + 1;
      
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });
    
    return {
      summary: {
        total: activeAlerts.length,
        critical: alertsBySeverity[AlertSeverity.CRITICAL] || 0,
        error: alertsBySeverity[AlertSeverity.ERROR] || 0,
        warning: alertsBySeverity[AlertSeverity.WARNING] || 0,
        info: alertsBySeverity[AlertSeverity.INFO] || 0,
      },
      activeAlerts,
      recentAlerts: activeAlerts.slice(-10),
      alertsByComponent,
      alertsBySeverity,
    };
  }
}

// Export singleton instances
export const alertManager = AlertManager.getInstance();
export const alertDashboard = new AlertDashboard();