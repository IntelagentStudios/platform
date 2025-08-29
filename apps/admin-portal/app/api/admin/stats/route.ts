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
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const activeDate = new Date(new Date().setDate(new Date().getDate() - 30));

    const [totalUsers, newUsers, totalLicenses, activeLicenses] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: { created_at: { gte: todayStart } }
      }),
      prisma.licenses.count(),
      prisma.licenses.count({
        where: { status: 'active' }
      })
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
        active: activeLicenses, // Using active licenses as proxy for active users
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