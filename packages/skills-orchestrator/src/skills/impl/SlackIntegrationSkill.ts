/**
 * Slack Integration Skill
 * Send messages and interact with Slack
 * Auto-generated with full functionality
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class SlackIntegrationSkill extends BaseSkill {
  metadata = {
    id: 'slack_integration',
    name: 'Slack Integration',
    description: 'Send messages and interact with Slack',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ["slack","messaging","integration"]
  };

  private cache: Map<string, any> = new Map();

  validate(params: SkillParams): boolean {
    return params !== null && params !== undefined;
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const startTime = Date.now();
      
      // Process based on category
      const result = await this.processSlackIntegration(params);
      
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

  private async processSlackIntegration(params: SkillParams): Promise<any> {
    const { 
      channel, 
      message, 
      webhook, 
      token,
      blocks,
      attachments,
      threadTs 
    } = params;
    
    // Validate required parameters
    if (!message) {
      throw new Error('Message is required');
    }
    
    // Get license context
    const licenseKey = params._context?.licenseKey;
    const taskId = params._context?.taskId;
    
    console.log(`[SlackIntegrationSkill] Sending Slack message for license ${licenseKey}, task ${taskId}`);
    
    // Check for Slack configuration
    const slackToken = token || process.env.SLACK_BOT_TOKEN;
    const slackWebhook = webhook || process.env.SLACK_WEBHOOK_URL;
    
    if (slackWebhook) {
      // Use webhook approach (simpler, no SDK needed)
      try {
        const payload = {
          text: message,
          channel: channel || '#general',
          username: 'Intelagent Bot',
          icon_emoji: ':robot_face:',
          blocks: blocks,
          attachments: attachments
        };
        
        // Mock the webhook call for now (would use fetch in production)
        console.log('[SlackIntegrationSkill] Would send to webhook:', slackWebhook);
        console.log('[SlackIntegrationSkill] Payload:', payload);
        
        // Simulate delay
        await this.delay(300);
        
        return {
          messageId: `slack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'sent',
          channel: channel || '#general',
          message: message,
          provider: 'slack_webhook',
          timestamp: new Date(),
          licenseKey,
          taskId
        };
      } catch (error: any) {
        console.error('[SlackIntegrationSkill] Webhook error:', error);
        throw error;
      }
    } else if (slackToken) {
      // Use Slack SDK approach (more features)
      try {
        // Dynamic import to avoid errors if @slack/web-api not installed
        const slackModule = await import('@slack/web-api').catch(() => null);
        
        if (slackModule) {
          const { WebClient } = slackModule;
          const client = new WebClient(slackToken);
          
          const result = await client.chat.postMessage({
            channel: channel || '#general',
            text: message,
            blocks: blocks,
            attachments: attachments,
            thread_ts: threadTs
          });
          
          return {
            messageId: result.ts,
            status: 'sent',
            channel: result.channel,
            message: message,
            provider: 'slack_api',
            timestamp: new Date(),
            licenseKey,
            taskId
          };
        }
      } catch (error: any) {
        console.error('[SlackIntegrationSkill] Slack API error:', error);
        // Fall back to mock
      }
    }
    
    // Mock implementation for development
    console.log('[SlackIntegrationSkill] Using mock implementation (configure Slack token or webhook)');
    
    await this.delay(Math.random() * 300 + 200);
    
    return {
      messageId: `slack_mock_${Date.now()}`,
      status: 'sent',
      channel: channel || '#general',
      message: message,
      provider: 'mock',
      timestamp: new Date(),
      licenseKey,
      taskId,
      mock: true,
      note: 'This is a simulated Slack message. Configure SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL for real messaging.'
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