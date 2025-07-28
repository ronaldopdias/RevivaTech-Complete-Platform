'use client';

// Enhanced Audit Logging with Persistent Storage and Analytics
interface AuditEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  action: string;
  category: 'Authentication' | 'Authorization' | 'Data Access' | 'Security' | 'Performance' | 'System';
  resource?: string;
  details: Record<string, any>;
  userAgent: string;
  ipAddress: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  riskScore: number;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  correlationId?: string;
  parentEventId?: string;
  tags: string[];
}

interface AuditQuery {
  userId?: string;
  category?: string;
  action?: string;
  dateFrom?: number;
  dateTo?: number;
  riskScoreMin?: number;
  riskScoreMax?: number;
  level?: string[];
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'riskScore' | 'category';
  sortOrder?: 'asc' | 'desc';
}

interface AuditAnalytics {
  totalEvents: number;
  averageRiskScore: number;
  categoryDistribution: Record<string, number>;
  actionDistribution: Record<string, number>;
  riskTrends: Array<{ timestamp: number; averageRisk: number }>;
  topUsers: Array<{ userId: string; eventCount: number; averageRisk: number }>;
  securityAlerts: SecurityAlert[];
}

interface SecurityAlert {
  id: string;
  type: 'high_risk_activity' | 'unusual_pattern' | 'multiple_failures' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
  events: string[];
  timestamp: number;
  acknowledged: boolean;
}

interface AuditRetentionPolicy {
  category: string;
  retentionDays: number;
  archiveAfterDays: number;
  compressionEnabled: boolean;
}

class PersistentAuditLogger {
  private db: IDBDatabase | null = null;
  private batchQueue: AuditEvent[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds
  private retentionPolicies: AuditRetentionPolicy[] = [];
  private alertThresholds = {
    highRiskScore: 80,
    failureThreshold: 5,
    timeWindow: 300000 // 5 minutes
  };

  constructor() {
    this.initializeDB();
    this.initializeRetentionPolicies();
    this.startBatchProcessor();
    this.startMaintenanceTasks();
  }

  // Initialize IndexedDB for audit storage
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RevivaTechAuditLog', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create audit events store
        if (!db.objectStoreNames.contains('audit_events')) {
          const eventStore = db.createObjectStore('audit_events', { keyPath: 'id' });
          eventStore.createIndex('userId', 'userId', { unique: false });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventStore.createIndex('category', 'category', { unique: false });
          eventStore.createIndex('action', 'action', { unique: false });
          eventStore.createIndex('riskScore', 'riskScore', { unique: false });
          eventStore.createIndex('level', 'level', { unique: false });
          eventStore.createIndex('correlationId', 'correlationId', { unique: false });
        }

        // Create security alerts store
        if (!db.objectStoreNames.contains('security_alerts')) {
          const alertStore = db.createObjectStore('security_alerts', { keyPath: 'id' });
          alertStore.createIndex('userId', 'userId', { unique: false });
          alertStore.createIndex('timestamp', 'timestamp', { unique: false });
          alertStore.createIndex('severity', 'severity', { unique: false });
          alertStore.createIndex('acknowledged', 'acknowledged', { unique: false });
        }

        // Create analytics cache store
        if (!db.objectStoreNames.contains('analytics_cache')) {
          const cacheStore = db.createObjectStore('analytics_cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Initialize retention policies
  private initializeRetentionPolicies(): void {
    this.retentionPolicies = [
      { category: 'Authentication', retentionDays: 365, archiveAfterDays: 90, compressionEnabled: true },
      { category: 'Authorization', retentionDays: 180, archiveAfterDays: 60, compressionEnabled: true },
      { category: 'Data Access', retentionDays: 90, archiveAfterDays: 30, compressionEnabled: false },
      { category: 'Security', retentionDays: 730, archiveAfterDays: 180, compressionEnabled: false },
      { category: 'Performance', retentionDays: 30, archiveAfterDays: 7, compressionEnabled: true },
      { category: 'System', retentionDays: 60, archiveAfterDays: 14, compressionEnabled: true }
    ];
  }

  // Log an audit event
  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'userAgent' | 'ipAddress' | 'location'>): Promise<string> {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP(),
      location: await this.getClientLocation(),
      level: this.determineLogLevel(event.riskScore),
      tags: this.generateTags(event)
    };

    // Add to batch queue
    this.batchQueue.push(auditEvent);

    // Immediate processing for critical events
    if (auditEvent.level === 'CRITICAL' || auditEvent.riskScore >= this.alertThresholds.highRiskScore) {
      await this.processCriticalEvent(auditEvent);
    }

    // Flush if batch is full
    if (this.batchQueue.length >= this.batchSize) {
      await this.flushBatch();
    }

    return auditEvent.id;
  }

  // Query audit events
  async query(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['audit_events'], 'readonly');
    const store = transaction.objectStore('audit_events');
    
    let events: AuditEvent[] = [];
    let cursor: IDBCursorWithValue | null;

    // Use appropriate index for efficient querying
    if (query.userId) {
      cursor = await this.promisifyRequest(store.index('userId').openCursor(query.userId));
    } else if (query.category) {
      cursor = await this.promisifyRequest(store.index('category').openCursor(query.category));
    } else if (query.dateFrom || query.dateTo) {
      const range = this.createDateRange(query.dateFrom, query.dateTo);
      cursor = await this.promisifyRequest(store.index('timestamp').openCursor(range));
    } else {
      cursor = await this.promisifyRequest(store.openCursor());
    }

    while (cursor) {
      const event = cursor.value as AuditEvent;
      
      if (this.matchesQuery(event, query)) {
        events.push(event);
      }
      
      cursor = await this.promisifyRequest(cursor.continue());
    }

    // Apply sorting
    events = this.sortEvents(events, query.sortBy || 'timestamp', query.sortOrder || 'desc');

    // Apply pagination
    const total = events.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    events = events.slice(offset, offset + limit);

    return { events, total };
  }

  // Generate analytics
  async generateAnalytics(timeRange: { from: number; to: number }): Promise<AuditAnalytics> {
    const cacheKey = `analytics_${timeRange.from}_${timeRange.to}`;
    
    // Check cache first
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached && cached.timestamp > Date.now() - 300000) { // 5 minute cache
      return cached.data;
    }

    // Query events for time range
    const { events } = await this.query({
      dateFrom: timeRange.from,
      dateTo: timeRange.to,
      limit: 10000 // Large limit for analytics
    });

    // Calculate analytics
    const analytics: AuditAnalytics = {
      totalEvents: events.length,
      averageRiskScore: this.calculateAverageRiskScore(events),
      categoryDistribution: this.calculateCategoryDistribution(events),
      actionDistribution: this.calculateActionDistribution(events),
      riskTrends: this.calculateRiskTrends(events),
      topUsers: this.calculateTopUsers(events),
      securityAlerts: await this.getActiveSecurityAlerts()
    };

    // Cache the results
    await this.cacheAnalytics(cacheKey, analytics);

    return analytics;
  }

  // Create security alert
  async createSecurityAlert(
    type: SecurityAlert['type'],
    userId: string,
    description: string,
    events: string[],
    severity: SecurityAlert['severity'] = 'medium'
  ): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateEventId(),
      type,
      severity,
      userId,
      description,
      events,
      timestamp: Date.now(),
      acknowledged: false
    };

    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['security_alerts'], 'readwrite');
    const store = transaction.objectStore('security_alerts');
    
    await this.promisifyRequest(store.add(alert));

    // Log the alert creation
    await this.log({
      userId: 'system',
      sessionId: 'system',
      action: 'security_alert_created',
      category: 'Security',
      details: { alertId: alert.id, type, severity, targetUserId: userId },
      riskScore: this.getSeverityRiskScore(severity),
      correlationId: alert.id,
      tags: ['security_alert', type, severity]
    });

    return alert.id;
  }

  // Acknowledge security alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['security_alerts'], 'readwrite');
    const store = transaction.objectStore('security_alerts');
    
    const alert = await this.promisifyRequest(store.get(alertId));
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();
      
      await this.promisifyRequest(store.put(alert));

      await this.log({
        userId: acknowledgedBy,
        sessionId: 'system',
        action: 'security_alert_acknowledged',
        category: 'Security',
        details: { alertId, originalSeverity: alert.severity },
        riskScore: 20,
        correlationId: alertId,
        tags: ['security_alert', 'acknowledged']
      });

      return true;
    }

    return false;
  }

  // Export audit logs
  async exportLogs(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const { events } = await this.query({ ...query, limit: 50000 });

    if (format === 'csv') {
      return this.exportToCSV(events);
    } else {
      return this.exportToJSON(events);
    }
  }

  // Private helper methods
  private async processCriticalEvent(event: AuditEvent): Promise<void> {
    // Immediate storage for critical events
    await this.storeEvent(event);

    // Check for security patterns
    await this.analyzeSecurityPatterns(event);

    // Real-time notifications would go here
    console.warn('Critical security event detected:', event);
  }

  private async analyzeSecurityPatterns(event: AuditEvent): Promise<void> {
    // Check for multiple failures
    if (event.action.includes('failed') || event.action.includes('denied')) {
      await this.checkMultipleFailures(event.userId);
    }

    // Check for privilege escalation
    if (event.action.includes('role_assigned') || event.action.includes('permission_granted')) {
      await this.checkPrivilegeEscalation(event);
    }

    // Check for unusual patterns
    await this.checkUnusualPatterns(event);
  }

  private async checkMultipleFailures(userId: string): Promise<void> {
    const timeWindow = Date.now() - this.alertThresholds.timeWindow;
    const { events } = await this.query({
      userId,
      dateFrom: timeWindow,
      limit: 20
    });

    const failures = events.filter(e => 
      e.action.includes('failed') || e.action.includes('denied')
    );

    if (failures.length >= this.alertThresholds.failureThreshold) {
      await this.createSecurityAlert(
        'multiple_failures',
        userId,
        `${failures.length} failed attempts detected in ${this.alertThresholds.timeWindow / 60000} minutes`,
        failures.map(e => e.id),
        'high'
      );
    }
  }

  private async checkPrivilegeEscalation(event: AuditEvent): Promise<void> {
    // Implementation would check for unusual privilege changes
    if (event.riskScore >= 70) {
      await this.createSecurityAlert(
        'privilege_escalation',
        event.userId,
        'Potential privilege escalation detected',
        [event.id],
        'medium'
      );
    }
  }

  private async checkUnusualPatterns(event: AuditEvent): Promise<void> {
    // Implementation would use ML or rule-based detection
    // For now, simple heuristics
    if (event.riskScore >= this.alertThresholds.highRiskScore) {
      await this.createSecurityAlert(
        'high_risk_activity',
        event.userId,
        `High-risk activity detected: ${event.action}`,
        [event.id],
        'medium'
      );
    }
  }

  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.batchQueue.length > 0) {
        await this.flushBatch();
      }
    }, this.flushInterval);
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const events = [...this.batchQueue];
    this.batchQueue = [];

    for (const event of events) {
      await this.storeEvent(event);
    }
  }

  private async storeEvent(event: AuditEvent): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['audit_events'], 'readwrite');
    const store = transaction.objectStore('audit_events');
    
    await this.promisifyRequest(store.add(event));
  }

  private startMaintenanceTasks(): void {
    // Run daily maintenance
    setInterval(() => {
      this.performMaintenance();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async performMaintenance(): Promise<void> {
    await this.cleanupExpiredEvents();
    await this.optimizeStorage();
    await this.updateAnalyticsCache();
  }

  private async cleanupExpiredEvents(): Promise<void> {
    const cutoffDate = Date.now() - (365 * 24 * 60 * 60 * 1000); // 1 year
    
    // Implementation would delete old events based on retention policies
    console.log('Performing audit log cleanup for events older than', new Date(cutoffDate));
  }

  // Utility methods
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineLogLevel(riskScore: number): AuditEvent['level'] {
    if (riskScore >= 90) return 'CRITICAL';
    if (riskScore >= 70) return 'ERROR';
    if (riskScore >= 50) return 'WARNING';
    if (riskScore >= 20) return 'INFO';
    return 'DEBUG';
  }

  private generateTags(event: Partial<AuditEvent>): string[] {
    const tags: string[] = [];
    
    if (event.category) tags.push(event.category.toLowerCase());
    if (event.action) tags.push(event.action);
    if (event.riskScore && event.riskScore >= 70) tags.push('high_risk');
    
    return tags;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private async getClientLocation(): Promise<{ country: string; region: string; city: string } | undefined> {
    // Implementation would use IP geolocation service
    return undefined;
  }

  private promisifyRequest(request: IDBRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private matchesQuery(event: AuditEvent, query: AuditQuery): boolean {
    // Implementation of query matching logic
    return true; // Simplified
  }

  private createDateRange(from?: number, to?: number): IDBKeyRange | undefined {
    if (from && to) return IDBKeyRange.bound(from, to);
    if (from) return IDBKeyRange.lowerBound(from);
    if (to) return IDBKeyRange.upperBound(to);
    return undefined;
  }

  private sortEvents(events: AuditEvent[], sortBy: string, order: string): AuditEvent[] {
    return events.sort((a, b) => {
      const aVal = a[sortBy as keyof AuditEvent];
      const bVal = b[sortBy as keyof AuditEvent];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });
  }

  private calculateAverageRiskScore(events: AuditEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, event) => acc + event.riskScore, 0);
    return Math.round(sum / events.length);
  }

  private calculateCategoryDistribution(events: AuditEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    events.forEach(event => {
      distribution[event.category] = (distribution[event.category] || 0) + 1;
    });
    return distribution;
  }

  private calculateActionDistribution(events: AuditEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    events.forEach(event => {
      distribution[event.action] = (distribution[event.action] || 0) + 1;
    });
    return distribution;
  }

  private calculateRiskTrends(events: AuditEvent[]): Array<{ timestamp: number; averageRisk: number }> {
    // Group events by hour and calculate average risk
    const hourlyGroups: Record<number, AuditEvent[]> = {};
    
    events.forEach(event => {
      const hour = Math.floor(event.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
      if (!hourlyGroups[hour]) hourlyGroups[hour] = [];
      hourlyGroups[hour].push(event);
    });

    return Object.entries(hourlyGroups).map(([timestamp, groupEvents]) => ({
      timestamp: Number(timestamp),
      averageRisk: this.calculateAverageRiskScore(groupEvents)
    }));
  }

  private calculateTopUsers(events: AuditEvent[]): Array<{ userId: string; eventCount: number; averageRisk: number }> {
    const userStats: Record<string, { events: AuditEvent[]; count: number }> = {};
    
    events.forEach(event => {
      if (!userStats[event.userId]) {
        userStats[event.userId] = { events: [], count: 0 };
      }
      userStats[event.userId].events.push(event);
      userStats[event.userId].count++;
    });

    return Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        eventCount: stats.count,
        averageRisk: this.calculateAverageRiskScore(stats.events)
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
  }

  private async getActiveSecurityAlerts(): Promise<SecurityAlert[]> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['security_alerts'], 'readonly');
    const store = transaction.objectStore('security_alerts');
    const index = store.index('acknowledged');
    
    const alerts: SecurityAlert[] = [];
    let cursor = await this.promisifyRequest(index.openCursor(false));

    while (cursor) {
      alerts.push(cursor.value);
      cursor = await this.promisifyRequest(cursor.continue());
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getSeverityRiskScore(severity: SecurityAlert['severity']): number {
    switch (severity) {
      case 'critical': return 95;
      case 'high': return 80;
      case 'medium': return 60;
      case 'low': return 40;
      default: return 50;
    }
  }

  private async getCachedAnalytics(key: string): Promise<any> {
    // Implementation for analytics caching
    return null;
  }

  private async cacheAnalytics(key: string, analytics: AuditAnalytics): Promise<void> {
    // Implementation for analytics caching
  }

  private async optimizeStorage(): Promise<void> {
    // Implementation for storage optimization
  }

  private async updateAnalyticsCache(): Promise<void> {
    // Implementation for analytics cache updates
  }

  private exportToJSON(events: AuditEvent[]): Blob {
    const jsonData = JSON.stringify(events, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  private exportToCSV(events: AuditEvent[]): Blob {
    const headers = ['id', 'userId', 'timestamp', 'action', 'category', 'riskScore', 'level'];
    const csvData = [
      headers.join(','),
      ...events.map(event => headers.map(header => 
        JSON.stringify(event[header as keyof AuditEvent] || '')
      ).join(','))
    ].join('\n');
    
    return new Blob([csvData], { type: 'text/csv' });
  }
}

// Create singleton instance
export const persistentAuditLogger = new PersistentAuditLogger();

// React hook for audit operations
export function useAuditLogger() {
  const [analytics, setAnalytics] = React.useState<AuditAnalytics | null>(null);
  const [alerts, setAlerts] = React.useState<SecurityAlert[]>([]);
  const [loading, setLoading] = React.useState(false);

  const generateAnalytics = async (timeRange: { from: number; to: number }) => {
    setLoading(true);
    try {
      const data = await persistentAuditLogger.generateAnalytics(timeRange);
      setAnalytics(data);
      setAlerts(data.securityAlerts);
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const queryEvents = async (query: AuditQuery) => {
    setLoading(true);
    try {
      return await persistentAuditLogger.query(query);
    } catch (error) {
      console.error('Failed to query events:', error);
      return { events: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string, userId: string) => {
    try {
      const success = await persistentAuditLogger.acknowledgeAlert(alertId, userId);
      if (success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      }
      return success;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return false;
    }
  };

  return {
    analytics,
    alerts,
    loading,
    generateAnalytics,
    queryEvents,
    acknowledgeAlert,
    exportLogs: persistentAuditLogger.exportLogs.bind(persistentAuditLogger)
  };
}

export default persistentAuditLogger;