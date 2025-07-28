// Performance Monitoring Service for RevivaTech
// Tracks API performance, database queries, and system health

import { cacheService } from './cacheService';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: any;
}

export interface ApiPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  cacheHit: boolean;
  errorRate: number;
  timestamp: Date;
}

export interface DatabasePerformanceMetrics {
  query: string;
  executionTime: number;
  recordsReturned: number;
  cacheHit: boolean;
  error?: string;
  timestamp: Date;
}

export interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000;
  private readonly BATCH_SIZE = 100;
  private batchBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout;

  private constructor() {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Track API performance metrics
   */
  public async trackApiPerformance(metrics: ApiPerformanceMetrics): Promise<void> {
    const metric: PerformanceMetric = {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'api_performance',
      value: metrics.responseTime,
      unit: 'ms',
      timestamp: metrics.timestamp,
      tags: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        status_code: metrics.statusCode.toString(),
        cache_hit: metrics.cacheHit.toString()
      },
      metadata: {
        requestSize: metrics.requestSize,
        responseSize: metrics.responseSize,
        errorRate: metrics.errorRate
      }
    };

    await this.addMetric(metric);
  }

  /**
   * Track database performance metrics
   */
  public async trackDatabasePerformance(metrics: DatabasePerformanceMetrics): Promise<void> {
    const metric: PerformanceMetric = {
      id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'database_performance',
      value: metrics.executionTime,
      unit: 'ms',
      timestamp: metrics.timestamp,
      tags: {
        query_type: this.getQueryType(metrics.query),
        cache_hit: metrics.cacheHit.toString(),
        has_error: (!!metrics.error).toString()
      },
      metadata: {
        query: metrics.query,
        recordsReturned: metrics.recordsReturned,
        error: metrics.error
      }
    };

    await this.addMetric(metric);
  }

  /**
   * Track system health metrics
   */
  public async trackSystemHealth(metrics: SystemHealthMetrics): Promise<void> {
    const systemMetrics: PerformanceMetric[] = [
      {
        id: `cpu_${Date.now()}`,
        name: 'cpu_usage',
        value: metrics.cpuUsage,
        unit: 'percent',
        timestamp: metrics.timestamp
      },
      {
        id: `memory_${Date.now()}`,
        name: 'memory_usage',
        value: metrics.memoryUsage,
        unit: 'percent',
        timestamp: metrics.timestamp
      },
      {
        id: `disk_${Date.now()}`,
        name: 'disk_usage',
        value: metrics.diskUsage,
        unit: 'percent',
        timestamp: metrics.timestamp
      },
      {
        id: `connections_${Date.now()}`,
        name: 'active_connections',
        value: metrics.activeConnections,
        unit: 'count',
        timestamp: metrics.timestamp
      },
      {
        id: `cache_hit_rate_${Date.now()}`,
        name: 'cache_hit_rate',
        value: metrics.cacheHitRate,
        unit: 'percent',
        timestamp: metrics.timestamp
      },
      {
        id: `error_rate_${Date.now()}`,
        name: 'error_rate',
        value: metrics.errorRate,
        unit: 'percent',
        timestamp: metrics.timestamp
      }
    ];

    for (const metric of systemMetrics) {
      await this.addMetric(metric);
    }
  }

  /**
   * Get performance metrics by name and time range
   */
  public async getMetrics(
    name: string,
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceMetric[]> {
    return this.metrics.filter(metric => 
      metric.name === name &&
      metric.timestamp >= startTime &&
      metric.timestamp <= endTime
    );
  }

  /**
   * Get API performance summary
   */
  public async getApiPerformanceSummary(
    endpoint?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<{
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    errorRate: number;
    cacheHitRate: number;
    throughput: number;
  }> {
    const apiMetrics = await this.getMetrics('api_performance', timeRange.start, timeRange.end);
    
    const filteredMetrics = endpoint 
      ? apiMetrics.filter(m => m.tags?.endpoint === endpoint)
      : apiMetrics;

    if (filteredMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        cacheHitRate: 0,
        throughput: 0
      };
    }

    const responseTimes = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const errors = filteredMetrics.filter(m => 
      m.tags?.status_code && parseInt(m.tags.status_code) >= 400
    ).length;
    const cacheHits = filteredMetrics.filter(m => m.tags?.cache_hit === 'true').length;

    const timeRangeHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);

    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.getPercentile(responseTimes, 95),
      p99ResponseTime: this.getPercentile(responseTimes, 99),
      totalRequests: filteredMetrics.length,
      errorRate: (errors / filteredMetrics.length) * 100,
      cacheHitRate: (cacheHits / filteredMetrics.length) * 100,
      throughput: filteredMetrics.length / timeRangeHours
    };
  }

  /**
   * Get database performance summary
   */
  public async getDatabasePerformanceSummary(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<{
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
    cacheHitRate: number;
    errorRate: number;
    topSlowQueries: Array<{ query: string; avgTime: number; count: number }>;
  }> {
    const dbMetrics = await this.getMetrics('database_performance', timeRange.start, timeRange.end);

    if (dbMetrics.length === 0) {
      return {
        avgQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        cacheHitRate: 0,
        errorRate: 0,
        topSlowQueries: []
      };
    }

    const queryTimes = dbMetrics.map(m => m.value);
    const slowQueries = dbMetrics.filter(m => m.value > 1000).length; // > 1 second
    const cacheHits = dbMetrics.filter(m => m.tags?.cache_hit === 'true').length;
    const errors = dbMetrics.filter(m => m.tags?.has_error === 'true').length;

    // Group by query type for top slow queries
    const queryGroups = dbMetrics.reduce((acc, metric) => {
      const queryType = metric.tags?.query_type || 'unknown';
      if (!acc[queryType]) {
        acc[queryType] = { totalTime: 0, count: 0 };
      }
      acc[queryType].totalTime += metric.value;
      acc[queryType].count++;
      return acc;
    }, {} as Record<string, { totalTime: number; count: number }>);

    const topSlowQueries = Object.entries(queryGroups)
      .map(([query, stats]) => ({
        query,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    return {
      avgQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      slowQueries,
      totalQueries: dbMetrics.length,
      cacheHitRate: (cacheHits / dbMetrics.length) * 100,
      errorRate: (errors / dbMetrics.length) * 100,
      topSlowQueries
    };
  }

  /**
   * Get system health summary
   */
  public async getSystemHealthSummary(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      end: new Date()
    }
  ): Promise<{
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgDiskUsage: number;
    avgActiveConnections: number;
    avgCacheHitRate: number;
    avgErrorRate: number;
    alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  }> {
    const [cpuMetrics, memoryMetrics, diskMetrics, connectionMetrics, cacheMetrics, errorMetrics] = await Promise.all([
      this.getMetrics('cpu_usage', timeRange.start, timeRange.end),
      this.getMetrics('memory_usage', timeRange.start, timeRange.end),
      this.getMetrics('disk_usage', timeRange.start, timeRange.end),
      this.getMetrics('active_connections', timeRange.start, timeRange.end),
      this.getMetrics('cache_hit_rate', timeRange.start, timeRange.end),
      this.getMetrics('error_rate', timeRange.start, timeRange.end)
    ]);

    const avgCpuUsage = this.calculateAverage(cpuMetrics);
    const avgMemoryUsage = this.calculateAverage(memoryMetrics);
    const avgDiskUsage = this.calculateAverage(diskMetrics);
    const avgActiveConnections = this.calculateAverage(connectionMetrics);
    const avgCacheHitRate = this.calculateAverage(cacheMetrics);
    const avgErrorRate = this.calculateAverage(errorMetrics);

    // Generate alerts based on thresholds
    const alerts = [];
    
    if (avgCpuUsage > 80) {
      alerts.push({
        type: 'high_cpu',
        message: `CPU usage is high: ${avgCpuUsage.toFixed(1)}%`,
        severity: 'high' as const
      });
    }
    
    if (avgMemoryUsage > 85) {
      alerts.push({
        type: 'high_memory',
        message: `Memory usage is high: ${avgMemoryUsage.toFixed(1)}%`,
        severity: 'high' as const
      });
    }
    
    if (avgDiskUsage > 90) {
      alerts.push({
        type: 'high_disk',
        message: `Disk usage is high: ${avgDiskUsage.toFixed(1)}%`,
        severity: 'high' as const
      });
    }
    
    if (avgErrorRate > 5) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate is high: ${avgErrorRate.toFixed(1)}%`,
        severity: 'medium' as const
      });
    }
    
    if (avgCacheHitRate < 70) {
      alerts.push({
        type: 'low_cache_hit_rate',
        message: `Cache hit rate is low: ${avgCacheHitRate.toFixed(1)}%`,
        severity: 'medium' as const
      });
    }

    return {
      avgCpuUsage,
      avgMemoryUsage,
      avgDiskUsage,
      avgActiveConnections,
      avgCacheHitRate,
      avgErrorRate,
      alerts
    };
  }

  /**
   * Create performance report
   */
  public async generatePerformanceReport(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<{
    summary: {
      totalRequests: number;
      avgResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
    };
    apiPerformance: any;
    databasePerformance: any;
    systemHealth: any;
    recommendations: string[];
  }> {
    const [apiPerf, dbPerf, systemHealth] = await Promise.all([
      this.getApiPerformanceSummary(undefined, timeRange),
      this.getDatabasePerformanceSummary(timeRange),
      this.getSystemHealthSummary(timeRange)
    ]);

    const recommendations = this.generateRecommendations(apiPerf, dbPerf, systemHealth);
    
    let systemHealthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (systemHealth.alerts.some(a => a.severity === 'high')) {
      systemHealthStatus = 'critical';
    } else if (systemHealth.alerts.some(a => a.severity === 'medium')) {
      systemHealthStatus = 'warning';
    }

    return {
      summary: {
        totalRequests: apiPerf.totalRequests,
        avgResponseTime: apiPerf.avgResponseTime,
        errorRate: apiPerf.errorRate,
        cacheHitRate: apiPerf.cacheHitRate,
        systemHealth: systemHealthStatus
      },
      apiPerformance: apiPerf,
      databasePerformance: dbPerf,
      systemHealth,
      recommendations
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  public async cleanup(olderThan: Date): Promise<number> {
    const originalLength = this.metrics.length;
    this.metrics = this.metrics.filter(metric => metric.timestamp > olderThan);
    return originalLength - this.metrics.length;
  }

  // Private helper methods
  private async addMetric(metric: PerformanceMetric): Promise<void> {
    this.batchBuffer.push(metric);
    
    if (this.batchBuffer.length >= this.BATCH_SIZE) {
      await this.flushMetrics();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.batchBuffer.length === 0) return;

    try {
      // Add to in-memory store
      this.metrics.push(...this.batchBuffer);
      
      // Keep only recent metrics
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics = this.metrics.slice(-this.MAX_METRICS);
      }
      
      // Cache metrics for external access
      await cacheService.set(
        'performance_metrics',
        this.batchBuffer,
        { ttl: 3600, tags: ['performance'] }
      );
      
      this.batchBuffer = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  private getQueryType(query: string): string {
    const upperQuery = query.toUpperCase().trim();
    
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    if (upperQuery.startsWith('CREATE')) return 'CREATE';
    if (upperQuery.startsWith('DROP')) return 'DROP';
    if (upperQuery.startsWith('ALTER')) return 'ALTER';
    
    return 'OTHER';
  }

  private getPercentile(values: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index] || 0;
  }

  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  private generateRecommendations(
    apiPerf: any,
    dbPerf: any,
    systemHealth: any
  ): string[] {
    const recommendations: string[] = [];

    if (apiPerf.avgResponseTime > 1000) {
      recommendations.push('API response time is slow. Consider optimizing queries and adding caching.');
    }

    if (apiPerf.cacheHitRate < 70) {
      recommendations.push('Cache hit rate is low. Review caching strategy and TTL settings.');
    }

    if (dbPerf.slowQueries > 0) {
      recommendations.push(`${dbPerf.slowQueries} slow database queries detected. Consider adding indexes or query optimization.`);
    }

    if (systemHealth.avgCpuUsage > 70) {
      recommendations.push('CPU usage is high. Consider scaling up or optimizing CPU-intensive operations.');
    }

    if (systemHealth.avgMemoryUsage > 80) {
      recommendations.push('Memory usage is high. Consider increasing memory or optimizing memory usage.');
    }

    if (apiPerf.errorRate > 2) {
      recommendations.push('Error rate is elevated. Review error logs and implement better error handling.');
    }

    return recommendations;
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();