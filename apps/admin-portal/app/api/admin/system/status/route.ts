import { NextRequest, NextResponse } from 'next/server';
import { SystemMonitor } from '@/lib/system-monitor';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await SystemMonitor.performHealthCheck();
    
    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}