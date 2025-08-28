import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch audit logs
    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 100 // Last 100 logs
    });
    
    // Transform to consistent format
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      action: log.action,
      resource_type: log.resource_type || 'system',
      resource_id: log.resource_id || '',
      user_id: log.user_id,
      license_key: log.license_key,
      changes: log.changes,
      ip_address: log.ip_address,
      severity: determineSeverity(log.action)
    }));
    
    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create audit log entry
    const log = await prisma.audit_logs.create({
      data: {
        action: body.action,
        resource_type: body.resource_type,
        resource_id: body.resource_id,
        user_id: body.user_id || null,
        license_key: body.license_key || null,
        changes: body.changes || {},
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    });
    
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}

function determineSeverity(action: string): 'info' | 'warning' | 'error' | 'critical' {
  if (action.includes('delete') || action.includes('reset')) return 'warning';
  if (action.includes('impersonate')) return 'warning';
  if (action.includes('error') || action.includes('fail')) return 'error';
  if (action.includes('critical') || action.includes('security')) return 'critical';
  return 'info';
}