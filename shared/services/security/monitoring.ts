import { EventEmitter } from 'events';
import { cache } from '../../config/redis';
import { SecurityLogger } from '../../config/logger';
import { getConfig } from '../../config/environment';

const config = getConfig();

// Security monitoring event types
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKOUT = 'account_lockout',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  API_ABUSE = 'api_abuse',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  MALICIOUS_UPLOAD = 'malicious_upload',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  DDoS_ATTEMPT = 'ddos_attempt',
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: Date;
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  blocked: boolean;
  resolved: boolean;
}

// Threat intelligence integration
export interface ThreatIntelligence {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  source: string;
  confidence: number;
  lastUpdated: Date;
  categories: string[];
}

// Security monitoring service
export class SecurityMonitoringService extends EventEmitter {
  private static instance: SecurityMonitoringService;
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, number>();
  private threatIntelligence = new Map<string, ThreatIntelligence>();
  
  constructor() {
    super();
    this.setupEventHandlers();
    this.loadBlockedIPs();
  }
  
  static getInstance(): SecurityMonitoringService {
    if (!this.instance) {
      this.instance = new SecurityMonitoringService();
    }
    return this.instance;
  }
  
  // Log security event
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const eventId = this.generateEventId();
    const securityEvent: SecurityEvent = {
      id: eventId,
      timestamp: new Date(),
      resolved: false,
      ...event,
    };
    
    // Store event
    await cache.set(
      `security_event:${eventId}`,
      securityEvent,
      7 * 24 * 3600 // 7 days
    );
    
    // Add to recent events list
    await cache.lpush('recent_security_events', eventId);
    await cache.expire('recent_security_events', 24 * 3600); // 24 hours
    
    // Emit event for real-time processing
    this.emit('securityEvent', securityEvent);
    
    // Process event for automatic responses
    await this.processSecurityEvent(securityEvent);
    
    return eventId;
  }
  
  // Process security events for automatic responses
  private async processSecurityEvent(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case SecurityEventType.LOGIN_FAILURE:
        await this.handleLoginFailure(event);
        break;
      case SecurityEventType.BRUTE_FORCE_ATTACK:
        await this.handleBruteForceAttack(event);
        break;
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
      case SecurityEventType.XSS_ATTEMPT:
        await this.handleInjectionAttempt(event);
        break;
      case SecurityEventType.API_ABUSE:
        await this.handleAPIAbuse(event);
        break;
      case SecurityEventType.DDoS_ATTEMPT:
        await this.handleDDoSAttempt(event);
        break;
    }
    
    // Check if IP should be blocked
    if (event.severity === 'critical' || this.shouldBlockIP(event.ip)) {
      await this.blockIP(event.ip, 'Automatic block due to security event');
    }
  }
  
  // Handle login failures
  private async handleLoginFailure(event: SecurityEvent): Promise<void> {
    const key = `login_failures:${event.ip}`;
    const failures = await cache.increment(key);
    await cache.expire(key, 3600); // Reset after 1 hour
    
    // Progressive lockout
    if (failures >= 5) {
      await this.logSecurityEvent({
        type: SecurityEventType.BRUTE_FORCE_ATTACK,
        ip: event.ip,
        userAgent: event.userAgent,
        severity: 'high',
        details: { failureCount: failures },
        blocked: true,
      });
      
      await this.blockIP(event.ip, `Brute force attack: ${failures} failed attempts`);
    } else if (failures >= 3) {
      await this.flagSuspiciousIP(event.ip);
    }
  }
  
  // Handle brute force attacks
  private async handleBruteForceAttack(event: SecurityEvent): Promise<void> {
    await this.blockIP(event.ip, 'Brute force attack detected');
    
    // Alert administrators
    await this.sendSecurityAlert({
      type: 'brute_force',
      ip: event.ip,
      details: event.details,
      severity: 'high',
    });
  }
  
  // Handle injection attempts
  private async handleInjectionAttempt(event: SecurityEvent): Promise<void> {
    await this.blockIP(event.ip, 'Injection attack detected');
    
    // Log detailed information for investigation
    SecurityLogger.logSuspiciousActivity(
      event.type,
      event.details,
      event.ip
    );
    
    // Alert security team
    await this.sendSecurityAlert({
      type: 'injection_attack',
      ip: event.ip,
      details: event.details,
      severity: 'critical',
    });
  }
  
  // Handle API abuse
  private async handleAPIAbuse(event: SecurityEvent): Promise<void> {
    const key = `api_abuse:${event.ip}`;
    const count = await cache.increment(key);
    await cache.expire(key, 3600);
    
    if (count >= 3) {
      await this.blockIP(event.ip, 'Repeated API abuse');
    }
  }
  
  // Handle DDoS attempts
  private async handleDDoSAttempt(event: SecurityEvent): Promise<void> {
    await this.blockIP(event.ip, 'DDoS attack detected');
    
    // Implement emergency rate limiting
    await this.enableEmergencyRateLimit();
    
    // Alert infrastructure team
    await this.sendSecurityAlert({
      type: 'ddos_attack',
      ip: event.ip,
      details: event.details,
      severity: 'critical',
    });
  }
  
  // Block IP address
  async blockIP(ip: string, reason: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ip);
    
    const blockData = {
      ip,
      reason,
      blockedAt: new Date().toISOString(),
      duration: duration || 24 * 3600, // 24 hours default
      automatic: true,
    };
    
    await cache.set(`blocked_ip:${ip}`, blockData, duration || 24 * 3600);
    
    SecurityLogger.logSuspiciousActivity('ip_blocked', blockData, ip);
  }
  
  // Unblock IP address
  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    await cache.del(`blocked_ip:${ip}`);
    
    SecurityLogger.logSuspiciousActivity('ip_unblocked', { ip }, ip);
  }
  
  // Check if IP is blocked
  async isIPBlocked(ip: string): Promise<boolean> {
    if (this.blockedIPs.has(ip)) {
      return true;
    }
    
    const blockData = await cache.get(`blocked_ip:${ip}`);
    if (blockData) {
      this.blockedIPs.add(ip);
      return true;
    }
    
    return false;
  }
  
  // Flag suspicious IP
  private async flagSuspiciousIP(ip: string): Promise<void> {
    const count = this.suspiciousIPs.get(ip) || 0;
    this.suspiciousIPs.set(ip, count + 1);
    
    await cache.set(`suspicious_ip:${ip}`, count + 1, 3600);
  }
  
  // Check if IP should be blocked based on threat intelligence
  private shouldBlockIP(ip: string): boolean {
    const threat = this.threatIntelligence.get(ip);
    return threat?.reputation === 'malicious' && threat.confidence > 0.8;
  }
  
  // Update threat intelligence
  async updateThreatIntelligence(intel: ThreatIntelligence): Promise<void> {
    this.threatIntelligence.set(intel.ip, intel);
    
    await cache.set(
      `threat_intel:${intel.ip}`,
      intel,
      7 * 24 * 3600 // 7 days
    );
    
    // Block if malicious with high confidence
    if (intel.reputation === 'malicious' && intel.confidence > 0.8) {
      await this.blockIP(intel.ip, `Threat intelligence: ${intel.source}`);
    }
  }
  
  // Get security metrics
  async getSecurityMetrics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    blockedIPs: number;
    suspiciousIPs: number;
    recentEvents: SecurityEvent[];
  }> {
    const recentEventIds = await cache.lrange('recent_security_events', 0, 100);
    const recentEvents: SecurityEvent[] = [];
    
    for (const eventId of recentEventIds) {
      const event = await cache.get(`security_event:${eventId}`);
      if (event) {
        recentEvents.push(event);
      }
    }
    
    const eventsByType: Record<string, number> = {};
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });
    
    return {
      totalEvents: recentEvents.length,
      eventsByType,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      recentEvents: recentEvents.slice(0, 20),
    };
  }
  
  // Anomaly detection
  async detectAnomalies(): Promise<Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    data: any;
  }>> {
    const anomalies = [];
    
    // Check for unusual login patterns
    const loginMetrics = await this.getLoginMetrics();
    if (loginMetrics.failureRate > 0.5) {
      anomalies.push({
        type: 'high_login_failure_rate',
        description: `High login failure rate: ${(loginMetrics.failureRate * 100).toFixed(1)}%`,
        severity: 'medium' as const,
        data: loginMetrics,
      });
    }
    
    // Check for suspicious geographic patterns
    const geoMetrics = await this.getGeographicMetrics();
    if (geoMetrics.newCountries.length > 5) {
      anomalies.push({
        type: 'unusual_geographic_activity',
        description: `Logins from ${geoMetrics.newCountries.length} new countries`,
        severity: 'medium' as const,
        data: geoMetrics,
      });
    }
    
    // Check for API abuse patterns
    const apiMetrics = await this.getAPIMetrics();
    if (apiMetrics.errorRate > 0.3) {
      anomalies.push({
        type: 'high_api_error_rate',
        description: `High API error rate: ${(apiMetrics.errorRate * 100).toFixed(1)}%`,
        severity: 'high' as const,
        data: apiMetrics,
      });
    }
    
    return anomalies;
  }
  
  // Generate security report
  async generateSecurityReport(period: 'day' | 'week' | 'month' = 'day'): Promise<{
    period: string;
    summary: any;
    events: SecurityEvent[];
    blockedIPs: any[];
    recommendations: string[];
  }> {
    const metrics = await this.getSecurityMetrics();
    const anomalies = await this.detectAnomalies();
    
    const recommendations = [];
    
    // Generate recommendations based on events
    if (metrics.eventsByType[SecurityEventType.BRUTE_FORCE_ATTACK] > 0) {
      recommendations.push('Consider implementing CAPTCHA for login forms');
    }
    
    if (metrics.eventsByType[SecurityEventType.SQL_INJECTION_ATTEMPT] > 0) {
      recommendations.push('Review and strengthen input validation');
    }
    
    if (anomalies.some(a => a.severity === 'high')) {
      recommendations.push('Investigate high-severity anomalies immediately');
    }
    
    return {
      period,
      summary: {
        totalEvents: metrics.totalEvents,
        blockedIPs: metrics.blockedIPs,
        criticalEvents: metrics.recentEvents.filter(e => e.severity === 'critical').length,
        anomalies: anomalies.length,
      },
      events: metrics.recentEvents,
      blockedIPs: Array.from(this.blockedIPs).map(ip => ({ ip })),
      recommendations,
    };
  }
  
  // Helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private setupEventHandlers(): void {
    this.on('securityEvent', (event: SecurityEvent) => {
      console.log(`Security event: ${event.type} from ${event.ip}`);
    });
  }
  
  private async loadBlockedIPs(): Promise<void> {
    const blockedKeys = await cache.keys('blocked_ip:*');
    for (const key of blockedKeys) {
      const ip = key.replace('blocked_ip:', '');
      this.blockedIPs.add(ip);
    }
  }
  
  private async sendSecurityAlert(alert: any): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    console.log('Security Alert:', alert);
    
    // Store alert for dashboard
    await cache.lpush('security_alerts', JSON.stringify({
      ...alert,
      timestamp: new Date().toISOString(),
    }));
    
    await cache.expire('security_alerts', 7 * 24 * 3600); // 7 days
  }
  
  private async enableEmergencyRateLimit(): Promise<void> {
    await cache.set('emergency_rate_limit', true, 3600); // 1 hour
  }
  
  private async getLoginMetrics(): Promise<any> {
    // Implement login metrics calculation
    return { failureRate: 0.1 };
  }
  
  private async getGeographicMetrics(): Promise<any> {
    // Implement geographic metrics calculation
    return { newCountries: [] };
  }
  
  private async getAPIMetrics(): Promise<any> {
    // Implement API metrics calculation
    return { errorRate: 0.05 };
  }
}

// Real-time security dashboard
export class SecurityDashboard {
  private monitoring: SecurityMonitoringService;
  
  constructor() {
    this.monitoring = SecurityMonitoringService.getInstance();
  }
  
  // Get real-time security status
  async getSecurityStatus(): Promise<{
    status: 'secure' | 'warning' | 'critical';
    activeThreats: number;
    blockedIPs: number;
    recentEvents: SecurityEvent[];
    systemHealth: any;
  }> {
    const metrics = await this.monitoring.getSecurityMetrics();
    const anomalies = await this.monitoring.detectAnomalies();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    
    if (anomalies.some(a => a.severity === 'high')) {
      status = 'critical';
    } else if (anomalies.length > 0 || metrics.blockedIPs > 0) {
      status = 'warning';
    }
    
    return {
      status,
      activeThreats: anomalies.filter(a => a.severity === 'high').length,
      blockedIPs: metrics.blockedIPs,
      recentEvents: metrics.recentEvents.slice(0, 10),
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }
  
  // Get security insights
  async getSecurityInsights(): Promise<{
    trends: any[];
    topThreats: any[];
    recommendations: string[];
  }> {
    const report = await this.monitoring.generateSecurityReport('week');
    
    return {
      trends: [], // Implement trend analysis
      topThreats: [], // Implement threat ranking
      recommendations: report.recommendations,
    };
  }
}

// Export singleton instance
export const securityMonitoring = SecurityMonitoringService.getInstance();
export const securityDashboard = new SecurityDashboard();