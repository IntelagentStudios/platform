import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { CampaignAnalyticsSkill } from '@/packages/skills-orchestrator/src/skills/impl/CampaignAnalyticsSkill';

const prisma = new PrismaClient();
const analyticsSkill = new CampaignAnalyticsSkill();

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
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

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'campaign_performance';
    const dateRange = {
      start: searchParams.get('startDate'),
      end: searchParams.get('endDate')
    };

    const result = await analyticsSkill.execute({
      action: reportType,
      licenseKey: user.license_key,
      data: {
        campaignId: params.campaignId,
        dateRange
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}