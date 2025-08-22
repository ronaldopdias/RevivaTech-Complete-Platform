/**
 * Production Safety Layer - Main Entry Point
 * Coordinates all production safety features for console management,
 * security sanitization, and error reporting optimization
 */

// Core production safety exports
export { 
  productionConsoleOptimizer,
  enableProductionDebugMode,
  disableProductionDebugMode,
  addSensitivePattern,
  testPIIRedaction,
  getRedactionStats,
  type ProductionConfig
} from './console-optimizer';

export {
  securitySanitizer,
  sanitizeForLogging,
  sanitizeError,
  addSanitizationRule,
  getSecurityViolations,
  testSanitization,
  type SecurityConfig,
  type SanitizationRule,
  type SecurityViolation
} from './security-sanitizer';

/**
 * Initialize complete production safety layer
 * Call this in your app initialization to set up all production safety features
 */
export const initializeProductionSafety = (config?: {
  enableConsoleStripping?: boolean;
  enablePIIRedaction?: boolean;
  enableSecuritySanitization?: boolean;
  enableRateLimiting?: boolean;
  debugMode?: boolean;
}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const debugMode = config?.debugMode ?? 
    (typeof window !== 'undefined' ? localStorage.getItem('revivatech_debug_mode') === 'true' : false);

  // Configure console optimizer
  productionConsoleOptimizer.updateConfig({
    stripConsoleLogs: config?.enableConsoleStripping ?? isProduction,
    enableDebugMode: debugMode,
    redactPII: config?.enablePIIRedaction ?? isProduction,
    sanitizeErrors: config?.enableSecuritySanitization ?? true,
    rateLimit: {
      enabled: config?.enableRateLimiting ?? isProduction,
      maxLogs: 50,
      windowMs: 60000,
    },
  });

  // Configure security sanitizer
  securitySanitizer.updateConfig({
    enableSanitization: config?.enableSecuritySanitization ?? isProduction,
    redactUrls: isProduction,
    redactUserData: isProduction,
    redactApiKeys: true, // Always redact API keys
    redactTokens: true, // Always redact tokens
    rateLimitErrorReporting: config?.enableRateLimiting ?? isProduction,
  });

  console.info('🔒 Production safety layer initialized', {
    environment: process.env.NODE_ENV,
    debugMode,
    consoleStripping: config?.enableConsoleStripping ?? isProduction,
    piiRedaction: config?.enablePIIRedaction ?? isProduction,
    securitySanitization: config?.enableSecuritySanitization ?? isProduction,
    rateLimiting: config?.enableRateLimiting ?? isProduction,
  });
};

/**
 * Production-safe error reporter that integrates with existing error reporting
 * Use this instead of direct console.error or error reporting in production
 */
export const reportProductionError = (error: Error | string, context?: any) => {
  // Sanitize the error and context
  const sanitizedError = typeof error === 'string' ? 
    securitySanitizer.sanitizeString(error) : 
    securitySanitizer.sanitizeError(error);
  
  const sanitizedContext = context ? securitySanitizer.sanitize(context) : undefined;

  // Create error key for rate limiting
  const errorKey = typeof error === 'string' ? error : `${error.name}:${error.message}`;
  
  // Check rate limiting
  if (securitySanitizer.shouldRateLimitErrorReporting(errorKey)) {
    return; // Skip this error due to rate limiting
  }

  // Log to console (will be handled by console optimizer)
  console.error('Production Error:', sanitizedError, sanitizedContext);

  // Send to monitoring service if available
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    fetch('/api/errors/production', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: sanitizedError,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(() => {
      // Silently fail - don't create infinite error loop
    });
  }
};

/**
 * Production-safe debug logger
 * Use this for debug information that should be visible in debug mode but hidden in production
 */
export const debugLog = (message: string, data?: any) => {
  const debugMode = typeof window !== 'undefined' ? 
    localStorage.getItem('revivatech_debug_mode') === 'true' : false;
    
  if (process.env.NODE_ENV === 'development' || debugMode) {
    const sanitizedData = data ? securitySanitizer.sanitize(data) : undefined;
    console.log(`🔍 DEBUG: ${message}`, sanitizedData);
  }
};

/**
 * Production-safe warning logger
 */
export const warnLog = (message: string, data?: any) => {
  const sanitizedMessage = securitySanitizer.sanitizeString(message);
  const sanitizedData = data ? securitySanitizer.sanitize(data) : undefined;
  console.warn(`⚠️  WARNING: ${sanitizedMessage}`, sanitizedData);
};

/**
 * Get production safety status and statistics
 */
export const getProductionSafetyStatus = () => {
  return {
    environment: process.env.NODE_ENV,
    consoleOptimizer: productionConsoleOptimizer.getConfig(),
    securitySanitizer: securitySanitizer.getConfig(),
    redactionStats: getRedactionStats(),
    sanitizationStats: securitySanitizer.getSanitizationStats(),
    securityViolations: securitySanitizer.getSecurityViolations(),
    rateLimitStats: productionConsoleOptimizer.getRateLimitStats(),
  };
};

/**
 * Emergency debug mode toggle (for production troubleshooting)
 * Only use this for critical production debugging
 */
export const emergencyDebugMode = {
  enable: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('revivatech_debug_mode', 'true');
      productionConsoleOptimizer.setDebugMode(true);
      console.warn('🚨 Emergency debug mode ENABLED in production. Remember to disable!');
    }
  },
  disable: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('revivatech_debug_mode', 'false');
      productionConsoleOptimizer.setDebugMode(false);
      console.info('✅ Emergency debug mode disabled');
    }
  },
  status: () => {
    return typeof window !== 'undefined' ? 
      localStorage.getItem('revivatech_debug_mode') === 'true' : false;
  }
};

/**
 * Cleanup function for production safety (use in app unmount/cleanup)
 */
export const cleanupProductionSafety = () => {
  productionConsoleOptimizer.clearRateLimitCounters();
  securitySanitizer.clearSecurityViolations();
  productionConsoleOptimizer.restore();
};

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize with default settings based on environment
  initializeProductionSafety();
  
  // Set up cleanup on page unload
  window.addEventListener('beforeunload', cleanupProductionSafety);
}