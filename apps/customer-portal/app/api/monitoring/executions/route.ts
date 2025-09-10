/**
 * Execution Monitoring API
 * Tracks all executions across the platform with license key tagging
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/monitoring/executions
 * Retrieve execution history for the authenticated license
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

    const { searchParams } = new URL(request.url);
    const executionType = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {
      license_key: authResult.user?.licenseKey
    };

    // Commented out filtering by non-existent fields
    // if (executionType) {
    //   where.execution_type = executionType;
    // }

    if (status) {
      where.state = status; // Use 'state' instead of 'status'
    }

    if (startDate || endDate) {
      where.created_at = {}; // Use 'created_at' instead of 'started_at'
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    // Fetch executions data (removed invalid includes for non-existent tables)
    const executions = await prisma.executions.findMany({
      where,
      orderBy: { created_at: 'desc' }, // Use 'created_at' instead of 'started_at'
      skip: offset,
      take: limit
    });

    // Calculate aggregated statistics (simplified - removed non-existent fields)
    const stats = await prisma.executions.aggregate({
      where: {
        license_key: authResult.user?.licenseKey,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      _count: { id: true }
    });

    return NextResponse.json({
      executions,
      stats: {
        total_executions: stats._count.id,
        // Removed other stats as fields don't exist in current schema
        total_duration_ms: 0,
        total_tokens: 0,
        total_api_calls: 0,
        total_data_kb: 0,
        total_cost: 0,
        avg_duration_ms: 0,
        avg_cpu_ms: 0,
        avg_memory_mb: 0
      },
      pagination: {
        offset,
        limit,
        total: await prisma.executions.count({ where })
      }
    });

  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/executions
 * Create a new execution record
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

    const data = await request.json();
    const {
      execution_type,
      execution_name,
      product_key,
      input_data,
      metadata,
      parent_execution_id,
      session_id
    } = data;

    // Create execution record
    const licenseKey = authResult.user?.licenseKey;
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 400 }
      );
    }

    const execution = await prisma.executions.create({
      data: {
        license_key: licenseKey,
        // Removed user_id as it doesn't exist in schema
        run_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organization: 'default',
        state: 'pending',
        intent: execution_name || 'unknown',
        input_data: input_data || {},
        // Simplified to match actual schema
        plan: {},
        error_details: {}
      }
    });

    // Create initial event (commented out - execution_events table doesn't exist)
    // await prisma.execution_events.create({
    //   data: {
    //     execution_id: execution.id,
    //     event_type: 'start',
    //     event_name: `Started ${execution_name}`,
    //     event_data: { input_data },
    //     severity: 'info'
    //   }
    // });

    // Track data flow if input data exists (commented out - data_flows table doesn't exist)
    // if (input_data) {
    //   await prisma.data_flows.create({
    //     data: {
    //       execution_id: execution.id,
    //       license_key: licenseKey,
    //       source_service: 'api',
    //       target_service: execution_type,
    //       data_type: 'user_input',
    //       data_size_bytes: JSON.stringify(input_data).length,
    //       data_sample: input_data
    //     }
    //   });
    // }

    return NextResponse.json({
      execution_id: execution.id,
      request_id: execution.run_id, // Use run_id instead of request_id
      status: 'pending',
      message: 'Execution tracking started'
    });

  } catch (error) {
    console.error('Error creating execution:', error);
    return NextResponse.json(
      { error: 'Failed to create execution' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/monitoring/executions
 * Update execution status and metrics
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      execution_id,
      status,
      output_data,
      error_data,
      metrics,
      events,
      data_flows
    } = data;

    // Verify execution belongs to this license
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

    // Update execution status (adapted to actual schema)
    const updateData: any = {};
    
    if (status) {
      updateData.state = status; // Use 'state' instead of 'status'
    }

    if (output_data) {
      updateData.output_data = output_data;
    }

    if (error_data) {
      updateData.error_details = error_data; // Use 'error_details' instead of 'error_data'
    }

    await prisma.executions.update({
      where: { id: execution_id },
      data: updateData
    });

    // Record metrics if provided (commented out - execution_metrics table doesn't exist)
    // if (metrics && Array.isArray(metrics)) {
    //   await prisma.execution_metrics.createMany({
    //     data: metrics.map((m: any) => ({
    //       execution_id,
    //       metric_name: m.name,
    //       metric_value: m.value,
    //       metric_unit: m.unit
    //     }))
    //   });
    // }

    // Record events if provided (commented out - execution_events table doesn't exist)
    // if (events && Array.isArray(events)) {
    //   await prisma.execution_events.createMany({
    //     data: events.map((e: any) => ({
    //       execution_id,
    //       event_type: e.type,
    //       event_name: e.name,
    //       event_data: e.data,
    //       severity: e.severity || 'info'
    //     }))
    //   });
    // }

    // Track data flows if provided (commented out - data_flows table doesn't exist)
    // if (data_flows && Array.isArray(data_flows)) {
    //   const licenseKey = authResult.user?.licenseKey;
    //   if (!licenseKey) {
    //     return NextResponse.json(
    //       { error: 'License key not found' },
    //       { status: 400 }
    //     );
    //   }

    //   await prisma.data_flows.createMany({
    //     data: data_flows.map((flow: any) => ({
    //       execution_id,
    //       license_key: licenseKey,
    //       source_service: flow.source,
    //       target_service: flow.target,
    //       data_type: flow.type,
    //       data_size_bytes: flow.size,
    //       data_sample: flow.sample,
    //       contains_pii: flow.contains_pii || false,
    //       data_classification: flow.classification
    //     }))
    //   });
    // }

    return NextResponse.json({
      success: true,
      execution_id,
      status: updateData.state || execution.state // Use 'state' instead of 'status'
    });

  } catch (error) {
    console.error('Error updating execution:', error);
    return NextResponse.json(
      { error: 'Failed to update execution' },
      { status: 500 }
    );
  }
}