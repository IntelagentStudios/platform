/**
 * Redis Cache Layer for Vector Store
 * Provides distributed caching for multi-server deployments
 */

import Redis from 'ioredis';
import { Vector, VectorSearchResult } from './index';

export class VectorRedisCache {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private ttl: number = 3600; // 1 hour default TTL
  private compressionThreshold: number = 1024; // Compress vectors larger than 1KB

  constructor(redisUrl?: string, ttl?: number) {
    if (redisUrl || process.env.REDIS_URL) {
      this.initializeRedis(redisUrl || process.env.REDIS_URL!);
    }
    if (ttl) {
      this.ttl = ttl;
    }
  }

  private initializeRedis(url: string): void {
    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        this.enabled = true;
        console.log('Redis cache connected for vector store');
      });

      this.redis.on('error', (err) => {
        console.error('Redis cache error:', err);
        this.enabled = false;
      });

      // Test connection
      this.redis.ping().catch(() => {
        console.log('Redis not available, running without distributed cache');
        this.enabled = false;
      });
    } catch (error) {
      console.log('Redis initialization failed, running without cache');
      this.enabled = false;
    }
  }

  /**
   * Generate cache key for vectors
   */
  private getCacheKey(collection: string, id: string): string {
    return `vec:${collection}:${id}`;
  }

  /**
   * Generate cache key for search results
   */
  private getSearchCacheKey(
    collection: string, 
    queryHash: string, 
    limit: number,
    filter?: Record<string, any>
  ): string {
    const filterHash = filter ? this.hashObject(filter) : 'nofilter';
    return `search:${collection}:${queryHash}:${limit}:${filterHash}`;
  }

  /**
   * Cache a vector
   */
  async cacheVector(collection: string, vector: Vector): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      const key = this.getCacheKey(collection, vector.id);
      const data = this.compress(vector);
      
      await this.redis.setex(key, this.ttl, data);
      
      // Also cache in a collection set for batch operations
      await this.redis.sadd(`collection:${collection}`, vector.id);
      await this.redis.expire(`collection:${collection}`, this.ttl);
    } catch (error) {
      // Fail silently, cache is optional
    }
  }

  /**
   * Get cached vector
   */
  async getCachedVector(collection: string, id: string): Promise<Vector | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const key = this.getCacheKey(collection, id);
      const data = await this.redis.get(key);
      
      if (data) {
        return this.decompress(data);
      }
    } catch (error) {
      // Fail silently
    }

    return null;
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    collection: string,
    queryVector: number[],
    results: VectorSearchResult[],
    limit: number,
    filter?: Record<string, any>
  ): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      const queryHash = this.hashVector(queryVector);
      const key = this.getSearchCacheKey(collection, queryHash, limit, filter);
      const data = JSON.stringify(results);
      
      // Cache for shorter time as search results change more frequently
      await this.redis.setex(key, Math.floor(this.ttl / 4), data);
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    collection: string,
    queryVector: number[],
    limit: number,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[] | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const queryHash = this.hashVector(queryVector);
      const key = this.getSearchCacheKey(collection, queryHash, limit, filter);
      const data = await this.redis.get(key);
      
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      // Fail silently
    }

    return null;
  }

  /**
   * Batch get vectors from cache
   */
  async batchGetVectors(collection: string, ids: string[]): Promise<Map<string, Vector>> {
    const results = new Map<string, Vector>();
    
    if (!this.enabled || !this.redis) return results;

    try {
      const keys = ids.map(id => this.getCacheKey(collection, id));
      const values = await this.redis.mget(...keys);
      
      values.forEach((value, idx) => {
        if (value) {
          const vector = this.decompress(value);
          results.set(ids[idx], vector);
        }
      });
    } catch (error) {
      // Fail silently
    }

    return results;
  }

  /**
   * Invalidate cache for a collection
   */
  async invalidateCollection(collection: string): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      // Get all vector IDs in collection
      const ids = await this.redis.smembers(`collection:${collection}`);
      
      if (ids.length > 0) {
        // Delete all vectors
        const keys = ids.map(id => this.getCacheKey(collection, id));
        await this.redis.del(...keys);
      }
      
      // Delete collection set
      await this.redis.del(`collection:${collection}`);
      
      // Delete search results for this collection
      const searchKeys = await this.redis.keys(`search:${collection}:*`);
      if (searchKeys.length > 0) {
        await this.redis.del(...searchKeys);
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed vectors
   */
  async warmupCache(
    collection: string,
    vectors: Vector[],
    popular?: string[]
  ): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      // Use pipeline for efficiency
      const pipeline = this.redis.pipeline();
      
      vectors.forEach(vector => {
        const key = this.getCacheKey(collection, vector.id);
        const data = this.compress(vector);
        const ttl = popular?.includes(vector.id) ? this.ttl * 2 : this.ttl;
        
        pipeline.setex(key, ttl, data);
        pipeline.sadd(`collection:${collection}`, vector.id);
      });
      
      pipeline.expire(`collection:${collection}`, this.ttl);
      
      await pipeline.exec();
      
      console.log(`Warmed up cache with ${vectors.length} vectors`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.enabled || !this.redis) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();
      
      // Parse memory info
      const usedMemory = info.match(/used_memory_human:(.+)/)?.[1] || 'unknown';
      const peakMemory = info.match(/used_memory_peak_human:(.+)/)?.[1] || 'unknown';
      
      // Count vector keys
      const vectorKeys = await this.redis.keys('vec:*');
      const searchKeys = await this.redis.keys('search:*');
      
      return {
        enabled: true,
        connected: this.redis.status === 'ready',
        totalKeys: dbSize,
        vectorsCached: vectorKeys.length,
        searchesCached: searchKeys.length,
        memoryUsage: usedMemory,
        peakMemory: peakMemory,
        ttl: this.ttl
      };
    } catch (error) {
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Compress vector data if large
   */
  private compress(vector: Vector): string {
    const json = JSON.stringify(vector);
    
    if (json.length > this.compressionThreshold) {
      // Use base64 encoding for compression (can add zlib for better compression)
      const compressed = Buffer.from(json).toString('base64');
      return `compressed:${compressed}`;
    }
    
    return json;
  }

  /**
   * Decompress vector data
   */
  private decompress(data: string): Vector {
    if (data.startsWith('compressed:')) {
      const compressed = data.substring(11);
      const json = Buffer.from(compressed, 'base64').toString('utf-8');
      return JSON.parse(json);
    }
    
    return JSON.parse(data);
  }

  /**
   * Hash a vector to create cache key
   */
  private hashVector(vector: number[]): string {
    // Take first 10 and last 10 elements for hash
    const sample = [
      ...vector.slice(0, 10),
      ...vector.slice(-10)
    ];
    
    // Simple hash
    const hash = sample.reduce((acc, val) => {
      return ((acc * 31) + val) % 1000000007;
    }, 0);
    
    return hash.toString(36);
  }

  /**
   * Hash an object for cache key
   */
  private hashObject(obj: Record<string, any>): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.enabled = false;
    }
  }
}

export default VectorRedisCache;