/**
 * Security Sanitizer for Production Environment
 * Provides additional security layers for error reporting and logging
 * Prevents sensitive information from being exposed in production
 * Works with existing error reporting system
 */

export interface SecurityConfig {
  enableSanitization: boolean;
  redactUrls: boolean;
  redactUserData: boolean;
  redactApiKeys: boolean;
  redactTokens: boolean;
  maxStackTraceDepth: number;
  allowedDomains: string[];
  blockedUserAgents: RegExp[];
  enableCSPViolationReporting: boolean;
  rateLimitErrorReporting: boolean;
}

export interface SanitizationRule {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  category: 'pii' | 'auth' | 'system' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityViolation {
  type: 'csp' | 'xss' | 'data_leak' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  data: any;
  timestamp: string;
  userAgent: string;
  url: string;
}

class SecuritySanitizer {
  private config: SecurityConfig;
  private sanitizationRules: SanitizationRule[] = [];
  private violationLog: SecurityViolation[] = [];
  private errorReportingRateLimit: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableSanitization: process.env.NODE_ENV === 'production',
      redactUrls: true,
      redactUserData: true,
      redactApiKeys: true,
      redactTokens: true,
      maxStackTraceDepth: 10,
      allowedDomains: ['revivatech.co.uk', 'localhost'],
      blockedUserAgents: [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
      ],
      enableCSPViolationReporting: true,
      rateLimitErrorReporting: true,
      ...config,
    };

    this.initializeDefaultRules();
    this.setupSecurityHandlers();
  }

  private initializeDefaultRules(): void {
    // PII Redaction Rules
    this.sanitizationRules.push(
      {
        name: 'Email Addresses',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]',
        category: 'pii',
        severity: 'high',
      },
      {
        name: 'Phone Numbers',
        pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        replacement: '[PHONE_REDACTED]',
        category: 'pii',
        severity: 'medium',
      },
      {
        name: 'Credit Card Numbers',
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[CARD_REDACTED]',
        category: 'pii',
        severity: 'critical',
      },
      {
        name: 'Social Security Numbers',
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN_REDACTED]',
        category: 'pii',
        severity: 'critical',
      }
    );

    // Authentication Redaction Rules
    this.sanitizationRules.push(
      {
        name: 'Bearer Tokens',
        pattern: /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
        replacement: 'Bearer [TOKEN_REDACTED]',
        category: 'auth',
        severity: 'critical',
      },
      {
        name: 'API Keys',
        pattern: /(api[_-]?key|apikey)[\"']?\s*[:|=]\s*[\"']?[A-Za-z0-9._~+/=-]{16,}/gi,
        replacement: '$1: [API_KEY_REDACTED]',
        category: 'auth',
        severity: 'critical',
      },
      {
        name: 'Passwords',
        pattern: /(password|pwd|pass)[\"']?\s*[:|=]\s*[\"']?[^\s\"']{6,}/gi,
        replacement: '$1: [PASSWORD_REDACTED]',
        category: 'auth',
        severity: 'critical',
      },
      {
        name: 'JWT Tokens',
        pattern: /eyJ[A-Za-z0-9._~+/=-]+/g,
        replacement: '[JWT_REDACTED]',
        category: 'auth',
        severity: 'critical',
      }
    );

    // System Information Redaction Rules
    this.sanitizationRules.push(
      {
        name: 'File Paths',
        pattern: /[A-Z]:\\[\\\w\s\-_\.\(\)]+|\/[\w\s\-_\.\(\)\/]+\.(js|ts|tsx|jsx|json|log)/gi,
        replacement: '[FILE_PATH_REDACTED]',
        category: 'system',
        severity: 'medium',
      },
      {
        name: 'IP Addresses',
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        replacement: '[IP_REDACTED]',
        category: 'system',
        severity: 'medium',
      },
      {
        name: 'Database Connection Strings',
        pattern: /(mongodb|mysql|postgres|redis):\/\/[^\s]+/gi,
        replacement: '$1://[CONNECTION_REDACTED]',
        category: 'system',
        severity: 'critical',
      }
    );
  }

  private setupSecurityHandlers(): void {
    if (typeof window === 'undefined') return;

    // CSP Violation Handler
    if (this.config.enableCSPViolationReporting) {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.logSecurityViolation({
          type: 'csp',
          severity: 'high',
          description: `CSP Violation: ${event.violatedDirective}`,
          data: {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            originalPolicy: event.originalPolicy,
            documentURI: event.documentURI,
          },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      });
    }

    // Detect suspicious activity
    this.setupSuspiciousActivityDetection();
  }

  private setupSuspiciousActivityDetection(): void {
    if (typeof window === 'undefined') return;

    // Detect blocked user agents
    if (this.config.blockedUserAgents.some(pattern => pattern.test(navigator.userAgent))) {
      this.logSecurityViolation({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Blocked user agent detected',
        data: { userAgent: navigator.userAgent },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }

    // Monitor for potential XSS attempts in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      if (this.containsPotentialXSS(value)) {
        this.logSecurityViolation({
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS attempt in URL parameters',
          data: { parameter: key, value: '[REDACTED]' },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }
    });
  }

  private containsPotentialXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Public API

  /**
   * Sanitize any value (string, object, error) for safe logging/reporting
   */
  sanitize(value: any): any {
    if (!this.config.enableSanitization) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (value instanceof Error) {
      return this.sanitizeError(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  /**
   * Sanitize string content
   */
  sanitizeString(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;

    // Apply all sanitization rules
    this.sanitizationRules.forEach(rule => {
      if (typeof rule.replacement === 'string') {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
      } else {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize error objects
   */
  sanitizeError(error: Error): any {
    const sanitized: any = {
      name: error.name,
      message: this.sanitizeString(error.message),
    };

    // Sanitize stack trace
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const limitedStack = stackLines.slice(0, this.config.maxStackTraceDepth);
      sanitized.stack = limitedStack.map(line => this.sanitizeString(line)).join('\n');
    }

    // Sanitize additional error properties
    Object.keys(error).forEach(key => {
      if (key !== 'name' && key !== 'message' && key !== 'stack') {
        sanitized[key] = this.sanitize((error as any)[key]);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize object properties
   */
  sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if key contains sensitive information
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'pwd', 'pass', 'secret', 'key', 'token', 'auth',
      'credential', 'authorization', 'cookie', 'session', 'csrf',
      'api_key', 'apikey', 'access_token', 'refresh_token',
      'private_key', 'client_secret', 'database_url', 'connection_string'
    ];

    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Check if error reporting should be rate limited
   */
  shouldRateLimitErrorReporting(errorKey: string): boolean {
    if (!this.config.rateLimitErrorReporting) return false;

    const now = Date.now();
    const rateLimit = this.errorReportingRateLimit.get(errorKey);

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= 10) { // Max 10 identical errors per minute
          return true;
        }
        rateLimit.count++;
      } else {
        rateLimit.count = 1;
        rateLimit.resetTime = now + 60000; // 1 minute window
      }
    } else {
      this.errorReportingRateLimit.set(errorKey, {
        count: 1,
        resetTime: now + 60000,
      });
    }

    return false;
  }

  /**
   * Log security violation
   */
  logSecurityViolation(violation: SecurityViolation): void {
    this.violationLog.push(violation);

    // Keep only last 100 violations
    if (this.violationLog.length > 100) {
      this.violationLog = this.violationLog.slice(-100);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && violation.severity === 'critical') {
      this.reportCriticalViolation(violation);
    }
  }

  private async reportCriticalViolation(violation: SecurityViolation): Promise<void> {
    try {
      await fetch('/api/security/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.sanitize(violation)),
      });
    } catch (error) {
      // Silently fail - don't create infinite loop
    }
  }

  /**
   * Add custom sanitization rule
   */
  addSanitizationRule(rule: SanitizationRule): void {
    this.sanitizationRules.push(rule);
  }

  /**
   * Remove sanitization rule by name
   */
  removeSanitizationRule(name: string): void {
    this.sanitizationRules = this.sanitizationRules.filter(rule => rule.name !== name);
  }

  /**
   * Get all security violations
   */
  getSecurityViolations(): SecurityViolation[] {
    return [...this.violationLog];
  }

  /**
   * Clear security violations log
   */
  clearSecurityViolations(): void {
    this.violationLog = [];
  }

  /**
   * Get sanitization statistics
   */
  getSanitizationStats(): {
    totalRules: number;
    rulesByCategory: Record<string, number>;
    rulesBySeverity: Record<string, number>;
    violationCount: number;
  } {
    const rulesByCategory = this.sanitizationRules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const rulesBySeverity = this.sanitizationRules.reduce((acc, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.sanitizationRules.length,
      rulesByCategory,
      rulesBySeverity,
      violationCount: this.violationLog.length,
    };
  }

  /**
   * Test sanitization on a sample input
   */
  testSanitization(input: any): {
    original: any;
    sanitized: any;
    rulesApplied: string[];
  } {
    const originalString = typeof input === 'string' ? input : JSON.stringify(input);
    const sanitized = this.sanitize(input);
    
    // Track which rules were applied
    const rulesApplied: string[] = [];
    this.sanitizationRules.forEach(rule => {
      if (typeof input === 'string' && rule.pattern.test(input)) {
        rulesApplied.push(rule.name);
      }
    });

    return {
      original: input,
      sanitized,
      rulesApplied,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const securitySanitizer = new SecuritySanitizer();

// Convenience exports
export const sanitizeForLogging = (value: any) => securitySanitizer.sanitize(value);
export const sanitizeError = (error: Error) => securitySanitizer.sanitizeError(error);
export const addSanitizationRule = (rule: SanitizationRule) => securitySanitizer.addSanitizationRule(rule);
export const getSecurityViolations = () => securitySanitizer.getSecurityViolations();
export const testSanitization = (input: any) => securitySanitizer.testSanitization(input);

export default securitySanitizer;