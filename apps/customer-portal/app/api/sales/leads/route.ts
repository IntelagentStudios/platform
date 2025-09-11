import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Fetch leads
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

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      license_key: user.license_key
    };

    if (campaignId) {
      where.campaign_id = campaignId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { company_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch leads with activity counts
    const leads = await prisma.sales_leads.findMany({
      where,
      // TODO: Add includes when relations are set up
      // include: {
      //   campaign: {
      //     select: {
      //       id: true,
      //       name: true,
      //       status: true
      //     }
      //   },
      //   _count: {
      //     select: {
      //       activities: true
      //     }
      //   }
      // },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.sales_leads.count({ where });

    // Get status distribution
    const statusCounts = await prisma.sales_leads.groupBy({
      by: ['status'],
      where: {
        license_key: user.license_key,
        ...(campaignId ? { campaign_id: campaignId } : {})
      },
      _count: true
    });

    return NextResponse.json({
      leads,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      statistics: {
        total: totalCount,
        byStatus: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST: Create or import leads
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

    const body = await request.json();
    const { campaignId, leads, importType } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Verify campaign ownership
    const campaign = await prisma.sales_campaigns.findFirst({
      where: {
        id: campaignId,
        license_key: user.license_key
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Handle bulk import
    if (importType === 'bulk' && Array.isArray(leads)) {
      const createdLeads = [];
      const errors = [];

      for (const leadData of leads) {
        try {
          // Check if lead already exists
          const existingLead = await prisma.sales_leads.findFirst({
            where: {
              campaign_id: campaignId,
              email: leadData.email
            }
          });

          if (existingLead) {
            errors.push({ email: leadData.email, error: 'Already exists' });
            continue;
          }

          // Create lead
          const lead = await prisma.sales_leads.create({
            data: {
              campaign_id: campaignId,
              license_key: user.license_key,
              email: leadData.email,
              first_name: leadData.first_name,
              last_name: leadData.last_name,
              full_name: leadData.full_name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
              phone: leadData.phone,
              linkedin_url: leadData.linkedin_url,
              company_name: leadData.company_name,
              company_domain: leadData.company_domain,
              job_title: leadData.job_title,
              department: leadData.department,
              company_size: leadData.company_size,
              industry: leadData.industry,
              company_linkedin: leadData.company_linkedin,
              custom_fields: leadData.custom_fields,
              tags: leadData.tags,
              notes: leadData.notes
            }
          });

          createdLeads.push(lead);
        } catch (err: any) {
          errors.push({ email: leadData.email, error: err.message });
        }
      }

      // Update campaign lead count
      await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          total_leads: {
            increment: createdLeads.length
          },
          updated_at: new Date()
        }
      });

      // Log import
      await prisma.audit_logs.create({
        data: {
          license_key: user.license_key,
          user_id: user.id,
          action: 'leads_imported',
          resource_type: 'sales_campaign',
          resource_id: campaignId,
          changes: {
            imported: createdLeads.length,
            failed: errors.length
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        success: createdLeads.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${createdLeads.length} leads`
      });
    }

    // Handle single lead creation
    const leadData = body;
    
    // Check if lead already exists
    const existingLead = await prisma.sales_leads.findFirst({
      where: {
        campaign_id: campaignId,
        email: leadData.email
      }
    });

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead with this email already exists in the campaign' },
        { status: 409 }
      );
    }

    const lead = await prisma.sales_leads.create({
      data: {
        campaign_id: campaignId,
        license_key: user.license_key,
        email: leadData.email,
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        full_name: leadData.full_name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
        phone: leadData.phone,
        linkedin_url: leadData.linkedin_url,
        company_name: leadData.company_name,
        company_domain: leadData.company_domain,
        job_title: leadData.job_title,
        department: leadData.department,
        company_size: leadData.company_size,
        industry: leadData.industry,
        company_linkedin: leadData.company_linkedin,
        custom_fields: leadData.custom_fields,
        tags: leadData.tags,
        notes: leadData.notes
      }
    });

    // Update campaign lead count
    await prisma.sales_campaigns.update({
      where: { id: campaignId },
      data: {
        total_leads: {
          increment: 1
        },
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      lead,
      message: 'Lead created successfully'
    });

  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// PATCH: Update a lead
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
    const { leadId, ...updateData } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Check ownership
    const existingLead = await prisma.sales_leads.findFirst({
      where: {
        id: leadId,
        license_key: user.license_key
      }
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Handle status change tracking
    if (updateData.status && updateData.status !== existingLead.status) {
      if (updateData.status === 'qualified') {
        updateData.qualified_at = new Date();
      }
      if (updateData.status === 'contacted' && !existingLead.contacted_at) {
        updateData.contacted_at = new Date();
      }

      // Create activity for status change
      await prisma.sales_activities.create({
        data: {
          campaign_id: existingLead.campaign_id,
          lead_id: leadId,
          license_key: user.license_key,
          activity_type: 'status_changed',
          metadata: {
            from: existingLead.status,
            to: updateData.status
          }
        }
      });
    }

    // Update the lead
    const lead = await prisma.sales_leads.update({
      where: { id: leadId },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      lead,
      message: 'Lead updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE: Delete leads
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
    const leadIds = searchParams.get('ids')?.split(',') || [];

    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs required' }, { status: 400 });
    }

    // Verify ownership of all leads
    const leads = await prisma.sales_leads.findMany({
      where: {
        id: { in: leadIds },
        license_key: user.license_key
      }
    });

    if (leads.length !== leadIds.length) {
      return NextResponse.json({ error: 'Some leads not found or unauthorized' }, { status: 404 });
    }

    // Get campaign IDs for updating counts
    const campaignIds = [...new Set(leads.map(l => l.campaign_id))];

    // Delete leads
    await prisma.sales_leads.deleteMany({
      where: {
        id: { in: leadIds }
      }
    });

    // Update campaign lead counts
    for (const campaignId of campaignIds) {
      const deletedCount = leads.filter(l => l.campaign_id === campaignId).length;
      await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          total_leads: {
            decrement: deletedCount
          },
          updated_at: new Date()
        }
      });
    }

    return NextResponse.json({
      message: `Successfully deleted ${leadIds.length} leads`
    });

  } catch (error: any) {
    console.error('Error deleting leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leads' },
      { status: 500 }
    );
  }
}