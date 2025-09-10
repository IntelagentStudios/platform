import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Fetch all campaigns for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      license_key: user.license_key
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch campaigns with lead counts
    const campaigns = await prisma.sales_campaigns.findMany({
      where,
      // TODO: Add relations when leads and activities tables are properly configured
      // include: {
      //   _count: {
      //     select: {
      //       leads: true,
      //       activities: true
      //     }
      //   }
      // },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.sales_campaigns.count({ where });

    // Calculate additional metrics
    const enrichedCampaigns = campaigns.map(campaign => {
      const conversionRate = campaign.total_leads > 0 
        ? ((campaign.meetings_booked / campaign.total_leads) * 100).toFixed(2)
        : 0;
      
      const responseRate = campaign.emails_sent > 0
        ? ((campaign.responses_received / campaign.emails_sent) * 100).toFixed(2)
        : 0;

      return {
        ...campaign,
        // TODO: Use actual counts when relations are set up
        lead_count: 0, // campaign._count?.leads || 0,
        activity_count: 0, // campaign._count?.activities || 0,
        conversion_rate: conversionRate,
        response_rate: responseRate
      };
    });

    return NextResponse.json({
      campaigns: enrichedCampaigns,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST: Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sales_outreach product
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        product: 'sales_outreach',
        status: 'active'
      }
    });

    if (!productKey) {
      return NextResponse.json(
        { error: 'Sales Outreach Agent not configured. Please configure the product first.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      campaign_type,
      target_industry,
      target_company_size,
      target_personas,
      daily_send_limit,
      from_email,
      from_name,
      reply_to_email,
      email_templates,
      start_date,
      end_date,
      send_times,
      timezone,
      crm_integration,
      webhook_url,
      enabled_skills
    } = body;

    // Create the campaign
    const campaign = await prisma.sales_campaigns.create({
      data: {
        license_key: user.license_key,
        product_key: productKey.product_key,
        name,
        description,
        campaign_type: campaign_type || 'cold_outreach',
        target_industry,
        target_company_size,
        target_personas,
        daily_send_limit: daily_send_limit || 50,
        from_email: from_email || user.email,
        from_name: from_name || user.name,
        reply_to_email: reply_to_email || from_email || user.email,
        email_templates: email_templates || [],
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        send_times: send_times || { start: '09:00', end: '17:00' },
        timezone: timezone || 'UTC',
        crm_integration,
        webhook_url,
        enabled_skills: enabled_skills || [],
        status: 'draft'
      }
    });

    // Log campaign creation
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'campaign_created',
        resource_type: 'sales_campaign',
        resource_id: campaign.id,
        changes: {
          name: campaign.name,
          type: campaign.campaign_type,
          daily_limit: campaign.daily_send_limit
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      campaign,
      message: 'Campaign created successfully'
    });

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PATCH: Update a campaign
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { campaignId, ...updateData } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Check ownership
    const existingCampaign = await prisma.sales_campaigns.findFirst({
      where: {
        id: campaignId,
        license_key: user.license_key
      }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Handle date conversions
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
    }

    // Update the campaign
    const campaign = await prisma.sales_campaigns.update({
      where: { id: campaignId },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });

    // Log update
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'campaign_updated',
        resource_type: 'sales_campaign',
        resource_id: campaign.id,
        changes: updateData,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      campaign,
      message: 'Campaign updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Check ownership
    const campaign = await prisma.sales_campaigns.findFirst({
      where: {
        id: campaignId,
        license_key: user.license_key
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Delete campaign (cascade will delete related leads and activities)
    await prisma.sales_campaigns.delete({
      where: { id: campaignId }
    });

    // Log deletion
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'campaign_deleted',
        resource_type: 'sales_campaign',
        resource_id: campaignId,
        changes: { name: campaign.name },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Campaign deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}