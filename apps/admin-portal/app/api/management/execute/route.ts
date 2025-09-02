import { NextRequest, NextResponse } from 'next/server';
import { MasterAdminController } from '../../../../../../packages/skills-orchestrator/src/agents/MasterAdminController';

// Master admin authentication
const MASTER_KEY = process.env.MASTER_ADMIN_KEY || 'master-key-2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, authKey } = body;

    // Validate request
    if (!command || !authKey) {
      return NextResponse.json(
        { error: 'Missing required fields: command and authKey' },
        { status: 400 }
      );
    }

    // Initialize MasterAdminController
    const masterController = MasterAdminController.initialize(MASTER_KEY);
    
    // Execute the master command
    const result = await masterController.executeMasterCommand(command, authKey);
    
    // Check for authentication errors
    if (result.error === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid master key' },
        { status: 401 }
      );
    }
    
    // Return the result
    return NextResponse.json({
      success: !result.error,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Master command execution failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute master command',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if master control is available
export async function GET() {
  return NextResponse.json({
    available: true,
    commands: [
      'EMERGENCY_STOP',
      'MAINTENANCE_MODE',
      'SYSTEM_STATUS',
      'OVERRIDE_DECISION',
      'CONFIGURE_AGENT',
      'DISABLE_AGENT',
      'ENABLE_AGENT',
      'UPDATE_SKILLS_MATRIX',
      'DISABLE_SKILL',
      'ENABLE_SKILL',
      'SET_SKILL_PRICING',
      'SUSPEND_CUSTOMER',
      'OVERRIDE_LIMITS',
      'GRANT_ACCESS',
      'REFUND',
      'ADJUST_BALANCE',
      'WAIVE_FEES',
      'VIEW_AUDIT_LOG',
      'EXPORT_DATA',
      'RUN_DIAGNOSTICS',
      'FORCE_EXECUTE'
    ],
    note: 'POST to this endpoint with { command: MasterCommand, authKey: string }'
  });
}