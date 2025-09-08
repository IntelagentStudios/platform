import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LeadManagementSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'lead_management',
    name: 'Lead Management System',
    description: 'Manages leads, scoring, qualification, and lifecycle tracking',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['leads', 'sales', 'crm', 'scoring', 'qualification']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, leadId, leadData, filters, licenseKey } = params;

    try {
      switch (action) {
        case 'create_lead':
          return await this.createLead(licenseKey, leadData);
        
        case 'get_leads':
          return await this.getLeads(licenseKey, filters);
        
        case 'get_lead':
          return await this.getLead(leadId);
        
        case 'update_lead':
          return await this.updateLead(leadId, leadData);
        
        case 'delete_lead':
          return await this.deleteLead(leadId);
        
        case 'score_lead':
          return await this.scoreLead(leadId);
        
        case 'qualify_lead':
          return await this.qualifyLead(leadId, leadData);
        
        case 'assign_lead':
          return await this.assignLead(leadId, leadData.assigneeId);
        
        case 'merge_leads':
          return await this.mergeLeads(leadData.primaryId, leadData.duplicateIds);
        
        case 'enrich_lead':
          return await this.enrichLead(leadId);
        
        case 'track_activity':
          return await this.trackLeadActivity(leadId, leadData);
        
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.error(`Lead management error: ${error.message}`);
    }
  }

  private async createLead(licenseKey: string, leadData: any): Promise<SkillResult> {
    try {
      // Check for duplicate
      const existing = await prisma.sales_leads.findFirst({
        where: {
          license_key: licenseKey,
          email: leadData.email
        }
      });

      if (existing) {
        return this.error('Lead with this email already exists', {
          existingLeadId: existing.id
        });
      }

      const lead = await prisma.sales_leads.create({
        data: {
          license_key: licenseKey,
          campaign_id: leadData.campaignId,
          email: leadData.email,
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          full_name: leadData.fullName || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim(),
          phone: leadData.phone,
          company_name: leadData.companyName,
          company_domain: leadData.companyDomain,
          job_title: leadData.jobTitle,
          department: leadData.department,
          company_size: leadData.companySize,
          industry: leadData.industry,
          linkedin_url: leadData.linkedinUrl,
          company_linkedin: leadData.companyLinkedin,
          status: 'new',
          lead_score: 0,
          custom_fields: {
            ...leadData.customFields,
            location: leadData.location,
            timezone: leadData.timezone,
            source: leadData.source || 'manual'
          },
          tags: leadData.tags || [],
          notes: leadData.notes
        }
      });

      // Track creation activity
      await prisma.sales_activities.create({
        data: {
          lead_id: lead.id,
          campaign_id: leadData.campaignId,
          license_key: licenseKey,
          activity_type: 'lead_created',
          metadata: {
            source: leadData.source || 'manual'
          }
        }
      });

      return this.success({
        leadId: lead.id,
        lead,
        message: 'Lead created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create lead: ${error.message}`);
    }
  }

  private async getLeads(licenseKey: string, filters: any = {}): Promise<SkillResult> {
    try {
      const where: any = {
        license_key: licenseKey
      };

      // Apply filters
      if (filters.campaignId) where.campaign_id = filters.campaignId;
      if (filters.status) where.status = filters.status;
      if (filters.minScore) where.lead_score = { gte: filters.minScore };
      if (filters.source) where.source = filters.source;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { full_name: { contains: filters.search, mode: 'insensitive' } },
          { company_name: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const leads = await prisma.sales_leads.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              activities: true
            }
          }
        },
        orderBy: filters.sortBy || { created_at: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      });

      const total = await prisma.sales_leads.count({ where });

      // Get status distribution
      const statusCounts = await prisma.sales_leads.groupBy({
        by: ['status'],
        where: { license_key: licenseKey },
        _count: true
      });

      return this.success({
        leads,
        pagination: {
          total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMore: (filters.offset || 0) + leads.length < total
        },
        statistics: {
          total,
          byStatus: statusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    } catch (error: any) {
      return this.error(`Failed to fetch leads: ${error.message}`);
    }
  }

  private async getLead(leadId: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId },
        include: {
          campaign: true,
          activities: {
            orderBy: { created_at: 'desc' },
            take: 20
          }
        }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      return this.success({
        lead,
        timeline: lead.activities
      });
    } catch (error: any) {
      return this.error(`Failed to fetch lead: ${error.message}`);
    }
  }

  private async updateLead(leadId: string, updates: any): Promise<SkillResult> {
    try {
      const existingLead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!existingLead) {
        return this.error('Lead not found');
      }

      const lead = await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      // Track significant changes
      if (updates.status && updates.status !== existingLead.status) {
        await prisma.sales_activities.create({
          data: {
            lead_id: leadId,
            campaign_id: lead.campaign_id,
            license_key: lead.license_key,
            activity_type: 'status_changed',
            metadata: {
              from: existingLead.status,
              to: updates.status
            }
          }
        });
      }

      return this.success({
        lead,
        message: 'Lead updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update lead: ${error.message}`);
    }
  }

  private async deleteLead(leadId: string): Promise<SkillResult> {
    try {
      // Delete related activities first
      await prisma.sales_activities.deleteMany({
        where: { lead_id: leadId }
      });

      await prisma.sales_leads.delete({
        where: { id: leadId }
      });

      return this.success({
        message: 'Lead deleted successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to delete lead: ${error.message}`);
    }
  }

  private async scoreLead(leadId: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId },
        include: {
          activities: true
        }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Calculate lead score based on various factors
      let score = 0;

      // Email engagement
      if (lead.emails_opened > 0) score += 10;
      if (lead.emails_clicked > 0) score += 20;
      if (lead.last_response) score += 30;

      // Profile completeness
      if (lead.phone) score += 5;
      if (lead.company_name) score += 10;
      if (lead.job_title) score += 10;
      if (lead.linkedin_url) score += 5;

      // Activity level
      const recentActivities = lead.activities.filter(a => {
        const daysSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      score += Math.min(recentActivities.length * 5, 25);

      // Company size bonus
      if (lead.company_size) {
        const sizeMap: Record<string, number> = {
          'enterprise': 20,
          'mid-market': 15,
          'small-business': 10,
          'startup': 5
        };
        score += sizeMap[lead.company_size] || 0;
      }

      // Update lead score
      await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          lead_score: score,
          updated_at: new Date()
        }
      });

      return this.success({
        leadId,
        score,
        factors: {
          engagement: (lead.emails_opened > 0) || (lead.emails_clicked > 0) || !!lead.last_response,
          profileCompleteness: !!(lead.phone && lead.company_name && lead.job_title),
          activityLevel: recentActivities.length,
          companySize: lead.company_size
        },
        message: `Lead scored: ${score} points`
      });
    } catch (error: any) {
      return this.error(`Failed to score lead: ${error.message}`);
    }
  }

  private async qualifyLead(leadId: string, criteria: any): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Apply qualification criteria
      const qualified = 
        (criteria.minScore ? lead.lead_score >= criteria.minScore : true) &&
        (criteria.hasEmail ? !!lead.email : true) &&
        (criteria.hasCompany ? !!lead.company_name : true) &&
        (criteria.hasEngagement ? (lead.emails_opened > 0 || !!lead.last_response) : true);

      const newStatus = qualified ? 'qualified' : 'unqualified';

      await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          status: newStatus,
          qualified_at: qualified ? new Date() : null,
          updated_at: new Date()
        }
      });

      // Track qualification
      await prisma.sales_activities.create({
        data: {
          lead_id: leadId,
          campaign_id: lead.campaign_id,
          license_key: lead.license_key,
          activity_type: 'lead_qualified',
          metadata: {
            qualified,
            criteria,
            score: lead.lead_score
          }
        }
      });

      return this.success({
        leadId,
        qualified,
        status: newStatus,
        message: `Lead ${qualified ? 'qualified' : 'not qualified'}`
      });
    } catch (error: any) {
      return this.error(`Failed to qualify lead: ${error.message}`);
    }
  }

  private async assignLead(leadId: string, assigneeId: string): Promise<SkillResult> {
    try {
      // Get existing lead to preserve custom_fields
      const existingLead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });
      
      if (!existingLead) {
        return this.error('Lead not found');
      }

      const lead = await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          custom_fields: {
            ...(existingLead.custom_fields as any || {}),
            assigned_to: assigneeId,
            assigned_at: new Date().toISOString()
          },
          updated_at: new Date()
        }
      });

      // Track assignment
      await prisma.sales_activities.create({
        data: {
          lead_id: leadId,
          campaign_id: lead.campaign_id,
          license_key: lead.license_key,
          activity_type: 'lead_assigned',
          metadata: {
            assigneeId
          }
        }
      });

      return this.success({
        lead,
        message: `Lead assigned to ${assigneeId}`
      });
    } catch (error: any) {
      return this.error(`Failed to assign lead: ${error.message}`);
    }
  }

  private async mergeLeads(primaryId: string, duplicateIds: string[]): Promise<SkillResult> {
    try {
      const primaryLead = await prisma.sales_leads.findUnique({
        where: { id: primaryId }
      });

      if (!primaryLead) {
        return this.error('Primary lead not found');
      }

      // Get all duplicate leads
      const duplicates = await prisma.sales_leads.findMany({
        where: { id: { in: duplicateIds } }
      });

      // Merge data (keep non-null values from duplicates)
      const mergedData: any = { ...primaryLead };
      duplicates.forEach(dup => {
        Object.keys(dup).forEach(key => {
          if (!mergedData[key] && dup[key as keyof typeof dup]) {
            mergedData[key] = dup[key as keyof typeof dup];
          }
        });
      });

      // Update primary lead with merged data
      await prisma.sales_leads.update({
        where: { id: primaryId },
        data: {
          ...mergedData,
          updated_at: new Date()
        }
      });

      // Move activities to primary lead
      await prisma.sales_activities.updateMany({
        where: { lead_id: { in: duplicateIds } },
        data: { lead_id: primaryId }
      });

      // Delete duplicates
      await prisma.sales_leads.deleteMany({
        where: { id: { in: duplicateIds } }
      });

      return this.success({
        mergedLeadId: primaryId,
        mergedCount: duplicateIds.length,
        message: `Merged ${duplicateIds.length} duplicate leads`
      });
    } catch (error: any) {
      return this.error(`Failed to merge leads: ${error.message}`);
    }
  }

  private async enrichLead(leadId: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Simulate enrichment (in production, this would call external APIs)
      const enrichedData = {
        company_size: lead.company_size || 'small-business',
        industry: lead.industry || 'Technology',
        annual_revenue: '$1M - $10M',
        employee_count: '50-200',
        technologies: ['React', 'Node.js', 'AWS'],
        social_profiles: {
          twitter: `https://twitter.com/${lead.company_name?.toLowerCase().replace(/\s/g, '')}`,
          facebook: `https://facebook.com/${lead.company_name?.toLowerCase().replace(/\s/g, '')}`
        }
      };

      await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          company_size: enrichedData.company_size,
          industry: enrichedData.industry,
          custom_fields: {
            ...(lead.custom_fields as any || {}),
            enriched: enrichedData
          },
          updated_at: new Date()
        }
      });

      return this.success({
        leadId,
        enrichedData,
        message: 'Lead enriched successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to enrich lead: ${error.message}`);
    }
  }

  private async trackLeadActivity(leadId: string, activityData: any): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      const activity = await prisma.sales_activities.create({
        data: {
          lead_id: leadId,
          campaign_id: lead.campaign_id,
          license_key: lead.license_key,
          activity_type: activityData.type,
          metadata: activityData.metadata || {},
          created_at: new Date()
        }
      });

      // Update lead based on activity type
      const updates: any = {};
      if (activityData.type === 'email_opened') {
        updates.emails_opened = (lead.emails_opened || 0) + 1;
        updates.last_email_opened = new Date();
        updates.updated_at = new Date();
      } else if (activityData.type === 'email_clicked') {
        updates.emails_clicked = (lead.emails_clicked || 0) + 1;
        updates.updated_at = new Date();
      } else if (activityData.type === 'replied') {
        updates.last_response = new Date();
        updates.updated_at = new Date();
      }

      if (Object.keys(updates).length > 0) {
        await prisma.sales_leads.update({
          where: { id: leadId },
          data: updates
        });
      }

      return this.success({
        activity,
        message: 'Activity tracked successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to track activity: ${error.message}`);
    }
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'create_lead', 'get_leads', 'get_lead', 'update_lead', 'delete_lead',
      'score_lead', 'qualify_lead', 'assign_lead', 'merge_leads', 'enrich_lead',
      'track_activity'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}