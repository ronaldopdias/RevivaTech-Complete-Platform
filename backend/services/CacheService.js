/**
 * CacheService.js - Advanced Redis Caching for Performance Optimization
 * Session 8: Performance & Monitoring Implementation
 * 
 * Features:
 * - Multi-level caching with TTL management
 * - Cache warming and preloading strategies
 * - Performance monitoring and metrics
 * - Automatic cache invalidation
 * - Memory-efficient data serialization
 */

const Redis = require('redis');
const crypto = require('crypto');
const EventEmitter = require('events');

class CacheService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6383,
      db: process.env.REDIS_DB || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'revivatech:',
      defaultTTL: 3600, // 1 hour
      compressionThreshold: 1024, // Compress data > 1KB
      maxMemory: '256mb',
      ...config
    };

    this.client = null;
    this.isConnected = false;
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalOperations: 0,
      avgResponseTime: 0,
      memoryUsage: 0
    };

    this.cacheStrategies = {
      // Analytics data cache (frequent reads)
      analytics: { ttl: 300, compress: true }, // 5 minutes
      
      // User session cache (critical for auth)
      session: { ttl: 1800, compress: false }, // 30 minutes
      
      // ML model results (expensive to compute)
      mlResults: { ttl: 7200, compress: true }, // 2 hours
      
      // Database query cache (reduce DB load)
      dbQuery: { ttl: 600, compress: true }, // 10 minutes
      
      // Static content cache (rarely changes)
      static: { ttl: 86400, compress: true }, // 24 hours
      
      // Real-time data (very short-lived)
      realtime: { ttl: 60, compress: false } // 1 minute
    };

    this.init();
  }

  async init() {
    try {
      // Create Redis client with connection pooling
      const clientConfig = {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      };
      // Only add password if it's defined and not null
      if (this.config.password) {
        clientConfig.password = this.config.password;
      }
      this.client = Redis.createClient(clientConfig);
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
        this.emit('connected');
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.metrics.errors++;
        this.emit('error', err);
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
        this.emit('disconnected');
      });

      await this.client.connect();
      
      // Configure Redis for optimal performance
      await this.configureRedis();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      console.log('CacheService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize CacheService:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  async configureRedis() {
    try {
      // Set memory management policies
      await this.client.configSet('maxmemory', this.config.maxMemory);
      await this.client.configSet('maxmemory-policy', 'allkeys-lru');
      
      // Enable compression for large values
      await this.client.configSet('list-compress-depth', '1');
      
      console.log('Redis configured for optimal performance');
    } catch (error) {
      console.error('Redis configuration error:', error);
    }
  }

  generateKey(namespace, identifier, ...args) {
    const baseKey = `${this.config.keyPrefix}${namespace}:${identifier}`;
    if (args.length === 0) return baseKey;
    
    // Create deterministic hash for complex identifiers
    const hash = crypto
      .createHash('md5')
      .update(args.join(':'))
      .digest('hex')
      .substring(0, 8);
    
    return `${baseKey}:${hash}`;
  }

  async get(key, options = {}) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalOperations++;
      
      const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
      const cached = await this.client.get(fullKey);
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      if (cached === null) {
        this.metrics.misses++;
        return null;
      }
      
      this.metrics.hits++;
      
      // Parse cached data
      const data = this.deserialize(cached);
      
      // Check if data has metadata (compression, expiry, etc.)
      if (data && typeof data === 'object' && data.__cache_meta) {
        return data.value;
      }
      
      return data;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  async set(key, value, options = {}) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalOperations++;
      this.metrics.sets++;
      
      const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
      
      // Determine cache strategy
      const strategy = this.getCacheStrategy(key, options);
      const ttl = options.ttl || strategy.ttl || this.config.defaultTTL;
      
      // Prepare data for caching
      const serializedData = this.serialize(value, strategy);
      
      // Set with expiration
      await this.client.setEx(fullKey, ttl, serializedData);
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      // Emit cache set event for monitoring
      this.emit('cacheSet', { key: fullKey, size: serializedData.length, ttl });
      
      return true;
      
    } catch (error) {
      console.error('Cache set error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  async delete(key) {
    try {
      this.metrics.totalOperations++;
      this.metrics.deletes++;
      
      const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
      const result = await this.client.del(fullKey);
      
      this.emit('cacheDelete', { key: fullKey });
      
      return result > 0;
      
    } catch (error) {
      console.error('Cache delete error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  async exists(key) {
    try {
      const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async mget(keys) {
    try {
      this.metrics.totalOperations++;
      
      const fullKeys = keys.map(key => 
        typeof key === 'string' ? key : this.generateKey(...key)
      );
      
      const results = await this.client.mGet(fullKeys);
      
      return results.map(result => {
        if (result === null) {
          this.metrics.misses++;
          return null;
        }
        this.metrics.hits++;
        return this.deserialize(result);
      });
      
    } catch (error) {
      console.error('Cache mget error:', error);
      this.metrics.errors++;
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, options = {}) {
    try {
      this.metrics.totalOperations++;
      
      const pipeline = this.client.multi();
      
      for (const [key, value] of keyValuePairs) {
        const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
        const strategy = this.getCacheStrategy(key, options);
        const ttl = options.ttl || strategy.ttl || this.config.defaultTTL;
        const serializedData = this.serialize(value, strategy);
        
        pipeline.setEx(fullKey, ttl, serializedData);
        this.metrics.sets++;
      }
      
      await pipeline.exec();
      return true;
      
    } catch (error) {
      console.error('Cache mset error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  async increment(key, value = 1, options = {}) {
    try {
      this.metrics.totalOperations++;
      
      const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
      const result = await this.client.incrBy(fullKey, value);
      
      // Set expiration if key is new
      const ttl = options.ttl || this.config.defaultTTL;
      await this.client.expire(fullKey, ttl);
      
      return result;
      
    } catch (error) {
      console.error('Cache increment error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  async getOrSet(key, factory, options = {}) {
    try {
      // Try to get from cache first
      const cached = await this.get(key, options);
      if (cached !== null) {
        return cached;
      }
      
      // Generate data using factory function
      const data = await factory();
      
      // Cache the result
      await this.set(key, data, options);
      
      return data;
      
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const fullPattern = `${this.config.keyPrefix}${pattern}`;
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        this.metrics.deletes += keys.length;
        
        this.emit('patternInvalidated', { pattern: fullPattern, count: keys.length });
      }
      
      return keys.length;
      
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  async warmup(warmupData) {
    try {
      console.log('Starting cache warmup...');
      
      const pipeline = this.client.multi();
      let count = 0;
      
      for (const [key, value, options = {}] of warmupData) {
        const fullKey = typeof key === 'string' ? key : this.generateKey(...key);
        const strategy = this.getCacheStrategy(key, options);
        const ttl = options.ttl || strategy.ttl || this.config.defaultTTL;
        const serializedData = this.serialize(value, strategy);
        
        pipeline.setEx(fullKey, ttl, serializedData);
        count++;
      }
      
      await pipeline.exec();
      
      console.log(`Cache warmup completed: ${count} keys preloaded`);
      this.emit('warmupCompleted', { count });
      
      return count;
      
    } catch (error) {
      console.error('Cache warmup error:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  getCacheStrategy(key, options) {
    // Determine strategy based on key pattern or explicit option
    if (options.strategy && this.cacheStrategies[options.strategy]) {
      return this.cacheStrategies[options.strategy];
    }
    
    const keyStr = Array.isArray(key) ? key[0] : key;
    
    for (const [strategy, config] of Object.entries(this.cacheStrategies)) {
      if (keyStr.includes(strategy)) {
        return config;
      }
    }
    
    // Default strategy
    return { ttl: this.config.defaultTTL, compress: false };
  }

  serialize(data, strategy = {}) {
    try {
      const jsonStr = JSON.stringify(data);
      
      // Compress large data if strategy allows
      if (strategy.compress && jsonStr.length > this.config.compressionThreshold) {
        const zlib = require('zlib');
        const compressed = zlib.deflateSync(jsonStr);
        
        return JSON.stringify({
          __cache_meta: { compressed: true, originalSize: jsonStr.length },
          value: compressed.toString('base64')
        });
      }
      
      return jsonStr;
      
    } catch (error) {
      console.error('Serialization error:', error);
      return JSON.stringify(null);
    }
  }

  deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      
      // Check if data is compressed
      if (parsed && typeof parsed === 'object' && parsed.__cache_meta?.compressed) {
        const zlib = require('zlib');
        const compressed = Buffer.from(parsed.value, 'base64');
        const decompressed = zlib.inflateSync(compressed).toString();
        return JSON.parse(decompressed);
      }
      
      return parsed;
      
    } catch (error) {
      console.error('Deserialization error:', error);
      return null;
    }
  }

  updateResponseTime(responseTime) {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalOperations - 1) + responseTime) / 
      this.metrics.totalOperations;
  }

  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          this.metrics.memoryUsage = parseInt(memoryMatch[1]);
        }
        
        // Calculate hit ratio
        const totalRequests = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRatio = totalRequests > 0 ? 
          (this.metrics.hits / totalRequests * 100).toFixed(2) : 0;
        
        this.emit('metricsUpdated', this.metrics);
        
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, 30000);
  }

  getMetrics() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    
    return {
      ...this.metrics,
      hitRatio: totalRequests > 0 ? 
        (this.metrics.hits / totalRequests * 100).toFixed(2) : 0,
      isConnected: this.isConnected,
      memoryUsageMB: (this.metrics.memoryUsage / 1024 / 1024).toFixed(2)
    };
  }

  async getHealth() {
    try {
      const startTime = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - startTime;
      
      const info = await this.client.info();
      const memory = await this.client.info('memory');
      
      return {
        status: 'healthy',
        responseTime,
        isConnected: this.isConnected,
        metrics: this.getMetrics(),
        redisInfo: {
          version: info.match(/redis_version:([\d.]+)/)?.[1],
          uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1],
          connectedClients: info.match(/connected_clients:(\d+)/)?.[1],
          usedMemory: memory.match(/used_memory_human:([\w.]+)/)?.[1],
          keyspace: info.match(/db0:keys=(\d+)/)?.[1] || '0'
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        isConnected: false
      };
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('CacheService closed');
      }
    } catch (error) {
      console.error('Error closing CacheService:', error);
    }
  }
}

// Cache service instance
let cacheInstance = null;

module.exports = {
  CacheService,
  
  // Singleton pattern for global access
  getInstance: (config) => {
    if (!cacheInstance) {
      cacheInstance = new CacheService(config);
    }
    return cacheInstance;
  },
  
  // Helper methods for common patterns
  cache: {
    analytics: (key, value, ttl = 300) => 
      cacheInstance?.set(['analytics', key], value, { ttl, strategy: 'analytics' }),
    
    session: (sessionId, data, ttl = 1800) => 
      cacheInstance?.set(['session', sessionId], data, { ttl, strategy: 'session' }),
    
    mlResult: (modelId, input, result, ttl = 7200) => 
      cacheInstance?.set(['mlResults', modelId, input], result, { ttl, strategy: 'mlResults' }),
    
    dbQuery: (query, params, result, ttl = 600) => {
      const key = crypto.createHash('md5').update(query + JSON.stringify(params)).digest('hex');
      return cacheInstance?.set(['dbQuery', key], result, { ttl, strategy: 'dbQuery' });
    }
  }
};