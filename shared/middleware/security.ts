import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { SecurityLogger } from '../config/logger';
import { getConfig } from '../config/environment';

const config = getConfig();

// Rate limiting configurations
const rateLimiters = {
  general: new RateLimiterRedis({
    storeClient: redis,
    keyGenerator: (req: any) => req.ip,
    points: config.RATE_LIMIT_MAX_REQUESTS,
    duration: config.RATE_LIMIT_WINDOW / 1000,
    blockDuration: 60, // Block for 60 seconds
  }),
  
  auth: new RateLimiterRedis({
    storeClient: redis,
    keyGenerator: (req: any) => req.ip,
    points: 5, // 5 attempts
    duration: 900, // Per 15 minutes
    blockDuration: 900, // Block for 15 minutes
  }),
  
  api: new RateLimiterRedis({
    storeClient: redis,
    keyGenerator: (req: any) => req.headers.authorization || req.ip,
    points: 100, // 100 requests
    duration: 60, // Per minute
    blockDuration: 60,
  }),
  
  fileUpload: new RateLimiterRedis({
    storeClient: redis,
    keyGenerator: (req: any) => req.ip,
    points: 10, // 10 uploads
    duration: 3600, // Per hour
    blockDuration: 3600,
  }),
};

// Security headers middleware
export function securityHeaders(req: NextRequest): NextResponse | null {
  const response = NextResponse.next();
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' wss: https://api.stripe.com https://www.google-analytics.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production with HTTPS)
  if (config.NODE_ENV === 'production' && req.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  return null; // Continue to next middleware
}

// Rate limiting middleware
export async function rateLimit(
  req: NextRequest,
  limiterType: keyof typeof rateLimiters = 'general'
): Promise<NextResponse | null> {
  try {
    const limiter = rateLimiters[limiterType];
    const key = getClientIdentifier(req);
    
    await limiter.consume(key);
    return null; // Continue to next middleware
  } catch (rejRes: any) {
    const remainingTime = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    SecurityLogger.logRateLimitHit(
      getClientIP(req),
      req.nextUrl.pathname,
      rateLimiters[limiterType].points
    );
    
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': remainingTime.toString(),
        'X-RateLimit-Limit': rateLimiters[limiterType].points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
      },
    });
  }
}

// CORS middleware
export function corsMiddleware(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const allowedOrigins = config.CORS_ORIGINS;
  
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  return null;
}

// Input validation and sanitization
export class InputValidator {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  private static nameRegex = /^[a-zA-Z\s\-'\.]{1,50}$/;
  private static passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, '') // Remove basic XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
  
  static validateEmail(email: string): boolean {
    return this.emailRegex.test(email) && email.length <= 254;
  }
  
  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\s/g, '');
    return this.phoneRegex.test(cleaned) && cleaned.length >= 10 && cleaned.length <= 15;
  }
  
  static validateName(name: string): boolean {
    return this.nameRegex.test(name);
  }
  
  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  static validateURL(url: string, allowedDomains?: string[]): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Check allowed domains if provided
      if (allowedDomains && !allowedDomains.includes(urlObj.hostname)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  static validateFileType(fileName: string, mimeType: string): boolean {
    const allowedTypes = config.ALLOWED_FILE_TYPES;
    return allowedTypes.includes(mimeType);
  }
  
  static validateFileSize(size: number): boolean {
    return size <= config.MAX_FILE_SIZE;
  }
}

// SQL injection prevention
export class SQLInjectionPrevention {
  private static suspiciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
    /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i,
    /('|\"|;|--|\*|\+|%|<|>)/,
    /(script|javascript|vbscript|onload|onerror)/i,
  ];
  
  static detectSQLInjection(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }
  
  static sanitizeQuery(input: string): string {
    if (this.detectSQLInjection(input)) {
      SecurityLogger.logSuspiciousActivity(
        'sql_injection_attempt',
        { input: input.substring(0, 100) },
        'unknown'
      );
      throw new Error('Potentially malicious input detected');
    }
    
    return input;
  }
}

// XSS prevention
export class XSSPrevention {
  static sanitizeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<\s*\w+\s+[^>]*on\w+\s*=/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  static preventXSS(input: string): string {
    if (this.detectXSS(input)) {
      SecurityLogger.logSuspiciousActivity(
        'xss_attempt',
        { input: input.substring(0, 100) },
        'unknown'
      );
      throw new Error('Potentially malicious content detected');
    }
    
    return this.sanitizeHTML(input);
  }
}

// Authentication helpers
export class AuthenticationSecurity {
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  static isPasswordCompromised(password: string): boolean {
    // In a real implementation, this would check against known compromised passwords
    // For now, just check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ];
    
    return weakPasswords.includes(password.toLowerCase());
  }
  
  static validatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];
    
    // Length
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    // Patterns
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeated characters');
    
    if (!/123|abc|qwe/i.test(password)) score += 1;
    else feedback.push('Avoid common patterns');
    
    // Check if compromised
    if (!this.isPasswordCompromised(password)) score += 1;
    else feedback.push('This password is commonly used');
    
    return { score, feedback };
  }
}

// CSRF protection
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
  
  static generateToken(sessionId: string): string {
    const token = AuthenticationSecurity.generateSecureToken();
    const expires = Date.now() + 3600000; // 1 hour
    
    this.tokens.set(sessionId, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }
  
  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored || stored.expires < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return stored.token === token;
  }
  
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (data.expires < now) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Utility functions
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown';
}

function getClientIdentifier(req: NextRequest): string {
  // Use Authorization header if available (for API requests)
  const auth = req.headers.get('authorization');
  if (auth) {
    return `auth:${auth.substring(0, 20)}`;
  }
  
  // Fall back to IP address
  return `ip:${getClientIP(req)}`;
}

// Security monitoring
export class SecurityMonitoring {
  private static suspiciousActivity = new Map<string, number>();
  
  static reportSuspiciousActivity(ip: string, activity: string): void {
    const key = `${ip}:${activity}`;
    const count = this.suspiciousActivity.get(key) || 0;
    this.suspiciousActivity.set(key, count + 1);
    
    // If suspicious activity exceeds threshold, log and potentially block
    if (count > 5) {
      SecurityLogger.logSuspiciousActivity(activity, { count: count + 1 }, ip);
      
      // In a real implementation, you might add the IP to a blocklist
      // or trigger additional security measures
    }
  }
  
  static getSuspiciousActivityReport(): Record<string, number> {
    return Object.fromEntries(this.suspiciousActivity);
  }
  
  static clearSuspiciousActivity(): void {
    this.suspiciousActivity.clear();
  }
}

export {
  getClientIP,
  getClientIdentifier,
};