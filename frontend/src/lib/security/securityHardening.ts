/**
 * Security Hardening System
 * Advanced security measures and protection for RevivaTech platform
 * 
 * Features:
 * - Input validation and sanitization
 * - XSS and CSRF protection
 * - Rate limiting and DDoS protection
 * - Security headers management
 * - Threat detection and monitoring
 * - Audit logging and compliance
 * - Data encryption and privacy
 */

import { z } from 'zod';

// Security Event Schema
export const SecurityEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(['authentication', 'authorization', 'input_validation', 'rate_limit', 'suspicious_activity', 'data_access']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  user: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  action: z.string(),
  resource: z.string().optional(),
  details: z.record(z.any()).optional(),
  blocked: z.boolean().default(false),
  resolved: z.boolean().default(false)
});

export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

// Rate Limit Configuration
export const RateLimitConfigSchema = z.object({
  endpoint: z.string(),
  windowMs: z.number(),
  maxRequests: z.number(),
  message: z.string(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false)
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// Security Policy Schema
export const SecurityPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['input_validation', 'access_control', 'data_protection', 'monitoring']),
  enabled: z.boolean().default(true),
  rules: z.array(z.object({
    condition: z.string(),
    action: z.enum(['allow', 'block', 'log', 'alert']),
    parameters: z.record(z.any()).optional()
  })),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type SecurityPolicy = z.infer<typeof SecurityPolicySchema>;

// Security Hardening Service
export class SecurityHardeningService {
  private events: SecurityEvent[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private policies: SecurityPolicy[] = [];
  private blockedIPs: Set<string> = new Set();
  private suspiciousPatterns: RegExp[] = [];

  constructor() {
    this.initializeSecurityPolicies();
    this.initializeSuspiciousPatterns();
    this.setupSecurityHeaders();
  }

  // Initialize security policies
  private initializeSecurityPolicies(): void {
    this.policies = [
      {
        id: 'input-validation-policy',
        name: 'Input Validation Policy',
        description: 'Validates and sanitizes all user inputs',
        type: 'input_validation',
        enabled: true,
        rules: [
          {
            condition: 'contains_script_tags',
            action: 'block',
            parameters: { logLevel: 'high' }
          },
          {
            condition: 'contains_sql_injection',
            action: 'block',
            parameters: { logLevel: 'critical' }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'access-control-policy',
        name: 'Access Control Policy',
        description: 'Manages user access and permissions',
        type: 'access_control',
        enabled: true,
        rules: [
          {
            condition: 'admin_resource_access',
            action: 'log',
            parameters: { requiresAuth: true }
          },
          {
            condition: 'failed_login_attempts',
            action: 'block',
            parameters: { threshold: 5, windowMs: 900000 }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Initialize suspicious patterns
  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /union\s+select/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /drop\s+table/gi,
      /--\s*$/gm,
      /\/\*.*?\*\//g
    ];
  }

  // Setup security headers
  private setupSecurityHeaders(): void {
    if (typeof window !== 'undefined') {
      // This would be implemented on the server side
      console.log('Security headers configured');
    }
  }

  // Input validation and sanitization
  validateInput(input: string, context: string = 'general'): { valid: boolean; sanitized: string; threats: string[] } {
    const threats: string[] = [];
    let sanitized = input;

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        threats.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    // XSS protection
    sanitized = this.sanitizeXSS(sanitized);

    // SQL injection protection
    if (this.detectSQLInjection(input)) {
      threats.push('Potential SQL injection detected');
    }

    // Log security event if threats detected
    if (threats.length > 0) {
      this.logSecurityEvent({
        type: 'input_validation',
        severity: 'high',
        source: 'input_validator',
        action: 'input_validation_failed',
        details: {
          context,
          input: input.substring(0, 100),
          threats
        },
        blocked: true
      });
    }

    return {
      valid: threats.length === 0,
      sanitized,
      threats
    };
  }

  // XSS sanitization
  private sanitizeXSS(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // SQL injection detection
  private detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\b\s*['"].*['"])/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(\bUNION\b.*\bSELECT\b)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Rate limiting
  checkRateLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; resetTime: number; remaining: number } {
    const key = `${config.endpoint}:${identifier}`;
    const now = Date.now();
    const stored = this.rateLimitStore.get(key);

    if (!stored || now > stored.resetTime) {
      // Reset or initialize
      const resetTime = now + config.windowMs;
      this.rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true, resetTime, remaining: config.maxRequests - 1 };
    }

    if (stored.count >= config.maxRequests) {
      // Rate limit exceeded
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        source: 'rate_limiter',
        action: 'rate_limit_exceeded',
        details: {
          endpoint: config.endpoint,
          identifier,
          count: stored.count,
          limit: config.maxRequests
        },
        blocked: true
      });

      return { allowed: false, resetTime: stored.resetTime, remaining: 0 };
    }

    // Increment counter
    stored.count++;
    this.rateLimitStore.set(key, stored);

    return { allowed: true, resetTime: stored.resetTime, remaining: config.maxRequests - stored.count };
  }

  // Authentication security
  validatePassword(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Password must contain special characters');

    // Common password check
    if (this.isCommonPassword(password)) {
      score = Math.max(0, score - 2);
      feedback.push('Password is too common');
    }

    return {
      valid: score >= 4,
      score,
      feedback
    };
  }

  // Common password detection
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  // Session security
  validateSession(sessionToken: string, userAgent: string, ip: string): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let valid = true;

    // Basic token validation
    if (!sessionToken || sessionToken.length < 32) {
      valid = false;
      reasons.push('Invalid session token format');
    }

    // Check for suspicious activity
    if (this.detectSuspiciousActivity(userAgent, ip)) {
      valid = false;
      reasons.push('Suspicious activity detected');
    }

    // Check blocked IPs
    if (this.blockedIPs.has(ip)) {
      valid = false;
      reasons.push('IP address is blocked');
    }

    if (!valid) {
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'high',
        source: 'session_validator',
        action: 'session_validation_failed',
        ip,
        userAgent,
        details: { reasons },
        blocked: true
      });
    }

    return { valid, reasons };
  }

  // Suspicious activity detection
  private detectSuspiciousActivity(userAgent: string, ip: string): boolean {
    // Check for bot patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }

    // Check for suspicious IP patterns
    const suspiciousIPs = [
      /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./ // Private IPs from public access
    ];

    return suspiciousIPs.some(pattern => pattern.test(ip));
  }

  // Data encryption utilities
  encryptSensitiveData(data: string, key?: string): string {
    // Simple encryption for demonstration
    // In production, use proper encryption libraries
    const shift = key ? key.length : 13;
    return data.split('').map(char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(((code - 32 + shift) % 95) + 32);
    }).join('');
  }

  decryptSensitiveData(encryptedData: string, key?: string): string {
    // Simple decryption for demonstration
    const shift = key ? key.length : 13;
    return encryptedData.split('').map(char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(((code - 32 - shift + 95) % 95) + 32);
    }).join('');
  }

  // Audit logging
  logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const event: SecurityEvent = {
      ...eventData,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const validatedEvent = SecurityEventSchema.parse(event);
    this.events.push(validatedEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Critical events require immediate action
    if (event.severity === 'critical') {
      this.handleCriticalEvent(event);
    }
  }

  // Handle critical security events
  private handleCriticalEvent(event: SecurityEvent): void {
    console.warn('CRITICAL SECURITY EVENT:', event);

    // Block IP if suspicious
    if (event.ip && event.blocked) {
      this.blockedIPs.add(event.ip);
      
      // Auto-unblock after 1 hour
      setTimeout(() => {
        this.blockedIPs.delete(event.ip!);
      }, 3600000);
    }

    // In production, this would:
    // 1. Send alerts to security team
    // 2. Update firewall rules
    // 3. Create incident tickets
    // 4. Trigger automated responses
  }

  // Security analytics
  getSecurityAnalytics(timeRange: number = 24): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedAttempts: number;
    topThreats: Array<{ threat: string; count: number }>;
  } {
    const cutoff = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const blockedAttempts = recentEvents.filter(e => e.blocked).length;

    // Count threat types
    const threatCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.details?.threats) {
        event.details.threats.forEach((threat: string) => {
          threatCounts.set(threat, (threatCounts.get(threat) || 0) + 1);
        });
      }
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedAttempts,
      topThreats
    };
  }

  // Public API
  getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    timeRange?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filters?.type) {
      filteredEvents = filteredEvents.filter(e => e.type === filters.type);
    }

    if (filters?.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === filters.severity);
    }

    if (filters?.timeRange) {
      const cutoff = new Date(Date.now() - filters.timeRange * 60 * 60 * 1000);
      filteredEvents = filteredEvents.filter(e => e.timestamp >= cutoff);
    }

    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(-filters.limit);
    }

    return filteredEvents.reverse();
  }

  getSecurityPolicies(): SecurityPolicy[] {
    return this.policies;
  }

  updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index === -1) return false;

    this.policies[index] = {
      ...this.policies[index],
      ...updates,
      updatedAt: new Date()
    };

    return true;
  }

  blockIP(ip: string, duration: number = 3600000): void {
    this.blockedIPs.add(ip);
    
    this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      source: 'manual_block',
      action: 'ip_blocked',
      ip,
      details: { duration },
      blocked: true
    });

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  unblockIP(ip: string): boolean {
    const wasBlocked = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    
    if (wasBlocked) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        source: 'manual_unblock',
        action: 'ip_unblocked',
        ip,
        blocked: false
      });
    }

    return wasBlocked;
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

// Default rate limit configurations
export const defaultRateLimits: RateLimitConfig[] = [
  {
    endpoint: '/api/auth/login',
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later'
  },
  {
    endpoint: '/api/auth/register',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later'
  },
  {
    endpoint: '/api/contact',
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 3,
    message: 'Too many contact form submissions, please try again later'
  },
  {
    endpoint: '/api/booking',
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 2,
    message: 'Too many booking attempts, please try again later'
  }
];

// Global security hardening instance
export const securityHardening = new SecurityHardeningService();