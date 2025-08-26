/**
 * License-based Redis caching utilities
 * Ensures cache isolation per license key (account boundary)
 */

import { RedisCache } from '@intelagent/redis';

export class LicenseCache {
  private cache: RedisCache;
  private defaultTTL: number;

  constructor(ttl: number = 3600) {
    this.cache = new RedisCache(ttl);
    this.defaultTTL = ttl;
  }

  /**
   * Generate a cache key that includes the license key for isolation
   * Pattern: license:{license_key}:{namespace}:{key}
   */
  private getLicenseKey(licenseKey: string, namespace: string, key: string): string {
    return `license:${licenseKey}:${namespace}:${key}`;
  }

  /**
   * Get cached data for a specific license
   */
  async get<T>(licenseKey: string, namespace: string, key: string): Promise<T | null> {
    const cacheKey = this.getLicenseKey(licenseKey, namespace, key);
    return await this.cache.get<T>(cacheKey);
  }

  /**
   * Set cached data for a specific license
   */
  async set(
    licenseKey: string,
    namespace: string,
    key: string,
    value: any,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.getLicenseKey(licenseKey, namespace, key);
    await this.cache.set(cacheKey, value, ttl || this.defaultTTL);
  }

  /**
   * Delete cached data for a specific license
   */
  async delete(licenseKey: string, namespace: string, key: string): Promise<void> {
    const cacheKey = this.getLicenseKey(licenseKey, namespace, key);
    await this.cache.delete(cacheKey);
  }

  /**
   * Check if cached data exists for a specific license
   */
  async exists(licenseKey: string, namespace: string, key: string): Promise<boolean> {
    const cacheKey = this.getLicenseKey(licenseKey, namespace, key);
    return await this.cache.exists(cacheKey);
  }

  /**
   * Clear all cache for a specific license and namespace
   * WARNING: This is a potentially expensive operation
   */
  async clearNamespace(licenseKey: string, namespace: string): Promise<void> {
    // In a real implementation, you'd use Redis SCAN to find and delete keys
    // For now, we'll just note this as a TODO
    console.warn(`Clear namespace not fully implemented: license:${licenseKey}:${namespace}:*`);
  }

  /**
   * Cache product-specific data
   */
  async cacheProductData(
    licenseKey: string,
    product: 'chatbot' | 'sales-agent' | 'data-enrichment' | 'setup-agent',
    dataType: string,
    data: any,
    ttl?: number
  ): Promise<void> {
    await this.set(licenseKey, `product:${product}`, dataType, data, ttl);
  }

  /**
   * Get cached product-specific data
   */
  async getProductData<T>(
    licenseKey: string,
    product: 'chatbot' | 'sales-agent' | 'data-enrichment' | 'setup-agent',
    dataType: string
  ): Promise<T | null> {
    return await this.get<T>(licenseKey, `product:${product}`, dataType);
  }

  /**
   * Cache chatbot conversations with proper isolation
   */
  async cacheChatbotConversations(
    licenseKey: string,
    siteKey: string,
    conversations: any[],
    ttl: number = 300 // 5 minutes default
  ): Promise<void> {
    // Use both license key and site key for proper isolation
    const cacheKey = `chatbot:conversations:${siteKey}`;
    await this.set(licenseKey, 'chatbot', cacheKey, conversations, ttl);
  }

  /**
   * Get cached chatbot conversations
   */
  async getChatbotConversations(
    licenseKey: string,
    siteKey: string
  ): Promise<any[] | null> {
    const cacheKey = `chatbot:conversations:${siteKey}`;
    return await this.get<any[]>(licenseKey, 'chatbot', cacheKey);
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(
    licenseKey: string,
    sessionId: string,
    sessionData: any,
    ttl: number = 3600 // 1 hour default
  ): Promise<void> {
    await this.set(licenseKey, 'session', sessionId, sessionData, ttl);
  }

  /**
   * Get cached user session
   */
  async getUserSession(licenseKey: string, sessionId: string): Promise<any | null> {
    return await this.get(licenseKey, 'session', sessionId);
  }

  /**
   * Increment a counter for a specific license (e.g., API calls, usage metrics)
   */
  async incrementCounter(
    licenseKey: string,
    counterName: string,
    amount: number = 1
  ): Promise<number> {
    const cacheKey = this.getLicenseKey(licenseKey, 'counter', counterName);
    return await this.cache.increment(cacheKey, amount);
  }

  /**
   * Get counter value
   */
  async getCounter(licenseKey: string, counterName: string): Promise<number> {
    const value = await this.get<number>(licenseKey, 'counter', counterName);
    return value || 0;
  }

  /**
   * Rate limiting per license
   */
  async checkRateLimit(
    licenseKey: string,
    action: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
    const cacheKey = `ratelimit:${action}:${windowStart}`;
    
    const count = await this.incrementCounter(licenseKey, cacheKey, 1);
    
    // Set expiry on first increment
    if (count === 1) {
      const fullKey = this.getLicenseKey(licenseKey, 'counter', cacheKey);
      await this.cache.expire(fullKey, windowSeconds);
    }
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: windowStart + (windowSeconds * 1000)
    };
  }
}

// Export singleton instance
export const licenseCache = new LicenseCache();

// Usage examples:
export const examples = {
  // Cache API response for a license
  async cacheApiResponse(licenseKey: string, endpoint: string, data: any) {
    await licenseCache.set(licenseKey, 'api', endpoint, data, 300); // 5 min cache
  },

  // Get cached API response
  async getCachedApiResponse(licenseKey: string, endpoint: string) {
    return await licenseCache.get(licenseKey, 'api', endpoint);
  },

  // Cache chatbot stats
  async cacheChatbotStats(licenseKey: string, siteKey: string, stats: any) {
    await licenseCache.cacheProductData(
      licenseKey,
      'chatbot',
      `stats:${siteKey}`,
      stats,
      600 // 10 minutes
    );
  },

  // Check API rate limit
  async checkApiLimit(licenseKey: string) {
    const isPro = await licenseCache.get<boolean>(licenseKey, 'license', 'is_pro');
    const limit = isPro ? 10000 : 1000; // Pro gets 10x more requests
    
    return await licenseCache.checkRateLimit(
      licenseKey,
      'api_calls',
      limit,
      3600 // 1 hour window
    );
  }
};