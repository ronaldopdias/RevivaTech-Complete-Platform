// Advanced Session Management System
// Handles session security, monitoring, and lifecycle management

import { Session } from '@/lib/auth/types';
import { auditLogger, AuditEventCategory, AuditLogLevel } from './audit-logger';

// Session status types
export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPICIOUS = 'suspicious',
}

// Session security levels
export enum SessionSecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Extended session interface with security information
export interface EnhancedSession extends Session {
  status: SessionStatus;
  securityLevel: SessionSecurityLevel;
  riskScore: number;
  lastActivity: Date;
  activityCount: number;
  deviceFingerprint?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  securityFlags: string[];
  trustedDevice: boolean;
  concurrentSessions?: number;
}

// Session activity tracking
export interface SessionActivity {
  id: string;
  sessionId: string;
  timestamp: Date;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskScore: number;
  metadata?: Record<string, any>;
}

// Session configuration
export const SESSION_CONFIG = {
  // Timeout settings (in minutes)
  idleTimeout: 30,
  absoluteTimeout: 480, // 8 hours
  extendedTimeout: 1440, // 24 hours (for remember me)
  
  // Security settings
  maxConcurrentSessions: 5,
  requireReauthForHighRisk: true,
  enableDeviceFingerprinting: true,
  enableGeolocationTracking: true,
  
  // Monitoring settings
  maxFailedActivities: 5,
  suspiciousActivityThreshold: 70,
  blockSuspiciousIPs: true,
  
  // Storage keys
  storageKeys: {
    currentSession: 'current_session',
    sessionList: 'session_list',
    deviceFingerprint: 'device_fingerprint',
    trustedDevices: 'trusted_devices',
  },
};

class SessionManager {
  private currentSession: EnhancedSession | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private sessionCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.setupActivityMonitoring();
    this.setupSessionChecks();
  }

  // Initialize session from storage
  private initializeSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SESSION_CONFIG.storageKeys.currentSession);
      if (stored) {
        const session = JSON.parse(stored);
        this.currentSession = {
          ...session,
          lastActivity: new Date(session.lastActivity),
          createdAt: new Date(session.createdAt),
          expiresAt: new Date(session.expiresAt),
        };

        // Validate session
        if (this.isSessionValid(this.currentSession)) {
          this.startSessionMonitoring();
        } else {
          this.terminateSession('Session validation failed');
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      this.clearSessionData();
    }
  }

  // Create new session
  createSession(sessionData: Partial<Session>): EnhancedSession {
    const deviceFingerprint = this.generateDeviceFingerprint();
    const securityLevel = this.calculateSessionSecurityLevel(sessionData);
    
    const session: EnhancedSession = {
      id: sessionData.id || this.generateSessionId(),
      userId: sessionData.userId!,
      deviceInfo: sessionData.deviceInfo!,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: sessionData.expiresAt || this.calculateExpirationTime(),
      status: SessionStatus.ACTIVE,
      securityLevel,
      riskScore: 0,
      activityCount: 0,
      deviceFingerprint,
      securityFlags: [],
      trustedDevice: this.isTrustedDevice(deviceFingerprint),
      concurrentSessions: 0,
    };

    this.currentSession = session;
    this.saveSessionData();
    this.startSessionMonitoring();

    // Log session creation
    auditLogger.logAuthentication(
      'SESSION_CREATED',
      true,
      `New session created for user ${session.userId}`,
      {
        sessionId: session.id,
        deviceFingerprint,
        securityLevel,
        metadata: { deviceInfo: session.deviceInfo }
      }
    );

    return session;
  }

  // Update session activity
  updateActivity(action: string, resource?: string, metadata?: Record<string, any>): void {
    if (!this.currentSession) return;

    const now = new Date();
    const riskScore = this.calculateActivityRiskScore(action, resource);

    // Create activity record
    const activity: SessionActivity = {
      id: this.generateActivityId(),
      sessionId: this.currentSession.id,
      timestamp: now,
      action,
      resource,
      ipAddress: this.getCurrentIP(),
      userAgent: navigator.userAgent,
      success: true,
      riskScore,
      metadata,
    };

    // Update session
    this.currentSession.lastActivity = now;
    this.currentSession.activityCount++;
    this.currentSession.riskScore = this.updateSessionRiskScore(riskScore);

    // Check for suspicious activity
    this.checkSuspiciousActivity(activity);

    // Extend session if needed
    if (this.shouldExtendSession()) {
      this.extendSession();
    }

    this.saveSessionData();

    // Log activity
    auditLogger.logUserAction(
      action,
      `User performed action: ${action}${resource ? ` on ${resource}` : ''}`,
      {
        sessionId: this.currentSession.id,
        resource,
        riskScore,
        metadata
      }
    );

    // Reset activity timer
    this.resetActivityTimer();
  }

  // Check if session is valid
  isSessionValid(session?: EnhancedSession): boolean {
    const sess = session || this.currentSession;
    if (!sess) return false;

    const now = new Date();
    
    // Check expiration
    if (sess.expiresAt < now) {
      return false;
    }

    // Check idle timeout
    const idleTime = now.getTime() - sess.lastActivity.getTime();
    if (idleTime > SESSION_CONFIG.idleTimeout * 60 * 1000) {
      return false;
    }

    // Check status
    if (sess.status !== SessionStatus.ACTIVE) {
      return false;
    }

    return true;
  }

  // Extend session expiration
  extendSession(additionalMinutes?: number): void {
    if (!this.currentSession) return;

    const extension = additionalMinutes || SESSION_CONFIG.idleTimeout;
    const newExpiration = new Date(Date.now() + extension * 60 * 1000);
    
    this.currentSession.expiresAt = newExpiration;
    this.saveSessionData();

    auditLogger.info(
      'SESSION_EXTENDED',
      AuditEventCategory.AUTHENTICATION,
      `Session extended by ${extension} minutes`,
      {
        sessionId: this.currentSession.id,
        newExpiration: newExpiration.toISOString()
      }
    );
  }

  // Terminate session
  terminateSession(reason: string): void {
    if (!this.currentSession) return;

    const sessionId = this.currentSession.id;
    
    this.currentSession.status = SessionStatus.TERMINATED;
    this.saveSessionData();

    // Stop monitoring
    this.stopSessionMonitoring();

    // Clear session data
    this.clearSessionData();

    auditLogger.logAuthentication(
      'SESSION_TERMINATED',
      true,
      `Session terminated: ${reason}`,
      { sessionId, reason }
    );
  }

  // Get current session
  getCurrentSession(): EnhancedSession | null {
    return this.currentSession;
  }

  // Get session status
  getSessionStatus(): SessionStatus {
    if (!this.currentSession) return SessionStatus.INACTIVE;
    
    if (!this.isSessionValid()) {
      this.currentSession.status = SessionStatus.EXPIRED;
      this.saveSessionData();
      return SessionStatus.EXPIRED;
    }

    return this.currentSession.status;
  }

  // Check if device is trusted
  isTrustedDevice(fingerprint: string): boolean {
    try {
      const trusted = localStorage.getItem(SESSION_CONFIG.storageKeys.trustedDevices);
      if (trusted) {
        const trustedDevices = JSON.parse(trusted);
        return trustedDevices.includes(fingerprint);
      }
    } catch (error) {
      console.error('Error checking trusted device:', error);
    }
    return false;
  }

  // Trust current device
  trustCurrentDevice(): void {
    if (!this.currentSession?.deviceFingerprint) return;

    try {
      const stored = localStorage.getItem(SESSION_CONFIG.storageKeys.trustedDevices) || '[]';
      const trustedDevices = JSON.parse(stored);
      
      if (!trustedDevices.includes(this.currentSession.deviceFingerprint)) {
        trustedDevices.push(this.currentSession.deviceFingerprint);
        localStorage.setItem(SESSION_CONFIG.storageKeys.trustedDevices, JSON.stringify(trustedDevices));
        
        this.currentSession.trustedDevice = true;
        this.saveSessionData();

        auditLogger.info(
          'DEVICE_TRUSTED',
          AuditEventCategory.SECURITY,
          'Device marked as trusted',
          {
            sessionId: this.currentSession.id,
            deviceFingerprint: this.currentSession.deviceFingerprint
          }
        );
      }
    } catch (error) {
      console.error('Error trusting device:', error);
    }
  }

  // Get session security info
  getSecurityInfo(): {
    securityLevel: SessionSecurityLevel;
    riskScore: number;
    securityFlags: string[];
    trustedDevice: boolean;
    lastActivity: Date;
  } | null {
    if (!this.currentSession) return null;

    return {
      securityLevel: this.currentSession.securityLevel,
      riskScore: this.currentSession.riskScore,
      securityFlags: this.currentSession.securityFlags,
      trustedDevice: this.currentSession.trustedDevice,
      lastActivity: this.currentSession.lastActivity,
    };
  }

  // Private methods

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceFingerprint(): string {
    if (!SESSION_CONFIG.enableDeviceFingerprinting) return 'disabled';

    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0,
    ].join('|');

    // Simple hash - in production, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  private calculateSessionSecurityLevel(sessionData: Partial<Session>): SessionSecurityLevel {
    let score = 0;

    // Check device info
    if (sessionData.deviceInfo) {
      const { userAgent, ip } = sessionData.deviceInfo;
      
      // Known browser
      if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari')) {
        score += 10;
      }

      // Local IP (more trusted)
      if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
        score += 15;
      }
    }

    // Device fingerprint check
    const fingerprint = this.generateDeviceFingerprint();
    if (this.isTrustedDevice(fingerprint)) {
      score += 20;
    }

    if (score >= 30) return SessionSecurityLevel.HIGH;
    if (score >= 20) return SessionSecurityLevel.MEDIUM;
    if (score >= 10) return SessionSecurityLevel.LOW;
    return SessionSecurityLevel.CRITICAL;
  }

  private calculateActivityRiskScore(action: string, resource?: string): number {
    let score = 5; // Base score

    // High-risk actions
    const highRiskActions = ['delete', 'transfer', 'payment', 'admin', 'configure'];
    if (highRiskActions.some(risk => action.toLowerCase().includes(risk))) {
      score += 20;
    }

    // High-risk resources
    const highRiskResources = ['users', 'payments', 'settings', 'admin'];
    if (resource && highRiskResources.some(risk => resource.toLowerCase().includes(risk))) {
      score += 15;
    }

    // Time-based risk (higher risk outside business hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private updateSessionRiskScore(activityRisk: number): number {
    if (!this.currentSession) return 0;

    // Weighted average with decay
    const weight = 0.1;
    const decayedScore = this.currentSession.riskScore * 0.95;
    return Math.min(100, decayedScore + (activityRisk * weight));
  }

  private checkSuspiciousActivity(activity: SessionActivity): void {
    if (!this.currentSession) return;

    const flags: string[] = [];

    // High risk score
    if (activity.riskScore > SESSION_CONFIG.suspiciousActivityThreshold) {
      flags.push('high_risk_activity');
    }

    // Rapid successive actions
    if (this.currentSession.activityCount > 10) {
      const timeSinceCreation = Date.now() - this.currentSession.createdAt.getTime();
      if (timeSinceCreation < 60000) { // 1 minute
        flags.push('rapid_activity');
      }
    }

    // IP address change
    if (activity.ipAddress !== this.currentSession.deviceInfo.ip) {
      flags.push('ip_change');
    }

    if (flags.length > 0) {
      this.currentSession.securityFlags.push(...flags);
      
      if (flags.includes('high_risk_activity')) {
        this.currentSession.status = SessionStatus.SUSPICIOUS;
      }

      auditLogger.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        `Suspicious activity detected: ${flags.join(', ')}`,
        this.currentSession.riskScore,
        {
          sessionId: this.currentSession.id,
          activity,
          flags
        }
      );
    }
  }

  private shouldExtendSession(): boolean {
    if (!this.currentSession) return false;

    const timeUntilExpiry = this.currentSession.expiresAt.getTime() - Date.now();
    const extensionThreshold = 15 * 60 * 1000; // 15 minutes

    return timeUntilExpiry < extensionThreshold;
  }

  private calculateExpirationTime(): Date {
    const minutes = SESSION_CONFIG.idleTimeout;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private getCurrentIP(): string {
    // In a real implementation, this would come from the server
    return 'unknown';
  }

  private saveSessionData(): void {
    if (!this.currentSession || typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        SESSION_CONFIG.storageKeys.currentSession,
        JSON.stringify(this.currentSession)
      );
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  private clearSessionData(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(SESSION_CONFIG.storageKeys.currentSession);
    } catch (error) {
      console.error('Error clearing session data:', error);
    }

    this.currentSession = null;
  }

  private setupActivityMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => {
      if (this.currentSession && this.isSessionValid()) {
        this.resetActivityTimer();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateActivity('TAB_HIDDEN');
      } else {
        this.updateActivity('TAB_VISIBLE');
      }
    });
  }

  private setupSessionChecks(): void {
    // Periodic session validation
    this.sessionCheckTimer = setInterval(() => {
      if (this.currentSession && !this.isSessionValid()) {
        this.terminateSession('Session expired');
      }
    }, 60000); // Check every minute
  }

  private startSessionMonitoring(): void {
    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      if (this.currentSession) {
        this.updateActivity('HEARTBEAT');
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    this.resetActivityTimer();
  }

  private stopSessionMonitoring(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
  }

  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      this.terminateSession('Idle timeout');
    }, SESSION_CONFIG.idleTimeout * 60 * 1000);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export utilities
export const sessionUtils = {
  // Format session duration
  formatDuration: (session: EnhancedSession): string => {
    const duration = Date.now() - session.createdAt.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Format time until expiry
  formatTimeUntilExpiry: (session: EnhancedSession): string => {
    const timeLeft = session.expiresAt.getTime() - Date.now();
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Get security level color
  getSecurityLevelColor: (level: SessionSecurityLevel): string => {
    switch (level) {
      case SessionSecurityLevel.HIGH: return 'text-green-600';
      case SessionSecurityLevel.MEDIUM: return 'text-yellow-600';
      case SessionSecurityLevel.LOW: return 'text-orange-600';
      case SessionSecurityLevel.CRITICAL: return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  // Get risk score color
  getRiskScoreColor: (score: number): string => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  },
};

export default sessionManager;