import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and license key
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    // For now, return empty sequences
    // TODO: Implement actual sequence fetching
    const sequences = [];

    return NextResponse.json({ sequences });
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get user and license key
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // For now, simulate sequence creation
    // TODO: Implement actual sequence creation
    const sequence = {
      id: `seq_${Date.now()}`,
      ...body,
      created_at: new Date()
    };

    return NextResponse.json({ sequence });
  } catch (error) {
    console.error('Error creating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
