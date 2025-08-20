import { prisma } from '@intelagent/database';
import { Redis } from 'ioredis';

interface UsageEvent {
  licenseKey: string;
  productId: string;
  eventType: string;
  quantity?: number;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

interface UsageLimits {
  [product: string]: {
    [metric: string]: number;
  };
}

interface BillingPeriod {
  start: Date;
  end: Date;
  licenseKey: string;
}

class UsageTracker {
  private redis: Redis | null = null;
  private flushInterval: NodeJS.Timer | null = null;
  private buffer: UsageEvent[] = [];
  private bufferSize: number = 100;
  private flushIntervalMs: number = 30000; // 30 seconds

  constructor() {
    this.initRedis();
    this.startAutoFlush();
  }

  private initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true
        });

        this.redis.on('error', (err) => {
          console.warn('Redis usage tracker error:', err.message);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize Redis for usage tracking:', error);
    }
  }

  private startAutoFlush() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  async track(event: UsageEvent): Promise<void> {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    // Add to buffer
    this.buffer.push(event);

    // Real-time tracking in Redis for immediate quota checks
    if (this.redis) {
      try {
        const key = `usage:${event.licenseKey}:${event.productId}:${event.eventType}`;
        const dayKey = `${key}:${new Date().toISOString().split('T')[0]}`;
        
        await this.redis.multi()
          .hincrby(key, 'total', event.quantity || 1)
          .hincrby(dayKey, 'count', event.quantity || 1)
          .expire(dayKey, 86400 * 7) // Keep daily data for 7 days
          .exec();
      } catch (error) {
        console.error('Failed to track usage in Redis:', error);
      }
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      // Batch insert usage events
      await prisma.usage_events.createMany({
        data: events.map(event => ({
          license_key: event.licenseKey,
          product_id: event.productId,
          event_type: event.eventType,
          quantity: event.quantity || 1,
          metadata: event.metadata || {},
          created_at: event.timestamp || new Date()
        }))
      });

      // Update aggregated metrics
      for (const event of events) {
        await this.updateAggregatedMetrics(event);
      }
    } catch (error) {
      console.error('Failed to flush usage events:', error);
      // Re-add events to buffer for retry
      this.buffer.unshift(...events);
    }
  }

  private async updateAggregatedMetrics(event: UsageEvent): Promise<void> {
    const period = this.getCurrentBillingPeriod(event.licenseKey);
    
    await prisma.usage_metrics.upsert({
      where: {
        license_key_product_id_period_start: {
          license_key: event.licenseKey,
          product_id: event.productId,
          period_start: period.start
        }
      },
      update: {
        [event.eventType]: {
          increment: event.quantity || 1
        },
        updated_at: new Date()
      },
      create: {
        license_key: event.licenseKey,
        product_id: event.productId,
        period_start: period.start,
        period_end: period.end,
        [event.eventType]: event.quantity || 1
      }
    });
  }

  private getCurrentBillingPeriod(licenseKey: string): BillingPeriod {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return { start, end, licenseKey };
  }

  async checkLimit(
    licenseKey: string,
    productId: string,
    metric: string,
    plan: string
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const limits = this.getPlanLimits(plan);
    const limit = limits[productId]?.[metric] || Infinity;

    if (limit === Infinity) {
      return { allowed: true, current: 0, limit, remaining: Infinity };
    }

    // Get current usage from Redis for real-time check
    let current = 0;
    
    if (this.redis) {
      try {
        const key = `usage:${licenseKey}:${productId}:${metric}`;
        const dayKey = `${key}:${new Date().toISOString().split('T')[0]}`;
        const usage = await this.redis.hget(dayKey, 'count');
        current = parseInt(usage || '0', 10);
      } catch (error) {
        // Fallback to database
        const period = this.getCurrentBillingPeriod(licenseKey);
        const metrics = await prisma.usage_metrics.findFirst({
          where: {
            license_key: licenseKey,
            product_id: productId,
            period_start: period.start
          }
        });
        current = metrics?.[metric] || 0;
      }
    }

    const remaining = Math.max(0, limit - current);
    const allowed = remaining > 0;

    return { allowed, current, limit, remaining };
  }

  private getPlanLimits(plan: string): UsageLimits {
    const limits: Record<string, UsageLimits> = {
      starter: {
        chatbot: {
          messages: 1000,
          sessions: 100,
          training_docs: 10
        },
        'sales-agent': {
          emails: 500,
          leads: 100,
          campaigns: 5
        },
        enrichment: {
          lookups: 500,
          api_calls: 1000
        }
      },
      professional: {
        chatbot: {
          messages: 10000,
          sessions: 1000,
          training_docs: 100
        },
        'sales-agent': {
          emails: 5000,
          leads: 1000,
          campaigns: 50
        },
        enrichment: {
          lookups: 5000,
          api_calls: 10000
        }
      },
      enterprise: {
        chatbot: {
          messages: Infinity,
          sessions: Infinity,
          training_docs: Infinity
        },
        'sales-agent': {
          emails: Infinity,
          leads: Infinity,
          campaigns: Infinity
        },
        enrichment: {
          lookups: 50000,
          api_calls: 100000
        }
      }
    };

    return limits[plan] || limits.starter;
  }

  async getUsageReport(
    licenseKey: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const start = startDate || new Date(new Date().setDate(1));
    const end = endDate || new Date();

    const [events, metrics, limits] = await Promise.all([
      // Get raw events
      prisma.usage_events.groupBy({
        by: ['product_id', 'event_type'],
        where: {
          license_key: licenseKey,
          created_at: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          quantity: true
        }
      }),

      // Get aggregated metrics
      prisma.usage_metrics.findMany({
        where: {
          license_key: licenseKey,
          period_start: {
            gte: start,
            lte: end
          }
        }
      }),

      // Get license info for limits
      prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        select: { plan: true }
      })
    ]);

    const planLimits = this.getPlanLimits(limits?.plan || 'starter');

    return {
      period: { start, end },
      summary: events.map(e => ({
        product: e.product_id,
        metric: e.event_type,
        total: e._sum.quantity || 0,
        limit: planLimits[e.product_id]?.[e.event_type] || Infinity,
        percentUsed: planLimits[e.product_id]?.[e.event_type] 
          ? ((e._sum.quantity || 0) / planLimits[e.product_id][e.event_type]) * 100
          : 0
      })),
      metrics,
      limits: planLimits
    };
  }

  async calculateBilling(licenseKey: string): Promise<any> {
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { plan: true, products: true }
    });

    if (!license) throw new Error('License not found');

    const period = this.getCurrentBillingPeriod(licenseKey);
    const usage = await this.getUsageReport(licenseKey, period.start, period.end);

    // Base prices
    const basePrices: Record<string, number> = {
      starter: 49,
      professional: 199,
      enterprise: 999
    };

    // Overage rates
    const overageRates: Record<string, Record<string, number>> = {
      chatbot: { messages: 0.01, sessions: 0.10 },
      'sales-agent': { emails: 0.02, leads: 0.50 },
      enrichment: { lookups: 0.01, api_calls: 0.005 }
    };

    let basePrice = basePrices[license.plan || 'starter'];
    let overageCharges = 0;

    // Calculate overages
    for (const item of usage.summary) {
      if (item.limit !== Infinity && item.total > item.limit) {
        const overage = item.total - item.limit;
        const rate = overageRates[item.product]?.[item.metric] || 0;
        overageCharges += overage * rate;
      }
    }

    return {
      period: period,
      plan: license.plan,
      basePrice,
      overageCharges,
      total: basePrice + overageCharges,
      usage: usage.summary,
      breakdown: usage.summary
        .filter(item => item.total > item.limit && item.limit !== Infinity)
        .map(item => ({
          product: item.product,
          metric: item.metric,
          included: item.limit,
          used: item.total,
          overage: item.total - item.limit,
          rate: overageRates[item.product]?.[item.metric] || 0,
          charge: (item.total - item.limit) * (overageRates[item.product]?.[item.metric] || 0)
        }))
    };
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

// Singleton instance
const usageTracker = new UsageTracker();

// Helper functions for common tracking scenarios
export async function trackApiCall(licenseKey: string, endpoint: string, metadata?: any) {
  await usageTracker.track({
    licenseKey,
    productId: 'api',
    eventType: 'api_calls',
    quantity: 1,
    metadata: { endpoint, ...metadata }
  });
}

export async function trackChatbotMessage(licenseKey: string, sessionId: string) {
  await usageTracker.track({
    licenseKey,
    productId: 'chatbot',
    eventType: 'messages',
    quantity: 1,
    metadata: { sessionId }
  });
}

export async function trackEnrichment(licenseKey: string, type: string, count: number = 1) {
  await usageTracker.track({
    licenseKey,
    productId: 'enrichment',
    eventType: 'lookups',
    quantity: count,
    metadata: { type }
  });
}

export async function trackEmailSent(licenseKey: string, campaignId: string, count: number = 1) {
  await usageTracker.track({
    licenseKey,
    productId: 'sales-agent',
    eventType: 'emails',
    quantity: count,
    metadata: { campaignId }
  });
}

export { usageTracker, UsageTracker, UsageEvent, UsageLimits, BillingPeriod };