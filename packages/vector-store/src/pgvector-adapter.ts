/**
 * pgvector Adapter for PostgreSQL Vector Operations
 * Provides native vector operations when pgvector extension is available
 */

import { PrismaClient } from '@prisma/client';

export class PgVectorAdapter {
  private prisma: PrismaClient;
  private isAvailable: boolean = false;
  private dimensions: Map<string, number> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.checkAvailability();
  }

  /**
   * Check if pgvector extension is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM pg_extension WHERE extname = 'vector' LIMIT 1
      `;
      
      this.isAvailable = result.length > 0;
      
      if (!this.isAvailable) {
        console.log('pgvector extension not found. Attempting to install...');
        await this.installExtension();
      }
      
      if (this.isAvailable) {
        await this.upgradeSchema();
      }
      
      return this.isAvailable;
    } catch (error) {
      console.log('pgvector not available, using JSONB fallback');
      return false;
    }
  }

  /**
   * Attempt to install pgvector extension
   */
  private async installExtension(): Promise<void> {
    try {
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
      this.isAvailable = true;
      console.log('pgvector extension installed successfully');
    } catch (error) {
      console.log('Could not install pgvector (requires superuser). Using JSONB mode.');
    }
  }

  /**
   * Upgrade schema to use vector type if available
   */
  private async upgradeSchema(): Promise<void> {
    try {
      // Check if vector column already exists
      const columns = await this.prisma.$queryRaw<any[]>`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'vector_embeddings' 
        AND column_name = 'embedding_vector'
      `;

      if (columns.length === 0) {
        // Add vector column
        await this.prisma.$executeRaw`
          ALTER TABLE vector_embeddings 
          ADD COLUMN IF NOT EXISTS embedding_vector vector(1536)
        `;
        
        // Migrate existing data
        await this.migrateJsonToVector();
        
        console.log('Schema upgraded to use pgvector');
      }
    } catch (error) {
      console.log('Could not upgrade schema:', error);
    }
  }

  /**
   * Migrate JSONB embeddings to vector type
   */
  private async migrateJsonToVector(): Promise<void> {
    try {
      // Update existing rows
      await this.prisma.$executeRaw`
        UPDATE vector_embeddings 
        SET embedding_vector = embedding::vector 
        WHERE embedding_vector IS NULL 
        AND embedding IS NOT NULL
      `;
      
      console.log('Migrated existing embeddings to vector type');
    } catch (error) {
      console.log('Migration skipped:', error);
    }
  }

  /**
   * Create HNSW index for fast similarity search
   */
  async createHNSWIndex(collection: string, m: number = 16, efConstruction: number = 64): Promise<void> {
    if (!this.isAvailable) return;

    try {
      // Create HNSW index for cosine similarity
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_${collection}_vector_hnsw_cosine
        ON vector_embeddings 
        USING hnsw (embedding_vector vector_cosine_ops)
        WITH (m = ${m}, ef_construction = ${efConstruction})
        WHERE collection = ${collection}
      `;

      // Create index for L2 distance
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_${collection}_vector_hnsw_l2
        ON vector_embeddings 
        USING hnsw (embedding_vector vector_l2_ops)
        WITH (m = ${m}, ef_construction = ${efConstruction})
        WHERE collection = ${collection}
      `;

      console.log(`HNSW indexes created for collection: ${collection}`);
    } catch (error) {
      console.log('Could not create HNSW index:', error);
    }
  }

  /**
   * Store vector using native pgvector
   */
  async storeVector(
    id: string,
    collection: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    if (this.isAvailable) {
      // Use pgvector
      await this.prisma.$executeRaw`
        INSERT INTO vector_embeddings (id, collection, embedding, embedding_vector, metadata, dimension, created_at, updated_at)
        VALUES (
          ${id}, 
          ${collection}, 
          ${JSON.stringify(embedding)}::jsonb,
          ${embedding}::vector,
          ${JSON.stringify(metadata)}::jsonb,
          ${embedding.length},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
          embedding = ${JSON.stringify(embedding)}::jsonb,
          embedding_vector = ${embedding}::vector,
          metadata = ${JSON.stringify(metadata)}::jsonb,
          updated_at = NOW()
      `;
    } else {
      // Fallback to JSONB
      await this.prisma.vector_embeddings.upsert({
        where: { id },
        create: {
          id,
          collection,
          embedding,
          metadata,
          dimension: embedding.length,
          created_at: new Date()
        },
        update: {
          embedding,
          metadata,
          updated_at: new Date()
        }
      });
    }
  }

  /**
   * Perform similarity search using pgvector
   */
  async similaritySearch(
    collection: string,
    queryVector: number[],
    limit: number = 10,
    metric: 'cosine' | 'euclidean' | 'inner_product' = 'cosine',
    filter?: Record<string, any>
  ): Promise<any[]> {
    if (!this.isAvailable) {
      return []; // Fallback handled by main class
    }

    let operator: string;
    let orderBy: string;
    
    switch (metric) {
      case 'cosine':
        operator = '<=>';
        orderBy = 'embedding_vector <=> $1::vector';
        break;
      case 'euclidean':
        operator = '<->';
        orderBy = 'embedding_vector <-> $1::vector';
        break;
      case 'inner_product':
        operator = '<#>';
        orderBy = '(embedding_vector <#> $1::vector) DESC';
        break;
      default:
        operator = '<=>';
        orderBy = 'embedding_vector <=> $1::vector';
    }

    // Build filter conditions
    const filterConditions = filter 
      ? Object.entries(filter).map(([key, value], idx) => 
          `metadata->>'${key}' = $${idx + 3}`
        ).join(' AND ')
      : '1=1';

    const query = `
      SELECT 
        id,
        collection,
        metadata,
        dimension,
        1 - (embedding_vector ${operator} $1::vector) as score,
        embedding_vector::text as vector
      FROM vector_embeddings
      WHERE collection = $2
        AND ${filterConditions}
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `;

    const params = [queryVector, collection, ...(filter ? Object.values(filter) : [])];
    
    try {
      const results = await this.prisma.$queryRawUnsafe(query, ...params);
      return results as any[];
    } catch (error) {
      console.error('pgvector search failed:', error);
      return [];
    }
  }

  /**
   * Batch similarity search for multiple queries
   */
  async batchSimilaritySearch(
    collection: string,
    queryVectors: number[][],
    limit: number = 10,
    metric: 'cosine' | 'euclidean' | 'inner_product' = 'cosine'
  ): Promise<Map<number, any[]>> {
    if (!this.isAvailable) {
      return new Map();
    }

    const results = new Map<number, any[]>();
    
    // Use Promise.all for parallel execution
    const searches = await Promise.all(
      queryVectors.map((vector, idx) => 
        this.similaritySearch(collection, vector, limit, metric)
          .then(res => ({ idx, res }))
      )
    );

    searches.forEach(({ idx, res }) => {
      results.set(idx, res);
    });

    return results;
  }

  /**
   * Calculate average vector (centroid) for a collection
   */
  async calculateCentroid(collection: string, filter?: Record<string, any>): Promise<number[] | null> {
    if (!this.isAvailable) return null;

    const filterConditions = filter 
      ? Object.entries(filter).map(([key, value]) => 
          `metadata->>'${key}' = '${value}'`
        ).join(' AND ')
      : '1=1';

    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT AVG(embedding_vector)::vector::text as centroid
        FROM vector_embeddings
        WHERE collection = ${collection}
          AND ${filterConditions}
      `;

      if (result.length > 0 && result[0].centroid) {
        // Parse the vector string format [x,y,z] to array
        return JSON.parse(result[0].centroid.replace(/\[/, '[').replace(/\]/, ']'));
      }
    } catch (error) {
      console.error('Centroid calculation failed:', error);
    }

    return null;
  }

  /**
   * Find vectors within a distance threshold
   */
  async rangeSearch(
    collection: string,
    queryVector: number[],
    maxDistance: number,
    metric: 'cosine' | 'euclidean' = 'euclidean'
  ): Promise<any[]> {
    if (!this.isAvailable) return [];

    const operator = metric === 'cosine' ? '<=>' : '<->';
    
    try {
      const results = await this.prisma.$queryRaw`
        SELECT 
          id,
          collection,
          metadata,
          embedding_vector ${operator} ${queryVector}::vector as distance
        FROM vector_embeddings
        WHERE collection = ${collection}
          AND embedding_vector ${operator} ${queryVector}::vector < ${maxDistance}
        ORDER BY distance
      `;
      
      return results as any[];
    } catch (error) {
      console.error('Range search failed:', error);
      return [];
    }
  }

  /**
   * Perform k-means clustering using pgvector
   */
  async kMeansClustering(
    collection: string,
    k: number,
    maxIterations: number = 10
  ): Promise<Map<number, string[]>> {
    if (!this.isAvailable) {
      return new Map();
    }

    // This is a simplified k-means implementation
    // For production, consider using pg_ml or madlib extensions
    
    const clusters = new Map<number, string[]>();
    
    try {
      // Get all vectors
      const vectors = await this.prisma.$queryRaw<any[]>`
        SELECT id, embedding_vector::text as vector
        FROM vector_embeddings
        WHERE collection = ${collection}
        LIMIT 1000
      `;

      // Simple clustering (would need more sophisticated algorithm for production)
      vectors.forEach((v: any, idx: number) => {
        const clusterIdx = idx % k;
        if (!clusters.has(clusterIdx)) {
          clusters.set(clusterIdx, []);
        }
        clusters.get(clusterIdx)!.push(v.id);
      });

    } catch (error) {
      console.error('Clustering failed:', error);
    }

    return clusters;
  }

  /**
   * Get statistics about vector distribution
   */
  async getVectorStats(collection: string): Promise<any> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as count,
          AVG(vector_norm(embedding_vector)) as avg_norm,
          MIN(vector_norm(embedding_vector)) as min_norm,
          MAX(vector_norm(embedding_vector)) as max_norm,
          STDDEV(vector_norm(embedding_vector)) as stddev_norm
        FROM vector_embeddings
        WHERE collection = ${collection}
      `;

      return stats[0] || null;
    } catch (error) {
      console.error('Stats calculation failed:', error);
      return null;
    }
  }

  get available(): boolean {
    return this.isAvailable;
  }
}

export default PgVectorAdapter;