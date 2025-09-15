import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

const prisma = new PrismaClient();

export class EmailSenderSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'email_sender',
    name: 'Advanced Email Sender',
    description: 'Enterprise email sending with multiple provider support, templates, and tracking',
    category: SkillCategory.COMMUNICATION,
    version: '2.0.0',
    author: 'Intelagent Platform',
    tags: ['email', 'smtp', 'sendgrid', 'mailgun', 'communication', 'templates', 'tracking']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        case 'send_email':
          return await this.sendEmail(licenseKey, data);
        case 'send_template':
          return await this.sendTemplateEmail(licenseKey, data);
        case 'send_bulk':
          return await this.sendBulkEmails(licenseKey, data);
        case 'send_campaign_email':
          return await this.sendCampaignEmail(licenseKey, data);
        case 'track_open':
          return await this.trackEmailOpen(data.activityId);
        case 'track_click':
          return await this.trackEmailClick(data.activityId, data.url);
        case 'verify_integration':
          return await this.verifyIntegration(licenseKey, data.integrationId);
        case 'test_email':
          return await this.sendTestEmail(licenseKey, data);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in EmailSenderSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async sendEmail(licenseKey: string, data: any): Promise<SkillResult> {
    const { to, subject, body, from, replyTo, attachments, integrationId } = data;

    if (!to || !subject || !body) {
      return this.error('Missing required parameters: to, subject, body');
    }

    try {
      // Get email integration config
      const integration = await this.getIntegration(licenseKey, integrationId);
      if (!integration) {
        return this.error('No email integration configured');
      }

      // Create transporter based on integration type
      const transporter = await this.createTransporter(integration);

      // Send email
      const info = await transporter.sendMail({
        from: from || integration.config.defaultFrom,
        to,
        subject,
        html: body,
        replyTo,
        attachments
      });

      // Track email activity if lead is provided
      if (data.leadId) {
        await this.trackEmailActivity(licenseKey, {
          leadId: data.leadId,
          campaignId: data.campaignId,
          type: 'email_sent',
          subject,
          messageId: info.messageId
        });
      }

      return this.success({
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        provider: integration.integration_type
      });
    } catch (error: any) {
      return this.error(`Failed to send email: ${error.message}`);
    }
  }

  private async sendTemplateEmail(licenseKey: string, data: any): Promise<SkillResult> {
    const { templateId, to, variables, integrationId } = data;

    try {
      // Get template
      const template = await prisma.sales_email_templates.findFirst({
        where: {
          license_key: licenseKey,
          id: templateId,
          is_active: true
        }
      });

      if (!template) {
        return this.error('Template not found');
      }

      // Compile template with variables
      const subjectTemplate = handlebars.compile(template.subject);
      const bodyTemplate = handlebars.compile(template.body);

      const subject = subjectTemplate(variables || {});
      const body = bodyTemplate(variables || {});

      // Send email using compiled template
      const result = await this.sendEmail(licenseKey, {
        to,
        subject,
        body,
        integrationId,
        leadId: data.leadId,
        campaignId: data.campaignId
      });

      // Update template usage stats
      if (result.success) {
        await prisma.sales_email_templates.update({
          where: { id: templateId },
          data: {
            times_used: { increment: 1 }
          }
        });
      }

      return result;
    } catch (error: any) {
      return this.error(`Failed to send template email: ${error.message}`);
    }
  }

  private async sendBulkEmails(licenseKey: string, data: any): Promise<SkillResult> {
    const { emails, delayMs = 1000 } = data;
    const results = {
      sent: [] as any[],
      failed: [] as any[]
    };

    for (const email of emails) {
      try {
        const result = await this.sendEmail(licenseKey, email);
        if (result.success) {
          results.sent.push({ to: email.to, messageId: result.data.messageId });
        } else {
          results.failed.push({ to: email.to, error: result.error });
        }

        // Add delay between emails to avoid rate limiting
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        results.failed.push({ to: email.to, error: error.message });
      }
    }

    return this.success({
      totalSent: results.sent.length,
      totalFailed: results.failed.length,
      results,
      message: `Sent ${results.sent.length} emails successfully`
    });
  }

  private async sendCampaignEmail(licenseKey: string, data: any): Promise<SkillResult> {
    const { campaignId, leadId, sequenceStep } = data;

    try {
      // Get campaign
      const campaign = await prisma.sales_campaigns.findFirst({
        where: {
          license_key: licenseKey,
          id: campaignId
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Get lead
      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Get sequence step template
      const sequence = campaign.sequence_steps as any[];
      const step = sequence[sequenceStep];

      if (!step) {
        return this.error('Sequence step not found');
      }

      // Prepare variables for template
      const variables = {
        firstName: lead.first_name || 'there',
        lastName: lead.last_name || '',
        fullName: lead.full_name || lead.first_name || 'there',
        company: lead.company_name || '',
        jobTitle: lead.job_title || '',
        ...lead.custom_fields as any
      };

      // Send template email
      const result = await this.sendTemplateEmail(licenseKey, {
        templateId: step.templateId,
        to: lead.email,
        variables,
        leadId,
        campaignId
      });

      // Update lead engagement metrics
      if (result.success) {
        await prisma.sales_leads.update({
          where: { id: leadId },
          data: {
            emails_sent: { increment: 1 },
            last_contacted_at: new Date()
          }
        });

        // Update campaign metrics
        await prisma.sales_campaigns.update({
          where: { id: campaignId },
          data: {
            emails_sent: { increment: 1 }
          }
        });
      }

      return result;
    } catch (error: any) {
      return this.error(`Failed to send campaign email: ${error.message}`);
    }
  }

  private async trackEmailOpen(activityId: string): Promise<SkillResult> {
    try {
      const activity = await prisma.sales_activities.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        return this.error('Activity not found');
      }

      // Update activity metadata
      await prisma.sales_activities.update({
        where: { id: activityId },
        data: {
          metadata: {
            ...(activity.metadata as any || {}),
            opened: true,
            openedAt: new Date().toISOString(),
            openCount: ((activity.metadata as any)?.openCount || 0) + 1
          }
        }
      });

      // Update lead metrics
      if (activity.lead_id) {
        await prisma.sales_leads.update({
          where: { id: activity.lead_id },
          data: {
            emails_opened: { increment: 1 },
            last_engaged_at: new Date()
          }
        });
      }

      // Update campaign metrics
      if (activity.campaign_id) {
        await prisma.sales_campaigns.update({
          where: { id: activity.campaign_id },
          data: {
            emails_opened: { increment: 1 }
          }
        });
      }

      return this.success({ tracked: true });
    } catch (error: any) {
      return this.error(`Failed to track email open: ${error.message}`);
    }
  }

  private async trackEmailClick(activityId: string, url: string): Promise<SkillResult> {
    try {
      const activity = await prisma.sales_activities.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        return this.error('Activity not found');
      }

      // Update activity metadata
      const clicks = (activity.metadata as any)?.clicks || [];
      clicks.push({ url, clickedAt: new Date().toISOString() });

      await prisma.sales_activities.update({
        where: { id: activityId },
        data: {
          metadata: {
            ...(activity.metadata as any || {}),
            clicked: true,
            clicks,
            clickCount: clicks.length
          }
        }
      });

      // Update lead metrics
      if (activity.lead_id) {
        await prisma.sales_leads.update({
          where: { id: activity.lead_id },
          data: {
            emails_clicked: { increment: 1 },
            last_engaged_at: new Date()
          }
        });
      }

      // Update campaign metrics
      if (activity.campaign_id) {
        await prisma.sales_campaigns.update({
          where: { id: activity.campaign_id },
          data: {
            emails_clicked: { increment: 1 }
          }
        });
      }

      return this.success({ tracked: true, url });
    } catch (error: any) {
      return this.error(`Failed to track email click: ${error.message}`);
    }
  }

  private async verifyIntegration(licenseKey: string, integrationId: string): Promise<SkillResult> {
    try {
      const integration = await this.getIntegration(licenseKey, integrationId);
      if (!integration) {
        return this.error('Integration not found');
      }

      // Test the integration
      const transporter = await this.createTransporter(integration);
      await transporter.verify();

      // Update verification status
      await prisma.sales_integrations.update({
        where: { id: integrationId },
        data: {
          is_verified: true,
          last_verified_at: new Date()
        }
      });

      return this.success({
        verified: true,
        integration: integration.name,
        type: integration.integration_type
      });
    } catch (error: any) {
      return this.error(`Integration verification failed: ${error.message}`);
    }
  }

  private async sendTestEmail(licenseKey: string, data: any): Promise<SkillResult> {
    const testEmail = {
      to: data.to || 'test@example.com',
      subject: 'Test Email from Intelagent Platform',
      body: `
        <h2>Test Email</h2>
        <p>This is a test email from your Intelagent Platform Sales Agent.</p>
        <p>Integration: ${data.integrationId || 'Default'}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <hr>
        <p><small>If you received this email, your email integration is working correctly.</small></p>
      `,
      integrationId: data.integrationId
    };

    return await this.sendEmail(licenseKey, testEmail);
  }

  private async getIntegration(licenseKey: string, integrationId?: string): Promise<any> {
    // If specific integration requested
    if (integrationId) {
      return await prisma.sales_integrations.findFirst({
        where: {
          license_key: licenseKey,
          id: integrationId,
          is_active: true
        }
      });
    }

    // Otherwise get default integration
    return await prisma.sales_integrations.findFirst({
      where: {
        license_key: licenseKey,
        default_for_campaigns: true,
        is_active: true
      }
    });
  }

  private async createTransporter(integration: any): Promise<any> {
    const config = integration.config as any;

    switch (integration.integration_type) {
      case 'smtp':
        return nodemailer.createTransporter({
          host: config.host,
          port: config.port,
          secure: config.secure || false,
          auth: {
            user: config.user,
            pass: config.password
          }
        });

      case 'sendgrid':
        // For SendGrid, we'd use their API
        // This is a simplified version
        return nodemailer.createTransporter({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: config.apiKey
          }
        });

      case 'mailgun':
        // For Mailgun, we'd use their API
        // This is a simplified version
        return nodemailer.createTransporter({
          host: 'smtp.mailgun.org',
          port: 587,
          auth: {
            user: config.username,
            pass: config.password
          }
        });

      default:
        throw new Error(`Unsupported integration type: ${integration.integration_type}`);
    }
  }

  private async trackEmailActivity(licenseKey: string, data: any): Promise<void> {
    await prisma.sales_activities.create({
      data: {
        license_key: licenseKey,
        lead_id: data.leadId,
        campaign_id: data.campaignId,
        activity_type: data.type,
        subject: data.subject,
        metadata: {
          messageId: data.messageId,
          timestamp: new Date().toISOString()
        },
        skill_used: 'email_sender',
        status: 'completed'
      }
    });
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'send_email', 'send_template', 'send_bulk', 'send_campaign_email',
      'track_open', 'track_click', 'verify_integration', 'test_email'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}