import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker/Railway
 * Returns 200 OK if the service is running
 * Updated: 2025-09-05 - Fixed n8n integration
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    // Optional: Check database connection
    if (process.env.DATABASE_URL) {
      try {
        // Only check DB if not in build mode
        if (process.env.BUILDING !== 'true') {
          const { prisma } = await import('@intelagent/database');
          await prisma.$queryRaw`SELECT 1`;
          (health as any).database = 'connected';
        } else {
          (health as any).database = 'skipped (build mode)';
        }
      } catch (error) {
        (health as any).database = 'error';
        console.error('Database health check failed:', error);
        // Don't fail the health check just because DB is down
        // This allows the container to stay running and potentially recover
      }
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Also support HEAD requests for lightweight checks
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}