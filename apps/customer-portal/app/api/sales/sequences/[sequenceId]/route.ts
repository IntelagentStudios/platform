import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

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

    // Mock implementation - TODO: Replace with actual logic
    return NextResponse.json({
      success: true,
      data: {
        sequenceId: params.sequenceId,
        status: 'active'
      }
    });
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

    // Mock implementation - TODO: Replace with actual logic
    return NextResponse.json({
      success: true,
      data: {
        sequenceId: params.sequenceId,
        ...body
      }
    });
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

    // Mock implementation - TODO: Replace with actual logic
    return NextResponse.json({
      success: true,
      message: 'Sequence deleted'
    });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}