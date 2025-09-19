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

    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Get recent activities
    const activities = await prisma.sales_activities.findMany({
      where: {
        license_key: user.license_key
      },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            full_name: true,
            company_name: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        performed_at: 'desc'
      },
      take: 50
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}