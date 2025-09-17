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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

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
        product: 'sales-outreach',
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    const licenseKey = user.license_key;

    // Build where clause
    const whereClause: any = {
      license_key: licenseKey
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { company_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalCount = await prisma.sales_leads.count({
      where: whereClause
    });

    // Get paginated leads
    const leads = await prisma.sales_leads.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    // Format leads for frontend
    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      email: lead.email,
      firstName: lead.first_name || '',
      lastName: lead.last_name || '',
      fullName: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
      companyName: lead.company_name || '',
      jobTitle: lead.job_title || '',
      status: lead.status,
      score: lead.score || 0,
      emailsSent: lead.emails_sent || 0,
      emailsOpened: lead.emails_opened || 0,
      lastContacted: lead.last_contacted_at,
      createdAt: lead.created_at
    }));

    return NextResponse.json({
      leads: formattedLeads,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
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
        product: 'sales-outreach',
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    const licenseKey = user.license_key;

    // Create lead
    const lead = await prisma.sales_leads.create({
      data: {
        license_key: licenseKey,
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        full_name: body.fullName || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
        company_name: body.companyName,
        company_domain: body.companyDomain,
        job_title: body.jobTitle,
        department: body.department,
        phone: body.phone,
        linkedin_url: body.linkedinUrl,
        city: body.city,
        state: body.state,
        country: body.country,
        industry: body.industry,
        company_size: body.companySize,
        source: body.source || 'manual',
        campaign_id: body.campaignId,
        status: 'new',
        tags: body.tags || []
      }
    });

    return NextResponse.json({
      leadId: lead.id,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}