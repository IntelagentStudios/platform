import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { EmailSequenceSkill } from '@/packages/skills-orchestrator/src/skills/impl/EmailSequenceSkill';
import { PrismaClient } from '@prisma/client';

const sequenceSkill = new EmailSequenceSkill();
const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { sequenceId: string } }
) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    let skillAction = '';
    let data: any = { sequenceId: params.sequenceId };

    switch (action) {
      case 'pause':
        skillAction = 'pause_sequence';
        break;
      case 'resume':
        skillAction = 'resume_sequence';
        break;
      case 'stop':
        skillAction = 'stop_sequence';
        data.reason = body.reason;
        break;
      case 'execute_step':
        skillAction = 'execute_next_step';
        break;
      case 'skip_step':
        skillAction = 'skip_step';
        data.stepNumber = body.stepNumber;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await sequenceSkill.execute({
      action: skillAction,
      licenseKey: user.license_key,
      data
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error performing sequence action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}