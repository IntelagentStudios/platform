import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SalesOutreachSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'sales_outreach',
    name: 'Sales Outreach Manager',
    description: 'Manages sales outreach campaigns, email sequences, and lead engagement',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['sales', 'outreach', 'campaigns', 'email', 'automation']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, campaignId, campaignData, leadData, emailData, licenseKey } = params;

    try {
      switch (action) {
        case 'create_campaign':
          return await this.createCampaign(licenseKey, campaignData);
        
        case 'get_campaigns':
          return await this.getCampaigns(licenseKey);
        
        case 'get_campaign':
          return await this.getCampaign(campaignId);
        
        case 'update_campaign':
          return await this.updateCampaign(campaignId, campaignData);
        
        case 'delete_campaign':
          return await this.deleteCampaign(campaignId);
        
        case 'start_campaign':
          return await this.startCampaign(campaignId);
        
        case 'pause_campaign':
          return await this.pauseCampaign(campaignId);
        
        case 'add_leads':
          return await this.addLeadsToCampaign(campaignId, leadData);
        
        case 'send_email':
          return await this.sendOutreachEmail(campaignId, emailData);
        
        case 'get_analytics':
          return await this.getCampaignAnalytics(campaignId);
        
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.error(`Sales outreach error: ${error.message}`);
    }
  }

  private async createCampaign(licenseKey: string, campaignData: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.create({
        data: {
          license_key: licenseKey,
          name: campaignData.name,
          description: campaignData.description,
          type: campaignData.type || 'email',
          status: 'draft',
          settings: campaignData.settings || {},
          email_templates: campaignData.emailTemplates || [],
          target_criteria: campaignData.targetCriteria || {},
          schedule_settings: campaignData.scheduleSettings || {},
          total_leads: 0,
          emails_sent: 0,
          emails_opened: 0,
          emails_clicked: 0,
          replies_received: 0,
          meetings_booked: 0,
          deals_created: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Log campaign creation
      await prisma.audit_logs.create({
        data: {
          license_key: licenseKey,
          user_id: campaignData.userId,
          action: 'campaign_created',
          resource_type: 'sales_campaign',
          resource_id: campaign.id,
          changes: { campaign: campaign.name },
          ip_address: campaignData.ipAddress || 'system',
          user_agent: 'SalesOutreachSkill'
        }
      });

      return this.success({
        campaignId: campaign.id,
        campaign,
        message: 'Campaign created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create campaign: ${error.message}`);
    }
  }

  private async getCampaigns(licenseKey: string): Promise<SkillResult> {
    try {
      const campaigns = await prisma.sales_campaigns.findMany({
        where: { license_key: licenseKey },
        include: {
          _count: {
            select: {
              leads: true,
              activities: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        draft: campaigns.filter(c => c.status === 'draft').length
      };

      return this.success({
        campaigns,
        stats,
        message: `Found ${campaigns.length} campaigns`
      });
    } catch (error: any) {
      return this.error(`Failed to fetch campaigns: ${error.message}`);
    }
  }

  private async getCampaign(campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId },
        include: {
          leads: {
            take: 10,
            orderBy: { created_at: 'desc' }
          },
          activities: {
            take: 10,
            orderBy: { created_at: 'desc' }
          },
          _count: {
            select: {
              leads: true,
              activities: true
            }
          }
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      return this.success({
        campaign,
        metrics: {
          leadCount: campaign._count.leads,
          activityCount: campaign._count.activities,
          openRate: campaign.emails_sent > 0 
            ? ((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(2)
            : 0,
          clickRate: campaign.emails_sent > 0
            ? ((campaign.emails_clicked / campaign.emails_sent) * 100).toFixed(2)
            : 0,
          replyRate: campaign.emails_sent > 0
            ? ((campaign.replies_received / campaign.emails_sent) * 100).toFixed(2)
            : 0
        }
      });
    } catch (error: any) {
      return this.error(`Failed to fetch campaign: ${error.message}`);
    }
  }

  private async updateCampaign(campaignId: string, updates: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      return this.success({
        campaign,
        message: 'Campaign updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update campaign: ${error.message}`);
    }
  }

  private async deleteCampaign(campaignId: string): Promise<SkillResult> {
    try {
      // Delete related data first
      await prisma.sales_activities.deleteMany({
        where: { campaign_id: campaignId }
      });

      await prisma.sales_leads.deleteMany({
        where: { campaign_id: campaignId }
      });

      await prisma.sales_campaigns.delete({
        where: { id: campaignId }
      });

      return this.success({
        message: 'Campaign deleted successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to delete campaign: ${error.message}`);
    }
  }

  private async startCampaign(campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'active',
          started_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create activity log
      await prisma.sales_activities.create({
        data: {
          campaign_id: campaignId,
          license_key: campaign.license_key,
          activity_type: 'campaign_started',
          metadata: { status: 'active' }
        }
      });

      return this.success({
        campaign,
        message: 'Campaign started successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to start campaign: ${error.message}`);
    }
  }

  private async pauseCampaign(campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'paused',
          updated_at: new Date()
        }
      });

      // Create activity log
      await prisma.sales_activities.create({
        data: {
          campaign_id: campaignId,
          license_key: campaign.license_key,
          activity_type: 'campaign_paused',
          metadata: { status: 'paused' }
        }
      });

      return this.success({
        campaign,
        message: 'Campaign paused successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to pause campaign: ${error.message}`);
    }
  }

  private async addLeadsToCampaign(campaignId: string, leads: any[]): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const createdLeads = [];
      const errors = [];

      for (const leadData of leads) {
        try {
          const lead = await prisma.sales_leads.create({
            data: {
              campaign_id: campaignId,
              license_key: campaign.license_key,
              email: leadData.email,
              first_name: leadData.firstName,
              last_name: leadData.lastName,
              full_name: leadData.fullName || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim(),
              company_name: leadData.companyName,
              job_title: leadData.jobTitle,
              phone: leadData.phone,
              linkedin_url: leadData.linkedinUrl,
              status: 'new',
              custom_fields: leadData.customFields || {},
              tags: leadData.tags || [],
              created_at: new Date()
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
          total_leads: { increment: createdLeads.length },
          updated_at: new Date()
        }
      });

      return this.success({
        added: createdLeads.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Added ${createdLeads.length} leads to campaign`
      });
    } catch (error: any) {
      return this.error(`Failed to add leads: ${error.message}`);
    }
  }

  private async sendOutreachEmail(campaignId: string, emailData: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Get target leads
      const leads = await prisma.sales_leads.findMany({
        where: {
          campaign_id: campaignId,
          status: emailData.targetStatus || 'new'
        },
        take: emailData.batchSize || 50
      });

      if (leads.length === 0) {
        return this.success({
          sent: 0,
          message: 'No eligible leads found'
        });
      }

      // Here we would integrate with email sending service
      // For now, we'll simulate the sending
      const sentCount = leads.length;

      // Update campaign stats
      await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          emails_sent: { increment: sentCount },
          updated_at: new Date()
        }
      });

      // Update lead statuses
      await prisma.sales_leads.updateMany({
        where: {
          id: { in: leads.map(l => l.id) }
        },
        data: {
          status: 'contacted',
          contacted_at: new Date()
        }
      });

      // Create activity logs
      for (const lead of leads) {
        await prisma.sales_activities.create({
          data: {
            campaign_id: campaignId,
            lead_id: lead.id,
            license_key: campaign.license_key,
            activity_type: 'email_sent',
            metadata: {
              template: emailData.templateId,
              subject: emailData.subject
            }
          }
        });
      }

      return this.success({
        sent: sentCount,
        leads: leads.map(l => ({ id: l.id, email: l.email })),
        message: `Sent ${sentCount} emails`
      });
    } catch (error: any) {
      return this.error(`Failed to send emails: ${error.message}`);
    }
  }

  private async getCampaignAnalytics(campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId },
        include: {
          _count: {
            select: {
              leads: true,
              activities: true
            }
          }
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Get lead status distribution
      const leadStats = await prisma.sales_leads.groupBy({
        by: ['status'],
        where: { campaign_id: campaignId },
        _count: true
      });

      // Get activity stats
      const activityStats = await prisma.sales_activities.groupBy({
        by: ['activity_type'],
        where: { campaign_id: campaignId },
        _count: true
      });

      const analytics = {
        overview: {
          totalLeads: campaign._count.leads,
          totalActivities: campaign._count.activities,
          emailsSent: campaign.emails_sent,
          emailsOpened: campaign.emails_opened,
          emailsClicked: campaign.emails_clicked,
          repliesReceived: campaign.replies_received,
          meetingsBooked: campaign.meetings_booked,
          dealsCreated: campaign.deals_created
        },
        rates: {
          openRate: campaign.emails_sent > 0 
            ? ((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(2)
            : 0,
          clickRate: campaign.emails_sent > 0
            ? ((campaign.emails_clicked / campaign.emails_sent) * 100).toFixed(2)
            : 0,
          replyRate: campaign.emails_sent > 0
            ? ((campaign.replies_received / campaign.emails_sent) * 100).toFixed(2)
            : 0,
          meetingRate: campaign.total_leads > 0
            ? ((campaign.meetings_booked / campaign.total_leads) * 100).toFixed(2)
            : 0
        },
        leadsByStatus: leadStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
        activitiesByType: activityStats.reduce((acc, curr) => {
          acc[curr.activity_type] = curr._count;
          return acc;
        }, {} as Record<string, number>)
      };

      return this.success({
        analytics,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        }
      });
    } catch (error: any) {
      return this.error(`Failed to get analytics: ${error.message}`);
    }
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'create_campaign', 'get_campaigns', 'get_campaign', 'update_campaign',
      'delete_campaign', 'start_campaign', 'pause_campaign', 'add_leads',
      'send_email', 'get_analytics'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}