import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    // Get basic metrics from Redis
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis: {
        connected: redis.status === 'ready'
      }
    }

    // Get cached metrics if available
    const cachedMetrics = await redis.get('system:metrics')
    if (cachedMetrics) {
      Object.assign(metrics, JSON.parse(cachedMetrics))
    }

    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}