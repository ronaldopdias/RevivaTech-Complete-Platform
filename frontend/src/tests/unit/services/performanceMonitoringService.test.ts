/**
 * Unit Tests for Performance Monitoring Service
 * Tests real-time performance tracking, metrics collection, and monitoring
 */

import { PerformanceMonitoringService } from '@/lib/services/performanceMonitoringService';
import { CacheService } from '@/lib/services/cacheService';

// Mock dependencies
jest.mock('@/lib/services/cacheService');
jest.mock('@/lib/prisma/client');

describe('PerformanceMonitoringService', () => {
  let service: PerformanceMonitoringService;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockPrismaClient: any;

  beforeEach(() => {
    // Mock cache service
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getMultiple: jest.fn(),
      setMultiple: jest.fn(),
      deleteMultiple: jest.fn(),
      invalidatePattern: jest.fn(),
      getOrSet: jest.fn(),
      getTTL: jest.fn(),
      expire: jest.fn(),
      warmCache: jest.fn(),
      getStats: jest.fn(),
      healthCheck: jest.fn(),
      namespace: jest.fn()
    } as any;

    // Mock Prisma client
    mockPrismaClient = {
      performanceMetric: {
        create: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        deleteMany: jest.fn()
      },
      $queryRaw: jest.fn()
    };

    // Mock global performance API
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      clearResourceTimings: jest.fn(),
      getEntries: jest.fn(() => []),
      setResourceTimingBufferSize: jest.fn(),
      onresourcetimingbufferfull: null,
      timing: {} as any,
      navigation: {} as any,
      timeOrigin: Date.now(),
      toJSON: jest.fn()
    };

    service = new PerformanceMonitoringService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Timer Operations', () => {
    test('starts and ends timer correctly', () => {
      const mockStartTime = 1000;
      const mockEndTime = 1500;
      
      (global.performance.now as jest.Mock)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const timer = service.startTimer('test-operation');
      const duration = timer.end();
      
      expect(duration).toBe(500); // 1500 - 1000
      expect(global.performance.now).toHaveBeenCalledTimes(2);
    });

    test('measures operation duration', () => {
      const mockStartTime = 2000;
      const mockEndTime = 2750;
      
      (global.performance.now as jest.Mock)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const timer = service.startTimer('api-call');
      const duration = timer.end();
      
      expect(duration).toBe(750);
    });

    test('handles multiple concurrent timers', () => {
      const mockTimes = [1000, 1500, 2000, 2500];
      let timeIndex = 0;
      
      (global.performance.now as jest.Mock).mockImplementation(() => mockTimes[timeIndex++]);
      
      const timer1 = service.startTimer('operation-1');
      const timer2 = service.startTimer('operation-2');
      
      const duration1 = timer1.end();
      const duration2 = timer2.end();
      
      expect(duration1).toBe(500); // 1500 - 1000
      expect(duration2).toBe(500); // 2500 - 2000
    });
  });

  describe('Metrics Recording', () => {
    test('records metric with correct data', async () => {
      const metricName = 'api_response_time';
      const value = 150.5;
      const labels = { endpoint: '/api/devices', method: 'GET' };
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-123',
        name: metricName,
        value: value,
        labels: labels,
        timestamp: new Date()
      });
      
      await service.recordMetric(metricName, value, labels);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: metricName,
          value: value,
          labels: labels,
          timestamp: expect.any(Date)
        }
      });
    });

    test('records metric without labels', async () => {
      const metricName = 'memory_usage';
      const value = 512.7;
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-456',
        name: metricName,
        value: value,
        timestamp: new Date()
      });
      
      await service.recordMetric(metricName, value);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: metricName,
          value: value,
          labels: {},
          timestamp: expect.any(Date)
        }
      });
    });

    test('handles metric recording errors', async () => {
      const metricName = 'error_rate';
      const value = 0.05;
      
      mockPrismaClient.performanceMetric.create.mockRejectedValue(new Error('Database error'));
      
      await expect(service.recordMetric(metricName, value)).rejects.toThrow('Database error');
    });
  });

  describe('Metrics Retrieval', () => {
    test('gets all metrics', async () => {
      const mockMetrics = [
        { id: '1', name: 'response_time', value: 120.5, timestamp: new Date() },
        { id: '2', name: 'memory_usage', value: 256.0, timestamp: new Date() },
        { id: '3', name: 'error_rate', value: 0.02, timestamp: new Date() }
      ];
      
      mockPrismaClient.performanceMetric.findMany.mockResolvedValue(mockMetrics);
      
      const metrics = await service.getMetrics();
      
      expect(mockPrismaClient.performanceMetric.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 1000
      });
      expect(metrics).toEqual(mockMetrics);
    });

    test('gets metrics with filters', async () => {
      const filters = {
        name: 'api_response_time',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02'),
        limit: 100
      };
      
      mockPrismaClient.performanceMetric.findMany.mockResolvedValue([]);
      
      await service.getMetrics(filters);
      
      expect(mockPrismaClient.performanceMetric.findMany).toHaveBeenCalledWith({
        where: {
          name: filters.name,
          timestamp: {
            gte: filters.startTime,
            lte: filters.endTime
          }
        },
        orderBy: { timestamp: 'desc' },
        take: filters.limit
      });
    });

    test('gets metrics by name', async () => {
      const metricName = 'database_query_time';
      const mockMetrics = [
        { id: '1', name: metricName, value: 45.2, timestamp: new Date() },
        { id: '2', name: metricName, value: 38.7, timestamp: new Date() }
      ];
      
      mockPrismaClient.performanceMetric.findMany.mockResolvedValue(mockMetrics);
      
      const metrics = await service.getMetricsByName(metricName);
      
      expect(mockPrismaClient.performanceMetric.findMany).toHaveBeenCalledWith({
        where: { name: metricName },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });
      expect(metrics).toEqual(mockMetrics);
    });
  });

  describe('Performance Statistics', () => {
    test('calculates average response time', async () => {
      const mockAggregate = {
        _avg: { value: 145.7 },
        _count: { value: 500 }
      };
      
      mockPrismaClient.performanceMetric.aggregate.mockResolvedValue(mockAggregate);
      
      const avgResponseTime = await service.getAverageResponseTime();
      
      expect(mockPrismaClient.performanceMetric.aggregate).toHaveBeenCalledWith({
        where: {
          name: 'api_response_time',
          timestamp: {
            gte: expect.any(Date) // Last 24 hours
          }
        },
        _avg: { value: true },
        _count: { value: true }
      });
      expect(avgResponseTime).toBe(145.7);
    });

    test('gets total request count', async () => {
      const mockCount = 1542;
      
      mockPrismaClient.performanceMetric.aggregate.mockResolvedValue({
        _sum: { value: mockCount }
      });
      
      const requestCount = await service.getRequestCount();
      
      expect(mockPrismaClient.performanceMetric.aggregate).toHaveBeenCalledWith({
        where: {
          name: 'request_count',
          timestamp: {
            gte: expect.any(Date) // Last 24 hours
          }
        },
        _sum: { value: true }
      });
      expect(requestCount).toBe(mockCount);
    });

    test('calculates error rate', async () => {
      const mockErrorCount = 15;
      const mockTotalCount = 1500;
      
      mockPrismaClient.performanceMetric.aggregate
        .mockResolvedValueOnce({ _sum: { value: mockErrorCount } }) // Error count
        .mockResolvedValueOnce({ _sum: { value: mockTotalCount } }); // Total count
      
      const errorRate = await service.getErrorRate();
      
      expect(errorRate).toBe(1.0); // (15/1500) * 100
    });

    test('gets cache hit rate', async () => {
      const mockCacheHits = 875;
      const mockCacheMisses = 125;
      
      mockPrismaClient.performanceMetric.aggregate
        .mockResolvedValueOnce({ _sum: { value: mockCacheHits } }) // Cache hits
        .mockResolvedValueOnce({ _sum: { value: mockCacheMisses } }); // Cache misses
      
      const cacheHitRate = await service.getCacheHitRate();
      
      expect(cacheHitRate).toBe(87.5); // (875/(875+125)) * 100
    });

    test('gets database query time', async () => {
      const mockAvgTime = 23.4;
      
      mockPrismaClient.performanceMetric.aggregate.mockResolvedValue({
        _avg: { value: mockAvgTime }
      });
      
      const queryTime = await service.getDatabaseQueryTime();
      
      expect(queryTime).toBe(mockAvgTime);
    });
  });

  describe('Real-time Monitoring', () => {
    test('tracks cache hit', async () => {
      const cacheKey = 'user:123:profile';
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-cache-hit',
        name: 'cache_hit',
        value: 1,
        labels: { key: cacheKey }
      });
      
      await service.trackCacheHit(cacheKey);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: 'cache_hit',
          value: 1,
          labels: { key: cacheKey },
          timestamp: expect.any(Date)
        }
      });
    });

    test('tracks cache miss', async () => {
      const cacheKey = 'device:456:details';
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-cache-miss',
        name: 'cache_miss',
        value: 1,
        labels: { key: cacheKey }
      });
      
      await service.trackCacheMiss(cacheKey);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: 'cache_miss',
          value: 1,
          labels: { key: cacheKey },
          timestamp: expect.any(Date)
        }
      });
    });

    test('tracks database query', async () => {
      const query = 'SELECT * FROM devices WHERE category = ?';
      const duration = 45.2;
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-db-query',
        name: 'database_query',
        value: duration,
        labels: { query_type: 'select' }
      });
      
      await service.trackDatabaseQuery(query, duration);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: 'database_query',
          value: duration,
          labels: { 
            query_type: 'select',
            query_hash: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      });
    });

    test('tracks API request', async () => {
      const endpoint = '/api/devices';
      const method = 'GET';
      const responseTime = 120.5;
      const statusCode = 200;
      
      mockPrismaClient.performanceMetric.create.mockResolvedValue({
        id: 'metric-api-request',
        name: 'api_request',
        value: responseTime,
        labels: { endpoint, method, status: statusCode.toString() }
      });
      
      await service.trackApiRequest(endpoint, method, responseTime, statusCode);
      
      expect(mockPrismaClient.performanceMetric.create).toHaveBeenCalledWith({
        data: {
          name: 'api_request',
          value: responseTime,
          labels: { 
            endpoint,
            method,
            status: statusCode.toString()
          },
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('Performance Alerts', () => {
    test('detects slow response times', async () => {
      const mockSlowMetrics = [
        { id: '1', name: 'api_response_time', value: 2500, timestamp: new Date() },
        { id: '2', name: 'api_response_time', value: 3000, timestamp: new Date() }
      ];
      
      mockPrismaClient.performanceMetric.findMany.mockResolvedValue(mockSlowMetrics);
      
      const alerts = await service.checkPerformanceAlerts();
      
      expect(alerts).toContainEqual({
        type: 'slow_response_time',
        severity: 'high',
        message: 'API response time exceeded 2000ms',
        value: 2500,
        threshold: 2000,
        timestamp: expect.any(Date)
      });
    });

    test('detects high error rates', async () => {
      const mockHighErrorRate = 8.5; // 8.5% error rate
      
      jest.spyOn(service, 'getErrorRate').mockResolvedValue(mockHighErrorRate);
      
      const alerts = await service.checkPerformanceAlerts();
      
      expect(alerts).toContainEqual({
        type: 'high_error_rate',
        severity: 'critical',
        message: 'Error rate exceeded 5%',
        value: mockHighErrorRate,
        threshold: 5.0,
        timestamp: expect.any(Date)
      });
    });

    test('detects low cache hit rates', async () => {
      const mockLowCacheHitRate = 65.5; // 65.5% cache hit rate
      
      jest.spyOn(service, 'getCacheHitRate').mockResolvedValue(mockLowCacheHitRate);
      
      const alerts = await service.checkPerformanceAlerts();
      
      expect(alerts).toContainEqual({
        type: 'low_cache_hit_rate',
        severity: 'medium',
        message: 'Cache hit rate below 70%',
        value: mockLowCacheHitRate,
        threshold: 70.0,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Data Cleanup', () => {
    test('cleans up old metrics', async () => {
      const daysToKeep = 30;
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      
      mockPrismaClient.performanceMetric.deleteMany.mockResolvedValue({ count: 1250 });
      
      const deletedCount = await service.cleanupOldMetrics(daysToKeep);
      
      expect(mockPrismaClient.performanceMetric.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date)
          }
        }
      });
      expect(deletedCount).toBe(1250);
    });

    test('aggregates metrics for reporting', async () => {
      const mockAggregatedData = [
        { name: 'api_response_time', avg: 145.7, count: 500, date: '2024-01-01' },
        { name: 'database_query', avg: 23.4, count: 1200, date: '2024-01-01' }
      ];
      
      mockPrismaClient.performanceMetric.groupBy.mockResolvedValue(mockAggregatedData);
      
      const aggregated = await service.aggregateMetrics('daily');
      
      expect(mockPrismaClient.performanceMetric.groupBy).toHaveBeenCalledWith({
        by: ['name'],
        where: {
          timestamp: {
            gte: expect.any(Date)
          }
        },
        _avg: { value: true },
        _count: { value: true },
        _min: { value: true },
        _max: { value: true }
      });
      expect(aggregated).toEqual(mockAggregatedData);
    });
  });

  describe('Health Check', () => {
    test('performs comprehensive health check', async () => {
      const mockHealthData = {
        averageResponseTime: 145.7,
        requestCount: 1542,
        errorRate: 0.12,
        cacheHitRate: 87.5,
        databaseQueryTime: 23.4
      };
      
      jest.spyOn(service, 'getAverageResponseTime').mockResolvedValue(mockHealthData.averageResponseTime);
      jest.spyOn(service, 'getRequestCount').mockResolvedValue(mockHealthData.requestCount);
      jest.spyOn(service, 'getErrorRate').mockResolvedValue(mockHealthData.errorRate);
      jest.spyOn(service, 'getCacheHitRate').mockResolvedValue(mockHealthData.cacheHitRate);
      jest.spyOn(service, 'getDatabaseQueryTime').mockResolvedValue(mockHealthData.databaseQueryTime);
      
      const healthStatus = await service.getHealthStatus();
      
      expect(healthStatus).toEqual({
        status: 'healthy',
        metrics: mockHealthData,
        alerts: [],
        timestamp: expect.any(Date),
        uptime: expect.any(Number)
      });
    });

    test('detects unhealthy status', async () => {
      const mockHealthData = {
        averageResponseTime: 3500, // Too slow
        requestCount: 50,
        errorRate: 15.0, // Too high
        cacheHitRate: 45.0, // Too low
        databaseQueryTime: 150.0 // Too slow
      };
      
      jest.spyOn(service, 'getAverageResponseTime').mockResolvedValue(mockHealthData.averageResponseTime);
      jest.spyOn(service, 'getRequestCount').mockResolvedValue(mockHealthData.requestCount);
      jest.spyOn(service, 'getErrorRate').mockResolvedValue(mockHealthData.errorRate);
      jest.spyOn(service, 'getCacheHitRate').mockResolvedValue(mockHealthData.cacheHitRate);
      jest.spyOn(service, 'getDatabaseQueryTime').mockResolvedValue(mockHealthData.databaseQueryTime);
      
      const healthStatus = await service.getHealthStatus();
      
      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('handles database connection errors', async () => {
      mockPrismaClient.performanceMetric.create.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(service.recordMetric('test_metric', 100))
        .rejects.toThrow('Database connection failed');
    });

    test('handles invalid metric data', async () => {
      await expect(service.recordMetric('', NaN))
        .rejects.toThrow('Invalid metric data');
    });

    test('handles missing performance API', () => {
      delete (global as any).performance;
      
      expect(() => service.startTimer('test')).toThrow('Performance API not available');
    });
  });

  describe('Configuration', () => {
    test('uses default configuration', () => {
      const config = service.getConfiguration();
      
      expect(config).toEqual({
        retention: {
          raw: 7, // 7 days
          aggregated: 90 // 90 days
        },
        alerts: {
          responseTime: 2000, // 2 seconds
          errorRate: 5.0, // 5%
          cacheHitRate: 70.0, // 70%
          databaseQueryTime: 100 // 100ms
        },
        sampling: {
          enabled: true,
          rate: 0.1 // 10%
        }
      });
    });

    test('allows configuration override', () => {
      const customConfig = {
        retention: { raw: 14, aggregated: 180 },
        alerts: { responseTime: 1500, errorRate: 3.0 }
      };
      
      service.updateConfiguration(customConfig);
      
      const config = service.getConfiguration();
      expect(config.retention.raw).toBe(14);
      expect(config.alerts.responseTime).toBe(1500);
    });
  });
});
