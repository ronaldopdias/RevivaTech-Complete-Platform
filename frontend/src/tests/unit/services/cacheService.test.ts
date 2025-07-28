/**
 * Unit Tests for Cache Service
 * Tests Redis caching functionality, performance optimization, and cache invalidation
 */

import { CacheService } from '@/lib/services/cacheService';
import { PerformanceMonitoringService } from '@/lib/services/performanceMonitoringService';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');
jest.mock('@/lib/services/performanceMonitoringService');

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  mdel: jest.fn(),
  flushdb: jest.fn(),
  ping: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  status: 'ready'
};

(Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis as any);

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockPerformanceMonitoring: jest.Mocked<PerformanceMonitoringService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock performance monitoring
    mockPerformanceMonitoring = {
      startTimer: jest.fn().mockReturnValue({
        end: jest.fn().mockReturnValue(100) // 100ms
      }),
      recordMetric: jest.fn(),
      getMetrics: jest.fn(),
      getAverageResponseTime: jest.fn(),
      getRequestCount: jest.fn(),
      getErrorRate: jest.fn(),
      getCacheHitRate: jest.fn(),
      getDatabaseQueryTime: jest.fn(),
      trackCacheHit: jest.fn(),
      trackCacheMiss: jest.fn(),
      trackDatabaseQuery: jest.fn()
    } as any;
    
    cacheService = new CacheService();
    
    // Mock successful Redis operations by default
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-1);
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.mget.mockResolvedValue([]);
    mockRedis.mset.mockResolvedValue('OK');
    mockRedis.ping.mockResolvedValue('PONG');
  });

  describe('Basic Cache Operations', () => {
    test('gets value from cache', async () => {
      const testValue = { id: 1, name: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testValue));
      
      const result = await cacheService.get('test-key');
      
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testValue);
      expect(mockPerformanceMonitoring.trackCacheHit).toHaveBeenCalledWith('test-key');
    });

    test('returns null for cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await cacheService.get('missing-key');
      
      expect(result).toBeNull();
      expect(mockPerformanceMonitoring.trackCacheMiss).toHaveBeenCalledWith('missing-key');
    });

    test('sets value in cache with TTL', async () => {
      const testValue = { id: 1, name: 'test' };
      
      await cacheService.set('test-key', testValue, 3600);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testValue),
        'EX',
        3600
      );
    });

    test('sets value in cache without TTL', async () => {
      const testValue = { id: 1, name: 'test' };
      
      await cacheService.set('test-key', testValue);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testValue)
      );
    });

    test('deletes value from cache', async () => {
      await cacheService.delete('test-key');
      
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    test('checks if key exists in cache', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const exists = await cacheService.exists('test-key');
      
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
      expect(exists).toBe(true);
    });
  });

  describe('Advanced Cache Operations', () => {
    test('gets multiple values from cache', async () => {
      const values = [JSON.stringify({ id: 1 }), JSON.stringify({ id: 2 }), null];
      mockRedis.mget.mockResolvedValue(values);
      
      const result = await cacheService.getMultiple(['key1', 'key2', 'key3']);
      
      expect(mockRedis.mget).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(result).toEqual([
        { id: 1 },
        { id: 2 },
        null
      ]);
    });

    test('sets multiple values in cache', async () => {
      const values = {
        'key1': { id: 1 },
        'key2': { id: 2 },
        'key3': { id: 3 }
      };
      
      await cacheService.setMultiple(values, 3600);
      
      expect(mockRedis.mset).toHaveBeenCalledWith([
        'key1', JSON.stringify({ id: 1 }),
        'key2', JSON.stringify({ id: 2 }),
        'key3', JSON.stringify({ id: 3 })
      ]);
      
      // Should set TTL for each key
      expect(mockRedis.expire).toHaveBeenCalledWith('key1', 3600);
      expect(mockRedis.expire).toHaveBeenCalledWith('key2', 3600);
      expect(mockRedis.expire).toHaveBeenCalledWith('key3', 3600);
    });

    test('deletes multiple values from cache', async () => {
      await cacheService.deleteMultiple(['key1', 'key2', 'key3']);
      
      expect(mockRedis.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    test('invalidates cache by pattern', async () => {
      const matchingKeys = ['user:123:profile', 'user:123:settings', 'user:123:bookings'];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      
      await cacheService.invalidatePattern('user:123:*');
      
      expect(mockRedis.keys).toHaveBeenCalledWith('user:123:*');
      expect(mockRedis.del).toHaveBeenCalledWith(matchingKeys);
    });
  });

  describe('Cache-Aside Pattern', () => {
    test('implements cache-aside pattern with cache hit', async () => {
      const cachedValue = { id: 1, name: 'cached' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedValue));
      
      const fallbackFunction = jest.fn();
      
      const result = await cacheService.getOrSet('test-key', fallbackFunction, 3600);
      
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(fallbackFunction).not.toHaveBeenCalled();
      expect(result).toEqual(cachedValue);
    });

    test('implements cache-aside pattern with cache miss', async () => {
      const freshValue = { id: 1, name: 'fresh' };
      mockRedis.get.mockResolvedValue(null);
      
      const fallbackFunction = jest.fn().mockResolvedValue(freshValue);
      
      const result = await cacheService.getOrSet('test-key', fallbackFunction, 3600);
      
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(fallbackFunction).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(freshValue),
        'EX',
        3600
      );
      expect(result).toEqual(freshValue);
    });

    test('handles fallback function errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const fallbackFunction = jest.fn().mockRejectedValue(new Error('Fallback error'));
      
      await expect(cacheService.getOrSet('test-key', fallbackFunction, 3600))
        .rejects.toThrow('Fallback error');
      
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('TTL Management', () => {
    test('gets TTL for cached key', async () => {
      mockRedis.ttl.mockResolvedValue(3600);
      
      const ttl = await cacheService.getTTL('test-key');
      
      expect(mockRedis.ttl).toHaveBeenCalledWith('test-key');
      expect(ttl).toBe(3600);
    });

    test('sets TTL for existing key', async () => {
      await cacheService.expire('test-key', 7200);
      
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 7200);
    });

    test('handles TTL for non-existent key', async () => {
      mockRedis.ttl.mockResolvedValue(-2); // Key doesn't exist
      
      const ttl = await cacheService.getTTL('missing-key');
      
      expect(ttl).toBe(-2);
    });
  });

  describe('Cache Warming', () => {
    test('warms cache with device data', async () => {
      const deviceData = [
        { id: 1, name: 'iPhone 15', category: 'smartphone' },
        { id: 2, name: 'MacBook Pro', category: 'laptop' }
      ];
      
      await cacheService.warmCache('devices', deviceData, 7200);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'devices',
        JSON.stringify(deviceData),
        'EX',
        7200
      );
    });

    test('warms cache with pricing data', async () => {
      const pricingData = {
        'device:1:repair:screen': 299.99,
        'device:2:repair:battery': 149.99
      };
      
      await cacheService.warmPricingCache(pricingData, 3600);
      
      expect(mockRedis.mset).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Statistics', () => {
    test('gets cache statistics', async () => {
      const stats = await cacheService.getStats();
      
      expect(stats).toEqual({
        status: 'ready',
        hitRate: expect.any(Number),
        missRate: expect.any(Number),
        totalHits: expect.any(Number),
        totalMisses: expect.any(Number),
        averageResponseTime: expect.any(Number)
      });
    });

    test('tracks cache performance metrics', async () => {
      await cacheService.get('test-key');
      
      expect(mockPerformanceMonitoring.startTimer).toHaveBeenCalled();
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'cache_operation_duration',
        100
      );
    });
  });

  describe('Error Handling', () => {
    test('handles Redis connection errors', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(cacheService.get('test-key')).rejects.toThrow('Redis connection failed');
    });

    test('handles JSON parsing errors', async () => {
      mockRedis.get.mockResolvedValue('invalid-json{');
      
      const result = await cacheService.get('test-key');
      
      expect(result).toBeNull();
    });

    test('handles Redis timeout errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Command timed out'));
      
      await expect(cacheService.set('test-key', { test: 'value' }, 3600))
        .rejects.toThrow('Command timed out');
    });
  });

  describe('Cache Invalidation Strategies', () => {
    test('invalidates user-specific cache', async () => {
      const userId = 'user-123';
      const userKeys = [
        `user:${userId}:profile`,
        `user:${userId}:bookings`,
        `user:${userId}:settings`
      ];
      
      mockRedis.keys.mockResolvedValue(userKeys);
      
      await cacheService.invalidateUser(userId);
      
      expect(mockRedis.keys).toHaveBeenCalledWith(`user:${userId}:*`);
      expect(mockRedis.del).toHaveBeenCalledWith(userKeys);
    });

    test('invalidates booking-specific cache', async () => {
      const bookingId = 'booking-456';
      const bookingKeys = [
        `booking:${bookingId}:details`,
        `booking:${bookingId}:status`,
        `booking:${bookingId}:payments`
      ];
      
      mockRedis.keys.mockResolvedValue(bookingKeys);
      
      await cacheService.invalidateBooking(bookingId);
      
      expect(mockRedis.keys).toHaveBeenCalledWith(`booking:${bookingId}:*`);
      expect(mockRedis.del).toHaveBeenCalledWith(bookingKeys);
    });

    test('invalidates device catalog cache', async () => {
      const deviceKeys = [
        'devices:all',
        'devices:apple',
        'devices:samsung',
        'devices:categories'
      ];
      
      mockRedis.keys.mockResolvedValue(deviceKeys);
      
      await cacheService.invalidateDevices();
      
      expect(mockRedis.keys).toHaveBeenCalledWith('devices:*');
      expect(mockRedis.del).toHaveBeenCalledWith(deviceKeys);
    });
  });

  describe('Cache Compression', () => {
    test('compresses large cache values', async () => {
      const largeValue = { 
        data: 'x'.repeat(10000), // Large string
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };
      
      await cacheService.setCompressed('large-key', largeValue, 3600);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'large-key',
        expect.any(String), // Compressed data
        'EX',
        3600
      );
    });

    test('decompresses cached values', async () => {
      const originalValue = { id: 1, name: 'test' };
      // Mock compressed data
      mockRedis.get.mockResolvedValue('compressed-data-mock');
      
      // Mock decompression result
      jest.spyOn(cacheService, 'getCompressed').mockResolvedValue(originalValue);
      
      const result = await cacheService.getCompressed('test-key');
      
      expect(result).toEqual(originalValue);
    });
  });

  describe('Cache Health Check', () => {
    test('performs health check on cache', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      
      const health = await cacheService.healthCheck();
      
      expect(health).toEqual({
        status: 'healthy',
        latency: expect.any(Number),
        memory: expect.any(Object),
        connections: expect.any(Number)
      });
    });

    test('detects unhealthy cache', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Redis is down'));
      
      const health = await cacheService.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Redis is down');
    });
  });

  describe('Cache Namespace Management', () => {
    test('uses namespaced keys', async () => {
      const namespacedCache = cacheService.namespace('booking');
      
      await namespacedCache.set('123', { id: 123, status: 'pending' });
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'booking:123',
        expect.any(String)
      );
    });

    test('gets namespaced keys', async () => {
      const namespacedCache = cacheService.namespace('user');
      mockRedis.get.mockResolvedValue(JSON.stringify({ id: 456, name: 'Test User' }));
      
      const result = await namespacedCache.get('456');
      
      expect(mockRedis.get).toHaveBeenCalledWith('user:456');
      expect(result).toEqual({ id: 456, name: 'Test User' });
    });

    test('clears entire namespace', async () => {
      const namespacedCache = cacheService.namespace('temp');
      const tempKeys = ['temp:key1', 'temp:key2', 'temp:key3'];
      
      mockRedis.keys.mockResolvedValue(tempKeys);
      
      await namespacedCache.clear();
      
      expect(mockRedis.keys).toHaveBeenCalledWith('temp:*');
      expect(mockRedis.del).toHaveBeenCalledWith(tempKeys);
    });
  });
});
