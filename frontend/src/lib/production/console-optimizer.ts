/**
 * Production Safety Layer for Console Management
 * Ensures console methods are properly handled in production builds
 * Provides security features like PII redaction and error sanitization
 * Integrates with existing console manager for development experience
 */

export interface ProductionConfig {
  stripConsoleLogs: boolean;
  enableDebugMode: boolean;
  redactPII: boolean;
  sanitizeErrors: boolean;
  allowedLogLevels: ('error' | 'warn' | 'info' | 'log' | 'debug')[];
  maxLogLength: number;
  rateLimit: {
    enabled: boolean;
    maxLogs: number;
    windowMs: number;
  };
  sensitivePatterns: RegExp[];
}

export interface PIIRedactionRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

class ProductionConsoleOptimizer {
  private config: ProductionConfig;
  private rateLimitCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private originalConsole: typeof console;
  private isProduction: boolean;
  
  // Default PII patterns to redact in production
  private defaultPIIPatterns: PIIRedactionRule[] = [
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      description: 'Email addresses'
    },
    {
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
      description: 'Credit card numbers'
    },
    {
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
      description: 'Social Security Numbers'
    },
    {
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      replacement: '[PHONE_REDACTED]',
      description: 'Phone numbers'
    },
    {
      pattern: /(password|pwd|pass|secret|key|token|auth|credential)[\"']?\s*[:|=]\s*[\"']?[^\s\"']+/gi,
      replacement: '$1: [REDACTED]',
      description: 'Passwords and secrets'
    },
    {
      pattern: /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
      replacement: 'Bearer [TOKEN_REDACTED]',
      description: 'Bearer tokens'
    },
    {
      pattern: /api[_-]?key[\"']?\s*[:|=]\s*[\"']?[A-Za-z0-9._~+/=-]+/gi,
      replacement: 'api_key: [REDACTED]',
      description: 'API keys'
    }
  ];

  constructor(config?: Partial<ProductionConfig>) {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      stripConsoleLogs: this.isProduction,
      enableDebugMode: typeof window !== 'undefined' ? 
        localStorage.getItem('revivatech_debug_mode') === 'true' : false,
      redactPII: this.isProduction,
      sanitizeErrors: true,
      allowedLogLevels: this.isProduction ? ['error', 'warn'] : ['error', 'warn', 'info', 'log', 'debug'],
      maxLogLength: this.isProduction ? 1000 : 10000,
      rateLimit: {
        enabled: this.isProduction,
        maxLogs: 50, // Max 50 logs per window
        windowMs: 60000, // 1 minute window
      },
      sensitivePatterns: [],
      ...config,
    };

    // Preserve original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
      trace: console.trace.bind(console),
      table: console.table.bind(console),
      group: console.group.bind(console),
      groupCollapsed: console.groupCollapsed.bind(console),
      groupEnd: console.groupEnd.bind(console),
      clear: console.clear.bind(console),
      count: console.count.bind(console),
      time: console.time.bind(console),
      timeEnd: console.timeEnd.bind(console),
      assert: console.assert.bind(console),
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.stripConsoleLogs && !this.config.enableDebugMode) {
      this.stripConsoleInProduction();
    } else {
      this.enhanceConsoleForSafety();
    }
  }

  private stripConsoleInProduction(): void {
    // Replace all console methods with no-ops in production
    const noOp = () => {};
    
    console.log = noOp;
    console.info = noOp;
    console.debug = noOp;
    console.trace = noOp;
    console.table = noOp;
    console.group = noOp;
    console.groupCollapsed = noOp;
    console.groupEnd = noOp;
    console.count = noOp;
    console.time = noOp;
    console.timeEnd = noOp;
    
    // Keep error and warn for critical issues, but sanitize them
    console.error = (...args: any[]) => {
      if (this.shouldAllowLog('error', args)) {
        const sanitizedArgs = this.sanitizeArgs(args);
        this.originalConsole.error(...sanitizedArgs);
      }
    };
    
    console.warn = (...args: any[]) => {
      if (this.shouldAllowLog('warn', args)) {
        const sanitizedArgs = this.sanitizeArgs(args);
        this.originalConsole.warn(...sanitizedArgs);
      }
    };
  }

  private enhanceConsoleForSafety(): void {
    // In development or debug mode, enhance console methods with safety features
    const methods: Array<keyof Console> = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
    
    methods.forEach((method) => {
      const originalMethod = this.originalConsole[method as keyof typeof this.originalConsole] as Function;
      
      (console as any)[method] = (...args: any[]) => {
        if (this.shouldAllowLog(method, args)) {
          const sanitizedArgs = this.config.sanitizeErrors || this.config.redactPII ? 
            this.sanitizeArgs(args) : args;
          originalMethod(...sanitizedArgs);
        }
      };
    });
  }

  private shouldAllowLog(level: string, args: any[]): boolean {
    // Check if log level is allowed
    if (!this.config.allowedLogLevels.includes(level as any)) {
      return false;
    }

    // Check rate limiting
    if (this.config.rateLimit.enabled) {
      const key = `${level}_${this.hashArgs(args)}`;
      const now = Date.now();
      const limit = this.rateLimitCounts.get(key);

      if (limit) {
        if (now < limit.resetTime) {
          if (limit.count >= this.config.rateLimit.maxLogs) {
            return false; // Rate limited
          }
          limit.count++;
        } else {
          // Reset window
          limit.count = 1;
          limit.resetTime = now + this.config.rateLimit.windowMs;
        }
      } else {
        this.rateLimitCounts.set(key, {
          count: 1,
          resetTime: now + this.config.rateLimit.windowMs,
        });
      }
    }

    return true;
  }

  private hashArgs(args: any[]): string {
    // Simple hash of arguments for rate limiting
    const str = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join('');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => this.sanitizeValue(arg));
  }

  private sanitizeValue(value: any): any {
    if (value == null) return value;

    if (typeof value === 'string') {
      return this.redactPII(this.truncateIfNeeded(value));
    }

    if (typeof value === 'object') {
      if (value instanceof Error) {
        return this.sanitizeError(value);
      }
      
      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeValue(item));
      }

      // Handle objects
      try {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          // Skip functions and sensitive keys
          if (typeof val === 'function') continue;
          if (this.isSensitiveKey(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = this.sanitizeValue(val);
          }
        }
        return sanitized;
      } catch (error) {
        return '[Object - Serialization Error]';
      }
    }

    return value;
  }

  private sanitizeError(error: Error): any {
    const sanitized: any = {
      name: error.name,
      message: this.redactPII(error.message),
    };

    // In development, include stack trace
    if (!this.isProduction || this.config.enableDebugMode) {
      sanitized.stack = this.redactPII(error.stack || '');
    }

    // Include other error properties but sanitize them
    Object.getOwnPropertyNames(error).forEach(key => {
      if (key !== 'name' && key !== 'message' && key !== 'stack') {
        const value = (error as any)[key];
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeValue(value);
        }
      }
    });

    return sanitized;
  }

  private redactPII(text: string): string {
    if (!this.config.redactPII || typeof text !== 'string') return text;

    let result = text;
    
    // Apply default PII patterns
    this.defaultPIIPatterns.forEach(rule => {
      result = result.replace(rule.pattern, rule.replacement);
    });

    // Apply custom sensitive patterns
    this.config.sensitivePatterns.forEach(pattern => {
      result = result.replace(pattern, '[REDACTED]');
    });

    return result;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'pwd', 'pass', 'secret', 'key', 'token', 'auth', 'credential',
      'authorization', 'cookie', 'session', 'csrf', 'api_key', 'apikey',
      'access_token', 'refresh_token', 'private_key', 'client_secret'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  private truncateIfNeeded(text: string): string {
    if (text.length <= this.config.maxLogLength) return text;
    
    return text.substring(0, this.config.maxLogLength) + 
           `... [Truncated: ${text.length - this.config.maxLogLength} characters]`;
  }

  // Public API

  /**
   * Enable or disable debug mode in production
   */
  setDebugMode(enabled: boolean): void {
    this.config.enableDebugMode = enabled;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('revivatech_debug_mode', enabled.toString());
    }
    
    // Re-initialize console methods
    this.initialize();
  }

  /**
   * Add custom PII redaction pattern
   */
  addSensitivePattern(pattern: RegExp, description?: string): void {
    this.config.sensitivePatterns.push(pattern);
  }

  /**
   * Remove all custom sensitive patterns
   */
  clearSensitivePatterns(): void {
    this.config.sensitivePatterns = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProductionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initialize();
  }

  /**
   * Get current configuration
   */
  getConfig(): ProductionConfig {
    return { ...this.config };
  }

  /**
   * Restore original console methods
   */
  restore(): void {
    Object.assign(console, this.originalConsole);
  }

  /**
   * Get PII redaction statistics
   */
  getRedactionStats(): {
    defaultRules: PIIRedactionRule[];
    customPatterns: number;
    isRedactionEnabled: boolean;
  } {
    return {
      defaultRules: this.defaultPIIPatterns,
      customPatterns: this.config.sensitivePatterns.length,
      isRedactionEnabled: this.config.redactPII,
    };
  }

  /**
   * Test PII redaction on a string
   */
  testRedaction(text: string): string {
    return this.redactPII(text);
  }

  /**
   * Clear rate limiting counters
   */
  clearRateLimitCounters(): void {
    this.rateLimitCounts.clear();
  }

  /**
   * Get rate limiting statistics
   */
  getRateLimitStats(): Array<{ key: string; count: number; resetTime: number }> {
    return Array.from(this.rateLimitCounts.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      resetTime: data.resetTime,
    }));
  }
}

// Create singleton instance
export const productionConsoleOptimizer = new ProductionConsoleOptimizer();

// Auto-initialize based on environment
if (typeof window !== 'undefined') {
  // In browser environment, check for debug mode
  const debugMode = localStorage.getItem('revivatech_debug_mode') === 'true';
  
  if (process.env.NODE_ENV === 'production' && !debugMode) {
    // Production mode: strip console logs
    productionConsoleOptimizer.updateConfig({
      stripConsoleLogs: true,
      enableDebugMode: false,
      redactPII: true,
      sanitizeErrors: true,
    });
  } else {
    // Development mode: enhance console with safety features
    productionConsoleOptimizer.updateConfig({
      stripConsoleLogs: false,
      enableDebugMode: true,
      redactPII: false, // Allow PII in development for debugging
      sanitizeErrors: false, // Allow full error details in development
    });
  }
}

// Convenience exports
export const enableProductionDebugMode = () => productionConsoleOptimizer.setDebugMode(true);
export const disableProductionDebugMode = () => productionConsoleOptimizer.setDebugMode(false);
export const addSensitivePattern = (pattern: RegExp) => productionConsoleOptimizer.addSensitivePattern(pattern);
export const testPIIRedaction = (text: string) => productionConsoleOptimizer.testRedaction(text);
export const getRedactionStats = () => productionConsoleOptimizer.getRedactionStats();

export default productionConsoleOptimizer;