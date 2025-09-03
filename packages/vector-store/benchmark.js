#!/usr/bin/env node

/**
 * CLI runner for vector store benchmarks
 * Usage:
 *   npm run benchmark       # Run quick benchmark
 *   npm run benchmark full  # Run full comparison
 */

require('ts-node/register');
const VectorStoreBenchmark = require('./src/benchmark').default;

async function main() {
  const benchmark = new VectorStoreBenchmark();
  const args = process.argv.slice(2);
  const mode = args[0] || 'quick';

  console.log('🚀 Intelagent Vector Store Benchmark Tool\n');

  try {
    if (mode === 'full') {
      console.log('Running full comparison benchmark...');
      console.log('This will test all configurations and may take several minutes.\n');
      await benchmark.runComparison();
    } else if (mode === 'quick') {
      console.log('Running quick benchmark with current configuration...');
      await benchmark.runQuickBenchmark();
    } else {
      console.log('Unknown mode:', mode);
      console.log('Usage: npm run benchmark [quick|full]');
      process.exit(1);
    }

    console.log('\n✅ Benchmark completed successfully!');
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);