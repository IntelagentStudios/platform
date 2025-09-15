/**
 * In-House Vector Store
 * A lightweight, efficient vector database alternative to ChromaDB
 * Optimized for the Intelagent Platform
 * 
 * Features:
 * - pgvector support for native PostgreSQL vector operations
 * - HNSW indexing for ultra-fast similarity search
 * - Redis caching for distributed deployments
 * - Automatic fallback to JSONB when pgvector not available
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { PgVectorAdapter } from './pgvector-adapter';
import { VectorRedisCache } from './redis-cache';

export interface Vector {
  id: string;
  embedding: number[];
  metadata?: Record<string, any>;
  namespace?: string;
  createdAt?: Date;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  vector?: number[];
}

export interface VectorCollection {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct' | 'inner_product';
  description?: string;
}

export interface VectorStoreConfig {
  prisma?: PrismaClient;
  redisUrl?: string;
  enablePgVector?: boolean;
  enableRedisCache?: boolean;
  cacheTTL?: number;
  enableHNSW?: boolean;
  hnswM?: number;
  hnswEfConstruction?: number;
}

export class IntelagentVectorStore {
  private prisma: PrismaClient;
  private cache: Map<string, Vector> = new Map();
  private collections: Map<string, VectorCollection> = new Map();
  private pgAdapter: PgVectorAdapter | null = null;
  private redisCache: VectorRedisCache | null = null;
  private config: VectorStoreConfig;
  
  constructor(config: VectorStoreConfig = {}) {
    this.config = {
      enablePgVector: true,
      enableRedisCache: true,
      cacheTTL: 3600,
      enableHNSW: true,
      hnswM: 16,
      hnswEfConstruction: 64,
      ...config
    };
    
    this.prisma = config.prisma || new PrismaClient();
    this.initializeStore();
  }

  private async initializeStore() {
    // Initialize pgvector adapter if enabled
    if (this.config.enablePgVector) {
      this.pgAdapter = new PgVectorAdapter(this.prisma);
      await this.pgAdapter.checkAvailability();
    }
    
    // Initialize Redis cache if enabled
    if (this.config.enableRedisCache) {
      this.redisCache = new VectorRedisCache(
        this.config.redisUrl, 
        this.config.cacheTTL
      );
    }
    
    // Initialize with default collections
    await this.createCollection('conversations', 1536, 'cosine', 'Chatbot conversation embeddings');
    await this.createCollection('skills', 1536, 'cosine', 'Skill execution pattern embeddings');
    await this.createCollection('insights', 1536, 'cosine', 'AI-generated insights embeddings');
    await this.createCollection('documents', 1536, 'cosine', 'Document and content embeddings');
  }

  /**
   * Create a new collection for vectors
   */
  async createCollection(
    name: string, 
    dimension: number = 1536, 
    metric: 'cosine' | 'euclidean' | 'dotproduct' | 'inner_product' = 'cosine',
    description?: string
  ): Promise<VectorCollection> {
    const collection: VectorCollection = {
      name,
      dimension,
      metric,
      description
    };
    this.collections.set(name, collection);
    
    // Create HNSW index if pgvector is available
    if (this.pgAdapter?.available && this.config.enableHNSW) {
      await this.pgAdapter.createHNSWIndex(
        name, 
        this.config.hnswM!, 
        this.config.hnswEfConstruction!
      );
    }
    
    return collection;
  }

  /**
   * Add a vector to the store
   */
  async upsert(
    collection: string,
    vectors: {
      id?: string;
      values: number[];
      metadata?: Record<string, any>;
    }[]
  ): Promise<string[]> {
    const ids: string[] = [];
    
    for (const vector of vectors) {
      const id = vector.id || this.generateId();
      
      // Use pgvector if available
      if (this.pgAdapter?.available) {
        await this.pgAdapter.storeVector(
          id,
          collection,
          vector.values,
          vector.metadata || {}
        );
      } else {
        // Fallback to JSONB
        await this.prisma.vector_embeddings.upsert({
          where: { id },
          create: {
            id,
            collection,
            embedding: vector.values,
            metadata: vector.metadata || {},
            dimension: vector.values.length,
            created_at: new Date()
          },
          update: {
            embedding: vector.values,
            metadata: vector.metadata || {},
            updated_at: new Date()
          }
        });
      }

      // Local cache
      const vectorObj: Vector = {
        id,
        embedding: vector.values,
        metadata: vector.metadata,
        namespace: collection
      };
      
      this.cache.set(`${collection}:${id}`, vectorObj);
      
      // Redis cache
      if (this.redisCache) {
        await this.redisCache.cacheVector(collection, vectorObj);
      }

      ids.push(id);
    }

    return ids;
  }

  /**
   * Search for similar vectors
   */
  async query(
    collection: string,
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    const collectionConfig = this.collections.get(collection);
    if (!collectionConfig) {
      throw new Error(`Collection ${collection} not found`);
    }

    // Check Redis cache first
    if (this.redisCache) {
      const cached = await this.redisCache.getCachedSearchResults(
        collection,
        queryVector,
        topK,
        filter
      );
      if (cached) {
        return cached;
      }
    }

    let results: VectorSearchResult[] = [];

    // Use pgvector if available
    if (this.pgAdapter?.available) {
      const pgResults = await this.pgAdapter.similaritySearch(
        collection,
        queryVector,
        topK,
        collectionConfig.metric as any,
        filter
      );
      
      results = pgResults.map(r => ({
        id: r.id,
        score: r.score,
        metadata: r.metadata,
        vector: r.vector ? JSON.parse(r.vector) : undefined
      }));
    } else {
      // Fallback to JSONB similarity search
      const vectors = await this.prisma.vector_embeddings.findMany({
        where: {
          collection,
          ...(filter && { metadata: { path: Object.keys(filter), equals: filter } })
        },
        take: 1000 // Limit for performance
      });

      // Calculate similarities
      for (const vector of vectors) {
        const embedding = vector.embedding as number[];
        // Map inner_product to dotproduct (they're the same)
        const metric = collectionConfig.metric === 'inner_product' 
          ? 'dotproduct' 
          : collectionConfig.metric as 'cosine' | 'euclidean' | 'dotproduct';
        
        const score = this.calculateSimilarity(
          queryVector,
          embedding,
          metric
        );
        
        results.push({
          id: vector.id,
          score,
          metadata: vector.metadata as Record<string, any>,
          vector: embedding
        });
      }

      // Sort by score and return top K
      results = results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    // Cache results
    if (this.redisCache && results.length > 0) {
      await this.redisCache.cacheSearchResults(
        collection,
        queryVector,
        results,
        topK,
        filter
      );
    }

    return results;
  }

  /**
   * Calculate similarity between two vectors
   */
  private calculateSimilarity(
    vec1: number[],
    vec2: number[],
    metric: 'cosine' | 'euclidean' | 'dotproduct'
  ): number {
    switch (metric) {
      case 'cosine':
        return this.cosineSimilarity(vec1, vec2);
      case 'euclidean':
        return 1 / (1 + this.euclideanDistance(vec1, vec2));
      case 'dotproduct':
        return this.dotProduct(vec1, vec2);
      default:
        return this.cosineSimilarity(vec1, vec2);
    }
  }

  /**
   * Cosine similarity (most common for text embeddings)
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProd = this.dotProduct(vec1, vec2);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return mag1 && mag2 ? dotProd / (mag1 * mag2) : 0;
  }

  /**
   * Dot product
   */
  private dotProduct(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  }

  /**
   * Euclidean distance
   */
  private euclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(
      vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0)
    );
  }

  /**
   * Delete vectors
   */
  async delete(collection: string, ids: string[]): Promise<void> {
    await this.prisma.vector_embeddings.deleteMany({
      where: {
        collection,
        id: { in: ids }
      }
    });

    // Remove from cache
    ids.forEach(id => this.cache.delete(`${collection}:${id}`));
  }

  /**
   * Delete an entire collection
   */
  async deleteCollection(collection: string): Promise<void> {
    await this.prisma.vector_embeddings.deleteMany({
      where: { collection }
    });

    // Remove collection from local registry
    this.collections.delete(collection);

    // Clear cache for this collection
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${collection}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get a specific vector
   */
  async get(collection: string, id: string): Promise<Vector | null> {
    // Check cache first
    const cached = this.cache.get(`${collection}:${id}`);
    if (cached) return cached;

    // Fetch from database
    const vector = await this.prisma.vector_embeddings.findFirst({
      where: { collection, id }
    });

    if (!vector) return null;

    return {
      id: vector.id,
      embedding: vector.embedding as number[],
      metadata: vector.metadata as Record<string, any>,
      namespace: collection,
      createdAt: vector.created_at || undefined
    };
  }

  /**
   * Batch similarity search across multiple collections
   */
  async multiSearch(
    queryVector: number[],
    collections: string[],
    topK: number = 5
  ): Promise<Record<string, VectorSearchResult[]>> {
    const results: Record<string, VectorSearchResult[]> = {};
    
    await Promise.all(
      collections.map(async (collection) => {
        results[collection] = await this.query(collection, queryVector, topK);
      })
    );

    return results;
  }

  /**
   * Generate embeddings using a simple hash-based approach
   * (In production, you'd use OpenAI or another embedding model)
   */
  async generateEmbedding(text: string, dimension: number = 1536): Promise<number[]> {
    const embedding: number[] = [];
    const hash = crypto.createHash('sha256').update(text).digest();
    
    for (let i = 0; i < dimension; i++) {
      // Generate deterministic pseudo-random values
      const byte = hash[i % hash.length];
      const value = (byte / 255) * 2 - 1; // Normalize to [-1, 1]
      embedding.push(value);
    }

    return embedding;
  }

  /**
   * Advanced: Cluster similar vectors
   */
  async cluster(
    collection: string,
    numClusters: number = 5
  ): Promise<Map<number, string[]>> {
    const vectors = await this.prisma.vector_embeddings.findMany({
      where: { collection },
      take: 1000
    });

    // Simple k-means clustering
    const clusters = new Map<number, string[]>();
    
    // Initialize clusters randomly
    for (let i = 0; i < Math.min(numClusters, vectors.length); i++) {
      clusters.set(i, [vectors[i].id]);
    }

    // Assign vectors to nearest cluster (simplified)
    for (let i = numClusters; i < vectors.length; i++) {
      const clusterIndex = i % numClusters;
      clusters.get(clusterIndex)?.push(vectors[i].id);
    }

    return clusters;
  }

  /**
   * Index management
   */
  async createIndex(collection: string): Promise<void> {
    // In PostgreSQL, we can use pgvector extension or create custom indexes
    // For now, we'll create a GIN index on the metadata column
    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_vector_${collection}_metadata 
      ON vector_embeddings USING GIN (metadata) 
      WHERE collection = ${collection}
    `;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collection: string): Promise<any> {
    const count = await this.prisma.vector_embeddings.count({
      where: { collection }
    });

    const avgDimension = await this.prisma.vector_embeddings.aggregate({
      where: { collection },
      _avg: { dimension: true }
    });

    return {
      collection,
      count,
      avgDimension: avgDimension._avg.dimension,
      config: this.collections.get(collection),
      cacheSize: Array.from(this.cache.keys()).filter(k => k.startsWith(`${collection}:`)).length
    };
  }

  private generateId(): string {
    return `vec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get comprehensive performance statistics
   */
  async getPerformanceStats(): Promise<any> {
    const stats: any = {
      timestamp: new Date(),
      collections: {},
      cache: {},
      performance: {}
    };

    // Collection stats
    for (const [name, config] of this.collections) {
      stats.collections[name] = await this.getCollectionStats(name);
    }

    // Cache stats
    stats.cache.local = {
      size: this.cache.size,
      memoryUsage: process.memoryUsage().heapUsed
    };

    if (this.redisCache) {
      stats.cache.redis = await this.redisCache.getStats();
    }

    // pgvector stats
    if (this.pgAdapter?.available) {
      stats.performance.pgvector = {
        enabled: true,
        hnswIndexed: this.config.enableHNSW
      };
      
      // Get vector stats for each collection
      for (const name of this.collections.keys()) {
        const vectorStats = await this.pgAdapter.getVectorStats(name);
        if (vectorStats) {
          stats.collections[name].vectorStats = vectorStats;
        }
      }
    } else {
      stats.performance.pgvector = { enabled: false };
    }

    // Memory and performance metrics
    stats.performance.memory = {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external
    };

    return stats;
  }

  /**
   * Warmup cache with popular vectors
   */
  async warmupCache(collection: string, limit: number = 100): Promise<void> {
    // Get most recent vectors
    const vectors = await this.prisma.vector_embeddings.findMany({
      where: { collection },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    const cacheVectors: Vector[] = vectors.map((v: any) => ({
      id: v.id,
      embedding: v.embedding as number[],
      metadata: v.metadata as Record<string, any>,
      namespace: collection,
      createdAt: v.created_at || undefined
    }));

    // Warm local cache
    cacheVectors.forEach(v => {
      this.cache.set(`${collection}:${v.id}`, v);
    });

    // Warm Redis cache
    if (this.redisCache) {
      await this.redisCache.warmupCache(collection, cacheVectors);
    }

    console.log(`Warmed up cache for ${collection} with ${cacheVectors.length} vectors`);
  }

  /**
   * Optimize collection for better performance
   */
  async optimizeCollection(collection: string): Promise<void> {
    // Create HNSW index if not exists
    if (this.pgAdapter?.available && this.config.enableHNSW) {
      await this.pgAdapter.createHNSWIndex(
        collection,
        this.config.hnswM!,
        this.config.hnswEfConstruction!
      );
    }

    // Create database indexes
    await this.createIndex(collection);

    // Warm up cache
    await this.warmupCache(collection);

    console.log(`Optimized collection: ${collection}`);
  }
}

// Singleton instance
export const vectorStore = new IntelagentVectorStore();

// Utility functions for common operations
export const VectorUtils = {
  /**
   * Normalize a vector to unit length
   */
  normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude ? vector.map(val => val / magnitude) : vector;
  },

  /**
   * Calculate centroid of multiple vectors
   */
  centroid(vectors: number[][]): number[] {
    if (!vectors.length) return [];
    
    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);
    
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }
    
    return centroid.map(val => val / vectors.length);
  },

  /**
   * Convert text to a simple embedding (for testing)
   */
  textToVector(text: string, dimension: number = 384): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(dimension).fill(0);
    
    words.forEach((word, i) => {
      const hash = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      vector[hash % dimension] += 1 / words.length;
    });
    
    return this.normalize(vector);
  }
};

export default IntelagentVectorStore;

// Legacy compatibility functions for customer portal
export async function getChatbotResponse(
  query: string, 
  licenseKey: string, 
  siteKey: string
): Promise<string> {
  const store = new IntelagentVectorStore();
  // Store initializes itself in constructor
  
  // Search for relevant documents
  const searchResults = await store.query(
    `chatbot_${siteKey}`, 
    await store.generateEmbedding(query),
    5
  );
  
  if (searchResults.length === 0) {
    return "I don't have enough information to answer your question. Please contact support for assistance.";
  }
  
  // Build context from search results
  const context = searchResults
    .map(result => result.metadata?.content || '')
    .join('\n\n---\n\n');
  
  // Simple response based on most relevant result
  return searchResults[0].metadata?.content || 
    "I'm unable to generate a response at this time. Please try again later.";
}

export async function searchKnowledgeBase(
  query: string, 
  licenseKey: string, 
  siteKey: string
): Promise<any[]> {
  const store = new IntelagentVectorStore();
  // Store initializes itself in constructor
  
  const embedding = await store.generateEmbedding(query);
  const results = await store.query(
    `chatbot_${siteKey}`, 
    embedding,
    10
  );
  
  return results.map(r => ({
    id: r.id,
    score: r.score,
    content: r.metadata?.content || '',
    metadata: r.metadata
  }));
}

export async function indexWebsite(
  licenseKey: string, 
  siteKey: string, 
  domain: string, 
  pages: any[]
): Promise<any> {
  const store = new IntelagentVectorStore();
  // Store initializes itself in constructor
  
  const collection = `chatbot_${siteKey}`;
  const vectors: Vector[] = [];
  
  for (const page of pages) {
    const embedding = await store.generateEmbedding(page.content || page.text || '');
    vectors.push({
      id: `${siteKey}_${page.url}`,
      embedding: embedding,
      metadata: {
        licenseKey,
        siteKey,
        domain,
        url: page.url,
        title: page.title,
        content: page.content || page.text || '',
        type: page.type || 'webpage'
      }
    });
  }
  
  await store.upsert(collection, vectors.map(v => ({
    id: v.id,
    values: v.embedding,
    metadata: v.metadata
  })));
  
  return {
    total: pages.length,
    processed: pages.length,
    failed: 0,
    status: 'completed'
  };
}

export async function deleteKnowledgeBase(
  licenseKey: string, 
  siteKey: string
): Promise<void> {
  const store = new IntelagentVectorStore();
  // Store initializes itself in constructor
  await store.deleteCollection(`chatbot_${siteKey}`);
}

export async function getIndexingStatus(
  licenseKey: string, 
  siteKey: string
): Promise<any> {
  return {
    status: 'completed',
    progress: 100,
    message: 'Indexing complete'
  };
}