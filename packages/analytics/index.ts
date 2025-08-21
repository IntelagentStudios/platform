/**
 * Analytics and Usage Tracking Module
 * Tracks product usage, user behavior, and system metrics
 */

import { prisma } from '@intelagent/database';
import { RedisManager } from '@intelagent/redis';

interface TrackingEvent {
  licenseKey: string;
  userId?: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

interface UsageMetrics {
  product: string;
  licenseKey: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metrics: {
    requests?: number;
    uniqueUsers?: number;
    activeTime?: number;
    errors?: number;
    [key: string]: any;
  };
}

interface ProductAnalytics {
  product: string;
  period: { start: Date; end: Date };
  summary: {
    totalRequests: number;
    uniqueUsers: number;
    avgResponseTime: number;
    errorRate: number;
    topFeatures: Array<{ feature: string; count: number }>;
    userEngagement: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
}

class AnalyticsService {
  private cache: any = null;
  private queue: TrackingEvent[] = [];
  private processing = false;
  
  constructor() {
    this.initializeCache();
    this.startProcessor();
  }
  
  private initializeCache() {
    try {
      this.cache = RedisManager.getClient('cache');
    } catch (error) {
      console.warn('Analytics cache not available');
      this.cache = new Map();
    }
  }
  
  private startProcessor() {
    // Process queued events every 10 seconds
    setInterval(() => {
      this.processQueue();
    }, 10000);
  }
  
  /**
   * Track a user event
   */
  async track(event: TrackingEvent): Promise<void> {
    // Add to queue for batch processing
    this.queue.push({
      ...event,
      timestamp: event.timestamp || new Date()
    });
    
    // Real-time metrics update
    await this.updateRealTimeMetrics(event);
    
    // Process immediately if queue is large
    if (this.queue.length >= 100) {
      this.processQueue();
    }
  }
  
  /**
   * Track product usage
   */
  async trackUsage(
    product: string,
    licenseKey: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      licenseKey,
      event: `${product}.${action}`,
      properties: {
        product,
        action,
        ...metadata
      }
    });
    
    // Update usage counters
    await this.incrementUsageCounter(product, licenseKey);
  }
  
  /**
   * Track API calls
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    licenseKey: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    await this.track({
      licenseKey,
      event: 'api.call',
      properties: {
        endpoint,
        method,
        responseTime,
        statusCode,
        success: statusCode < 400
      }
    });
    
    // Update API metrics
    await this.updateApiMetrics(endpoint, responseTime, statusCode);
  }
  
  /**
   * Track errors
   */
  async trackError(
    error: Error,
    context: {
      product?: string;
      licenseKey?: string;
      userId?: string;
      action?: string;
    }
  ): Promise<void> {
    await this.track({
      licenseKey: context.licenseKey || 'system',
      event: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        product: context.product,
        action: context.action,
        userId: context.userId
      }
    });
  }
  
  /**
   * Track conversion events
   */
  async trackConversion(
    type: 'signup' | 'activation' | 'upgrade' | 'churn',
    licenseKey: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      licenseKey,
      event: `conversion.${type}`,
      properties: {
        type,
        ...metadata
      }
    });
    
    // Update conversion funnel
    await this.updateConversionFunnel(type, licenseKey);
  }
  
  /**
   * Get product analytics
   */
  async getProductAnalytics(
    product: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProductAnalytics> {
    // Check cache first
    const cacheKey = `analytics:${product}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    // Query database
    const events = await prisma.events.findMany({
      where: {
        event_type: {
          startsWith: product
        },
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Calculate metrics
    const analytics: ProductAnalytics = {
      product,
      period: { start: startDate, end: endDate },
      summary: {
        totalRequests: events.length,
        uniqueUsers: new Set(events.map(e => e.license_key)).size,
        avgResponseTime: this.calculateAvgResponseTime(events),
        errorRate: this.calculateErrorRate(events),
        topFeatures: this.getTopFeatures(events),
        userEngagement: await this.calculateEngagement(product, startDate, endDate)
      }
    };
    
    // Cache results
    await this.saveToCache(cacheKey, analytics, 3600); // 1 hour
    
    return analytics;
  }
  
  /**
   * Get usage metrics for a license
   */
  async getUsageMetrics(
    licenseKey: string,
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<UsageMetrics[]> {
    const startDate = this.getStartDate(period);
    
    const usage = await prisma.usage_metrics.findMany({
      where: {
        license_key: licenseKey,
        created_at: {
          gte: startDate
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return usage.map(u => ({
      product: u.product,
      licenseKey: u.license_key,
      period: 'daily',
      metrics: u.metrics as any
    }));
  }
  
  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(licenseKey: string): Promise<any> {
    const metrics = {
      today: await this.getTodayMetrics(licenseKey),
      week: await this.getWeekMetrics(licenseKey),
      month: await this.getMonthMetrics(licenseKey),
      products: await this.getProductMetrics(licenseKey)
    };
    
    return metrics;
  }
  
  // Private helper methods
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, 100);
    
    try {
      // Store events in database
      await prisma.events.createMany({
        data: batch.map(event => ({
          license_key: event.licenseKey,
          user_id: event.userId,
          event_type: event.event,
          event_data: event.properties || {},
          session_id: event.sessionId,
          ip_address: event.ip,
          user_agent: event.userAgent,
          created_at: event.timestamp || new Date()
        }))
      });
      
      // Update aggregated metrics
      for (const event of batch) {
        await this.updateAggregatedMetrics(event);
      }
    } catch (error) {
      console.error('Failed to process analytics batch:', error);
      // Re-queue failed events
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;
    }
  }
  
  private async updateRealTimeMetrics(event: TrackingEvent): Promise<void> {
    const key = `realtime:${event.licenseKey}:${new Date().toISOString().slice(0, 10)}`;
    
    if (this.cache instanceof Map) {
      const current = this.cache.get(key) || { events: 0, users: new Set() };
      current.events++;
      if (event.userId) current.users.add(event.userId);
      this.cache.set(key, current);
    } else if (this.cache) {
      await this.cache.hincrby(key, 'events', 1);
      if (event.userId) {
        await this.cache.sadd(`${key}:users`, event.userId);
      }
      await this.cache.expire(key, 86400); // 24 hours
    }
  }
  
  private async incrementUsageCounter(product: string, licenseKey: string): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    const key = `usage:${product}:${licenseKey}:${date}`;
    
    if (this.cache instanceof Map) {
      const current = this.cache.get(key) || 0;
      this.cache.set(key, current + 1);
    } else if (this.cache) {
      await this.cache.incr(key);
      await this.cache.expire(key, 86400 * 7); // 7 days
    }
  }
  
  private async updateApiMetrics(endpoint: string, responseTime: number, statusCode: number): Promise<void> {
    const hour = new Date().toISOString().slice(0, 13);
    const key = `api:${endpoint}:${hour}`;
    
    if (this.cache instanceof Map) {
      const current = this.cache.get(key) || { count: 0, totalTime: 0, errors: 0 };
      current.count++;
      current.totalTime += responseTime;
      if (statusCode >= 400) current.errors++;
      this.cache.set(key, current);
    } else if (this.cache) {
      await this.cache.hincrby(key, 'count', 1);
      await this.cache.hincrbyfloat(key, 'totalTime', responseTime);
      if (statusCode >= 400) {
        await this.cache.hincrby(key, 'errors', 1);
      }
      await this.cache.expire(key, 3600 * 24); // 24 hours
    }
  }
  
  private async updateConversionFunnel(type: string, licenseKey: string): Promise<void> {
    await prisma.conversion_events.create({
      data: {
        license_key: licenseKey,
        event_type: type,
        created_at: new Date()
      }
    });
  }
  
  private async updateAggregatedMetrics(event: TrackingEvent): Promise<void> {
    const hour = new Date().toISOString().slice(0, 13);
    
    await prisma.usage_metrics.upsert({
      where: {
        license_key_product_hour: {
          license_key: event.licenseKey,
          product: event.properties?.product || 'general',
          hour
        }
      },
      create: {
        license_key: event.licenseKey,
        product: event.properties?.product || 'general',
        hour,
        metrics: {
          events: 1,
          users: event.userId ? [event.userId] : []
        }
      },
      update: {
        metrics: {
          increment: { events: 1 },
          users: event.userId ? { push: event.userId } : undefined
        }
      }
    });
  }
  
  private calculateAvgResponseTime(events: any[]): number {
    const apiEvents = events.filter(e => e.event_data?.responseTime);
    if (apiEvents.length === 0) return 0;
    
    const total = apiEvents.reduce((sum, e) => sum + e.event_data.responseTime, 0);
    return total / apiEvents.length;
  }
  
  private calculateErrorRate(events: any[]): number {
    const apiEvents = events.filter(e => e.event_type === 'api.call');
    if (apiEvents.length === 0) return 0;
    
    const errors = apiEvents.filter(e => e.event_data?.statusCode >= 400);
    return (errors.length / apiEvents.length) * 100;
  }
  
  private getTopFeatures(events: any[]): Array<{ feature: string; count: number }> {
    const features: Record<string, number> = {};
    
    for (const event of events) {
      const feature = event.event_data?.action || event.event_type;
      features[feature] = (features[feature] || 0) + 1;
    }
    
    return Object.entries(features)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));
  }
  
  private async calculateEngagement(product: string, startDate: Date, endDate: Date): Promise<any> {
    const daily = await this.getActiveUsers(product, startDate, endDate, 'day');
    const weekly = await this.getActiveUsers(product, startDate, endDate, 'week');
    const monthly = await this.getActiveUsers(product, startDate, endDate, 'month');
    
    return { daily, weekly, monthly };
  }
  
  private async getActiveUsers(product: string, startDate: Date, endDate: Date, period: string): Promise<number> {
    const result = await prisma.events.groupBy({
      by: ['license_key'],
      where: {
        event_type: {
          startsWith: product
        },
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        license_key: true
      }
    });
    
    return result.length;
  }
  
  private async getTodayMetrics(licenseKey: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await prisma.events.count({
      where: {
        license_key: licenseKey,
        created_at: {
          gte: today
        }
      }
    });
    
    return {
      events,
      timestamp: new Date()
    };
  }
  
  private async getWeekMetrics(licenseKey: string): Promise<any> {
    const week = new Date();
    week.setDate(week.getDate() - 7);
    
    const events = await prisma.events.groupBy({
      by: ['event_type'],
      where: {
        license_key: licenseKey,
        created_at: {
          gte: week
        }
      },
      _count: {
        event_type: true
      }
    });
    
    return events;
  }
  
  private async getMonthMetrics(licenseKey: string): Promise<any> {
    const month = new Date();
    month.setMonth(month.getMonth() - 1);
    
    const daily = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM events
      WHERE license_key = ${licenseKey}
        AND created_at >= ${month}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    return daily;
  }
  
  private async getProductMetrics(licenseKey: string): Promise<any> {
    const products = await prisma.product_setups.findMany({
      where: {
        user_id: licenseKey
      }
    });
    
    const metrics = [];
    for (const product of products) {
      const usage = await this.getUsageMetrics(licenseKey, 'week');
      metrics.push({
        product: product.product,
        status: product.status,
        usage: usage.find(u => u.product === product.product)
      });
    }
    
    return metrics;
  }
  
  private getStartDate(period: string): Date {
    const date = new Date();
    switch (period) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date;
  }
  
  private async getFromCache(key: string): Promise<any> {
    try {
      if (this.cache instanceof Map) {
        return this.cache.get(key);
      } else if (this.cache) {
        const cached = await this.cache.get(key);
        return cached ? JSON.parse(cached) : null;
      }
    } catch {
      return null;
    }
  }
  
  private async saveToCache(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      if (this.cache instanceof Map) {
        this.cache.set(key, data);
      } else if (this.cache) {
        await this.cache.set(key, JSON.stringify(data), 'EX', ttl);
      }
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

// Public API
export const analytics = {
  track: (event: TrackingEvent) => analyticsService.track(event),
  trackUsage: (product: string, licenseKey: string, action: string, metadata?: any) => 
    analyticsService.trackUsage(product, licenseKey, action, metadata),
  trackApiCall: (endpoint: string, method: string, licenseKey: string, responseTime: number, statusCode: number) =>
    analyticsService.trackApiCall(endpoint, method, licenseKey, responseTime, statusCode),
  trackError: (error: Error, context: any) => analyticsService.trackError(error, context),
  trackConversion: (type: any, licenseKey: string, metadata?: any) =>
    analyticsService.trackConversion(type, licenseKey, metadata),
  getProductAnalytics: (product: string, startDate: Date, endDate: Date) =>
    analyticsService.getProductAnalytics(product, startDate, endDate),
  getUsageMetrics: (licenseKey: string, period?: any) =>
    analyticsService.getUsageMetrics(licenseKey, period),
  getDashboardMetrics: (licenseKey: string) =>
    analyticsService.getDashboardMetrics(licenseKey)
};

export { AnalyticsService, TrackingEvent, UsageMetrics, ProductAnalytics };