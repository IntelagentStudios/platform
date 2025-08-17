import { NextRequest, NextResponse } from 'next/server';
import { redis, metrics } from '@/lib/redis';
import { QueueManager } from '@/lib/queues';
import { logger } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    // Get user stats
    const totalUsers = await redis.get('stats:users:total') || '0';
    const activeUsers = await redis.get('stats:users:active') || '0';
    const newUsers = await redis.get('stats:users:new:today') || '0';

    // Get request stats  
    const totalRequests = await redis.get('stats:requests:total') || '0';
    const rpm = await redis.get('stats:requests:rpm') || '0';
    const errors = await redis.get('stats:requests:errors') || '0';

    // Get database stats
    const dbConnections = await redis.get('stats:db:connections') || '0';
    const dbQueries = await redis.get('stats:db:queries') || '0';
    const slowQueries = await redis.get('stats:db:slow') || '0';

    // Get queue stats
    const queueStats = await QueueManager.getAllQueuesStats();
    let totalJobs = 0;
    let processingJobs = 0;
    let failedJobs = 0;

    for (const [name, stats] of Object.entries(queueStats)) {
      if (stats) {
        totalJobs += stats.total || 0;
        processingJobs += stats.active || 0;
        failedJobs += stats.failed || 0;
      }
    }

    const stats = {
      users: {
        total: parseInt(totalUsers),
        active: parseInt(activeUsers),
        new: parseInt(newUsers),
      },
      requests: {
        total: parseInt(totalRequests),
        rpm: parseInt(rpm),
        errors: parseInt(errors),
      },
      database: {
        connections: parseInt(dbConnections),
        queries: parseInt(dbQueries),
        slow: parseInt(slowQueries),
      },
      queues: {
        total: totalJobs,
        processing: processingJobs,
        failed: failedJobs,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, 'Failed to get stats');
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}