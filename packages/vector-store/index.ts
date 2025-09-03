/**
 * Vector Store Package
 * Re-exports the new in-house vector database implementation
 */

export * from './src/index';
export { default } from './src/index';

// Re-export specific classes for backward compatibility
export { IntelagentVectorStore as VectorStoreService } from './src/index';
export { VectorRedisCache } from './src/redis-cache';
export { PgVectorAdapter } from './src/pgvector-adapter';