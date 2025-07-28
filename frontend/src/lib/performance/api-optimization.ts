// API optimization and compression utilities
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Response compression configuration
export const COMPRESSION_CONFIG = {
  // Enable compression for responses larger than this size (bytes)
  threshold: 1024,
  
  // Compression algorithms in order of preference
  algorithms: ['br', 'gzip', 'deflate'] as const,
  
  // MIME types to compress
  mimeTypes: [
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'application/xml',
    'image/svg+xml',
  ],
  
  // Cache settings
  cache: {
    maxAge: 300, // 5 minutes for API responses
    staleWhileRevalidate: 60,
  },
} as const;

// Request optimization settings
export const REQUEST_OPTIMIZATION = {
  // Connection pooling
  maxSockets: 10,
  keepAlive: true,
  timeout: 30000,
  
  // Retry configuration
  retries: 3,
  retryDelay: 1000,
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    perMilliseconds: 60000, // 1 minute
  },
} as const;

// Create optimized API client
export function createOptimizedApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_OPTIMIZATION.timeout,
    headers: {
      'Accept-Encoding': COMPRESSION_CONFIG.algorithms.join(', '),
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for optimization
  client.interceptors.request.use(
    (config) => {
      // Add compression headers
      if (config.data && JSON.stringify(config.data).length > COMPRESSION_CONFIG.threshold) {
        config.headers['Content-Encoding'] = 'gzip';
      }

      // Add caching headers for GET requests
      if (config.method === 'get') {
        config.headers['Cache-Control'] = `max-age=${COMPRESSION_CONFIG.cache.maxAge}`;
      }

      // Add request timestamp for performance monitoring
      config.metadata = { startTime: Date.now() };

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for monitoring and optimization
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Calculate response time
      const endTime = Date.now();
      const startTime = response.config.metadata?.startTime || endTime;
      const responseTime = endTime - startTime;

      // Log slow responses
      if (responseTime > 2000) {
        console.warn(`Slow API response: ${response.config.url} took ${responseTime}ms`);
      }

      // Add performance metrics to response
      response.performance = {
        responseTime,
        compressed: response.headers['content-encoding'] ? true : false,
        size: response.headers['content-length'] ? parseInt(response.headers['content-length']) : 0,
      };

      return response;
    },
    (error) => {
      // Handle compression errors
      if (error.response?.status === 406) {
        console.warn('Server does not support requested compression');
        // Retry without compression
        const config = { ...error.config };
        delete config.headers['Accept-Encoding'];
        return client.request(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

// Response caching implementation
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = COMPRESSION_CONFIG.cache.maxAge * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup expired entries
    this.cleanup();
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; totalSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      totalSize: JSON.stringify([...this.cache.values()]).length,
      hitRate: 0, // Would need hit/miss tracking
    };
  }
}

// Global response cache instance
export const responseCache = new ResponseCache();

// Cached API client with automatic caching
export function createCachedApiClient(baseURL: string): AxiosInstance {
  const client = createOptimizedApiClient(baseURL);

  // Add caching to GET requests
  client.interceptors.request.use((config) => {
    if (config.method === 'get') {
      const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
      const cachedResponse = responseCache.get(cacheKey);

      if (cachedResponse) {
        // Return cached response as a resolved promise
        return Promise.reject({
          config,
          response: cachedResponse,
          cached: true,
        });
      }
    }

    return config;
  });

  // Cache successful GET responses
  client.interceptors.response.use((response) => {
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
      responseCache.set(cacheKey, response);
    }

    return response;
  });

  return client;
}

// Request batching utility
export class RequestBatcher {
  private batches = new Map<string, { requests: any[]; timeout: NodeJS.Timeout }>();
  private batchDelay = 50; // 50ms delay before sending batch

  batch<T>(
    endpoint: string,
    request: any,
    batchKey: string = endpoint
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(batchKey);

      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(() => this.sendBatch(batchKey), this.batchDelay),
        };
        this.batches.set(batchKey, batch);
      }

      batch.requests.push({
        request,
        resolve,
        reject,
      });
    });
  }

  private async sendBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);
    clearTimeout(batch.timeout);

    try {
      // Send all requests in the batch
      const results = await Promise.allSettled(
        batch.requests.map(({ request }) => request)
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const { resolve, reject } = batch.requests[index];
        
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.requests.forEach(({ reject }) => reject(error));
    }
  }
}

// Global request batcher instance
export const requestBatcher = new RequestBatcher();

// Performance monitoring for API calls
export class ApiPerformanceMonitor {
  private metrics = new Map<string, {
    totalRequests: number;
    totalTime: number;
    errors: number;
    slowRequests: number;
  }>();

  recordRequest(endpoint: string, responseTime: number, success: boolean): void {
    const existing = this.metrics.get(endpoint) || {
      totalRequests: 0,
      totalTime: 0,
      errors: 0,
      slowRequests: 0,
    };

    existing.totalRequests++;
    existing.totalTime += responseTime;
    
    if (!success) {
      existing.errors++;
    }
    
    if (responseTime > 2000) {
      existing.slowRequests++;
    }

    this.metrics.set(endpoint, existing);
  }

  getMetrics(endpoint?: string): any {
    if (endpoint) {
      const metrics = this.metrics.get(endpoint);
      if (!metrics) return null;

      return {
        endpoint,
        averageTime: metrics.totalTime / metrics.totalRequests,
        errorRate: metrics.errors / metrics.totalRequests,
        slowRequestRate: metrics.slowRequests / metrics.totalRequests,
        ...metrics,
      };
    }

    // Return all metrics
    const allMetrics: any[] = [];
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      allMetrics.push({
        endpoint,
        averageTime: metrics.totalTime / metrics.totalRequests,
        errorRate: metrics.errors / metrics.totalRequests,
        slowRequestRate: metrics.slowRequests / metrics.totalRequests,
        ...metrics,
      });
    }

    return allMetrics;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const apiPerformanceMonitor = new ApiPerformanceMonitor();

// Optimized fetch wrapper with compression and caching
export async function optimizedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_OPTIMIZATION.timeout);

  try {
    const optimizedOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept-Encoding': COMPRESSION_CONFIG.algorithms.join(', '),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cachedResponse = responseCache.get(url);
      if (cachedResponse) {
        return new Response(JSON.stringify(cachedResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const startTime = Date.now();
    const response = await fetch(url, optimizedOptions);
    const responseTime = Date.now() - startTime;

    // Record performance metrics
    apiPerformanceMonitor.recordRequest(url, responseTime, response.ok);

    // Cache successful GET responses
    if (response.ok && (!options.method || options.method === 'GET')) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      responseCache.set(url, data);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// API optimization status
export function getApiOptimizationStatus() {
  return {
    compressionEnabled: true,
    cachingEnabled: true,
    requestBatching: true,
    performanceMonitoring: true,
    cacheStats: responseCache.getStats(),
    performanceMetrics: apiPerformanceMonitor.getMetrics(),
    timestamp: new Date().toISOString(),
  };
}