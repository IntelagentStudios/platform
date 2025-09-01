/**
 * Real-time Monitoring API
 * Provides live execution monitoring and data flow tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/monitoring/realtime
 * Get real-time execution status and data flows
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const licenseKey = authResult.user?.licenseKey!;

    // Get currently running executions
    const runningExecutions = await prisma.executions.findMany({
      where: {
        license_key: licenseKey,
        status: 'running'
      },
      include: {
        execution_events: {
          orderBy: { timestamp: 'desc' },
          take: 3
        }
      },
      orderBy: { started_at: 'desc' }
    });

    // Get recent data flows (last 5 minutes)
    const recentDataFlows = await prisma.data_flows.findMany({
      where: {
        license_key: licenseKey,
        transferred_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      orderBy: { transferred_at: 'desc' },
      take: 50
    });

    // Get execution statistics for the last hour
    const hourlyStats = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('minute', started_at) as minute,
        COUNT(*) as execution_count,
        AVG(duration_ms) as avg_duration,
        SUM(tokens_used) as total_tokens,
        SUM(api_calls_made) as total_api_calls,
        SUM(data_processed_kb) as total_data_kb
      FROM executions
      WHERE license_key = ${licenseKey}
        AND started_at >= NOW() - INTERVAL '1 hour'
      GROUP BY minute
      ORDER BY minute DESC
    `;

    // Get data flow patterns
    const flowPatterns = await prisma.$queryRaw`
      SELECT 
        source_service,
        target_service,
        data_type,
        COUNT(*) as flow_count,
        SUM(data_size_bytes) as total_bytes,
        AVG(data_size_bytes) as avg_bytes
      FROM data_flows
      WHERE license_key = ${licenseKey}
        AND transferred_at >= NOW() - INTERVAL '1 hour'
      GROUP BY source_service, target_service, data_type
      ORDER BY flow_count DESC
      LIMIT 20
    `;

    // Get error rate
    const errorStats = await prisma.executions.groupBy({
      by: ['execution_type'],
      where: {
        license_key: licenseKey,
        started_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      _count: {
        id: true
      }
    });

    const failedStats = await prisma.executions.groupBy({
      by: ['execution_type'],
      where: {
        license_key: licenseKey,
        status: 'failed',
        started_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      _count: {
        id: true
      }
    });

    // Calculate error rates
    const errorRates = errorStats.map(stat => {
      const failed = failedStats.find(f => f.execution_type === stat.execution_type);
      return {
        execution_type: stat.execution_type,
        total: stat._count.id,
        failed: failed?._count.id || 0,
        error_rate: failed ? (failed._count.id / stat._count.id * 100).toFixed(2) : '0.00'
      };
    });

    // Get system health metrics
    const systemHealth = await prisma.execution_metrics.groupBy({
      by: ['metric_name'],
      where: {
        recorded_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        },
        execution_id: {
          in: runningExecutions.map(e => e.id)
        }
      },
      _avg: {
        metric_value: true
      },
      _max: {
        metric_value: true
      },
      _min: {
        metric_value: true
      }
    });

    return NextResponse.json({
      running_executions: runningExecutions,
      recent_data_flows: recentDataFlows,
      hourly_stats: hourlyStats,
      flow_patterns: flowPatterns,
      error_rates: errorRates,
      system_health: systemHealth,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch realtime data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/realtime
 * Stream execution updates in real-time
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { execution_id, event_type, data } = await request.json();

    // Verify execution ownership
    const execution = await prisma.executions.findFirst({
      where: {
        id: execution_id,
        license_key: authResult.user?.licenseKey
      }
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Handle different event types
    switch (event_type) {
      case 'progress':
        await prisma.execution_events.create({
          data: {
            execution_id,
            event_type: 'progress',
            event_name: data.message || 'Progress update',
            event_data: data,
            severity: 'info'
          }
        });
        break;

      case 'metric':
        await prisma.execution_metrics.create({
          data: {
            execution_id,
            metric_name: data.name,
            metric_value: data.value,
            metric_unit: data.unit
          }
        });
        break;

      case 'data_transfer':
        await prisma.data_flows.create({
          data: {
            execution_id,
            license_key: authResult.user?.licenseKey!,
            source_service: data.source,
            target_service: data.target,
            data_type: data.type,
            data_size_bytes: data.size,
            contains_pii: data.contains_pii || false
          }
        });
        
        await prisma.execution_events.create({
          data: {
            execution_id,
            event_type: 'data_transfer',
            event_name: `Data transferred from ${data.source} to ${data.target}`,
            event_data: data,
            severity: 'info'
          }
        });
        break;

      case 'error':
        await prisma.execution_events.create({
          data: {
            execution_id,
            event_type: 'error',
            event_name: data.error || 'Error occurred',
            event_data: data,
            severity: data.severity || 'error'
          }
        });
        
        if (data.fatal) {
          await prisma.executions.update({
            where: { id: execution_id },
            data: {
              status: 'failed',
              error_data: data,
              completed_at: new Date()
            }
          });
        }
        break;

      default:
        await prisma.execution_events.create({
          data: {
            execution_id,
            event_type,
            event_name: data.name || event_type,
            event_data: data,
            severity: data.severity || 'info'
          }
        });
    }

    return NextResponse.json({
      success: true,
      execution_id,
      event_type,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error recording realtime event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}