import Redis, { RedisOptions } from 'ioredis';

/**
 * Centralized Redis client configuration for the entire platform
 * Provides singleton instances for different use cases
 */

// Parse Redis configuration from environment
function getRedisConfig(): RedisOptions | string | null {
  // Check for public Redis URL first (works during build and runtime)
  const publicRedisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL_PUBLIC;
  
  if (publicRedisUrl) {
    console.log('Using public Redis URL');
    return publicRedisUrl;
  }
  
  // Check for internal Redis URL (only works at runtime in Railway)
  const redisUrl = process.env.REDIS_URL;
  
  // If Redis URL is provided, parse it for connection
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      
      // Skip internal URLs during build time
      if (url.hostname.includes('.internal') && process.env.BUILDING === 'true') {
        console.log('Skipping internal Redis URL during build');
        return null;
      }
      
      // Return URL string for ioredis to parse
      return redisUrl;
    } catch (error) {
      console.warn('Invalid REDIS_URL format:', error);
    }
  }
  
  // Check for Railway's naming convention (without underscores)
  const railwayHost = process.env.REDISHOST;
  const railwayPort = process.env.REDISPORT;
  const railwayUser = process.env.REDISUSER;
  const railwayPassword = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD;
  
  if (railwayHost) {
    return {
      host: railwayHost,
      port: parseInt(railwayPort || '6379'),
      username: railwayUser,
      password: railwayPassword,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.warn('Redis connection failed after 10 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      commandTimeout: 5000,
      keepAlive: 30000,
      lazyConnect: true,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    };
  }
  
  // Check for standard naming convention (with underscores) as fallback
  if (process.env.REDIS_HOST) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.warn('Redis connection failed after 10 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      commandTimeout: 5000,
      keepAlive: 30000,
      lazyConnect: true,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    };
  }
  
  // No Redis configuration provided
  console.warn('No Redis configuration found. Some features may be limited.');
  return null;
}

// Defer Redis configuration until runtime
let redisConfig: any = null;
let isInitialized = false;

function initializeRedisConfig() {
  if (isInitialized) return redisConfig;
  
  // Skip Redis in build environment
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.argv.includes('build') ||
                       process.env.BUILDING === 'true' ||
                       process.env.NODE_ENV === 'build';
  
  if (isBuildTime) {
    console.log('Redis disabled during build time');
    redisConfig = null;
  } else {
    redisConfig = getRedisConfig();
  }
  
  isInitialized = true;
  return redisConfig;
}

class RedisManager {
  private static instances: Map<string, Redis> = new Map();
  private static isProduction = process.env.NODE_ENV === 'production';

  /**
   * Get or create a Redis client for a specific purpose
   */
  static getClient(purpose: 'cache' | 'queue' | 'pubsub' | 'session' | 'rate-limit' = 'cache'): Redis | null {
    const config = initializeRedisConfig();
    if (!config) {
      console.warn(`Redis not configured. ${purpose} features will be limited.`);
      return null;
    }
    
    if (!this.instances.has(purpose)) {
      const client = this.createClient(purpose);
      if (client) {
        this.instances.set(purpose, client);
        this.setupEventHandlers(client, purpose);
      }
    }
    return this.instances.get(purpose) || null;
  }

  /**
   * Create a new Redis client with purpose-specific configuration
   */
  private static createClient(purpose: string): Redis | null {
    const config = initializeRedisConfig();
    if (!config) return null;
    
    let client: Redis;

    try {
      if (typeof config === 'string') {
        // Use Redis URL if available
        client = new Redis(config, {
          connectionName: `intelagent-${purpose}`,
          db: this.getDatabaseIndex(purpose),
          maxRetriesPerRequest: 3,
          enableOfflineQueue: true,
          lazyConnect: true,
          enableReadyCheck: false,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 100, 3000);
          }
        });
      } else {
        // Use individual connection parameters
        client = new Redis({
          ...config,
          connectionName: `intelagent-${purpose}`,
          db: this.getDatabaseIndex(purpose),
          lazyConnect: true,
          enableReadyCheck: false
        });
      }
      
      return client;
    } catch (error) {
      console.error(`Failed to create Redis client for ${purpose}:`, error);
      return null;
    }
  }

  /**
   * Get database index for different purposes (0-15 available)
   */
  private static getDatabaseIndex(purpose: string): number {
    const dbMap: Record<string, number> = {
      'cache': 0,
      'queue': 1,
      'pubsub': 2,
      'session': 3,
      'rate-limit': 4
    };
    return dbMap[purpose] || 0;
  }

  /**
   * Setup event handlers for Redis client
   */
  private static setupEventHandlers(client: Redis, purpose: string): void {
    client.on('connect', () => {
      console.log(`Redis [${purpose}] connected successfully`);
    });

    client.on('ready', () => {
      console.log(`Redis [${purpose}] ready to accept commands`);
    });

    client.on('error', (err) => {
      console.error(`Redis [${purpose}] error:`, err.message);
      
      // In production, send alert
      if (this.isProduction) {
        // Could integrate with notification service here
        console.error(`CRITICAL: Redis ${purpose} connection error in production`);
      }
    });

    client.on('close', () => {
      console.log(`Redis [${purpose}] connection closed`);
    });

    client.on('reconnecting', (delay: number) => {
      console.log(`Redis [${purpose}] reconnecting in ${delay}ms`);
    });

    client.on('end', () => {
      console.log(`Redis [${purpose}] connection ended`);
    });
  }

  /**
   * Health check for all Redis connections
   */
  static async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [purpose, client] of this.instances) {
      try {
        await client.ping();
        health[purpose] = true;
      } catch (error) {
        health[purpose] = false;
      }
    }
    
    return health;
  }

  /**
   * Gracefully shutdown all Redis connections
   */
  static async shutdown(): Promise<void> {
    console.log('Shutting down Redis connections...');
    
    const promises = Array.from(this.instances.entries()).map(async ([purpose, client]) => {
      try {
        await client.quit();
        console.log(`Redis [${purpose}] connection closed gracefully`);
      } catch (error) {
        console.error(`Error closing Redis [${purpose}]:`, error);
        client.disconnect();
      }
    });
    
    await Promise.all(promises);
    this.instances.clear();
  }

  /**
   * Get statistics for monitoring
   */
  static async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [purpose, client] of this.instances) {
      try {
        const info = await client.info();
        const memory = await client.info('memory');
        const clientList = await client.client('list');
        
        stats[purpose] = {
          connected: client.status === 'ready',
          db: client.options.db,
          clients: clientList.split('\n').length - 1,
          memory: this.parseMemoryInfo(memory),
          commands: this.parseCommandStats(info)
        };
      } catch (error) {
        stats[purpose] = {
          connected: false,
          error: error.message
        };
      }
    }
    
    return stats;
  }

  private static parseMemoryInfo(info: string): any {
    const lines = info.split('\r\n');
    const memory: any = {};
    
    lines.forEach(line => {
      if (line.includes('used_memory_human')) {
        memory.used = line.split(':')[1];
      }
      if (line.includes('used_memory_peak_human')) {
        memory.peak = line.split(':')[1];
      }
    });
    
    return memory;
  }

  private static parseCommandStats(info: string): any {
    const lines = info.split('\r\n');
    const stats: any = {};
    
    lines.forEach(line => {
      if (line.includes('instantaneous_ops_per_sec')) {
        stats.opsPerSec = parseInt(line.split(':')[1]);
      }
      if (line.includes('total_commands_processed')) {
        stats.totalCommands = parseInt(line.split(':')[1]);
      }
    });
    
    return stats;
  }
}

// Cache utilities
export class RedisCache {
  private client: Redis | null;
  private defaultTTL: number;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();

  constructor(ttl: number = 3600) {
    this.client = RedisManager.getClient('cache');
    this.defaultTTL = ttl;
    
    // Cleanup expired memory cache entries periodically
    if (!this.client) {
      setInterval(() => this.cleanupMemoryCache(), 60000); // Every minute
    }
  }

  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      // Fallback to memory cache
      const item = this.memoryCache.get(key);
      if (item && item.expires > Date.now()) {
        return item.value;
      }
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) {
      // Fallback to memory cache
      const expires = Date.now() + ((ttl || this.defaultTTL) * 1000);
      this.memoryCache.set(key, { value, expires });
      return;
    }
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl || this.defaultTTL) {
        await this.client.setex(key, ttl || this.defaultTTL, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      this.memoryCache.delete(key);
      return;
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    if (!this.client) {
      this.memoryCache.clear();
      return;
    }
    
    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      const item = this.memoryCache.get(key);
      return item !== undefined && item.expires > Date.now();
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client) {
      const item = this.memoryCache.get(key);
      const current = (item && item.expires > Date.now()) ? item.value : 0;
      const newValue = (typeof current === 'number' ? current : 0) + amount;
      this.memoryCache.set(key, { value: newValue, expires: Date.now() + (this.defaultTTL * 1000) });
      return newValue;
    }
    
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.client) {
      const item = this.memoryCache.get(key);
      if (item) {
        item.expires = Date.now() + (ttl * 1000);
      }
      return;
    }
    
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  }
}

// Queue utilities
export class RedisQueue {
  private client: Redis;
  private queueName: string;

  constructor(queueName: string) {
    this.client = RedisManager.getClient('queue');
    this.queueName = `queue:${queueName}`;
  }

  async push(data: any): Promise<void> {
    try {
      await this.client.rpush(this.queueName, JSON.stringify(data));
    } catch (error) {
      console.error(`Queue push error for ${this.queueName}:`, error);
    }
  }

  async pop<T>(): Promise<T | null> {
    try {
      const value = await this.client.lpop(this.queueName);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Queue pop error for ${this.queueName}:`, error);
      return null;
    }
  }

  async blockingPop<T>(timeout: number = 0): Promise<T | null> {
    try {
      const result = await this.client.blpop(this.queueName, timeout);
      return result ? JSON.parse(result[1]) : null;
    } catch (error) {
      console.error(`Queue blocking pop error for ${this.queueName}:`, error);
      return null;
    }
  }

  async length(): Promise<number> {
    try {
      return await this.client.llen(this.queueName);
    } catch (error) {
      console.error(`Queue length error for ${this.queueName}:`, error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.del(this.queueName);
    } catch (error) {
      console.error(`Queue clear error for ${this.queueName}:`, error);
    }
  }
}

// Pub/Sub utilities
export class RedisPubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.publisher = RedisManager.getClient('pubsub');
    this.subscriber = this.publisher.duplicate();
    this.setupSubscriber();
  }

  private setupSubscriber() {
    this.subscriber.on('message', (channel: string, message: string) => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            const data = JSON.parse(message);
            handler(data);
          } catch (error) {
            console.error(`PubSub handler error for channel ${channel}:`, error);
          }
        });
      }
    });
  }

  async publish(channel: string, data: any): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(data));
    } catch (error) {
      console.error(`PubSub publish error for channel ${channel}:`, error);
    }
  }

  async subscribe(channel: string, handler: Function): Promise<void> {
    try {
      if (!this.handlers.has(channel)) {
        this.handlers.set(channel, new Set());
        await this.subscriber.subscribe(channel);
      }
      this.handlers.get(channel)!.add(handler);
    } catch (error) {
      console.error(`PubSub subscribe error for channel ${channel}:`, error);
    }
  }

  async unsubscribe(channel: string, handler?: Function): Promise<void> {
    try {
      if (handler) {
        this.handlers.get(channel)?.delete(handler);
      } else {
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    } catch (error) {
      console.error(`PubSub unsubscribe error for channel ${channel}:`, error);
    }
  }
}

// Session store
export class RedisSessionStore {
  private client: Redis;
  private prefix: string;
  private ttl: number;

  constructor(prefix: string = 'session:', ttl: number = 86400) {
    this.client = RedisManager.getClient('session');
    this.prefix = prefix;
    this.ttl = ttl;
  }

  async get(sessionId: string): Promise<any> {
    try {
      const data = await this.client.get(`${this.prefix}${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Session get error for ${sessionId}:`, error);
      return null;
    }
  }

  async set(sessionId: string, data: any): Promise<void> {
    try {
      await this.client.setex(
        `${this.prefix}${sessionId}`,
        this.ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(`Session set error for ${sessionId}:`, error);
    }
  }

  async destroy(sessionId: string): Promise<void> {
    try {
      await this.client.del(`${this.prefix}${sessionId}`);
    } catch (error) {
      console.error(`Session destroy error for ${sessionId}:`, error);
    }
  }

  async touch(sessionId: string): Promise<void> {
    try {
      await this.client.expire(`${this.prefix}${sessionId}`, this.ttl);
    } catch (error) {
      console.error(`Session touch error for ${sessionId}:`, error);
    }
  }
}

// Export singleton instances (lazy initialization)
let _cache: RedisCache | null = null;
let _pubsub: RedisPubSub | null = null;
let _sessionStore: RedisSessionStore | null = null;

export const cache = {
  get: async (key: string) => {
    if (!_cache) _cache = new RedisCache();
    return _cache.get(key);
  },
  set: async (key: string, value: any, ttl?: number) => {
    if (!_cache) _cache = new RedisCache();
    return _cache.set(key, value, ttl);
  },
  delete: async (key: string) => {
    if (!_cache) _cache = new RedisCache();
    return _cache.delete(key);
  },
  clear: async (pattern?: string) => {
    if (!_cache) _cache = new RedisCache();
    return _cache.clear(pattern);
  }
};

export const pubsub = {
  publish: async (channel: string, message: any) => {
    if (!_pubsub) _pubsub = new RedisPubSub();
    return _pubsub.publish(channel, message);
  },
  subscribe: async (channel: string, callback: (message: any) => void) => {
    if (!_pubsub) _pubsub = new RedisPubSub();
    return _pubsub.subscribe(channel, callback);
  },
  unsubscribe: async (channel: string) => {
    if (!_pubsub) _pubsub = new RedisPubSub();
    return _pubsub.unsubscribe(channel);
  }
};

export const sessionStore = {
  get: async (sessionId: string) => {
    if (!_sessionStore) _sessionStore = new RedisSessionStore();
    return _sessionStore.get(sessionId);
  },
  set: async (sessionId: string, data: any, ttl?: number) => {
    if (!_sessionStore) _sessionStore = new RedisSessionStore();
    return _sessionStore.set(sessionId, data, ttl);
  },
  destroy: async (sessionId: string) => {
    if (!_sessionStore) _sessionStore = new RedisSessionStore();
    return _sessionStore.destroy(sessionId);
  },
  touch: async (sessionId: string) => {
    if (!_sessionStore) _sessionStore = new RedisSessionStore();
    return _sessionStore.touch(sessionId);
  }
};

// Export the manager for advanced usage
export { RedisManager };

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await RedisManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await RedisManager.shutdown();
  process.exit(0);
});