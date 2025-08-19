import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'degraded' | 'unknown' },
      redis: { status: 'disabled' as 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'disabled' },
      api: { status: 'healthy' as 'healthy' | 'unhealthy' | 'degraded' | 'unknown' }
    },
    environment: {
      node_env: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database.status = 'healthy'
  } catch (error) {
    health.services.database.status = 'unhealthy'
    health.status = 'degraded'
    console.error('Database health check failed:', error)
  }

  // Redis is optional - only check if configured
  if (process.env.REDIS_URL) {
    try {
      const { redis } = await import('@/lib/redis')
      const result = await redis.ping()
      if (result === 'PONG') {
        health.services.redis.status = 'healthy'
      } else {
        health.services.redis.status = 'degraded'
        // Don't fail health check for Redis
      }
    } catch (error) {
      health.services.redis.status = 'disabled'
      // Redis is optional, so don't degrade overall health
      console.log('Redis not configured or unavailable')
    }
  }

  // Only return 503 if critical services are down
  const httpStatus = health.services.database.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(health, { status: httpStatus })
}