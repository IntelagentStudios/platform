import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

class RateLimiter {
  private redis: Redis | null = null;
  private useMemoryFallback: boolean = false;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          enableReadyCheck: false,
          lazyConnect: true
        });

        this.redis.on('error', (err) => {
          console.warn('Redis rate limiter error, falling back to memory:', err.message);
          this.useMemoryFallback = true;
        });

        this.redis.on('connect', () => {
          console.log('Redis rate limiter connected');
          this.useMemoryFallback = false;
        });
      } else {
        this.useMemoryFallback = true;
        console.log('No Redis URL provided, using memory-based rate limiting');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis for rate limiting:', error);
      this.useMemoryFallback = true;
    }
  }

  async limit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const fullKey = `${config.keyPrefix || 'rate'}:${key}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const resetTime = now + config.windowMs;

    if (!this.useMemoryFallback && this.redis) {
      try {
        // Use Redis sliding window algorithm
        const multi = this.redis.multi();
        
        // Remove old entries
        multi.zremrangebyscore(fullKey, '-inf', windowStart);
        
        // Count current entries
        multi.zcard(fullKey);
        
        // Add current request
        multi.zadd(fullKey, now, `${now}-${Math.random()}`);
        
        // Set expiry
        multi.expire(fullKey, Math.ceil(config.windowMs / 1000));
        
        const results = await multi.exec();
        
        if (results) {
          const count = (results[1]?.[1] as number) || 0;
          const remaining = Math.max(0, config.max - count - 1);
          
          return {
            success: count < config.max,
            limit: config.max,
            remaining,
            reset: new Date(resetTime)
          };
        }
      } catch (error) {
        console.warn('Redis rate limit check failed, using memory fallback:', error);
        this.useMemoryFallback = true;
      }
    }

    // Memory fallback
    return this.memoryLimit(fullKey, config);
  }

  private memoryLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const record = this.memoryStore.get(key);

    if (!record || record.resetTime < now) {
      // Create new window
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });

      return {
        success: true,
        limit: config.max,
        remaining: config.max - 1,
        reset: new Date(now + config.windowMs)
      };
    }

    // Check if limit exceeded
    if (record.count >= config.max) {
      return {
        success: false,
        limit: config.max,
        remaining: 0,
        reset: new Date(record.resetTime)
      };
    }

    // Increment count
    record.count++;
    this.memoryStore.set(key, record);

    return {
      success: true,
      limit: config.max,
      remaining: config.max - record.count,
      reset: new Date(record.resetTime)
    };
  }

  // Clean up old entries periodically
  startCleanup(intervalMs: number = 60000) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.memoryStore.entries()) {
        if (record.resetTime < now) {
          this.memoryStore.delete(key);
        }
      }
    }, intervalMs);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();
rateLimiter.startCleanup();

// Middleware function
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  }
): Promise<NextResponse | null> {
  // Get identifier (IP or API key)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const apiKey = request.headers.get('x-api-key');
  const identifier = apiKey || ip;

  const result = await rateLimiter.limit(identifier, config);

  // Set rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toISOString());

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString());
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again at ${result.reset.toISOString()}`,
        retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers
      }
    );
  }

  // Add headers to successful response (handled by caller)
  return null;
}

// Plan-based rate limits
export const RATE_LIMITS = {
  starter: {
    api: { windowMs: 60000, max: 60 },      // 60/min
    chatbot: { windowMs: 60000, max: 100 }, // 100/min
    enrichment: { windowMs: 60000, max: 30 } // 30/min
  },
  professional: {
    api: { windowMs: 60000, max: 300 },     // 300/min
    chatbot: { windowMs: 60000, max: 500 }, // 500/min
    enrichment: { windowMs: 60000, max: 100 } // 100/min
  },
  enterprise: {
    api: { windowMs: 60000, max: 1000 },    // 1000/min
    chatbot: { windowMs: 60000, max: 2000 }, // 2000/min
    enrichment: { windowMs: 60000, max: 500 } // 500/min
  }
};

export { rateLimiter, RateLimiter, RateLimitConfig, RateLimitResult };