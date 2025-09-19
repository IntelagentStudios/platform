import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { EmailSequenceSkill } from '@/packages/skills-orchestrator/src/skills/impl/EmailSequenceSkill';
import { PrismaClient } from '@prisma/client';

const sequenceSkill = new EmailSequenceSkill();
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { sequenceId: string } }
) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const result = await sequenceSkill.execute({
      action: 'get_sequence_status',
      licenseKey: user.license_key,
      data: { sequenceId: params.sequenceId }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequence' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sequenceId: string } }
) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const result = await sequenceSkill.execute({
      action: 'update_sequence',
      licenseKey: user.license_key,
      data: {
        sequenceId: params.sequenceId,
        updates: body
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to update sequence' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sequenceId: string } }
) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const result = await sequenceSkill.execute({
      action: 'delete_sequence',
      licenseKey: user.license_key,
      data: { sequenceId: params.sequenceId }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}