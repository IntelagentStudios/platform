import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from './redis';
import { z } from 'zod';
import crypto from 'crypto';
import { logger, auditLog } from './monitoring';

// Rate limiting configurations
export const rateLimiters = {
  api: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:api',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 1 minute
  }),

  auth: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:auth',
    points: 5, // 5 login attempts
    duration: 900, // Per 15 minutes
    blockDuration: 900, // Block for 15 minutes
  }),

  export: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:export',
    points: 10, // 10 exports
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour
  }),

  webhook: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:webhook',
    points: 1000, // 1000 webhook calls
    duration: 60, // Per minute
    blockDuration: 300, // Block for 5 minutes
  }),
};

// CSRF token management
export const csrf = {
  generate(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  async store(sessionId: string, token: string): Promise<void> {
    await redis.setex(`csrf:${sessionId}`, 3600, token);
  },

  async verify(sessionId: string, token: string): Promise<boolean> {
    const storedToken = await redis.get(`csrf:${sessionId}`);
    return storedToken === token;
  },

  async rotate(sessionId: string): Promise<string> {
    const newToken = this.generate();
    await this.store(sessionId, newToken);
    return newToken;
  },
};

// Input validation schemas
export const validators = {
  email: z.string().email(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  apiKey: z.string().regex(/^sk_[a-zA-Z0-9]{32}$/),

  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),

  searchQuery: z.string().max(200).trim(),
};

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// API key management
export class ApiKeyManager {
  static async generate(userId: string, name: string, permissions: string[]): Promise<string> {
    const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

    await redis.hset(`apikey:${hashedKey}`, {
      userId,
      name,
      permissions: JSON.stringify(permissions),
      createdAt: new Date().toISOString(),
      lastUsed: null,
      requestCount: 0,
    });

    await auditLog.log({
      userId,
      action: 'API_KEY_CREATED',
      resource: 'api_key',
      resourceId: hashedKey.substring(0, 8),
      metadata: { name, permissions },
    });

    return key;
  }

  static async verify(key: string): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> {
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const data = await redis.hgetall(`apikey:${hashedKey}`);

    if (!data || !data.userId) {
      return { valid: false };
    }

    // Update usage stats
    await redis.hincrby(`apikey:${hashedKey}`, 'requestCount', 1);
    await redis.hset(`apikey:${hashedKey}`, 'lastUsed', new Date().toISOString());

    return {
      valid: true,
      userId: data.userId,
      permissions: JSON.parse(data.permissions || '[]'),
    };
  }

  static async revoke(key: string, userId: string): Promise<boolean> {
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const deleted = await redis.del(`apikey:${hashedKey}`);

    if (deleted) {
      await auditLog.log({
        userId,
        action: 'API_KEY_REVOKED',
        resource: 'api_key',
        resourceId: hashedKey.substring(0, 8),
      });
    }

    return deleted > 0;
  }

  static async list(userId: string): Promise<any[]> {
    const pattern = 'apikey:*';
    const keys = await redis.keys(pattern);
    const userKeys = [];

    for (const key of keys) {
      const data = await redis.hgetall(key);
      if (data.userId === userId) {
        userKeys.push({
          id: key.replace('apikey:', '').substring(0, 8),
          name: data.name,
          permissions: JSON.parse(data.permissions || '[]'),
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          requestCount: parseInt(data.requestCount || '0'),
        });
      }
    }

    return userKeys;
  }
}

// Session security
export class SessionManager {
  static async create(userId: string, metadata: Record<string, any> = {}): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata,
    };

    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData)); // 24 hours
    return sessionId;
  }

  static async verify(sessionId: string): Promise<{ valid: boolean; userId?: string }> {
    const data = await redis.get(`session:${sessionId}`);
    
    if (!data) {
      return { valid: false };
    }

    const session = JSON.parse(data);
    
    // Update last activity
    session.lastActivity = new Date().toISOString();
    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(session));

    return { valid: true, userId: session.userId };
  }

  static async destroy(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
  }

  static async destroyAllUserSessions(userId: string): Promise<void> {
    const keys = await redis.keys('session:*');
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          await redis.del(key);
        }
      }
    }
  }
}

// IP-based security
export class IpSecurity {
  private static blacklist = new Set<string>();
  private static whitelist = new Set<string>();

  static async checkIp(ip: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check whitelist first
    if (this.whitelist.has(ip)) {
      return { allowed: true };
    }

    // Check blacklist
    if (this.blacklist.has(ip)) {
      return { allowed: false, reason: 'IP blacklisted' };
    }

    // Check Redis for dynamic blacklist
    const isBlacklisted = await redis.get(`blacklist:${ip}`);
    if (isBlacklisted) {
      return { allowed: false, reason: 'IP temporarily blocked' };
    }

    // Check for suspicious activity
    const suspiciousCount = await redis.get(`suspicious:${ip}`);
    if (suspiciousCount && parseInt(suspiciousCount) > 10) {
      await this.blacklistIp(ip, 3600); // Block for 1 hour
      return { allowed: false, reason: 'Suspicious activity detected' };
    }

    return { allowed: true };
  }

  static async blacklistIp(ip: string, duration: number): Promise<void> {
    await redis.setex(`blacklist:${ip}`, duration, '1');
    logger.warn({ ip }, 'IP blacklisted');
  }

  static async reportSuspiciousActivity(ip: string): Promise<void> {
    await redis.incr(`suspicious:${ip}`);
    await redis.expire(`suspicious:${ip}`, 3600); // Reset count after 1 hour
  }
}

// Two-factor authentication
export class TwoFactorAuth {
  static async generateSecret(userId: string): Promise<string> {
    const secret = crypto.randomBytes(32).toString('base64');
    await redis.setex(`2fa:secret:${userId}`, 300, secret); // 5 minutes to setup
    return secret;
  }

  static async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    const hashedCodes = codes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await redis.set(`2fa:backup:${userId}`, JSON.stringify(hashedCodes));
    return codes;
  }

  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const storedCodes = await redis.get(`2fa:backup:${userId}`);
    if (!storedCodes) return false;

    const codes = JSON.parse(storedCodes);
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    
    const index = codes.indexOf(hashedCode);
    if (index === -1) return false;

    // Remove used code
    codes.splice(index, 1);
    await redis.set(`2fa:backup:${userId}`, JSON.stringify(codes));
    
    return true;
  }
}