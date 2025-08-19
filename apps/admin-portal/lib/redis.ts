import Redis from 'ioredis';
import { Queue, Worker, QueueEvents } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

export const pubClient = redis.duplicate();
export const subClient = redis.duplicate();

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

export const cacheManager = {
  async get(key: string) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl?: number) {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string) {
    await redis.del(key);
  },

  async flush() {
    await redis.flushall();
  },

  async keys(pattern: string) {
    return await redis.keys(pattern);
  },
};

export const rateLimiter = {
  async check(key: string, limit: number, window: number) {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    return current <= limit;
  },

  async reset(key: string) {
    await redis.del(key);
  },
};

export const sessionStore = {
  async get(session_id: string) {
    const session = await redis.get(`session:${session_id}`);
    return session ? JSON.parse(session) : null;
  },

  async set(session_id: string, data: any, ttl = 86400) {
    await redis.setex(`session:${session_id}`, ttl, JSON.stringify(data));
  },

  async destroy(session_id: string) {
    await redis.del(`session:${session_id}`);
  },
};

export const metrics = {
  async increment(metric: string, value = 1) {
    await redis.incrby(`metric:${metric}`, value);
  },

  async gauge(metric: string, value: number) {
    await redis.set(`gauge:${metric}`, value);
  },

  async histogram(metric: string, value: number) {
    const key = `histogram:${metric}`;
    await redis.zadd(key, Date.now(), value);
    await redis.expire(key, 3600);
  },

  async getMetrics() {
    const keys = await redis.keys('metric:*');
    const gaugeKeys = await redis.keys('gauge:*');
    const metrics: Record<string, any> = {};

    for (const key of keys) {
      const name = key.replace('metric:', '');
      metrics[name] = parseInt(await redis.get(key) || '0');
    }

    for (const key of gaugeKeys) {
      const name = key.replace('gauge:', '');
      metrics[name] = parseFloat(await redis.get(key) || '0');
    }

    return metrics;
  },
};

export default redis;