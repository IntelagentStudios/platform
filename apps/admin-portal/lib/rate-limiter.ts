import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'
import { redis } from './redis'
import { SUBSCRIPTION_TIERS } from './stripe'

// Rate limit configurations per tier
export const RATE_LIMITS = {
  BASIC: {
    apiCalls: { points: 1000, duration: 2592000 }, // 1000 per month
    requests: { points: 10, duration: 1 }, // 10 per second
    storage: 1073741824, // 1GB
    teamMembers: 5,
    chatbotMessages: 1000,
    enrichmentRequests: 100,
  },
  PRO: {
    apiCalls: { points: 10000, duration: 2592000 }, // 10000 per month
    requests: { points: 50, duration: 1 }, // 50 per second
    storage: 10737418240, // 10GB
    teamMembers: 20,
    chatbotMessages: 10000,
    enrichmentRequests: 1000,
  },
  ENTERPRISE: {
    apiCalls: { points: -1, duration: 2592000 }, // Unlimited
    requests: { points: 200, duration: 1 }, // 200 per second
    storage: -1, // Unlimited
    teamMembers: -1, // Unlimited
    chatbotMessages: -1, // Unlimited
    enrichmentRequests: -1, // Unlimited
  }
}

// Create rate limiters for different resources
export const rateLimiters = {
  // API calls per month
  apiMonthly: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:api:monthly',
    points: RATE_LIMITS.PRO.apiCalls.points,
    duration: RATE_LIMITS.PRO.apiCalls.duration,
    blockDuration: 0,
  }),

  // Requests per second
  apiSecond: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:api:second',
    points: RATE_LIMITS.PRO.requests.points,
    duration: RATE_LIMITS.PRO.requests.duration,
    blockDuration: 1,
  }),

  // Chatbot messages per month
  chatbot: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:chatbot',
    points: RATE_LIMITS.PRO.chatbotMessages,
    duration: 2592000, // 30 days
    blockDuration: 0,
  }),

  // Enrichment requests per month
  enrichment: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:enrichment',
    points: RATE_LIMITS.PRO.enrichmentRequests,
    duration: 2592000, // 30 days
    blockDuration: 0,
  }),

  // Authentication attempts
  auth: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:auth',
    points: 5,
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 minutes
  }),
}

export async function checkRateLimit(
  licenseKey: string,
  resource: keyof typeof rateLimiters,
  points = 1
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const limiter = rateLimiters[resource]
    const result = await limiter.consume(licenseKey, points)
    
    return {
      allowed: true,
      remaining: result.remainingPoints,
      resetAt: new Date(Date.now() + result.msBeforeNext),
    }
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        remaining: error.remainingPoints || 0,
        resetAt: new Date(Date.now() + error.msBeforeNext),
      }
    }
    throw error
  }
}

export async function getRateLimitStatus(licenseKey: string) {
  const statuses = await Promise.all([
    rateLimiters.apiMonthly.get(licenseKey),
    rateLimiters.apiSecond.get(licenseKey),
    rateLimiters.chatbot.get(licenseKey),
    rateLimiters.enrichment.get(licenseKey),
  ])

  return {
    apiMonthly: {
      consumed: statuses[0]?.consumedPoints || 0,
      remaining: RATE_LIMITS.PRO.apiCalls.points - (statuses[0]?.consumedPoints || 0),
      limit: RATE_LIMITS.PRO.apiCalls.points,
    },
    apiSecond: {
      consumed: statuses[1]?.consumedPoints || 0,
      remaining: RATE_LIMITS.PRO.requests.points - (statuses[1]?.consumedPoints || 0),
      limit: RATE_LIMITS.PRO.requests.points,
    },
    chatbot: {
      consumed: statuses[2]?.consumedPoints || 0,
      remaining: RATE_LIMITS.PRO.chatbotMessages - (statuses[2]?.consumedPoints || 0),
      limit: RATE_LIMITS.PRO.chatbotMessages,
    },
    enrichment: {
      consumed: statuses[3]?.consumedPoints || 0,
      remaining: RATE_LIMITS.PRO.enrichmentRequests - (statuses[3]?.consumedPoints || 0),
      limit: RATE_LIMITS.PRO.enrichmentRequests,
    },
  }
}

export async function resetRateLimit(licenseKey: string, resource: keyof typeof rateLimiters) {
  await rateLimiters[resource].delete(licenseKey)
}

// Middleware for rate limiting
export async function rateLimitMiddleware(
  licenseKey: string,
  tier: 'BASIC' | 'PRO' | 'ENTERPRISE' = 'PRO'
) {
  // Check if enterprise (unlimited)
  if (tier === 'ENTERPRISE') {
    return { allowed: true, remaining: -1, resetAt: new Date() }
  }

  // Check monthly API limit
  const monthlyCheck = await checkRateLimit(licenseKey, 'apiMonthly')
  if (!monthlyCheck.allowed) {
    throw new Error(`Monthly API limit exceeded. Resets at ${monthlyCheck.resetAt.toISOString()}`)
  }

  // Check per-second rate limit
  const secondCheck = await checkRateLimit(licenseKey, 'apiSecond')
  if (!secondCheck.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(secondCheck.resetAt.getTime() - Date.now())}ms`)
  }

  return {
    allowed: true,
    remaining: monthlyCheck.remaining,
    resetAt: monthlyCheck.resetAt,
  }
}