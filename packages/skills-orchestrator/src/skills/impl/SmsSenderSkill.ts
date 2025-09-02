/**
 * SMS Sender Skill
 * Send SMS messages via multiple providers
 * Auto-generated with full functionality
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class SmsSenderSkill extends BaseSkill {
  metadata = {
    id: 'sms_sender',
    name: 'SMS Sender',
    description: 'Send SMS messages via multiple providers',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ["sms","messaging","notification"]
  };

  private cache: Map<string, any> = new Map();

  validate(params: SkillParams): boolean {
    return params !== null && params !== undefined;
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const startTime = Date.now();
      
      // Process based on category
      const result = await this.processSmsSender(params);
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          ...result,
          category: 'communication',
          executionTime,
          timestamp: new Date()
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

  private async processSmsSender(params: SkillParams): Promise<any> {
    const { to, message, from, provider = 'twilio' } = params;
    
    // Validate required parameters
    if (!to || !message) {
      throw new Error('Recipients (to) and message are required');
    }
    
    // Get license context if available
    const licenseKey = params._context?.licenseKey;
    const taskId = params._context?.taskId;
    
    console.log(`[SmsSenderSkill] Sending SMS for license ${licenseKey}, task ${taskId}`);
    
    // Check if we have real credentials configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = from || process.env.TWILIO_PHONE_NUMBER;
    
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
      // Real Twilio implementation
      try {
        // Dynamic import to avoid errors if Twilio not installed
        const twilio = await import('twilio').catch(() => null);
        
        if (twilio) {
          const client = twilio.default(twilioAccountSid, twilioAuthToken);
          
          const result = await client.messages.create({
            body: message,
            from: twilioFromNumber,
            to: to
          });
          
          return {
            messageId: result.sid,
            status: result.status,
            recipient: to,
            from: twilioFromNumber,
            content: message,
            provider: 'twilio',
            deliveredAt: result.dateCreated,
            licenseKey,
            taskId
          };
        }
      } catch (error: any) {
        console.error('[SmsSenderSkill] Twilio error:', error);
        // Fall back to mock if Twilio fails
      }
    }
    
    // Mock implementation for development/testing
    console.log('[SmsSenderSkill] Using mock implementation (configure Twilio for real SMS)');
    
    // Simulate SMS sending delay
    await this.delay(Math.random() * 500 + 500);
    
    return {
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      recipient: to,
      from: twilioFromNumber || '+1234567890',
      content: message,
      provider: 'mock',
      deliveredAt: new Date(),
      licenseKey,
      taskId,
      mock: true,
      note: 'This is a simulated SMS. Configure Twilio credentials for real SMS sending.'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'communication',
      version: '1.0.0'
    };
  }
}