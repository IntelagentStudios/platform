import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@intelagent/database';
import { RedisManager } from '@intelagent/redis';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check system health
    let dbStatus = 'operational';
    let redisStatus = 'operational';
    let apiLatency = 0;
    
    // Test database connection
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      apiLatency = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'degraded';
      console.error('Database health check failed:', error);
    }

    // Test Redis connection
    try {
      const redis = RedisManager.getClient('cache');
      if (redis) {
        await redis.ping();
      }
    } catch (error) {
      redisStatus = 'degraded';
      console.error('Redis health check failed:', error);
    }

    // Calculate overall server status
    const serverStatus = dbStatus === 'operational' && redisStatus === 'operational' 
      ? 'operational' 
      : 'degraded';

    // Get error metrics from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [totalRequests, failedRequests] = await Promise.all([
      prisma.events.count({
        where: {
          created_at: { gte: yesterday }
        }
      }),
      prisma.events.count({
        where: {
          created_at: { gte: yesterday },
          event_type: 'error'
        }
      })
    ]);

    const errorRate = totalRequests > 0 
      ? Math.round((failedRequests / totalRequests) * 100 * 100) / 100 
      : 0;

    // Calculate uptime (simplified - in production, use proper monitoring)
    const uptime = 99.99 - errorRate * 0.1; // Adjust uptime based on error rate

    // Get service-specific metrics
    const services = {
      database: {
        status: dbStatus,
        latency: apiLatency,
        connections: await prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity` as any
      },
      redis: {
        status: redisStatus,
        memory: 'N/A' // Would need Redis INFO command
      },
      api: {
        requestsPerHour: Math.round(totalRequests / 24),
        p95Latency: apiLatency * 1.5, // Simplified
        p99Latency: apiLatency * 2    // Simplified
      }
    };

    // Get resource usage (simplified)
    const resourceUsage = {
      cpu: Math.round(20 + Math.random() * 30), // Mock data - replace with actual monitoring
      memory: Math.round(40 + Math.random() * 20),
      disk: Math.round(30 + Math.random() * 10),
      bandwidth: Math.round(totalRequests * 0.1) // MB estimate
    };

    return NextResponse.json({
      serverStatus,
      uptime: Math.round(uptime * 100) / 100,
      apiLatency,
      errorRate,
      services,
      resourceUsage,
      totalRequests,
      failedRequests,
      requestsPerSecond: Math.round(totalRequests / (24 * 60 * 60) * 100) / 100,
      activeConnections: Math.round(10 + Math.random() * 20), // Mock - replace with actual
      lastIncident: null, // Would fetch from incidents table
      nextMaintenance: null // Would fetch from maintenance schedule
    });

  } catch (error) {
    console.error('Admin system stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    );
  }
}