// Performance Tracking Middleware for RevivaTech
// Automatically tracks API performance, database queries, and system metrics

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitoringService } from '@/lib/services/performanceMonitoringService';
import { cacheService } from '@/lib/services/cacheService';

export interface PerformanceMiddlewareOptions {
  enableApiTracking?: boolean;
  enableDatabaseTracking?: boolean;
  enableCacheTracking?: boolean;
  excludeEndpoints?: string[];
  sampleRate?: number; // 0-1, percentage of requests to track
}

export class PerformanceMiddleware {
  private static instance: PerformanceMiddleware;
  private options: PerformanceMiddlewareOptions;
  private requestStartTimes: Map<string, number> = new Map();

  private constructor(options: PerformanceMiddlewareOptions = {}) {
    this.options = {
      enableApiTracking: true,
      enableDatabaseTracking: true,
      enableCacheTracking: true,
      excludeEndpoints: ['/health', '/metrics', '/favicon.ico'],
      sampleRate: 1.0,
      ...options
    };
  }

  public static getInstance(options?: PerformanceMiddlewareOptions): PerformanceMiddleware {
    if (!PerformanceMiddleware.instance) {
      PerformanceMiddleware.instance = new PerformanceMiddleware(options);
    }
    return PerformanceMiddleware.instance;
  }

  /**
   * Middleware for Next.js API routes
   */
  public withPerformanceTracking(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Check if we should track this request
      if (!this.shouldTrackRequest(request)) {
        return handler(request, context);
      }

      this.requestStartTimes.set(requestId, startTime);

      try {
        // Execute the handler
        const response = await handler(request, context);

        // Track performance if enabled
        if (this.options.enableApiTracking) {
          await this.trackApiPerformance(request, response, startTime);
        }

        return response;

      } catch (error) {
        // Track error performance
        if (this.options.enableApiTracking) {
          await this.trackApiPerformance(request, null, startTime, error);
        }

        throw error;
      } finally {
        this.requestStartTimes.delete(requestId);
      }
    };
  }

  /**
   * Database query wrapper for performance tracking
   */
  public async withDatabaseTracking<T>(
    query: string,
    executor: () => Promise<T>
  ): Promise<T> {
    if (!this.options.enableDatabaseTracking) {
      return executor();
    }

    const startTime = Date.now();
    let result: T;
    let error: Error | undefined;

    try {
      result = await executor();
      return result;
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown database error');
      throw error;
    } finally {
      const executionTime = Date.now() - startTime;
      
      await performanceMonitoringService.trackDatabasePerformance({
        query,
        executionTime,
        recordsReturned: this.getRecordCount(result),
        cacheHit: false, // Would be determined by the executor
        error: error?.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Cache operation wrapper for performance tracking
   */
  public async withCacheTracking<T>(
    operation: string,
    key: string,
    executor: () => Promise<T>
  ): Promise<T> {
    if (!this.options.enableCacheTracking) {
      return executor();
    }

    const startTime = Date.now();
    let result: T;
    let cacheHit = false;

    try {
      result = await executor();
      cacheHit = result !== null && result !== undefined;
      return result;
    } catch (error) {
      throw error;
    } finally {
      const executionTime = Date.now() - startTime;
      
      // Track cache performance as API performance
      await performanceMonitoringService.trackApiPerformance({
        endpoint: `/cache/${operation}`,
        method: 'CACHE',
        responseTime: executionTime,
        statusCode: cacheHit ? 200 : 404,
        requestSize: key.length,
        responseSize: this.getResultSize(result),
        cacheHit,
        errorRate: 0,
        timestamp: new Date()
      });
    }
  }

  /**
   * System health monitoring
   */
  public async trackSystemHealth(): Promise<void> {
    try {
      const [memoryUsage, cacheStats] = await Promise.all([
        this.getMemoryUsage(),
        cacheService.getStats()
      ]);

      await performanceMonitoringService.trackSystemHealth({
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: memoryUsage.percentage,
        diskUsage: await this.getDiskUsage(),
        activeConnections: await this.getActiveConnections(),
        cacheHitRate: cacheStats.hitRate,
        errorRate: 0, // Would be calculated from recent metrics
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track system health:', error);
    }
  }

  /**
   * Start periodic system monitoring
   */
  public startSystemMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.trackSystemHealth();
    }, intervalMs);
  }

  /**
   * Track slow query alerts
   */
  public async trackSlowQuery(query: string, executionTime: number): Promise<void> {
    if (executionTime > 1000) { // Slow query threshold: 1 second
      console.warn(`🐌 Slow query detected: ${executionTime}ms - ${query.substring(0, 100)}...`);
      
      // Track as high-priority metric
      await performanceMonitoringService.trackDatabasePerformance({
        query,
        executionTime,
        recordsReturned: 0,
        cacheHit: false,
        error: 'SLOW_QUERY',
        timestamp: new Date()
      });
    }
  }

  /**
   * Create performance summary middleware
   */
  public createSummaryMiddleware() {
    return async (request: NextRequest): Promise<NextResponse> => {
      const summary = await performanceMonitoringService.generatePerformanceReport();
      
      return NextResponse.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    };
  }

  // Private helper methods
  private shouldTrackRequest(request: NextRequest): boolean {
    const url = new URL(request.url);
    
    // Check if endpoint is excluded
    if (this.options.excludeEndpoints?.some(endpoint => url.pathname.includes(endpoint))) {
      return false;
    }

    // Check sample rate
    if (this.options.sampleRate && Math.random() > this.options.sampleRate) {
      return false;
    }

    return true;
  }

  private async trackApiPerformance(
    request: NextRequest,
    response: NextResponse | null,
    startTime: number,
    error?: any
  ): Promise<void> {
    try {
      const url = new URL(request.url);
      const responseTime = Date.now() - startTime;
      const statusCode = response?.status || (error ? 500 : 200);
      
      await performanceMonitoringService.trackApiPerformance({
        endpoint: url.pathname,
        method: request.method,
        responseTime,
        statusCode,
        requestSize: await this.getRequestSize(request),
        responseSize: await this.getResponseSize(response),
        cacheHit: this.wasCacheHit(response),
        errorRate: error ? 100 : 0,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Failed to track API performance:', err);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getRequestSize(request: NextRequest): Promise<number> {
    try {
      const body = await request.clone().text();
      return body.length;
    } catch {
      return 0;
    }
  }

  private async getResponseSize(response: NextResponse | null): Promise<number> {
    if (!response) return 0;
    
    try {
      const body = await response.clone().text();
      return body.length;
    } catch {
      return 0;
    }
  }

  private wasCacheHit(response: NextResponse | null): boolean {
    if (!response) return false;
    
    const cacheHeader = response.headers.get('X-Cache-Status');
    return cacheHeader === 'HIT';
  }

  private getRecordCount(result: any): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (result && typeof result === 'object' && result.count) {
      return result.count;
    }
    return result ? 1 : 0;
  }

  private getResultSize(result: any): number {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100
      };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  }

  private async getCpuUsage(): Promise<number> {
    // In a real implementation, you'd use a library like 'os' or 'pidusage'
    // For now, return a simulated value
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // In a real implementation, you'd check disk usage
    // For now, return a simulated value
    return Math.random() * 100;
  }

  private async getActiveConnections(): Promise<number> {
    // In a real implementation, you'd check active database connections
    // For now, return a simulated value
    return Math.floor(Math.random() * 50) + 10;
  }
}

// Export default instance
export const performanceMiddleware = PerformanceMiddleware.getInstance();

// Export wrapper functions for easy use
export const withPerformanceTracking = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) => {
  return performanceMiddleware.withPerformanceTracking(handler);
};

export const withDatabaseTracking = async <T>(
  query: string,
  executor: () => Promise<T>
): Promise<T> => {
  return performanceMiddleware.withDatabaseTracking(query, executor);
};

export const withCacheTracking = async <T>(
  operation: string,
  key: string,
  executor: () => Promise<T>
): Promise<T> => {
  return performanceMiddleware.withCacheTracking(operation, key, executor);
};