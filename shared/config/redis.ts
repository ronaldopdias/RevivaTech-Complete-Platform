import Redis, { RedisOptions } from 'ioredis';
import { getConfig } from './environment';

const config = getConfig();

// Redis configuration
const redisConfig: RedisOptions = {
  host: config.REDIS_URL ? new URL(config.REDIS_URL).hostname : 'localhost',
  port: config.REDIS_URL ? parseInt(new URL(config.REDIS_URL).port) || 6379 : 6379,
  password: config.REDIS_URL ? new URL(config.REDIS_URL).password || undefined : undefined,
  
  // Connection settings
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  
  // Reconnection settings
  retryConnect: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  
  // Performance settings
  lazyConnect: true,
  keepAlive: 30000,
  
  // Production optimizations
  ...(config.NODE_ENV === 'production' && {
    enableReadyCheck: true,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
  }),
};

// Create Redis instances
export const redis = new Redis(redisConfig);
export const redisPub = new Redis(redisConfig); // For publishing
export const redisSub = new Redis(redisConfig); // For subscribing

// Connection event handlers
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('ready', () => {
  console.log('Redis ready for commands');
});

redis.on('error', (error) => {
  console.error('Redis error:', error);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', (time) => {
  console.log(`Redis reconnecting in ${time}ms`);
});

// Cache helper functions
export class CacheService {
  private defaultTTL: number;
  
  constructor(ttl: number = config.CACHE_TTL) {
    this.defaultTTL = ttl;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
  
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, value);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }
  
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }
  
  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redis.hget(key, field);
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }
  
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await redis.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }
  
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await redis.hgetall(key);
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return null;
    }
  }
  
  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await redis.lpush(key, ...values);
    } catch (error) {
      console.error('Cache lpush error:', error);
      return 0;
    }
  }
  
  async rpop(key: string): Promise<string | null> {
    try {
      return await redis.rpop(key);
    } catch (error) {
      console.error('Cache rpop error:', error);
      return null;
    }
  }
  
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redis.lrange(key, start, stop);
    } catch (error) {
      console.error('Cache lrange error:', error);
      return [];
    }
  }
  
  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      console.error('Cache sadd error:', error);
      return 0;
    }
  }
  
  async smembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      console.error('Cache smembers error:', error);
      return [];
    }
  }
  
  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
  
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        return await redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Cache deletePattern error:', error);
      return 0;
    }
  }
  
  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }
}

// Session store for Redis
export class RedisSessionStore {
  private prefix: string;
  private ttl: number;
  
  constructor(prefix: string = 'session:', ttl: number = 86400) {
    this.prefix = prefix;
    this.ttl = ttl;
  }
  
  async get(sessionId: string): Promise<any> {
    try {
      const data = await redis.get(this.prefix + sessionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Session get error:', error);
      return null;
    }
  }
  
  async set(sessionId: string, data: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(data);
      await redis.setex(this.prefix + sessionId, this.ttl, serialized);
      return true;
    } catch (error) {
      console.error('Session set error:', error);
      return false;
    }
  }
  
  async destroy(sessionId: string): Promise<boolean> {
    try {
      await redis.del(this.prefix + sessionId);
      return true;
    } catch (error) {
      console.error('Session destroy error:', error);
      return false;
    }
  }
  
  async touch(sessionId: string): Promise<boolean> {
    try {
      await redis.expire(this.prefix + sessionId, this.ttl);
      return true;
    } catch (error) {
      console.error('Session touch error:', error);
      return false;
    }
  }
}

// Rate limiting store
export class RedisRateLimiter {
  private prefix: string;
  private windowMs: number;
  private maxRequests: number;
  
  constructor(prefix: string = 'rate_limit:', windowMs: number = config.RATE_LIMIT_WINDOW, maxRequests: number = config.RATE_LIMIT_MAX_REQUESTS) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.prefix + identifier;
    const window = Math.floor(Date.now() / this.windowMs);
    const windowKey = `${key}:${window}`;
    
    try {
      const current = await redis.incr(windowKey);
      
      if (current === 1) {
        await redis.expire(windowKey, Math.ceil(this.windowMs / 1000));
      }
      
      const remaining = Math.max(0, this.maxRequests - current);
      const resetTime = (window + 1) * this.windowMs;
      
      return {
        allowed: current <= this.maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
      };
    }
  }
}

// Real-time notifications
export class RedisNotifications {
  private channel: string;
  
  constructor(channel: string = 'notifications') {
    this.channel = channel;
  }
  
  async publish(event: string, data: any): Promise<boolean> {
    try {
      const message = JSON.stringify({ event, data, timestamp: Date.now() });
      await redisPub.publish(this.channel, message);
      return true;
    } catch (error) {
      console.error('Notification publish error:', error);
      return false;
    }
  }
  
  subscribe(callback: (event: string, data: any) => void): void {
    redisSub.subscribe(this.channel);
    
    redisSub.on('message', (channel, message) => {
      if (channel === this.channel) {
        try {
          const { event, data } = JSON.parse(message);
          callback(event, data);
        } catch (error) {
          console.error('Notification parse error:', error);
        }
      }
    });
  }
  
  unsubscribe(): void {
    redisSub.unsubscribe(this.channel);
  }
}

// Create service instances
export const cache = new CacheService();
export const sessionStore = new RedisSessionStore();
export const rateLimiter = new RedisRateLimiter();
export const notifications = new RedisNotifications();

// Health check
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: any;
}> {
  try {
    const start = Date.now();
    const pong = await redis.ping();
    const duration = Date.now() - start;
    
    const info = await redis.info('memory');
    const memoryUsage = info.split('\n').find(line => line.startsWith('used_memory:'));
    
    return {
      status: 'healthy',
      details: {
        ping: pong,
        responseTime: duration,
        memoryUsage: memoryUsage?.split(':')[1] || 'unknown',
        connected: redis.status === 'ready',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false,
      },
    };
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  console.log('Closing Redis connections...');
  
  try {
    await Promise.all([
      redis.disconnect(),
      redisPub.disconnect(),
      redisSub.disconnect(),
    ]);
    console.log('Redis connections closed');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
}

// Handle process termination
process.on('SIGINT', closeRedis);
process.on('SIGTERM', closeRedis);