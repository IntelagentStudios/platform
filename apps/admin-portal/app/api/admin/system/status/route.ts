import { NextRequest, NextResponse } from 'next/server';
import { SystemMonitor } from '@/lib/system-monitor';
import { logger } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await SystemMonitor.performHealthCheck();
    
    return NextResponse.json(healthCheck);
  } catch (error) {
    logger.error({ error }, 'Failed to get system status');
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}