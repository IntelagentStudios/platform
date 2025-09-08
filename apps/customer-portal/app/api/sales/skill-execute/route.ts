import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SkillExecutor } from '../../../../../../../packages/skills-orchestrator/src/executor';
import { SkillRegistry } from '../../../../../../../packages/skills-orchestrator/src/registry';

// Initialize executor with registry
const registry = SkillRegistry.getInstance();
const executor = new SkillExecutor(registry);

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

    // Execute the skill
    const result = await executor.execute(skillId, {
      ...params,
      action,
      licenseKey: decoded.licenseKey || 'default',
      userId: decoded.userId,
      tenantId: decoded.tenantId
    });

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