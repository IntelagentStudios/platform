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

    // Get user and their product
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Check for sales product
    const salesProduct = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        OR: [
          { product: 'sales-outreach' },
          { product_type: 'sales-agent' }
        ],
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    const licenseKey = user.license_key;

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

    // Get user and their product
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Check for sales product
    const salesProduct = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        OR: [
          { product: 'sales-outreach' },
          { product_type: 'sales-agent' }
        ],
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    const licenseKey = user.license_key;

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