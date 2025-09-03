/**
 * Performance Benchmarks for IntelagentVectorStore
 * Compares performance with and without pgvector/Redis optimizations
 */

import { IntelagentVectorStore, VectorStoreConfig } from './index';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  throughput: number;
  config: string;
}

export class VectorStoreBenchmark {
  private results: BenchmarkResult[] = [];
  
  /**
   * Generate random vector of specified dimension
   */
  private generateRandomVector(dimension: number): number[] {
    return Array.from({ length: dimension }, () => Math.random() * 2 - 1);
  }

  /**
   * Generate test data
   */
  private generateTestData(count: number, dimension: number = 1536) {
    return Array.from({ length: count }, (_, i) => ({
      id: `test-${i}`,
      values: this.generateRandomVector(dimension),
      metadata: {
        category: `category-${i % 10}`,
        timestamp: Date.now(),
        index: i,
        description: `Test vector ${i}`
      }
    }));
  }

  /**
   * Measure operation time
   */
  private async measureTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await operation();
    const time = performance.now() - start;
    return { result, time };
  }

  /**
   * Run insertion benchmark
   */
  async benchmarkInsertion(
    store: IntelagentVectorStore,
    collection: string,
    count: number,
    config: string
  ): Promise<void> {
    console.log(`\n📊 Benchmarking insertion (${config})...`);
    
    const testData = this.generateTestData(count);
    const batchSize = 100;
    
    const { time } = await this.measureTime(async () => {
      for (let i = 0; i < testData.length; i += batchSize) {
        const batch = testData.slice(i, Math.min(i + batchSize, testData.length));
        await store.upsert(collection, batch);
        
        if ((i + batchSize) % 1000 === 0) {
          console.log(`  Inserted ${i + batchSize}/${count} vectors`);
        }
      }
    });

    this.results.push({
      operation: 'insertion',
      iterations: count,
      totalTime: time,
      averageTime: time / count,
      throughput: (count / time) * 1000,
      config
    });

    console.log(`  ✓ Inserted ${count} vectors in ${time.toFixed(2)}ms`);
    console.log(`  ✓ Average: ${(time / count).toFixed(3)}ms per vector`);
    console.log(`  ✓ Throughput: ${((count / time) * 1000).toFixed(0)} vectors/sec`);
  }

  /**
   * Run query benchmark
   */
  async benchmarkQuery(
    store: IntelagentVectorStore,
    collection: string,
    queryCount: number,
    topK: number,
    config: string
  ): Promise<void> {
    console.log(`\n📊 Benchmarking queries (${config})...`);
    
    const queryVectors = this.generateTestData(queryCount, 1536);
    let totalResults = 0;
    
    const { time } = await this.measureTime(async () => {
      for (const query of queryVectors) {
        const results = await store.query(collection, query.values, topK);
        totalResults += results.length;
      }
    });

    this.results.push({
      operation: 'query',
      iterations: queryCount,
      totalTime: time,
      averageTime: time / queryCount,
      throughput: (queryCount / time) * 1000,
      config
    });

    console.log(`  ✓ Executed ${queryCount} queries in ${time.toFixed(2)}ms`);
    console.log(`  ✓ Average: ${(time / queryCount).toFixed(3)}ms per query`);
    console.log(`  ✓ Throughput: ${((queryCount / time) * 1000).toFixed(0)} queries/sec`);
    console.log(`  ✓ Retrieved ${totalResults} total results`);
  }

  /**
   * Run filtered query benchmark
   */
  async benchmarkFilteredQuery(
    store: IntelagentVectorStore,
    collection: string,
    queryCount: number,
    config: string
  ): Promise<void> {
    console.log(`\n📊 Benchmarking filtered queries (${config})...`);
    
    const queryVectors = this.generateTestData(queryCount, 1536);
    let totalResults = 0;
    
    const { time } = await this.measureTime(async () => {
      for (let i = 0; i < queryVectors.length; i++) {
        const filter = { category: `category-${i % 10}` };
        const results = await store.query(
          collection, 
          queryVectors[i].values, 
          10,
          filter
        );
        totalResults += results.length;
      }
    });

    this.results.push({
      operation: 'filtered_query',
      iterations: queryCount,
      totalTime: time,
      averageTime: time / queryCount,
      throughput: (queryCount / time) * 1000,
      config
    });

    console.log(`  ✓ Executed ${queryCount} filtered queries in ${time.toFixed(2)}ms`);
    console.log(`  ✓ Average: ${(time / queryCount).toFixed(3)}ms per query`);
    console.log(`  ✓ Retrieved ${totalResults} total results`);
  }

  /**
   * Run cache hit rate benchmark (only for Redis-enabled stores)
   */
  async benchmarkCacheHitRate(
    store: IntelagentVectorStore,
    collection: string,
    config: string
  ): Promise<void> {
    console.log(`\n📊 Benchmarking cache hit rate (${config})...`);
    
    // Generate a small set of query vectors
    const queryVectors = this.generateTestData(10, 1536);
    const iterations = 100;
    
    // First pass - cache warming
    console.log('  Warming cache...');
    for (const query of queryVectors) {
      await store.query(collection, query.values, 10);
    }
    
    // Second pass - measure cache hits
    const { time } = await this.measureTime(async () => {
      for (let i = 0; i < iterations; i++) {
        const query = queryVectors[i % queryVectors.length];
        await store.query(collection, query.values, 10);
      }
    });

    this.results.push({
      operation: 'cache_hits',
      iterations: iterations,
      totalTime: time,
      averageTime: time / iterations,
      throughput: (iterations / time) * 1000,
      config
    });

    console.log(`  ✓ ${iterations} cached queries in ${time.toFixed(2)}ms`);
    console.log(`  ✓ Average: ${(time / iterations).toFixed(3)}ms per cached query`);
  }

  /**
   * Run batch operation benchmark
   */
  async benchmarkBatchOperations(
    store: IntelagentVectorStore,
    collection: string,
    config: string
  ): Promise<void> {
    console.log(`\n📊 Benchmarking batch operations (${config})...`);
    
    const ids = Array.from({ length: 100 }, (_, i) => `test-${i}`);
    
    // Batch retrieval
    const { time: retrievalTime } = await this.measureTime(async () => {
      await store.retrieve(collection, ids);
    });

    // Batch deletion
    const deleteIds = Array.from({ length: 50 }, (_, i) => `test-${i + 100}`);
    const { time: deletionTime } = await this.measureTime(async () => {
      await store.delete(collection, deleteIds);
    });

    this.results.push({
      operation: 'batch_retrieval',
      iterations: ids.length,
      totalTime: retrievalTime,
      averageTime: retrievalTime / ids.length,
      throughput: (ids.length / retrievalTime) * 1000,
      config
    });

    this.results.push({
      operation: 'batch_deletion',
      iterations: deleteIds.length,
      totalTime: deletionTime,
      averageTime: deletionTime / deleteIds.length,
      throughput: (deleteIds.length / deletionTime) * 1000,
      config
    });

    console.log(`  ✓ Retrieved ${ids.length} vectors in ${retrievalTime.toFixed(2)}ms`);
    console.log(`  ✓ Deleted ${deleteIds.length} vectors in ${deletionTime.toFixed(2)}ms`);
  }

  /**
   * Compare different configurations
   */
  async runComparison(): Promise<void> {
    console.log('\n🚀 Starting Vector Store Performance Benchmark\n');
    console.log('=' .repeat(60));
    
    const configs: VectorStoreConfig[] = [
      {
        // Basic configuration (JSONB only)
        enablePgVector: false,
        enableRedisCache: false
      },
      {
        // With Redis cache
        enablePgVector: false,
        enableRedisCache: true,
        redisUrl: process.env.REDIS_URL
      },
      {
        // With pgvector
        enablePgVector: true,
        enableRedisCache: false
      },
      {
        // Full optimization (pgvector + Redis)
        enablePgVector: true,
        enableRedisCache: true,
        redisUrl: process.env.REDIS_URL
      }
    ];

    const configNames = [
      'JSONB Only',
      'JSONB + Redis',
      'pgvector Only',
      'pgvector + Redis'
    ];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const configName = configNames[i];
      
      console.log(`\n\n🔧 Testing Configuration: ${configName}`);
      console.log('-'.repeat(60));
      
      const store = new IntelagentVectorStore(config);
      await store.initialize();
      
      const collection = `benchmark_${Date.now()}`;
      
      // Run benchmarks
      await this.benchmarkInsertion(store, collection, 1000, configName);
      await this.benchmarkQuery(store, collection, 100, 10, configName);
      await this.benchmarkFilteredQuery(store, collection, 50, configName);
      
      if (config.enableRedisCache) {
        await this.benchmarkCacheHitRate(store, collection, configName);
      }
      
      await this.benchmarkBatchOperations(store, collection, configName);
      
      // Cleanup
      await store.deleteCollection(collection);
      await store.disconnect();
    }

    this.printResults();
  }

  /**
   * Print comparison results
   */
  private printResults(): void {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 BENCHMARK RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Group results by operation
    const operations = [...new Set(this.results.map(r => r.operation))];
    
    for (const operation of operations) {
      console.log(`\n${operation.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      const opResults = this.results.filter(r => r.operation === operation);
      opResults.sort((a, b) => a.averageTime - b.averageTime);
      
      const baseline = opResults.find(r => r.config === 'JSONB Only');
      
      for (const result of opResults) {
        const improvement = baseline 
          ? ((baseline.averageTime - result.averageTime) / baseline.averageTime * 100)
          : 0;
        
        console.log(`  ${result.config}:`);
        console.log(`    Average Time: ${result.averageTime.toFixed(3)}ms`);
        console.log(`    Throughput: ${result.throughput.toFixed(0)}/sec`);
        
        if (improvement > 0 && baseline && result !== baseline) {
          console.log(`    Improvement: ${improvement.toFixed(1)}% faster than baseline`);
        }
      }
    }

    // Overall winner
    console.log('\n' + '='.repeat(80));
    console.log('🏆 PERFORMANCE RANKINGS');
    console.log('='.repeat(80));
    
    const configScores = new Map<string, number>();
    
    for (const result of this.results) {
      const current = configScores.get(result.config) || 0;
      configScores.set(result.config, current + result.throughput);
    }
    
    const rankings = Array.from(configScores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    rankings.forEach(([ config, score], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${config} (Score: ${score.toFixed(0)})`);
    });
  }

  /**
   * Run a quick benchmark
   */
  async runQuickBenchmark(): Promise<void> {
    console.log('\n🚀 Running Quick Benchmark\n');
    
    const store = new IntelagentVectorStore();
    await store.initialize();
    
    const collection = `quick_benchmark_${Date.now()}`;
    
    // Get current configuration
    const stats = await store.getPerformanceStats();
    const configName = stats.pgvectorAvailable && stats.redisCacheEnabled
      ? 'pgvector + Redis'
      : stats.pgvectorAvailable
      ? 'pgvector Only'
      : stats.redisCacheEnabled
      ? 'JSONB + Redis'
      : 'JSONB Only';
    
    console.log(`Current Configuration: ${configName}\n`);
    
    await this.benchmarkInsertion(store, collection, 500, configName);
    await this.benchmarkQuery(store, collection, 50, 10, configName);
    
    // Cleanup
    await store.deleteCollection(collection);
    await store.disconnect();
    
    console.log('\n✅ Quick benchmark complete!');
  }
}

// Export for use in tests or direct execution
export default VectorStoreBenchmark;

// Allow direct execution
if (require.main === module) {
  const benchmark = new VectorStoreBenchmark();
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'quick';
  
  (async () => {
    try {
      if (mode === 'full') {
        await benchmark.runComparison();
      } else {
        await benchmark.runQuickBenchmark();
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
      process.exit(1);
    }
  })();
}