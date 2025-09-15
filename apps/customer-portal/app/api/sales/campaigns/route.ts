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

    // Get user's license
    const license = await prisma.licenses.findFirst({
      where: {
        email: session.email,
        status: 'active',
        products: {
          has: 'Sales Outreach Agent'
        }
      }
    });

    if (!license) {
      return NextResponse.json({ error: 'No active sales license' }, { status: 403 });
    }

    const licenseKey = license.license_key;

    // Get campaigns
    const campaigns = await prisma.sales_campaigns.findMany({
      where: { license_key: licenseKey },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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

    // Get user's license
    const license = await prisma.licenses.findFirst({
      where: {
        email: session.email,
        status: 'active',
        products: {
          has: 'Sales Outreach Agent'
        }
      }
    });

    if (!license) {
      return NextResponse.json({ error: 'No active sales license' }, { status: 403 });
    }

    const licenseKey = license.license_key;

    // Create campaign using Prisma directly
    const campaign = await prisma.sales_campaigns.create({
      data: {
        license_key: licenseKey,
        name: body.name,
        description: body.description,
        campaign_type: body.type,
        target_criteria: body.targetCriteria || {},
        email_templates: body.emailTemplates || [],
        sequence_steps: body.sequence?.steps || [],
        settings: {
          emailSettings: body.emailSettings,
          schedule: body.schedule
        },
        status: 'draft',
        created_by: session.email
      }
    });

    return NextResponse.json({
      campaignId: campaign.id,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}