import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { OrchestratorAgent } from '@intelagent/skills-orchestrator';

// Register sales skills
import '@intelagent/skills-orchestrator/src/skills/registerSalesSkills';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const body = await request.json();
    const { skillId, action, params } = body;

    // Validate skill ID
    if (!skillId || !['sales_outreach', 'lead_management'].includes(skillId)) {
      return NextResponse.json(
        { error: 'Invalid skill ID' },
        { status: 400 }
      );
    }

    // Get orchestrator instance
    const orchestrator = OrchestratorAgent.getInstance();
    
    // Execute the skill through orchestrator
    const orchestrationResult = await orchestrator.execute({
      skillId,
      params: {
        ...params,
        action
      },
      context: {
        userId: decoded.userId,
        licenseKey: decoded.licenseKey || 'default',
        sessionId: `sales-${Date.now()}`,
        metadata: {
          tenantId: decoded.tenantId
        }
      }
    });
    
    const result = orchestrationResult.results[0] || { 
      success: false, 
      error: orchestrationResult.error 
    };

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Skill execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute skill' },
      { status: 500 }
    );
  }
}