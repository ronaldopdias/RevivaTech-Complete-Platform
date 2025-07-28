# Session 6: Security Hardening & Performance Optimization - Implementation Guide

**Session Priority**: CRITICAL - Production readiness and security  
**Estimated Duration**: Full implementation session  
**Prerequisites**: Sessions 1-5 completed (All features operational)  
**Objective**: Implement production-grade security, performance optimization, monitoring, and launch preparation  

---

## 🎯 Session Objectives

### Primary Goals
1. **Security Hardening**: HTTPS enforcement, JWT security, API protection, data encryption
2. **Performance Optimization**: Bundle optimization, caching, CDN, database optimization
3. **Monitoring & Logging**: Error tracking, performance monitoring, analytics, alerts
4. **Production Infrastructure**: SSL certificates, reverse proxy, load balancing, backups
5. **Launch Preparation**: Final testing, documentation, deployment automation

### Success Criteria
- [ ] A+ SSL rating with complete HTTPS enforcement
- [ ] 95+ Lighthouse score on all pages
- [ ] Sub-2-second page load times with real data
- [ ] Complete security audit passed
- [ ] Production monitoring and alerting operational
- [ ] Automated deployment and backup systems
- [ ] Performance benchmarks documented and met

---

## 🔒 Security Hardening Implementation

### 1. Complete Security Middleware

**Create**: `/backend/middleware/security-hardening.js`

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 bookings per hour per IP
  message: 'Too many booking attempts, please try again later'
});

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://challenges.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://challenges.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    },
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
});

// JWT token validation with additional security
const validateJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check token blacklist
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Additional security checks
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Rate limiting per user
    const userRequests = await redis.incr(`user_requests:${decoded.userId}`);
    if (userRequests === 1) {
      await redis.expire(`user_requests:${decoded.userId}`, 60);
    }
    if (userRequests > 50) { // 50 requests per minute per user
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    req.user = await User.findByPk(decoded.userId);
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('JWT validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Input validation and sanitization
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    next();
  };
};

// API key validation for admin endpoints
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!apiKey || !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedKey))) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// File upload security
const secureFileUpload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads', req.user.id.toString());
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${sanitizedName}`;
      cb(null, uniqueName);
    }
  })
});

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  bookingLimiter,
  validateJWT,
  validateInput,
  validateApiKey,
  secureFileUpload
};
```

### 2. Frontend Security Implementation

**Create**: `/frontend/src/lib/security.ts`

```typescript
// Content Security Policy
export const CSP_NONCE = typeof window !== 'undefined' 
  ? document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') 
  : null;

// Secure token management
class SecureTokenManager {
  private static instance: SecureTokenManager;
  private token: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): SecureTokenManager {
    if (!SecureTokenManager.instance) {
      SecureTokenManager.instance = new SecureTokenManager();
    }
    return SecureTokenManager.instance;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
    
    // Auto-refresh token before expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = (payload.exp * 1000) - Date.now() - 300000; // 5 minutes before expiry
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, expiresIn);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    
    // Validate token hasn't expired
    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        if (payload.exp < Date.now() / 1000) {
          this.clearToken();
          return null;
        }
      } catch {
        this.clearToken();
        return null;
      }
    }
    
    return this.token;
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { token } = await response.json();
        this.setToken(token);
      } else {
        this.clearToken();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearToken();
      window.location.href = '/login';
    }
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Secure API client with automatic retry and rate limiting
export class SecureApiClient {
  private baseUrl: string;
  private tokenManager: SecureTokenManager;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.tokenManager = SecureTokenManager.getInstance();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      try {
        await request();
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        console.error('Request failed:', error);
      }
    }
    
    this.processing = false;
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        const token = this.tokenManager.getToken();
        
        const config: RequestInit = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
          },
        };

        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, config);
          
          if (response.status === 401) {
            this.tokenManager.clearToken();
            window.location.href = '/login';
            return;
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// XSS protection for dynamic content
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const tokenManager = SecureTokenManager.getInstance();
export const apiClient = new SecureApiClient();
```

---

## ⚡ Performance Optimization Implementation

### 1. Backend Performance Optimizations

**Create**: `/backend/middleware/performance-optimization.js`

```javascript
const compression = require('compression');
const redis = require('redis');
const { promisify } = require('util');

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6383,
  password: process.env.REDIS_PASSWORD
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

// Response compression
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

// Advanced caching middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching for authenticated requests with dynamic content
    if (req.headers.authorization && req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.method}:${req.originalUrl}:${req.headers.authorization || 'anonymous'}`;
    
    try {
      const cached = await getAsync(cacheKey);
      if (cached) {
        const { statusCode, headers, body } = JSON.parse(cached);
        res.set(headers);
        res.set('X-Cache', 'HIT');
        return res.status(statusCode).send(body);
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }

    // Intercept response
    const originalSend = res.send;
    res.send = function(body) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cacheData = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: body
        };
        
        setAsync(cacheKey, JSON.stringify(cacheData), 'EX', duration).catch(console.error);
      }
      
      res.set('X-Cache', 'MISS');
      originalSend.call(this, body);
    };

    next();
  };
};

// Database query optimization
const optimizeQueries = (sequelize) => {
  // Connection pooling optimization
  const pool = {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  };

  // Query performance monitoring
  sequelize.addHook('beforeBulkCreate', (instances, options) => {
    options.benchmark = true;
    options.logging = (sql, timing) => {
      if (timing > 1000) { // Log slow queries
        console.warn(`Slow query (${timing}ms):`, sql);
      }
    };
  });

  return { pool };
};

// Memory usage monitoring
const memoryMonitoring = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const mb = (bytes) => Math.round(bytes / 1024 / 1024);
    
    console.log(`Memory Usage: RSS ${mb(usage.rss)}MB, Heap ${mb(usage.heapUsed)}/${mb(usage.heapTotal)}MB`);
    
    // Alert if memory usage is high
    if (usage.heapUsed > 512 * 1024 * 1024) { // 512MB
      console.warn('High memory usage detected');
    }
  }, 60000); // Check every minute
};

// Request timing middleware
const requestTiming = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Alert for slow requests
    if (duration > 2000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  compressionMiddleware,
  cacheMiddleware,
  optimizeQueries,
  memoryMonitoring,
  requestTiming,
  redisClient
};
```

### 2. Frontend Performance Optimizations

**Create**: `/frontend/src/lib/performance.ts`

```typescript
import { lazy, Suspense } from 'react';

// Code splitting for components
export const LazyAdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
export const LazyBookingFlow = lazy(() => import('../components/booking/MultiStepBookingFlow'));
export const LazyRepairTracking = lazy(() => import('../components/tracking/RealTimeTracker'));

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string): void {
    performance.mark(`${name}-end`);
    
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(measure.duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      // Log slow operations
      if (measure.duration > 1000) {
        console.warn(`Slow operation: ${name} took ${measure.duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }

  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  getMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [name, measurements] of this.metrics) {
      result[name] = {
        average: this.getAverageTime(name),
        count: measurements.length,
        latest: measurements[measurements.length - 1] || 0
      };
    }
    
    return result;
  }
}

// Image optimization
export const OptimizedImage = ({ src, alt, ...props }: any) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ display: isLoading ? 'none' : 'block' }}
        {...props}
      />
    </div>
  );
};

// Virtual scrolling for large lists
export const VirtualList = ({ items, itemHeight, containerHeight, renderItem }: any) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item: any, index: number) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Bundle analysis helper
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.scripts);
    let totalSize = 0;
    
    scripts.forEach(script => {
      if (script.src) {
        fetch(script.src, { method: 'HEAD' })
          .then(response => {
            const size = parseInt(response.headers.get('content-length') || '0');
            totalSize += size;
            console.log(`Script: ${script.src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`);
          })
          .catch(() => {});
      }
    });
    
    setTimeout(() => {
      console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }, 2000);
  }
};

export const performanceMonitor = PerformanceMonitor.getInstance();
```

---

## 📊 Monitoring & Analytics Implementation

### 1. Application Monitoring Service

**Create**: `/backend/services/monitoring-service.js`

```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Comprehensive logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'revivatech-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Error tracking and alerting
class MonitoringService {
  static async logError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      level: 'error'
    };

    logger.error(errorData);

    // Send to external monitoring service
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }

    // Critical error alerting
    if (this.isCriticalError(error)) {
      await this.sendAlert(errorData);
    }
  }

  static async logPerformance(operation, duration, metadata = {}) {
    const performanceData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
      level: 'info'
    };

    logger.info(performanceData);

    // Alert for slow operations
    if (duration > 5000) { // 5 seconds
      await this.sendAlert({
        type: 'performance',
        message: `Slow operation: ${operation} took ${duration}ms`,
        ...performanceData
      });
    }
  }

  static async trackBusinessMetric(metric, value, tags = {}) {
    const metricData = {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    };

    logger.info(metricData);

    // Store in time-series database for analytics
    await this.storeMetric(metricData);
  }

  static isCriticalError(error) {
    const criticalKeywords = [
      'payment',
      'booking',
      'database',
      'authentication',
      'security',
      'stripe'
    ];

    return criticalKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  static async sendAlert(alertData) {
    // Implementation for sending alerts (Slack, email, etc.)
    console.warn('ALERT:', alertData);
    
    // In production, integrate with alerting service
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 RevivaTech Alert: ${alertData.message}`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Timestamp', value: alertData.timestamp, short: true },
                { title: 'Context', value: JSON.stringify(alertData.context), short: false }
              ]
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  }

  static async storeMetric(metricData) {
    // Store metrics for analytics dashboard
    try {
      await AnalyticsEvent.create({
        event_type: 'metric',
        event_data: metricData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to store metric:', error);
    }
  }
}

module.exports = { logger, MonitoringService };
```

### 2. Performance Dashboard Component

**Create**: `/frontend/src/components/monitoring/PerformanceDashboard.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Database,
  Server,
  Users
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  databaseLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  cacheHitRate: number;
}

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <div>Loading performance metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Response Time</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics?.responseTime || 0, { good: 200, warning: 500 })}`}>
                {metrics?.responseTime}ms
              </p>
            </div>
            <Clock className="h-8 w-8 text-trust-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Error Rate</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics?.errorRate || 0, { good: 1, warning: 5 })}`}>
                {metrics?.errorRate}%
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Throughput</p>
              <p className="text-2xl font-bold text-professional-600">
                {metrics?.throughput}/min
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-professional-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Active Users</p>
              <p className="text-2xl font-bold text-trust-600">
                {metrics?.activeUsers}
              </p>
            </div>
            <Users className="h-8 w-8 text-trust-500" />
          </div>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Database Latency</span>
              <Badge variant={metrics?.databaseLatency! < 50 ? 'success' : 'warning'}>
                {metrics?.databaseLatency}ms
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Memory Usage</span>
              <Badge variant={metrics?.memoryUsage! < 80 ? 'success' : 'destructive'}>
                {metrics?.memoryUsage}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">CPU Usage</span>
              <Badge variant={metrics?.cpuUsage! < 70 ? 'success' : 'warning'}>
                {metrics?.cpuUsage}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Cache Hit Rate</span>
              <Badge variant={metrics?.cacheHitRate! > 90 ? 'success' : 'warning'}>
                {metrics?.cacheHitRate}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>All systems operational</span>
              </div>
            ) : (
              alerts.map((alert: any, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-neutral-500">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
```

---

## ✅ Session 6 Implementation Checklist

### Security Hardening
- [ ] HTTPS enforcement with A+ SSL rating
- [ ] Complete CSP implementation
- [ ] JWT security with token blacklisting
- [ ] API rate limiting and protection
- [ ] Input validation and sanitization
- [ ] File upload security
- [ ] XSS and CSRF protection

### Performance Optimization
- [ ] Response compression enabled
- [ ] Redis caching implementation
- [ ] Database query optimization
- [ ] Code splitting and lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] CDN integration

### Monitoring & Alerting
- [ ] Comprehensive error logging
- [ ] Performance monitoring
- [ ] Business metrics tracking
- [ ] Real-time alerting system
- [ ] Health check endpoints
- [ ] Uptime monitoring

### Production Infrastructure
- [ ] SSL certificates configured
- [ ] Reverse proxy optimization
- [ ] Load balancing setup
- [ ] Automated backups
- [ ] Disaster recovery plan
- [ ] Environment configuration

### Launch Preparation
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] End-to-end testing passed
- [ ] Documentation complete
- [ ] Deployment automation
- [ ] Rollback procedures

---

**Session 6 Success Criteria**: Production-ready system with A+ security rating, 95+ Lighthouse score, comprehensive monitoring, and automated deployment pipeline.

**Next Sessions**: 
- **Session 7**: Final integration testing and user acceptance testing
- **Session 8**: Production launch, documentation, and team training

**Production Launch Ready**: System optimized, secured, and monitored for live operation.