/**
 * Enhanced EmailSender Skill
 * Intelligent email sending with dual-agent architecture
 */

import { EnhancedBaseSkill, IntentAnalysis, EnhancedSkillContext } from '../EnhancedBaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { SkillCore } from '../../core/SkillCore';

export class EnhancedEmailSenderSkill extends EnhancedBaseSkill {
  metadata = {
    id: 'email_sender_enhanced',
    name: 'Enhanced Email Sender',
    description: 'Intelligent email sending with context-aware templates and multi-tenant support',
    category: SkillCategory.COMMUNICATION,
    version: '3.0.0',
    author: 'Intelagent',
    tags: ["email", "communication", "ai", "intelligent", "multi-tenant"]
  };

  /**
   * Agent 1: Analyze email intent and strategy
   */
  protected async analyzeStrategy(
    params: SkillParams,
    context: EnhancedSkillContext
  ): Promise<IntentAnalysis> {
    const { to, subject, message, template, type } = params;
    
    // Determine email intent
    let intent = 'general';
    let confidence = 0.8;
    const entities: Record<string, any> = {};
    const suggestedActions: string[] = [];
    
    // Analyze based on subject and content
    const content = (subject + ' ' + message).toLowerCase();
    
    if (content.includes('welcome') || content.includes('onboarding')) {
      intent = 'welcome';
      confidence = 0.95;
      suggestedActions.push('include_getting_started_guide');
      suggestedActions.push('schedule_followup');
    } else if (content.includes('invoice') || content.includes('payment')) {
      intent = 'transactional';
      confidence = 0.9;
      entities.type = 'invoice';
      suggestedActions.push('attach_pdf');
      suggestedActions.push('include_payment_link');
    } else if (content.includes('marketing') || content.includes('promotion')) {
      intent = 'marketing';
      confidence = 0.85;
      suggestedActions.push('add_unsubscribe_link');
      suggestedActions.push('track_opens');
    } else if (content.includes('support') || content.includes('help')) {
      intent = 'support';
      confidence = 0.9;
      suggestedActions.push('create_ticket');
      suggestedActions.push('include_faq_links');
    } else if (content.includes('notification') || content.includes('alert')) {
      intent = 'notification';
      confidence = 0.9;
      suggestedActions.push('set_priority_high');
    }
    
    // Extract recipient type
    if (Array.isArray(to)) {
      entities.recipientType = 'bulk';
      suggestedActions.push('use_batch_sending');
    } else {
      entities.recipientType = 'single';
    }
    
    // Check for urgency
    if (content.includes('urgent') || content.includes('immediate')) {
      entities.priority = 'high';
      suggestedActions.push('send_immediately');
    }
    
    return {
      intent,
      confidence,
      entities,
      searchTerms: [intent, 'email', entities.type].filter(Boolean),
      suggestedActions
    };
  }

  /**
   * Agent 2: Generate formatted email response
   */
  protected async generateResponse(
    strategy: IntentAnalysis,
    data: any,
    context: EnhancedSkillContext
  ): Promise<string> {
    const { messageId, status, provider } = data;
    const baseUrl = context.domain ? `https://${context.domain}` : '';
    
    // Create response based on intent
    const responses: Record<string, string> = {
      welcome: `✓ Welcome email sent successfully! Message ID: ${messageId}. The recipient will receive onboarding instructions${baseUrl ? ` and can access their account at ${baseUrl}` : ''}.`,
      
      transactional: `✓ Transaction email delivered. ID: ${messageId}. ${strategy.entities?.type === 'invoice' ? 'Invoice has been sent with payment instructions.' : 'Transaction details sent successfully.'}`,
      
      marketing: `✓ Marketing email campaign initiated. ID: ${messageId}. Tracking enabled for opens and clicks. ${data.recipientCount ? `Sent to ${data.recipientCount} recipients.` : ''}`,
      
      support: `✓ Support email sent. Ticket #${messageId} created. Our team will respond within 24 hours${baseUrl ? `. Track status at ${baseUrl}/support` : ''}.`,
      
      notification: `✓ Notification delivered${strategy.entities?.priority === 'high' ? ' with high priority' : ''}. ID: ${messageId}. Recipient notified immediately.`,
      
      general: `✓ Email sent successfully. Message ID: ${messageId}. Delivered via ${provider} to ${data.recipientCount || 1} recipient(s).`
    };
    
    return responses[strategy.intent] || responses.general;
  }

  /**
   * Perform the email sending action
   */
  protected async performAction(
    params: SkillParams,
    strategy: IntentAnalysis,
    context: EnhancedSkillContext
  ): Promise<any> {
    const core = SkillCore.getInstance();
    const { to, subject, message, attachments, cc, bcc, template } = params;
    
    if (!to || !subject) {
      throw new Error('Recipient and subject are required');
    }
    
    // Enhance email based on context and strategy
    let enhancedSubject = subject;
    let enhancedMessage = message || '';
    
    // Add company branding if available
    if (context.companyName) {
      enhancedSubject = `[${context.companyName}] ${subject}`;
    }
    
    // Apply template based on intent
    if (!template && strategy.intent !== 'general') {
      enhancedMessage = this.applyTemplate(strategy.intent, {
        message: enhancedMessage,
        companyName: context.companyName,
        domain: context.domain,
        customKnowledge: context.customKnowledge
      });
    }
    
    // Add footer based on intent
    enhancedMessage += this.generateFooter(strategy.intent, context);
    
    // Handle bulk sending
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await core.sendEmail(recipient, enhancedSubject, enhancedMessage, {
          cc,
          bcc,
          attachments,
          licenseKey: context.productKey,
          taskId: params._context?.taskId,
          priority: strategy.entities?.priority,
          tracking: strategy.intent === 'marketing'
        });
        
        results.push({
          recipient,
          messageId: result.messageId,
          status: 'sent'
        });
      } catch (error: any) {
        results.push({
          recipient,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    // Return aggregated result
    const successCount = results.filter(r => r.status === 'sent').length;
    
    return {
      messageId: results[0]?.messageId || 'batch-' + Date.now(),
      status: successCount === recipients.length ? 'sent' : 'partial',
      provider: 'enhanced-smtp',
      recipientCount: recipients.length,
      successCount,
      failedCount: recipients.length - successCount,
      timestamp: new Date(),
      intent: strategy.intent,
      results: results
    };
  }

  /**
   * Apply email template based on intent
   */
  private applyTemplate(intent: string, data: any): string {
    const { message, companyName, domain } = data;
    const templates: Record<string, string> = {
      welcome: `
Dear Valued Customer,

Welcome to ${companyName || 'our platform'}! We're excited to have you on board.

${message}

Getting Started:
1. Complete your profile setup
2. Explore our features
3. Contact support if you need help

Visit ${domain ? `https://${domain}/getting-started` : 'our website'} to learn more.

Best regards,
The ${companyName || 'Team'}
`,
      
      transactional: `
${message}

This is an automated transaction notification. Please do not reply to this email.

For questions, visit ${domain ? `https://${domain}/support` : 'our support page'}.
`,
      
      marketing: `
${message}

${domain ? `Learn more at https://${domain}` : ''}

Special offers and updates tailored just for you!
`,
      
      support: `
Thank you for contacting support.

${message}

We'll get back to you within 24 hours. For urgent matters, please call our support line.

${domain ? `Track your request at https://${domain}/support` : ''}
`,
      
      notification: `
Important Notification:

${message}

This is an automated system notification.
`
    };
    
    return templates[intent] || message;
  }

  /**
   * Generate email footer based on intent and context
   */
  private generateFooter(intent: string, context: EnhancedSkillContext): string {
    const companyName = context.companyName || 'Intelagent Studios';
    const domain = context.domain || 'intelagentstudios.com';
    
    const footers: Record<string, string> = {
      marketing: `

---
Unsubscribe: https://${domain}/unsubscribe
Update preferences: https://${domain}/preferences
${companyName} | AI-Powered Solutions
`,
      
      support: `

---
Support Hours: Mon-Fri 9am-6pm EST
Email: support@${domain}
Phone: Contact us through the portal
${companyName} Support Team
`,
      
      general: `

---
${companyName}
${domain ? `https://${domain}` : ''}
Powered by Intelagent Skills Platform
`
    };
    
    return footers[intent] || footers.general;
  }

  validate(params: SkillParams): boolean {
    return !!(params?.to && params?.subject);
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'communication',
      version: '3.0.0',
      features: [
        'multi-tenant',
        'intelligent-routing',
        'template-engine',
        'bulk-sending',
        'tracking',
        'priority-handling'
      ]
    };
  }
}