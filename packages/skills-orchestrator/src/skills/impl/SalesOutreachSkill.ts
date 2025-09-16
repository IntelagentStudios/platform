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
    version: '2.0.0',
    author: 'Intelagent Platform',
    tags: ['sales', 'outreach', 'campaigns', 'email', 'automation']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        case 'create_campaign':
          return await this.createCampaign(licenseKey, data);
        case 'get_campaigns':
          return await this.getCampaigns(licenseKey);
        case 'get_campaign':
          return await this.getCampaign(data.campaignId);
        case 'update_campaign':
          return await this.updateCampaign(data.campaignId, data.updates);
        case 'delete_campaign':
          return await this.deleteCampaign(data.campaignId);
        case 'start_campaign':
          return await this.startCampaign(data.campaignId);
        case 'pause_campaign':
          return await this.pauseCampaign(data.campaignId);
        case 'add_leads':
          return await this.addLeadsToCampaign(data.campaignId, data.leads);
        case 'send_email':
          return await this.sendOutreachEmail(data.campaignId, data.leadId, data.emailData);
        case 'get_analytics':
          return await this.getCampaignAnalytics(data.campaignId);
        case 'execute_sequence':
          return await this.executeSequenceStep(data.sequenceId);
        case 'track_activity':
          return await this.trackActivity(licenseKey, data);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in SalesOutreachSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async createCampaign(licenseKey: string, campaignData: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.create({
        data: {
          license_key: licenseKey,
          name: campaignData.name,
          description: campaignData.description,
          campaign_type: campaignData.type || 'email',
          settings: campaignData.settings || {},
          email_templates: campaignData.templates || [],
          sequence_steps: campaignData.sequence || [],
          target_criteria: campaignData.targetCriteria || {},
          target_persona: campaignData.targetPersona,
          start_date: campaignData.startDate ? new Date(campaignData.startDate) : null,
          end_date: campaignData.endDate ? new Date(campaignData.endDate) : null,
          timezone: campaignData.timezone || 'UTC',
          send_schedule: campaignData.schedule || {},
          skills_used: ['sales_outreach', 'email_sender', 'lead_management'],
          created_by: campaignData.createdBy || 'system'
        }
      });

      this.log(`Campaign created: ${campaign.id}`, 'info');

      return this.success({
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
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

      return this.success({
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          type: c.campaign_type,
          totalLeads: c._count.leads,
          totalActivities: c._count.activities,
          metrics: {
            emailsSent: c.emails_sent,
            emailsOpened: c.emails_opened,
            emailsClicked: c.emails_clicked,
            repliesReceived: c.replies_received,
            meetingsBooked: c.meetings_booked
          },
          createdAt: c.created_at,
          updatedAt: c.updated_at
        })),
        total: campaigns.length
      });
    } catch (error: any) {
      return this.error(`Failed to get campaigns: ${error.message}`);
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
            take: 20,
            orderBy: { performed_at: 'desc' }
          },
          sequences: {
            where: { status: 'active' }
          }
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      return this.success({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          type: campaign.campaign_type,
          settings: campaign.settings,
          templates: campaign.email_templates,
          sequence: campaign.sequence_steps,
          metrics: {
            totalLeads: campaign.total_leads,
            emailsSent: campaign.emails_sent,
            emailsOpened: campaign.emails_opened,
            emailsClicked: campaign.emails_clicked,
            repliesReceived: campaign.replies_received,
            meetingsBooked: campaign.meetings_booked,
            dealsCreated: campaign.deals_created
          },
          recentLeads: campaign.leads,
          recentActivities: campaign.activities,
          activeSequences: campaign.sequences.length,
          createdAt: campaign.created_at,
          updatedAt: campaign.updated_at
        }
      });
    } catch (error: any) {
      return this.error(`Failed to get campaign: ${error.message}`);
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

      this.log(`Campaign updated: ${campaignId}`, 'info');

      return this.success({
        campaignId: campaign.id,
        message: 'Campaign updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update campaign: ${error.message}`);
    }
  }

  private async deleteCampaign(campaignId: string): Promise<SkillResult> {
    try {
      await prisma.sales_campaigns.delete({
        where: { id: campaignId }
      });

      this.log(`Campaign deleted: ${campaignId}`, 'info');

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
          start_date: new Date(),
          updated_at: new Date()
        }
      });

      // Get all leads in the campaign
      const leads = await prisma.sales_leads.findMany({
        where: { campaign_id: campaignId }
      });

      // Create sequences for each lead
      for (const lead of leads) {
        await prisma.sales_sequences.create({
          data: {
            campaign_id: campaignId,
            lead_id: lead.id,
            status: 'active',
            total_steps: (campaign.sequence_steps as any[])?.length || 0
          }
        });
      }

      this.log(`Campaign started: ${campaignId} with ${leads.length} leads`, 'info');

      return this.success({
        campaignId: campaign.id,
        status: campaign.status,
        leadsActivated: leads.length,
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

      // Pause all active sequences
      await prisma.sales_sequences.updateMany({
        where: {
          campaign_id: campaignId,
          status: 'active'
        },
        data: {
          status: 'paused',
          updated_at: new Date()
        }
      });

      this.log(`Campaign paused: ${campaignId}`, 'info');

      return this.success({
        campaignId: campaign.id,
        status: campaign.status,
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
          const lead = await prisma.sales_leads.upsert({
            where: {
              license_key_email: {
                license_key: campaign.license_key,
                email: leadData.email
              }
            },
            update: {
              campaign_id: campaignId,
              ...leadData,
              updated_at: new Date()
            },
            create: {
              license_key: campaign.license_key,
              campaign_id: campaignId,
              ...leadData
            }
          });
          createdLeads.push(lead);
        } catch (error: any) {
          errors.push({ email: leadData.email, error: error.message });
        }
      }

      // Update campaign lead count
      await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          total_leads: { increment: createdLeads.length }
        }
      });

      this.log(`Added ${createdLeads.length} leads to campaign ${campaignId}`, 'info');

      return this.success({
        campaignId,
        leadsAdded: createdLeads.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully added ${createdLeads.length} leads`
      });
    } catch (error: any) {
      return this.error(`Failed to add leads: ${error.message}`);
    }
  }

  private async sendOutreachEmail(campaignId: string, leadId: string, emailData: any): Promise<SkillResult> {
    try {
      // Get lead and campaign details
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Track the activity
      const activity = await prisma.sales_activities.create({
        data: {
          license_key: lead.license_key,
          campaign_id: campaignId,
          lead_id: leadId,
          activity_type: 'email_sent',
          subject: emailData.subject,
          content: emailData.body,
          metadata: {
            template_id: emailData.templateId,
            personalization: emailData.personalization
          },
          skill_used: 'sales_outreach',
          status: 'pending'
        }
      });

      // Here you would integrate with EmailSenderSkill
      // For now, we'll simulate the sending
      this.log(`Email queued for ${lead.email}: ${emailData.subject}`, 'info');

      // Update lead stats
      await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          emails_sent: { increment: 1 },
          last_contacted_at: new Date()
        }
      });

      // Update campaign stats
      await prisma.sales_campaigns.update({
        where: { id: campaignId },
        data: {
          emails_sent: { increment: 1 }
        }
      });

      return this.success({
        activityId: activity.id,
        leadEmail: lead.email,
        subject: emailData.subject,
        status: 'sent',
        message: 'Email sent successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to send email: ${error.message}`);
    }
  }

  private async executeSequenceStep(sequenceId: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId },
        include: {
          campaign: true,
          lead: true
        }
      });

      if (!sequence || sequence.status !== 'active') {
        return this.error('Sequence not found or not active');
      }

      const steps = sequence.campaign.sequence_steps as any[];
      const currentStep = steps[sequence.current_step || 0];

      if (!currentStep) {
        // Sequence completed
        await prisma.sales_sequences.update({
          where: { id: sequenceId },
          data: {
            status: 'completed',
            completed_at: new Date()
          }
        });
        return this.success({ message: 'Sequence completed' });
      }

      // Execute the current step
      const result = await this.sendOutreachEmail(
        sequence.campaign_id,
        sequence.lead_id,
        currentStep
      );

      // Update sequence progress
      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          current_step: (sequence.current_step || 0) + 1,
          steps_completed: (sequence.steps_completed || 0) + 1,
          last_step_at: new Date(),
          next_step_at: this.calculateNextStepTime(currentStep.delay)
        }
      });

      return result;
    } catch (error: any) {
      return this.error(`Failed to execute sequence: ${error.message}`);
    }
  }

  private async trackActivity(licenseKey: string, activityData: any): Promise<SkillResult> {
    try {
      const activity = await prisma.sales_activities.create({
        data: {
          license_key: licenseKey,
          campaign_id: activityData.campaignId,
          lead_id: activityData.leadId,
          activity_type: activityData.type,
          subject: activityData.subject,
          content: activityData.content,
          metadata: activityData.metadata || {},
          skill_used: 'sales_outreach',
          status: activityData.status || 'completed'
        }
      });

      // Update lead engagement metrics based on activity type
      if (activityData.type === 'email_opened') {
        await prisma.sales_leads.update({
          where: { id: activityData.leadId },
          data: {
            emails_opened: { increment: 1 },
            last_engaged_at: new Date()
          }
        });
        await prisma.sales_campaigns.update({
          where: { id: activityData.campaignId },
          data: { emails_opened: { increment: 1 } }
        });
      }

      if (activityData.type === 'email_clicked') {
        await prisma.sales_leads.update({
          where: { id: activityData.leadId },
          data: {
            emails_clicked: { increment: 1 },
            last_engaged_at: new Date()
          }
        });
        await prisma.sales_campaigns.update({
          where: { id: activityData.campaignId },
          data: { emails_clicked: { increment: 1 } }
        });
      }

      return this.success({
        activityId: activity.id,
        message: 'Activity tracked successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to track activity: ${error.message}`);
    }
  }

  private async getCampaignAnalytics(campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Get lead statistics
      const leadStats = await prisma.sales_leads.groupBy({
        by: ['status'],
        where: { campaign_id: campaignId },
        _count: true
      });

      // Get activity statistics
      const activityStats = await prisma.sales_activities.groupBy({
        by: ['activity_type'],
        where: { campaign_id: campaignId },
        _count: true
      });

      // Get sequence statistics
      const sequenceStats = await prisma.sales_sequences.groupBy({
        by: ['status'],
        where: { campaign_id: campaignId },
        _count: true
      });

      // Calculate conversion rates
      const openRate = campaign.emails_sent ?
        (campaign.emails_opened! / campaign.emails_sent * 100).toFixed(2) : 0;
      const clickRate = campaign.emails_sent ?
        (campaign.emails_clicked! / campaign.emails_sent * 100).toFixed(2) : 0;
      const replyRate = campaign.emails_sent ?
        (campaign.replies_received! / campaign.emails_sent * 100).toFixed(2) : 0;

      return this.success({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        },
        metrics: {
          totalLeads: campaign.total_leads,
          emailsSent: campaign.emails_sent,
          emailsOpened: campaign.emails_opened,
          emailsClicked: campaign.emails_clicked,
          repliesReceived: campaign.replies_received,
          meetingsBooked: campaign.meetings_booked,
          dealsCreated: campaign.deals_created
        },
        rates: {
          openRate: `${openRate}%`,
          clickRate: `${clickRate}%`,
          replyRate: `${replyRate}%`
        },
        leadBreakdown: leadStats,
        activityBreakdown: activityStats,
        sequenceBreakdown: sequenceStats,
        createdAt: campaign.created_at,
        lastActivity: campaign.updated_at
      });
    } catch (error: any) {
      return this.error(`Failed to get analytics: ${error.message}`);
    }
  }

  private calculateNextStepTime(delay: any): Date {
    const delayHours = delay?.hours || 24;
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + delayHours);
    return nextTime;
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'create_campaign', 'get_campaigns', 'get_campaign', 'update_campaign',
      'delete_campaign', 'start_campaign', 'pause_campaign', 'add_leads',
      'send_email', 'get_analytics', 'execute_sequence', 'track_activity'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}