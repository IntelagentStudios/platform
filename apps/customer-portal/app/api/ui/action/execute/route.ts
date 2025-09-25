import { NextRequest, NextResponse } from 'next/server';
import { DataCatalog } from '@/packages/ui-system/src/DataCatalog';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionBind, params = {}, namespace } = body;

    if (!actionBind || !namespace) {
      return NextResponse.json({
        error: 'Action bind and namespace are required'
      }, { status: 400 });
    }

    // Get user info from session
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value || 'anonymous';
    const licenseKey = cookieStore.get('licenseKey')?.value;

    // Add license key to params for skill execution
    const enrichedParams = {
      ...params,
      licenseKey,
      userId,
      timestamp: new Date().toISOString()
    };

    // Execute the action through the catalog
    const catalog = new DataCatalog();

    try {
      const result = await catalog.executeAction(
        namespace,
        actionBind,
        enrichedParams,
        userId
      );

      // Log successful execution
      console.log(`[ACTION] Executed ${namespace}.${actionBind} by ${userId}`);

      return NextResponse.json({
        success: true,
        runId: `run-${Date.now()}`,
        status: 'completed',
        result
      });
    } catch (actionError: any) {
      console.error(`[ACTION] Failed ${namespace}.${actionBind}:`, actionError);

      return NextResponse.json({
        success: false,
        runId: `run-${Date.now()}`,
        status: 'failed',
        error: actionError.message || 'Action execution failed'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in action execute:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}