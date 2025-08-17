import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redis } from './redis';
import { logger } from './monitoring';

export interface QueueConfig {
  name: string;
  concurrency?: number;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

export class QueueManager {
  private static queues = new Map<string, Queue>();
  private static workers = new Map<string, Worker>();
  private static events = new Map<string, QueueEvents>();

  static createQueue(config: QueueConfig) {
    const queue = new Queue(config.name, {
      connection: redis,
      defaultJobOptions: config.defaultJobOptions || {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    const events = new QueueEvents(config.name, {
      connection: redis.duplicate(),
    });

    this.queues.set(config.name, queue);
    this.events.set(config.name, events);

    this.setupEventListeners(config.name, events);

    return queue;
  }

  static createWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency = 1
  ) {
    const worker = new Worker(queueName, processor, {
      connection: redis.duplicate(),
      concurrency,
    });

    worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queueName }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, queueName, error: err.message }, 'Job failed');
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  private static setupEventListeners(queueName: string, events: QueueEvents) {
    events.on('waiting', ({ jobId }) => {
      logger.debug({ jobId, queueName }, 'Job waiting');
    });

    events.on('progress', ({ jobId, data }) => {
      logger.debug({ jobId, queueName, progress: data }, 'Job progress');
    });

    events.on('completed', ({ jobId, returnvalue }) => {
      logger.info({ jobId, queueName, result: returnvalue }, 'Job completed');
    });

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error({ jobId, queueName, reason: failedReason }, 'Job failed');
    });
  }

  static getQueue(name: string) {
    return this.queues.get(name);
  }

  static async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + delayed + paused,
    };
  }

  static async getAllQueuesStats() {
    const stats: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }

    return stats;
  }

  static async pauseQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      logger.info({ queueName }, 'Queue paused');
    }
  }

  static async resumeQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      logger.info({ queueName }, 'Queue resumed');
    }
  }

  static async drainQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.drain();
      logger.warn({ queueName }, 'Queue drained');
    }
  }

  static async cleanQueue(queueName: string, grace: number = 0) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.clean(grace, 100);
      logger.info({ queueName }, 'Queue cleaned');
    }
  }

  static async shutdown() {
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info({ workerName: name }, 'Worker closed');
    }

    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info({ queueName: name }, 'Queue closed');
    }

    for (const [name, events] of this.events) {
      await events.close();
      logger.info({ eventsName: name }, 'Queue events closed');
    }
  }
}

// Define standard queues
export const Queues = {
  EMAIL: 'email',
  ENRICHMENT: 'enrichment',
  ANALYTICS: 'analytics',
  EXPORT: 'export',
  IMPORT: 'import',
  NOTIFICATION: 'notification',
  BACKUP: 'backup',
  AUDIT: 'audit',
  WEBHOOK: 'webhook',
  REPORT: 'report',
} as const;

// Initialize standard queues
export const initializeQueues = () => {
  // Email queue
  QueueManager.createQueue({
    name: Queues.EMAIL,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  });

  // Enrichment queue
  QueueManager.createQueue({
    name: Queues.ENRICHMENT,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    },
  });

  // Analytics queue
  QueueManager.createQueue({
    name: Queues.ANALYTICS,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 1000,
    },
  });

  // Export queue
  QueueManager.createQueue({
    name: Queues.EXPORT,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    },
  });

  // Notification queue
  QueueManager.createQueue({
    name: Queues.NOTIFICATION,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  // Webhook queue
  QueueManager.createQueue({
    name: Queues.WEBHOOK,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30000 },
    },
  });

  logger.info('All queues initialized');
};

// Queue job interfaces
export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EnrichmentJob {
  type: 'company' | 'person' | 'email';
  data: Record<string, any>;
}

export interface AnalyticsJob {
  event: string;
  userId?: string;
  properties: Record<string, any>;
}

export interface ExportJob {
  type: 'csv' | 'json' | 'pdf';
  model: string;
  filters?: Record<string, any>;
  userId: string;
}

export interface NotificationJob {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface WebhookJob {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  retries?: number;
}