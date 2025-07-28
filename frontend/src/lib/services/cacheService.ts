// Advanced Caching Service for RevivaTech
// Provides Redis-based caching with intelligent invalidation and performance optimization

import { Redis } from 'ioredis';
import { NotificationType, NotificationChannel } from '@/generated/prisma';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  invalidateOnUpdate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
  avgResponseTime: number;
}

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private stats: CacheStats;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'revivatech:';

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6383'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsage: 0,
      keyCount: 0,
      avgResponseTime: 0
    };

    this.setupEventHandlers();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('✅ Redis: Connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis: Connection error:', error);
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis: Ready for commands');
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis: Connection closed');
    });
  }

  /**
   * Get cached value with performance tracking
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const fullKey = this.getFullKey(key);
      const cached = await this.redis.get(fullKey);
      
      if (cached) {
        this.stats.hits++;
        this.updateStats(Date.now() - startTime);
        return JSON.parse(cached);
      } else {
        this.stats.misses++;
        this.updateStats(Date.now() - startTime);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached value with advanced options
   */
  public async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const ttl = options.ttl || this.DEFAULT_TTL;
      
      let serializedValue = JSON.stringify(value);
      
      // Compress if requested and value is large
      if (options.compress && serializedValue.length > 1024) {
        serializedValue = await this.compress(serializedValue);
      }
      
      // Set with TTL
      const result = await this.redis.setex(fullKey, ttl, serializedValue);
      
      // Handle tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTags(fullKey, options.tags);
      }
      
      return result === 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  public async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let keysToDelete: string[] = [];
      
      for (const tag of tags) {
        const tagKey = this.getTagKey(tag);
        const keys = await this.redis.smembers(tagKey);
        keysToDelete = keysToDelete.concat(keys);
        
        // Also delete the tag set
        await this.redis.del(tagKey);
      }
      
      if (keysToDelete.length > 0) {
        const result = await this.redis.del(...keysToDelete);
        return result;
      }
      
      return 0;
    } catch (error) {
      console.error('Cache invalidate by tags error:', error);
      return 0;
    }
  }

  /**
   * Cache with automatic invalidation on database updates
   */
  public async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Cache the result
    await this.set(key, data, options);
    
    return data;
  }

  /**
   * Batch operations for performance
   */
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.getFullKey(key));
      const results = await this.redis.mget(...fullKeys);
      
      return results.map(result => {
        if (result) {
          try {
            return JSON.parse(result);
          } catch {
            return null;
          }
        }
        return null;
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set operations
   */
  public async mset<T>(
    entries: Array<{ key: string; value: T; options?: CacheOptions }>
  ): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const entry of entries) {
        const fullKey = this.getFullKey(entry.key);
        const ttl = entry.options?.ttl || this.DEFAULT_TTL;
        const serializedValue = JSON.stringify(entry.value);
        
        pipeline.setex(fullKey, ttl, serializedValue);
        
        // Handle tags
        if (entry.options?.tags && entry.options.tags.length > 0) {
          for (const tag of entry.options.tags) {
            const tagKey = this.getTagKey(tag);
            pipeline.sadd(tagKey, fullKey);
          }
        }
      }
      
      const results = await pipeline.exec();
      return results?.every(result => result && result[0] === null) || false;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      
      // Parse key count
      const keyMatch = keyspace.match(/keys=(\d+)/);
      const keyCount = keyMatch ? parseInt(keyMatch[1]) : 0;
      
      // Calculate hit rate
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
      
      return {
        ...this.stats,
        hitRate,
        memoryUsage,
        keyCount
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return this.stats;
    }
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<boolean> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Warm up cache with commonly accessed data
   */
  public async warmUp(): Promise<void> {
    try {
      console.log('🔥 Cache: Starting warmup...');
      
      // Warm up device categories
      await this.warmUpDeviceCategories();
      
      // Warm up notification templates
      await this.warmUpNotificationTemplates();
      
      // Warm up pricing rules
      await this.warmUpPricingRules();
      
      console.log('✅ Cache: Warmup completed');
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Intelligent cache invalidation based on data changes
   */
  public async invalidateRelated(entity: string, entityId: string): Promise<void> {
    const invalidationRules = {
      'user': [`user:${entityId}`, 'user:*', 'notifications:*'],
      'booking': [`booking:${entityId}`, 'bookings:*', 'notifications:*'],
      'device': [`device:${entityId}`, 'devices:*', 'pricing:*'],
      'notification': [`notification:${entityId}`, 'notifications:*'],
      'pricing': ['pricing:*', 'devices:*']
    };
    
    const patterns = invalidationRules[entity as keyof typeof invalidationRules] || [];
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(this.getFullKey(pattern));
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.delete(pattern);
      }
    }
  }

  // Private helper methods
  private getFullKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getTagKey(tag: string): string {
    return `${this.CACHE_PREFIX}tags:${tag}`;
  }

  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.sadd(tagKey, key);
    }
    
    await pipeline.exec();
  }

  private async compress(data: string): Promise<string> {
    // In a real implementation, use a compression library like pako
    // For now, just return the data as-is
    return data;
  }

  private updateStats(responseTime: number): void {
    this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
  }

  private async warmUpDeviceCategories(): Promise<void> {
    try {
      // This would fetch and cache device categories
      console.log('📱 Cache: Warming up device categories...');
    } catch (error) {
      console.error('Failed to warm up device categories:', error);
    }
  }

  private async warmUpNotificationTemplates(): Promise<void> {
    try {
      // This would fetch and cache notification templates
      console.log('🔔 Cache: Warming up notification templates...');
    } catch (error) {
      console.error('Failed to warm up notification templates:', error);
    }
  }

  private async warmUpPricingRules(): Promise<void> {
    try {
      // This would fetch and cache pricing rules
      console.log('💰 Cache: Warming up pricing rules...');
    } catch (error) {
      console.error('Failed to warm up pricing rules:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();