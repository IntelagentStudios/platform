/**
 * Email Composer Skill
 * Generates professional emails using AI
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class EmailComposerSkill extends BaseSkill {
  metadata = {
    id: 'email_composer',
    name: 'Email Composer',
    description: 'Compose professional emails with AI assistance',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['email', 'communication', 'ai', 'writing']
  };

  validate(params: SkillParams): boolean {
    return !!(params.recipient && params.subject && params.context);
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { recipient, subject, context, tone = 'professional', template = 'standard' } = params;

      // Generate email based on template
      let emailBody = '';
      const timestamp = new Date().toLocaleDateString();

      switch (template) {
        case 'sales':
          emailBody = this.generateSalesEmail(recipient, subject, context, tone);
          break;
        case 'support':
          emailBody = this.generateSupportEmail(recipient, subject, context, tone);
          break;
        case 'followup':
          emailBody = this.generateFollowUpEmail(recipient, subject, context, tone);
          break;
        case 'introduction':
          emailBody = this.generateIntroductionEmail(recipient, subject, context, tone);
          break;
        default:
          emailBody = this.generateStandardEmail(recipient, subject, context, tone);
      }

      // Add signature if provided
      if (params.signature) {
        emailBody += `\n\n${params.signature}`;
      }

      return {
        success: true,
        data: {
          recipient,
          subject,
          body: emailBody,
          tone,
          template,
          wordCount: emailBody.split(' ').length,
          timestamp
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private generateStandardEmail(recipient: string, subject: string, context: string, tone: string): string {
    const greeting = this.getGreeting(recipient, tone);
    const closing = this.getClosing(tone);
    
    return `${greeting}

I hope this email finds you well.

${context}

Please let me know if you have any questions or need any additional information.

${closing}`;
  }

  private generateSalesEmail(recipient: string, subject: string, context: string, tone: string): string {
    const greeting = this.getGreeting(recipient, tone);
    const closing = this.getClosing(tone);
    
    return `${greeting}

I'm reaching out regarding ${subject}.

${context}

I believe this could provide significant value to your organization by:
• Increasing efficiency and productivity
• Reducing operational costs
• Improving customer satisfaction

Would you be available for a brief 15-minute call this week to discuss how we can help you achieve your goals?

${closing}`;
  }

  private generateSupportEmail(recipient: string, subject: string, context: string, tone: string): string {
    const greeting = this.getGreeting(recipient, tone);
    const closing = this.getClosing(tone);
    
    return `${greeting}

Thank you for contacting our support team regarding ${subject}.

${context}

To assist you better, I've outlined the following steps:
1. Please ensure you have the latest version installed
2. Try clearing your cache and cookies
3. If the issue persists, please provide any error messages you're seeing

We're committed to resolving this issue as quickly as possible. If you need immediate assistance, please don't hesitate to call our support hotline.

${closing}`;
  }

  private generateFollowUpEmail(recipient: string, subject: string, context: string, tone: string): string {
    const greeting = this.getGreeting(recipient, tone);
    const closing = this.getClosing(tone);
    
    return `${greeting}

I wanted to follow up on our previous conversation about ${subject}.

${context}

Have you had a chance to review the information I sent? I'd be happy to answer any questions or provide additional details.

Looking forward to hearing from you.

${closing}`;
  }

  private generateIntroductionEmail(recipient: string, subject: string, context: string, tone: string): string {
    const greeting = this.getGreeting(recipient, tone);
    const closing = this.getClosing(tone);
    
    return `${greeting}

My name is [Your Name] and I'm [Your Position] at [Your Company].

${context}

I came across your profile and was impressed by your work in [relevant field]. I believe there might be some interesting synergies between our organizations.

Would you be open to a brief conversation to explore potential collaboration opportunities?

${closing}`;
  }

  private getGreeting(recipient: string, tone: string): string {
    switch (tone) {
      case 'formal':
        return `Dear ${recipient},`;
      case 'casual':
        return `Hi ${recipient},`;
      case 'friendly':
        return `Hello ${recipient}!`;
      default:
        return `Dear ${recipient},`;
    }
  }

  private getClosing(tone: string): string {
    switch (tone) {
      case 'formal':
        return 'Sincerely,\n[Your Name]';
      case 'casual':
        return 'Cheers,\n[Your Name]';
      case 'friendly':
        return 'Best regards,\n[Your Name]';
      default:
        return 'Best regards,\n[Your Name]';
    }
  }

  getConfig(): Record<string, any> {
    return {
      templates: ['standard', 'sales', 'support', 'followup', 'introduction'],
      tones: ['professional', 'formal', 'casual', 'friendly'],
      maxLength: 1000
    };
  }
}