import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        users: { total: 0, active: 0, new: 0 },
        requests: { total: 0, rpm: 0, errors: 0 },
        database: { connections: 0, queries: 0, slow: 0 },
        queues: { total: 0, processing: 0, failed: 0 },
      });
    }
    
    // Get real stats from database
    const [totalUsers, todayStart, activeDate] = [
      await prisma.user.count(),
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(new Date().setDate(new Date().getDate() - 30))
    ];

    const [newUsers, activeUsers, totalLicenses] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.user.count({
        where: { lastActiveAt: { gte: activeDate } }
      }),
      prisma.licenses.count()
    ]);

    // Get database connection stats (simplified)
    const dbStats = await prisma.$queryRaw`
      SELECT 
        count(*) as connection_count,
        pg_database_size(current_database()) as db_size
      FROM pg_stat_activity
      WHERE datname = current_database()
    ` as any[];

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
      },
      requests: {
        total: 0, // Would need request tracking
        rpm: 0, // Would need real-time monitoring
        errors: 0, // Would need error tracking
      },
      database: {
        connections: parseInt(dbStats[0]?.connection_count || '0'),
        queries: 0, // Would need query tracking
        slow: 0, // Would need query performance monitoring
      },
      queues: {
        total: 0, // No queue system implemented yet
        processing: 0,
        failed: 0,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    
    // Return empty stats on error instead of mock data
    return NextResponse.json({
      users: { total: 0, active: 0, new: 0 },
      requests: { total: 0, rpm: 0, errors: 0 },
      database: { connections: 0, queries: 0, slow: 0 },
      queues: { total: 0, processing: 0, failed: 0 },
    });
  }
}