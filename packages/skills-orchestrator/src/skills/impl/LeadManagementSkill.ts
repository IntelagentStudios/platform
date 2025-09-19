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
    version: '2.0.0',
    author: 'Intelagent Platform',
    tags: ['leads', 'sales', 'crm', 'scoring', 'qualification']
  };

  validate(params: SkillParams): boolean {
    const { action, licenseKey } = params;
    if (!licenseKey) return false;

    const validActions = [
      'create_lead', 'get_leads', 'get_lead', 'update_lead', 'delete_lead',
      'score_lead', 'qualify_lead', 'bulk_import', 'bulk_update', 'assign_to_campaign',
      'get_lead_timeline', 'add_note', 'add_tag', 'remove_tag', 'search_leads',
      'duplicate_check', 'merge_leads', 'export_leads'
    ];

    return validActions.includes(action);
  }

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!this.validate(params)) {
      return this.error('Invalid parameters or action');
    }

    try {
      switch (action) {
        case 'create_lead':
          return await this.createLead(licenseKey, data);
        case 'get_leads':
          return await this.getLeads(licenseKey, data);
        case 'get_lead':
          return await this.getLead(data.leadId);
        case 'update_lead':
          return await this.updateLead(data.leadId, data.updates);
        case 'delete_lead':
          return await this.deleteLead(data.leadId);
        case 'score_lead':
          return await this.scoreLead(data.leadId);
        case 'qualify_lead':
          return await this.qualifyLead(data.leadId, data.criteria);
        case 'bulk_import':
          return await this.bulkImportLeads(licenseKey, data.leads);
        case 'bulk_update':
          return await this.bulkUpdateLeads(data.leadIds, data.updates);
        case 'assign_to_campaign':
          return await this.assignToCampaign(data.leadIds, data.campaignId);
        case 'get_lead_timeline':
          return await this.getLeadTimeline(data.leadId);
        case 'add_note':
          return await this.addNote(data.leadId, data.note);
        case 'add_tag':
          return await this.addTag(data.leadId, data.tag);
        case 'remove_tag':
          return await this.removeTag(data.leadId, data.tag);
        case 'search_leads':
          return await this.searchLeads(licenseKey, data.query);
        case 'duplicate_check':
          return await this.checkDuplicates(licenseKey, data.email);
        case 'merge_leads':
          return await this.mergeLeads(data.primaryLeadId, data.duplicateLeadIds);
        case 'export_leads':
          return await this.exportLeads(licenseKey, data.filters);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in LeadManagementSkill: ${error.message}`, 'error');
      return this.error(error.message);
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
        return this.error('Lead with this email already exists', { existingId: existing.id });
      }

      const lead = await prisma.sales_leads.create({
        data: {
          license_key: licenseKey,
          email: leadData.email,
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          full_name: leadData.fullName || `${leadData.firstName} ${leadData.lastName}`.trim(),
          phone: leadData.phone,
          linkedin_url: leadData.linkedinUrl,
          company_name: leadData.companyName,
          company_domain: leadData.companyDomain,
          company_size: leadData.companySize,
          industry: leadData.industry,
          job_title: leadData.jobTitle,
          department: leadData.department,
          city: leadData.city,
          state: leadData.state,
          country: leadData.country,
          timezone: leadData.timezone,
          status: leadData.status || 'new',
          score: 0,
          tags: leadData.tags || [],
          source: leadData.source,
          source_details: leadData.sourceDetails || {},
          custom_fields: leadData.customFields || {},
          campaign_id: leadData.campaignId
        }
      });

      // Log activity
      await prisma.sales_activities.create({
        data: {
          license_key: licenseKey,
          lead_id: lead.id,
          activity_type: 'lead_created',
          subject: 'Lead created',
          metadata: { leadData },
          skill_used: this.metadata.id
        }
      });

      return this.success({
        leadId: lead.id,
        email: lead.email,
        message: 'Lead created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create lead: ${error.message}`);
    }
  }

  private async getLeads(licenseKey: string, filters: any = {}): Promise<SkillResult> {
    try {
      const where: any = { license_key: licenseKey };

      if (filters.campaignId) where.campaign_id = filters.campaignId;
      if (filters.status) where.status = filters.status;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }
      if (filters.scoreMin) where.score = { gte: filters.scoreMin };
      if (filters.scoreMax) where.score = { ...where.score, lte: filters.scoreMax };
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { full_name: { contains: filters.search, mode: 'insensitive' } },
          { company_name: { contains: filters.search, mode: 'insensitive' } },
          { job_title: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const leads = await prisma.sales_leads.findMany({
        where,
        orderBy: filters.orderBy || { created_at: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          campaign: true,
          activities: {
            orderBy: { performed_at: 'desc' },
            take: 5
          },
          sequences: {
            where: { status: 'active' }
          }
        }
      });

      const count = await prisma.sales_leads.count({ where });

      return this.success({
        leads,
        total: count,
        limit: filters.limit || 100,
        offset: filters.offset || 0
      });
    } catch (error: any) {
      return this.error(`Failed to get leads: ${error.message}`);
    }
  }

  private async getLead(leadId: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId },
        include: {
          campaign: true,
          activities: {
            orderBy: { performed_at: 'desc' }
          },
          sequences: true
        }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      return this.success({ lead });
    } catch (error: any) {
      return this.error(`Failed to get lead: ${error.message}`);
    }
  }

  private async updateLead(leadId: string, updates: any): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          full_name: updates.fullName,
          phone: updates.phone,
          linkedin_url: updates.linkedinUrl,
          company_name: updates.companyName,
          company_domain: updates.companyDomain,
          company_size: updates.companySize,
          industry: updates.industry,
          job_title: updates.jobTitle,
          department: updates.department,
          city: updates.city,
          state: updates.state,
          country: updates.country,
          timezone: updates.timezone,
          status: updates.status,
          score: updates.score,
          tags: updates.tags,
          custom_fields: updates.customFields,
          updated_at: new Date()
        }
      });

      // Log activity
      await prisma.sales_activities.create({
        data: {
          license_key: lead.license_key,
          lead_id: leadId,
          activity_type: 'lead_updated',
          subject: 'Lead information updated',
          metadata: { updates },
          skill_used: this.metadata.id
        }
      });

      return this.success({
        leadId: lead.id,
        message: 'Lead updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update lead: ${error.message}`);
    }
  }

  private async deleteLead(leadId: string): Promise<SkillResult> {
    try {
      await prisma.sales_leads.delete({
        where: { id: leadId }
      });

      return this.success({ message: 'Lead deleted successfully' });
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

      // Calculate score based on various factors
      let score = 0;

      // Email engagement scoring
      const emailActivities = lead.activities.filter((a: any) =>
        ['email_opened', 'link_clicked', 'replied'].includes(a.activity_type)
      );
      score += emailActivities.length * 10;

      // Profile completeness scoring
      if (lead.job_title) score += 15;
      if (lead.company_name) score += 15;
      if (lead.phone) score += 10;
      if (lead.linkedin_url) score += 10;

      // Company fit scoring
      if (lead.company_size && ['50-200', '200-1000', '1000+'].includes(lead.company_size)) {
        score += 20;
      }

      // Activity recency scoring
      if (lead.last_engaged_at) {
        const daysSinceEngagement = Math.floor(
          (Date.now() - new Date(lead.last_engaged_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceEngagement < 7) score += 25;
        else if (daysSinceEngagement < 30) score += 15;
        else if (daysSinceEngagement < 90) score += 5;
      }

      // Update lead score
      await prisma.sales_leads.update({
        where: { id: leadId },
        data: { score }
      });

      return this.success({
        leadId,
        score,
        factors: {
          emailEngagement: emailActivities.length * 10,
          profileCompleteness: (lead.job_title ? 15 : 0) + (lead.company_name ? 15 : 0),
          companyFit: lead.company_size ? 20 : 0
        }
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

      // Default qualification criteria
      const qualificationCriteria = criteria || {
        minScore: 50,
        requiredFields: ['email', 'company_name', 'job_title'],
        excludeStatuses: ['unqualified', 'lost']
      };

      let qualified = true;
      const reasons: string[] = [];

      // Check score
      if (lead.score && lead.score < qualificationCriteria.minScore) {
        qualified = false;
        reasons.push(`Score ${lead.score} is below minimum ${qualificationCriteria.minScore}`);
      }

      // Check required fields
      for (const field of qualificationCriteria.requiredFields) {
        if (!lead[field as keyof typeof lead]) {
          qualified = false;
          reasons.push(`Missing required field: ${field}`);
        }
      }

      // Check status
      if (qualificationCriteria.excludeStatuses.includes(lead.status)) {
        qualified = false;
        reasons.push(`Lead status is ${lead.status}`);
      }

      // Update lead status
      const newStatus = qualified ? 'qualified' : 'unqualified';
      await prisma.sales_leads.update({
        where: { id: leadId },
        data: { status: newStatus }
      });

      // Log activity
      await prisma.sales_activities.create({
        data: {
          license_key: lead.license_key,
          lead_id: leadId,
          activity_type: 'lead_qualified',
          subject: `Lead ${qualified ? 'qualified' : 'disqualified'}`,
          metadata: { criteria: qualificationCriteria, reasons },
          skill_used: this.metadata.id
        }
      });

      return this.success({
        leadId,
        qualified,
        status: newStatus,
        reasons
      });
    } catch (error: any) {
      return this.error(`Failed to qualify lead: ${error.message}`);
    }
  }

  private async bulkImportLeads(licenseKey: string, leadsData: any[]): Promise<SkillResult> {
    try {
      const results = {
        imported: 0,
        failed: 0,
        duplicates: 0,
        errors: [] as any[]
      };

      for (const leadData of leadsData) {
        try {
          // Check for duplicate
          const existing = await prisma.sales_leads.findFirst({
            where: {
              license_key: licenseKey,
              email: leadData.email
            }
          });

          if (existing) {
            results.duplicates++;
            continue;
          }

          await prisma.sales_leads.create({
            data: {
              license_key: licenseKey,
              email: leadData.email,
              first_name: leadData.firstName,
              last_name: leadData.lastName,
              full_name: leadData.fullName || `${leadData.firstName} ${leadData.lastName}`.trim(),
              phone: leadData.phone,
              linkedin_url: leadData.linkedinUrl,
              company_name: leadData.companyName,
              company_domain: leadData.companyDomain,
              company_size: leadData.companySize,
              industry: leadData.industry,
              job_title: leadData.jobTitle,
              department: leadData.department,
              city: leadData.city,
              state: leadData.state,
              country: leadData.country,
              timezone: leadData.timezone,
              status: leadData.status || 'new',
              score: 0,
              tags: leadData.tags || [],
              source: leadData.source || 'import',
              source_details: leadData.sourceDetails || {},
              custom_fields: leadData.customFields || {},
              campaign_id: leadData.campaignId
            }
          });

          results.imported++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            email: leadData.email,
            error: error.message
          });
        }
      }

      return this.success({
        message: 'Bulk import completed',
        results
      });
    } catch (error: any) {
      return this.error(`Failed to import leads: ${error.message}`);
    }
  }

  private async bulkUpdateLeads(leadIds: string[], updates: any): Promise<SkillResult> {
    try {
      const result = await prisma.sales_leads.updateMany({
        where: { id: { in: leadIds } },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      return this.success({
        message: 'Leads updated successfully',
        count: result.count
      });
    } catch (error: any) {
      return this.error(`Failed to update leads: ${error.message}`);
    }
  }

  private async assignToCampaign(leadIds: string[], campaignId: string): Promise<SkillResult> {
    try {
      const result = await prisma.sales_leads.updateMany({
        where: { id: { in: leadIds } },
        data: {
          campaign_id: campaignId,
          updated_at: new Date()
        }
      });

      return this.success({
        message: 'Leads assigned to campaign',
        count: result.count,
        campaignId
      });
    } catch (error: any) {
      return this.error(`Failed to assign leads: ${error.message}`);
    }
  }

  private async getLeadTimeline(leadId: string): Promise<SkillResult> {
    try {
      const activities = await prisma.sales_activities.findMany({
        where: { lead_id: leadId },
        orderBy: { performed_at: 'desc' },
        include: {
          campaign: true
        }
      });

      return this.success({
        leadId,
        activities,
        count: activities.length
      });
    } catch (error: any) {
      return this.error(`Failed to get timeline: ${error.message}`);
    }
  }

  private async addNote(leadId: string, note: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      const activity = await prisma.sales_activities.create({
        data: {
          license_key: lead.license_key,
          lead_id: leadId,
          activity_type: 'note_added',
          subject: 'Note added',
          content: note,
          skill_used: this.metadata.id
        }
      });

      return this.success({
        message: 'Note added successfully',
        activityId: activity.id
      });
    } catch (error: any) {
      return this.error(`Failed to add note: ${error.message}`);
    }
  }

  private async addTag(leadId: string, tag: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      const updatedTags = [...(lead.tags || []), tag];

      await prisma.sales_leads.update({
        where: { id: leadId },
        data: { tags: updatedTags }
      });

      return this.success({
        message: 'Tag added successfully',
        tags: updatedTags
      });
    } catch (error: any) {
      return this.error(`Failed to add tag: ${error.message}`);
    }
  }

  private async removeTag(leadId: string, tag: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      const updatedTags = (lead.tags || []).filter((t: string) => t !== tag);

      await prisma.sales_leads.update({
        where: { id: leadId },
        data: { tags: updatedTags }
      });

      return this.success({
        message: 'Tag removed successfully',
        tags: updatedTags
      });
    } catch (error: any) {
      return this.error(`Failed to remove tag: ${error.message}`);
    }
  }

  private async searchLeads(licenseKey: string, query: string): Promise<SkillResult> {
    try {
      const leads = await prisma.sales_leads.findMany({
        where: {
          license_key: licenseKey,
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { full_name: { contains: query, mode: 'insensitive' } },
            { company_name: { contains: query, mode: 'insensitive' } },
            { job_title: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } }
          ]
        },
        take: 50,
        orderBy: { score: 'desc' }
      });

      return this.success({
        query,
        results: leads,
        count: leads.length
      });
    } catch (error: any) {
      return this.error(`Failed to search leads: ${error.message}`);
    }
  }

  private async checkDuplicates(licenseKey: string, email: string): Promise<SkillResult> {
    try {
      const duplicates = await prisma.sales_leads.findMany({
        where: {
          license_key: licenseKey,
          email: email
        }
      });

      return this.success({
        email,
        hasDuplicates: duplicates.length > 0,
        duplicates
      });
    } catch (error: any) {
      return this.error(`Failed to check duplicates: ${error.message}`);
    }
  }

  private async mergeLeads(primaryLeadId: string, duplicateLeadIds: string[]): Promise<SkillResult> {
    try {
      const primaryLead = await prisma.sales_leads.findUnique({
        where: { id: primaryLeadId }
      });

      if (!primaryLead) {
        return this.error('Primary lead not found');
      }

      // Move all activities to primary lead
      await prisma.sales_activities.updateMany({
        where: { lead_id: { in: duplicateLeadIds } },
        data: { lead_id: primaryLeadId }
      });

      // Move all sequences to primary lead
      await prisma.sales_sequences.updateMany({
        where: { lead_id: { in: duplicateLeadIds } },
        data: { lead_id: primaryLeadId }
      });

      // Delete duplicate leads
      await prisma.sales_leads.deleteMany({
        where: { id: { in: duplicateLeadIds } }
      });

      return this.success({
        message: 'Leads merged successfully',
        primaryLeadId,
        mergedCount: duplicateLeadIds.length
      });
    } catch (error: any) {
      return this.error(`Failed to merge leads: ${error.message}`);
    }
  }

  private async exportLeads(licenseKey: string, filters: any = {}): Promise<SkillResult> {
    try {
      const where: any = { license_key: licenseKey };

      if (filters.campaignId) where.campaign_id = filters.campaignId;
      if (filters.status) where.status = filters.status;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      const leads = await prisma.sales_leads.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });

      // Convert to CSV format
      const headers = [
        'Email', 'First Name', 'Last Name', 'Company', 'Job Title',
        'Phone', 'Status', 'Score', 'Tags', 'Created At'
      ];

      const rows = leads.map(lead => [
        lead.email,
        lead.first_name || '',
        lead.last_name || '',
        lead.company_name || '',
        lead.job_title || '',
        lead.phone || '',
        lead.status || '',
        lead.score?.toString() || '0',
        (lead.tags || []).join(', '),
        lead.created_at?.toISOString() || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return this.success({
        format: 'csv',
        data: csv,
        count: leads.length
      });
    } catch (error: any) {
      return this.error(`Failed to export leads: ${error.message}`);
    }
  }
}