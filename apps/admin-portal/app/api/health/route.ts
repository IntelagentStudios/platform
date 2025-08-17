import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'degraded' | 'unknown' },
      redis: { status: 'unknown' as 'healthy' | 'unhealthy' | 'degraded' | 'unknown' },
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

  // Check Redis
  try {
    const result = await redis.ping()
    if (result === 'PONG') {
      health.services.redis.status = 'healthy'
    } else {
      health.services.redis.status = 'degraded'
      health.status = 'degraded'
    }
  } catch (error) {
    health.services.redis.status = 'unhealthy'
    health.status = 'degraded'
    console.error('Redis health check failed:', error)
  }

  const httpStatus = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: httpStatus })
}