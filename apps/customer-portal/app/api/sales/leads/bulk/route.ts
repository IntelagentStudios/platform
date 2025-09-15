import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, leadIds, leads } = body;

    // Get user's license
    const license = await prisma.licenses.findFirst({
      where: {
        email: session.email,
        products: { has: 'Sales Outreach Agent' },
        status: 'active'
      }
    });

    if (!license) {
      return NextResponse.json({ error: 'No active sales license' }, { status: 403 });
    }

    const licenseKey = license.license_key;

    switch (action) {
      case 'import': {
        // Bulk import leads
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[]
        };

        // Process leads in batches
        for (const leadData of leads) {
          try {
            // Check if email already exists
            const existingLead = await prisma.sales_leads.findFirst({
              where: {
                license_key: licenseKey,
                email: leadData.email
              }
            });

            if (existingLead) {
              // Update existing lead
              await prisma.sales_leads.update({
                where: { id: existingLead.id },
                data: {
                  first_name: leadData.firstName || existingLead.first_name,
                  last_name: leadData.lastName || existingLead.last_name,
                  full_name: leadData.fullName || existingLead.full_name,
                  company_name: leadData.companyName || existingLead.company_name,
                  company_domain: leadData.companyDomain || existingLead.company_domain,
                  job_title: leadData.jobTitle || existingLead.job_title,
                  department: leadData.department || existingLead.department,
                  phone: leadData.phone || existingLead.phone,
                  linkedin_url: leadData.linkedinUrl || existingLead.linkedin_url,
                  city: leadData.city || existingLead.city,
                  state: leadData.state || existingLead.state,
                  country: leadData.country || existingLead.country,
                  industry: leadData.industry || existingLead.industry,
                  company_size: leadData.companySize || existingLead.company_size,
                  tags: leadData.tags || existingLead.tags,
                  updated_at: new Date()
                }
              });
            } else {
              // Create new lead
              await prisma.sales_leads.create({
                data: {
                  license_key: licenseKey,
                  email: leadData.email,
                  first_name: leadData.firstName || null,
                  last_name: leadData.lastName || null,
                  full_name: leadData.fullName || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim() || null,
                  company_name: leadData.companyName || null,
                  company_domain: leadData.companyDomain || null,
                  job_title: leadData.jobTitle || null,
                  department: leadData.department || null,
                  phone: leadData.phone || null,
                  linkedin_url: leadData.linkedinUrl || null,
                  city: leadData.city || null,
                  state: leadData.state || null,
                  country: leadData.country || null,
                  industry: leadData.industry || null,
                  company_size: leadData.companySize || null,
                  source: leadData.source || 'import',
                  campaign_id: leadData.campaignId || null,
                  status: 'new',
                  tags: leadData.tags || []
                }
              });
            }

            results.success++;
          } catch (error: any) {
            results.failed++;
            results.errors.push(`${leadData.email}: ${error.message}`);
          }
        }

        return NextResponse.json(results);
      }

      case 'delete': {
        // Bulk delete leads
        const deleteResult = await prisma.sales_leads.deleteMany({
          where: {
            license_key: licenseKey,
            id: { in: leadIds }
          }
        });

        return NextResponse.json({
          deleted: deleteResult.count,
          message: `Deleted ${deleteResult.count} leads`
        });
      }

      case 'add_to_campaign': {
        // Add leads to campaign
        const { campaignId } = body;

        const updateResult = await prisma.sales_leads.updateMany({
          where: {
            license_key: licenseKey,
            id: { in: leadIds }
          },
          data: {
            campaign_id: campaignId,
            updated_at: new Date()
          }
        });

        return NextResponse.json({
          updated: updateResult.count,
          message: `Added ${updateResult.count} leads to campaign`
        });
      }

      case 'update_status': {
        // Update lead status
        const { status } = body;

        const updateResult = await prisma.sales_leads.updateMany({
          where: {
            license_key: licenseKey,
            id: { in: leadIds }
          },
          data: {
            status,
            updated_at: new Date()
          }
        });

        return NextResponse.json({
          updated: updateResult.count,
          message: `Updated status for ${updateResult.count} leads`
        });
      }

      case 'export': {
        // Export leads
        const exportLeads = await prisma.sales_leads.findMany({
          where: {
            license_key: licenseKey,
            id: { in: leadIds }
          }
        });

        // Format for CSV export
        const formattedLeads = exportLeads.map(lead => ({
          email: lead.email,
          firstName: lead.first_name,
          lastName: lead.last_name,
          fullName: lead.full_name,
          companyName: lead.company_name,
          companyDomain: lead.company_domain,
          jobTitle: lead.job_title,
          department: lead.department,
          phone: lead.phone,
          linkedinUrl: lead.linkedin_url,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          industry: lead.industry,
          companySize: lead.company_size,
          status: lead.status,
          score: lead.score,
          source: lead.source,
          tags: lead.tags?.join(', '),
          createdAt: lead.created_at,
          lastContactedAt: lead.last_contacted_at
        }));

        return NextResponse.json({
          leads: formattedLeads,
          count: formattedLeads.length
        });
      }

      case 'enrich': {
        // Enrich lead data (placeholder - would integrate with enrichment service)
        const enrichmentOptions = body.enrichmentOptions || {
          companyInfo: true,
          socialProfiles: true,
          contactDetails: true,
          techStack: false
        };

        // Simulate enrichment
        const enrichedCount = leadIds.length;
        const creditsUsed = enrichedCount * 2;

        return NextResponse.json({
          enriched: enrichedCount,
          creditsUsed,
          message: `Enriched ${enrichedCount} leads using ${creditsUsed} credits`
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk lead operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}