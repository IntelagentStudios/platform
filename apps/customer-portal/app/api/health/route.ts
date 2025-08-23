import { NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbUrlPrefix = process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.substring(0, 30) + '...' : 
    'NOT SET';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      hasDbUrl,
      dbUrlPrefix,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      hasDbUrl,
      dbUrlPrefix,
      nodeEnv: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}