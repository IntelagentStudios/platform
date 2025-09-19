import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { LeadManagementSkill } from '@/packages/skills-orchestrator/src/skills/impl/LeadManagementSkill';

const leadSkill = new LeadManagementSkill();

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId } = body;

    const result = await leadSkill.execute({
      action: 'score_lead',
      licenseKey: session.licenseKey,
      data: { leadId }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error scoring lead:', error);
    return NextResponse.json(
      { error: 'Failed to score lead' },
      { status: 500 }
    );
  }
}