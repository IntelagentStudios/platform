const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Job queues
const emailQueue = new Queue('emails', { connection });
const enrichmentQueue = new Queue('enrichment', { connection });
const analyticsQueue = new Queue('analytics', { connection });

// Email worker
const emailWorker = new Worker('emails', async (job) => {
  console.log(`Processing email job ${job.id}:`, job.data);
  // Process email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, timestamp: new Date().toISOString() };
}, { connection });

// Enrichment worker
const enrichmentWorker = new Worker('enrichment', async (job) => {
  console.log(`Processing enrichment job ${job.id}:`, job.data);
  // Process data enrichment
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { enriched: true, timestamp: new Date().toISOString() };
}, { connection });

// Analytics worker
const analyticsWorker = new Worker('analytics', async (job) => {
  console.log(`Processing analytics job ${job.id}:`, job.data);
  // Process analytics calculations
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { processed: true, timestamp: new Date().toISOString() };
}, { connection });

// Error handling
emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

enrichmentWorker.on('failed', (job, err) => {
  console.error(`Enrichment job ${job.id} failed:`, err);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`Analytics job ${job.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await emailWorker.close();
  await enrichmentWorker.close();
  await analyticsWorker.close();
  await connection.quit();
  process.exit(0);
});

console.log('Worker service started successfully');
console.log('Listening for jobs on queues: emails, enrichment, analytics');