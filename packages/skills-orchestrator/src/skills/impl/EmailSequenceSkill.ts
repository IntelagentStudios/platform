import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SequenceStep {
  stepNumber: number;
  delayDays: number;
  templateId?: string;
  subject: string;
  body: string;
  personalizationFields: string[];
  conditions?: {
    waitForReply?: boolean;
    skipIfReplied?: boolean;
    skipIfClicked?: boolean;
    skipIfMeetingBooked?: boolean;
  };
}

export class EmailSequenceSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'email_sequence',
    name: 'Email Sequence Automation',
    description: 'Manages automated email sequences, drip campaigns, and follow-up workflows',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['email', 'sequence', 'automation', 'drip', 'follow-up', 'sales']
  };

  validate(params: SkillParams): boolean {
    const { action, licenseKey } = params;
    if (!licenseKey) return false;

    const validActions = [
      'create_sequence', 'update_sequence', 'delete_sequence', 'get_sequences',
      'start_sequence', 'pause_sequence', 'resume_sequence', 'stop_sequence',
      'add_lead_to_sequence', 'remove_lead_from_sequence', 'get_sequence_status',
      'execute_next_step', 'skip_step', 'get_sequence_analytics',
      'bulk_add_leads', 'bulk_remove_leads', 'clone_sequence'
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
        case 'create_sequence':
          return await this.createSequence(licenseKey, data);
        case 'update_sequence':
          return await this.updateSequence(data.sequenceId, data.updates);
        case 'delete_sequence':
          return await this.deleteSequence(data.sequenceId);
        case 'get_sequences':
          return await this.getSequences(licenseKey, data.campaignId);
        case 'start_sequence':
          return await this.startSequence(data.sequenceId, data.leadId);
        case 'pause_sequence':
          return await this.pauseSequence(data.sequenceId);
        case 'resume_sequence':
          return await this.resumeSequence(data.sequenceId);
        case 'stop_sequence':
          return await this.stopSequence(data.sequenceId, data.reason);
        case 'add_lead_to_sequence':
          return await this.addLeadToSequence(data.campaignId, data.leadId, data.startStep);
        case 'remove_lead_from_sequence':
          return await this.removeLeadFromSequence(data.sequenceId);
        case 'get_sequence_status':
          return await this.getSequenceStatus(data.sequenceId);
        case 'execute_next_step':
          return await this.executeNextStep(data.sequenceId);
        case 'skip_step':
          return await this.skipStep(data.sequenceId, data.stepNumber);
        case 'get_sequence_analytics':
          return await this.getSequenceAnalytics(data.campaignId);
        case 'bulk_add_leads':
          return await this.bulkAddLeads(data.campaignId, data.leadIds);
        case 'bulk_remove_leads':
          return await this.bulkRemoveLeads(data.campaignId, data.leadIds);
        case 'clone_sequence':
          return await this.cloneSequence(data.sequenceId, data.newName);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in EmailSequenceSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async createSequence(licenseKey: string, sequenceData: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findFirst({
        where: {
          license_key: licenseKey,
          id: sequenceData.campaignId
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Update campaign with sequence steps
      await prisma.sales_campaigns.update({
        where: { id: sequenceData.campaignId },
        data: {
          sequence_steps: sequenceData.steps,
          updated_at: new Date()
        }
      });

      return this.success({
        campaignId: sequenceData.campaignId,
        steps: sequenceData.steps,
        message: 'Email sequence created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create sequence: ${error.message}`);
    }
  }

  private async updateSequence(sequenceId: string, updates: any): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId }
      });

      if (!sequence) {
        return this.error('Sequence not found');
      }

      // Update campaign sequence steps if provided
      if (updates.steps) {
        await prisma.sales_campaigns.update({
          where: { id: sequence.campaign_id },
          data: {
            sequence_steps: updates.steps,
            updated_at: new Date()
          }
        });
      }

      // Update sequence record
      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          total_steps: updates.steps ? updates.steps.length : undefined,
          updated_at: new Date()
        }
      });

      return this.success({
        sequenceId,
        message: 'Sequence updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update sequence: ${error.message}`);
    }
  }

  private async deleteSequence(sequenceId: string): Promise<SkillResult> {
    try {
      await prisma.sales_sequences.delete({
        where: { id: sequenceId }
      });

      return this.success({ message: 'Sequence deleted successfully' });
    } catch (error: any) {
      return this.error(`Failed to delete sequence: ${error.message}`);
    }
  }

  private async getSequences(licenseKey: string, campaignId?: string): Promise<SkillResult> {
    try {
      const where: any = {};

      if (campaignId) {
        where.campaign_id = campaignId;
      } else {
        // Get all campaigns for this license
        const campaigns = await prisma.sales_campaigns.findMany({
          where: { license_key: licenseKey },
          select: { id: true }
        });
        where.campaign_id = { in: campaigns.map(c => c.id) };
      }

      const sequences = await prisma.sales_sequences.findMany({
        where,
        include: {
          campaign: true,
          lead: true
        },
        orderBy: { created_at: 'desc' }
      });

      return this.success({
        sequences,
        count: sequences.length
      });
    } catch (error: any) {
      return this.error(`Failed to get sequences: ${error.message}`);
    }
  }

  private async startSequence(campaignId: string, leadId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const lead = await prisma.sales_leads.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Check if sequence already exists
      const existing = await prisma.sales_sequences.findFirst({
        where: {
          campaign_id: campaignId,
          lead_id: leadId
        }
      });

      if (existing) {
        return this.error('Lead already in this sequence');
      }

      // Get sequence steps from campaign
      const steps = campaign.sequence_steps as any[] || [];

      if (steps.length === 0) {
        return this.error('Campaign has no sequence steps defined');
      }

      // Calculate next step time
      const firstStep = steps[0];
      const nextStepAt = new Date();
      nextStepAt.setDate(nextStepAt.getDate() + (firstStep.delayDays || 0));

      // Create sequence record
      const sequence = await prisma.sales_sequences.create({
        data: {
          campaign_id: campaignId,
          lead_id: leadId,
          current_step: 0,
          status: 'active',
          total_steps: steps.length,
          next_step_at: nextStepAt
        }
      });

      // Log activity
      await prisma.sales_activities.create({
        data: {
          license_key: campaign.license_key,
          campaign_id: campaignId,
          lead_id: leadId,
          activity_type: 'sequence_started',
          subject: 'Added to email sequence',
          metadata: { sequenceId: sequence.id, totalSteps: steps.length },
          skill_used: this.metadata.id
        }
      });

      // Schedule first email
      await this.scheduleNextEmail(sequence.id, campaign, lead, steps[0]);

      return this.success({
        sequenceId: sequence.id,
        message: 'Sequence started successfully',
        nextStepAt
      });
    } catch (error: any) {
      return this.error(`Failed to start sequence: ${error.message}`);
    }
  }

  private async pauseSequence(sequenceId: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          status: 'paused',
          updated_at: new Date()
        }
      });

      return this.success({
        sequenceId,
        message: 'Sequence paused',
        status: 'paused'
      });
    } catch (error: any) {
      return this.error(`Failed to pause sequence: ${error.message}`);
    }
  }

  private async resumeSequence(sequenceId: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId },
        include: {
          campaign: true,
          lead: true
        }
      });

      if (!sequence) {
        return this.error('Sequence not found');
      }

      // Calculate new next step time
      const campaign = sequence.campaign;
      const steps = campaign.sequence_steps as any[] || [];
      const currentStep = steps[sequence.current_step || 0];

      const nextStepAt = new Date();
      nextStepAt.setDate(nextStepAt.getDate() + (currentStep?.delayDays || 1));

      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          status: 'active',
          next_step_at: nextStepAt,
          updated_at: new Date()
        }
      });

      return this.success({
        sequenceId,
        message: 'Sequence resumed',
        status: 'active',
        nextStepAt
      });
    } catch (error: any) {
      return this.error(`Failed to resume sequence: ${error.message}`);
    }
  }

  private async stopSequence(sequenceId: string, reason?: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          status: 'completed',
          stop_reason: reason,
          completed_at: new Date(),
          updated_at: new Date()
        }
      });

      // Log activity
      await prisma.sales_activities.create({
        data: {
          license_key: sequence.lead.license_key,
          campaign_id: sequence.campaign_id,
          lead_id: sequence.lead_id,
          activity_type: 'sequence_stopped',
          subject: 'Sequence stopped',
          metadata: { reason },
          skill_used: this.metadata.id
        }
      });

      return this.success({
        sequenceId,
        message: 'Sequence stopped',
        reason
      });
    } catch (error: any) {
      return this.error(`Failed to stop sequence: ${error.message}`);
    }
  }

  private async addLeadToSequence(campaignId: string, leadId: string, startStep: number = 0): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const steps = campaign.sequence_steps as any[] || [];

      if (startStep >= steps.length) {
        return this.error('Invalid start step');
      }

      // Calculate next step time
      const nextStep = steps[startStep];
      const nextStepAt = new Date();
      nextStepAt.setDate(nextStepAt.getDate() + (nextStep.delayDays || 0));

      const sequence = await prisma.sales_sequences.create({
        data: {
          campaign_id: campaignId,
          lead_id: leadId,
          current_step: startStep,
          status: 'active',
          total_steps: steps.length,
          next_step_at: nextStepAt
        }
      });

      return this.success({
        sequenceId: sequence.id,
        message: 'Lead added to sequence'
      });
    } catch (error: any) {
      return this.error(`Failed to add lead to sequence: ${error.message}`);
    }
  }

  private async removeLeadFromSequence(sequenceId: string): Promise<SkillResult> {
    try {
      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          status: 'cancelled',
          stop_reason: 'Manually removed',
          completed_at: new Date()
        }
      });

      return this.success({ message: 'Lead removed from sequence' });
    } catch (error: any) {
      return this.error(`Failed to remove lead from sequence: ${error.message}`);
    }
  }

  private async getSequenceStatus(sequenceId: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId },
        include: {
          campaign: true,
          lead: true
        }
      });

      if (!sequence) {
        return this.error('Sequence not found');
      }

      const activities = await prisma.sales_activities.findMany({
        where: {
          lead_id: sequence.lead_id,
          campaign_id: sequence.campaign_id
        },
        orderBy: { performed_at: 'desc' }
      });

      return this.success({
        sequence,
        activities,
        progress: {
          currentStep: sequence.current_step,
          totalSteps: sequence.total_steps,
          percentComplete: sequence.total_steps
            ? Math.round((sequence.current_step || 0) / sequence.total_steps * 100)
            : 0
        }
      });
    } catch (error: any) {
      return this.error(`Failed to get sequence status: ${error.message}`);
    }
  }

  private async executeNextStep(sequenceId: string): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId },
        include: {
          campaign: true,
          lead: true
        }
      });

      if (!sequence) {
        return this.error('Sequence not found');
      }

      if (sequence.status !== 'active') {
        return this.error(`Sequence is ${sequence.status}`);
      }

      const campaign = sequence.campaign;
      const lead = sequence.lead;
      const steps = campaign.sequence_steps as any[] || [];
      const currentStepIndex = sequence.current_step || 0;

      if (currentStepIndex >= steps.length) {
        // Sequence completed
        await prisma.sales_sequences.update({
          where: { id: sequenceId },
          data: {
            status: 'completed',
            completed_at: new Date()
          }
        });

        return this.success({
          message: 'Sequence completed',
          completed: true
        });
      }

      const currentStep = steps[currentStepIndex];

      // Check conditions
      if (await this.shouldSkipStep(sequence, lead, currentStep)) {
        // Skip to next step
        return await this.moveToNextStep(sequenceId, currentStepIndex + 1, steps);
      }

      // Send email
      await this.sendSequenceEmail(sequence, campaign, lead, currentStep);

      // Update sequence
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex];
        const nextStepAt = new Date();
        nextStepAt.setDate(nextStepAt.getDate() + (nextStep.delayDays || 1));

        await prisma.sales_sequences.update({
          where: { id: sequenceId },
          data: {
            current_step: nextStepIndex,
            steps_completed: (sequence.steps_completed || 0) + 1,
            last_step_at: new Date(),
            next_step_at: nextStepAt,
            updated_at: new Date()
          }
        });

        return this.success({
          message: 'Step executed successfully',
          nextStep: nextStepIndex,
          nextStepAt
        });
      } else {
        // Sequence completed
        await prisma.sales_sequences.update({
          where: { id: sequenceId },
          data: {
            status: 'completed',
            steps_completed: (sequence.steps_completed || 0) + 1,
            completed_at: new Date()
          }
        });

        return this.success({
          message: 'Sequence completed',
          completed: true
        });
      }
    } catch (error: any) {
      return this.error(`Failed to execute next step: ${error.message}`);
    }
  }

  private async skipStep(sequenceId: string, stepNumber: number): Promise<SkillResult> {
    try {
      const sequence = await prisma.sales_sequences.findUnique({
        where: { id: sequenceId }
      });

      if (!sequence) {
        return this.error('Sequence not found');
      }

      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          current_step: stepNumber,
          updated_at: new Date()
        }
      });

      return this.success({
        message: 'Skipped to step',
        currentStep: stepNumber
      });
    } catch (error: any) {
      return this.error(`Failed to skip step: ${error.message}`);
    }
  }

  private async getSequenceAnalytics(campaignId: string): Promise<SkillResult> {
    try {
      const sequences = await prisma.sales_sequences.findMany({
        where: { campaign_id: campaignId }
      });

      const analytics = {
        totalSequences: sequences.length,
        active: sequences.filter(s => s.status === 'active').length,
        paused: sequences.filter(s => s.status === 'paused').length,
        completed: sequences.filter(s => s.status === 'completed').length,
        cancelled: sequences.filter(s => s.status === 'cancelled').length,
        avgStepsCompleted: sequences.reduce((acc, s) => acc + (s.steps_completed || 0), 0) / sequences.length,
        completionRate: sequences.filter(s => s.status === 'completed').length / sequences.length * 100
      };

      return this.success({ analytics });
    } catch (error: any) {
      return this.error(`Failed to get analytics: ${error.message}`);
    }
  }

  private async bulkAddLeads(campaignId: string, leadIds: string[]): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const steps = campaign.sequence_steps as any[] || [];
      const results = {
        added: 0,
        skipped: 0,
        errors: [] as any[]
      };

      for (const leadId of leadIds) {
        try {
          // Check if already in sequence
          const existing = await prisma.sales_sequences.findFirst({
            where: {
              campaign_id: campaignId,
              lead_id: leadId
            }
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          const nextStepAt = new Date();
          nextStepAt.setDate(nextStepAt.getDate() + ((steps[0]?.delayDays) || 0));

          await prisma.sales_sequences.create({
            data: {
              campaign_id: campaignId,
              lead_id: leadId,
              current_step: 0,
              status: 'active',
              total_steps: steps.length,
              next_step_at: nextStepAt
            }
          });

          results.added++;
        } catch (error: any) {
          results.errors.push({
            leadId,
            error: error.message
          });
        }
      }

      return this.success({
        message: 'Bulk add completed',
        results
      });
    } catch (error: any) {
      return this.error(`Failed to bulk add leads: ${error.message}`);
    }
  }

  private async bulkRemoveLeads(campaignId: string, leadIds: string[]): Promise<SkillResult> {
    try {
      const result = await prisma.sales_sequences.updateMany({
        where: {
          campaign_id: campaignId,
          lead_id: { in: leadIds },
          status: { not: 'completed' }
        },
        data: {
          status: 'cancelled',
          stop_reason: 'Bulk removal',
          completed_at: new Date()
        }
      });

      return this.success({
        message: 'Leads removed from sequence',
        count: result.count
      });
    } catch (error: any) {
      return this.error(`Failed to bulk remove leads: ${error.message}`);
    }
  }

  private async cloneSequence(campaignId: string, newName: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const newCampaign = await prisma.sales_campaigns.create({
        data: {
          license_key: campaign.license_key,
          name: newName,
          description: `Clone of ${campaign.name}`,
          campaign_type: campaign.campaign_type,
          settings: campaign.settings,
          email_templates: campaign.email_templates,
          sequence_steps: campaign.sequence_steps,
          target_criteria: campaign.target_criteria,
          target_persona: campaign.target_persona,
          timezone: campaign.timezone,
          send_schedule: campaign.send_schedule,
          skills_used: campaign.skills_used,
          created_by: 'system'
        }
      });

      return this.success({
        campaignId: newCampaign.id,
        message: 'Sequence cloned successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to clone sequence: ${error.message}`);
    }
  }

  // Helper methods
  private async shouldSkipStep(sequence: any, lead: any, step: any): Promise<boolean> {
    if (!step.conditions) return false;

    // Check if lead has replied
    if (step.conditions.skipIfReplied) {
      const replies = await prisma.sales_activities.findFirst({
        where: {
          lead_id: lead.id,
          activity_type: 'replied',
          performed_at: { gte: sequence.last_step_at || sequence.started_at }
        }
      });
      if (replies) return true;
    }

    // Check if link was clicked
    if (step.conditions.skipIfClicked) {
      const clicks = await prisma.sales_activities.findFirst({
        where: {
          lead_id: lead.id,
          activity_type: 'link_clicked',
          performed_at: { gte: sequence.last_step_at || sequence.started_at }
        }
      });
      if (clicks) return true;
    }

    // Check if meeting was booked
    if (step.conditions.skipIfMeetingBooked) {
      const meetings = await prisma.sales_activities.findFirst({
        where: {
          lead_id: lead.id,
          activity_type: 'meeting_booked',
          performed_at: { gte: sequence.last_step_at || sequence.started_at }
        }
      });
      if (meetings) return true;
    }

    return false;
  }

  private async moveToNextStep(sequenceId: string, nextStepIndex: number, steps: any[]): Promise<SkillResult> {
    if (nextStepIndex >= steps.length) {
      await prisma.sales_sequences.update({
        where: { id: sequenceId },
        data: {
          status: 'completed',
          completed_at: new Date()
        }
      });

      return this.success({
        message: 'Sequence completed',
        completed: true
      });
    }

    const nextStep = steps[nextStepIndex];
    const nextStepAt = new Date();
    nextStepAt.setDate(nextStepAt.getDate() + (nextStep.delayDays || 1));

    await prisma.sales_sequences.update({
      where: { id: sequenceId },
      data: {
        current_step: nextStepIndex,
        next_step_at: nextStepAt,
        updated_at: new Date()
      }
    });

    return this.success({
      message: 'Moved to next step',
      currentStep: nextStepIndex,
      nextStepAt
    });
  }

  private async sendSequenceEmail(sequence: any, campaign: any, lead: any, step: any): Promise<void> {
    // This would integrate with the email sending system
    // For now, just log the activity
    await prisma.sales_activities.create({
      data: {
        license_key: campaign.license_key,
        campaign_id: campaign.id,
        lead_id: lead.id,
        activity_type: 'email_sent',
        subject: step.subject,
        content: step.body,
        metadata: {
          sequenceId: sequence.id,
          stepNumber: sequence.current_step,
          templateId: step.templateId
        },
        skill_used: this.metadata.id
      }
    });
  }

  private async scheduleNextEmail(sequenceId: string, campaign: any, lead: any, step: any): Promise<void> {
    // This would add to email queue for scheduled sending
    // Implementation depends on email sending infrastructure
    this.log(`Scheduled email for sequence ${sequenceId}, step ${step.stepNumber}`, 'info');
  }
}