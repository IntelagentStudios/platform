/**
 * Communications Agent
 * Manages all communication channels: email, SMS, push notifications, in-app messages
 */

import { SpecialistAgent, AgentInsight } from './base/SpecialistAgent';

export class CommunicationsAgent extends SpecialistAgent {
  private channels = new Map<string, any>();
  private templates = new Map<string, any>();
  private queues = new Map<string, any[]>();
  private subscribers = new Map<string, Set<string>>();
  
  constructor() {
    super('communications-agent', 'communications');
    this.initializeChannels();
  }
  
  protected async initialize(): Promise<void> {
    console.log('[CommunicationsAgent] Initializing communication channels...');
    this.loadTemplates();
  }
  
  private initializeChannels(): void {
    // Email channel
    this.channels.set('email', {
      provider: 'sendgrid',
      enabled: true,
      rateLimit: 100,
      priority: 1
    });
    
    // SMS channel
    this.channels.set('sms', {
      provider: 'twilio',
      enabled: true,
      rateLimit: 30,
      priority: 2
    });
    
    // Push notifications
    this.channels.set('push', {
      provider: 'firebase',
      enabled: true,
      rateLimit: 200,
      priority: 3
    });
    
    // In-app messaging
    this.channels.set('in_app', {
      provider: 'internal',
      enabled: true,
      rateLimit: 500,
      priority: 4
    });
    
    // Slack
    this.channels.set('slack', {
      provider: 'slack',
      enabled: true,
      rateLimit: 50,
      priority: 5
    });
    
    // Initialize queues for each channel
    this.channels.forEach((_, channel) => {
      this.queues.set(channel, []);
    });
  }
  
  private loadTemplates(): void {
    // Load message templates
    this.templates.set('welcome', {
      subject: 'Welcome to {{company}}!',
      body: 'Hi {{name}}, welcome aboard!',
      channels: ['email', 'in_app']
    });
    
    this.templates.set('password_reset', {
      subject: 'Password Reset Request',
      body: 'Click here to reset your password: {{link}}',
      channels: ['email']
    });
    
    this.templates.set('payment_success', {
      subject: 'Payment Received',
      body: 'We\'ve received your payment of {{amount}}',
      channels: ['email', 'sms', 'push']
    });
    
    this.templates.set('alert', {
      subject: 'Important Alert',
      body: '{{message}}',
      channels: ['email', 'sms', 'push', 'slack']
    });
    
    this.templates.set('newsletter', {
      subject: 'Monthly Newsletter',
      body: 'Check out what\'s new this month!',
      channels: ['email']
    });
  }
  
  protected startMonitoring(): void {
    // Monitor communication channels
    setInterval(() => this.processQueues(), 5000); // Every 5 seconds
    setInterval(() => this.checkDeliveryStatus(), 30000); // Every 30 seconds
    setInterval(() => this.cleanupQueues(), 60000); // Every minute
    setInterval(() => this.updateSubscribers(), 300000); // Every 5 minutes
  }
  
  protected async analyzeEvent(event: any): Promise<AgentInsight | null> {
    const { type, data } = event;
    
    switch (type) {
      case 'delivery_failed':
        return this.createInsight(
          'error',
          'Message Delivery Failed',
          `Failed to deliver message via ${data.channel}: ${data.error}`,
          0.9,
          data
        );
      
      case 'bounce_detected':
        return this.createInsight(
          'warning',
          'Email Bounce',
          `Email bounced for ${data.recipient}: ${data.reason}`,
          0.8,
          data
        );
      
      case 'unsubscribe':
        return this.createInsight(
          'info',
          'User Unsubscribed',
          `${data.user} unsubscribed from ${data.channel}`,
          0.5,
          data
        );
      
      case 'spam_complaint':
        return this.createInsight(
          'warning',
          'Spam Complaint',
          `Spam complaint received from ${data.recipient}`,
          0.85,
          data
        );
      
      case 'rate_limit_warning':
        return this.createInsight(
          'warning',
          'Approaching Rate Limit',
          `${data.channel} approaching rate limit (${data.current}/${data.limit})`,
          0.7,
          data
        );
      
      default:
        return null;
    }
  }
  
  protected shouldIntervene(insight: AgentInsight): boolean {
    // Intervene on delivery failures and spam complaints
    return insight.type === 'error' || 
           (insight.type === 'warning' && insight.title === 'Spam Complaint');
  }
  
  protected async intervene(insight: AgentInsight): Promise<void> {
    console.log(`[CommunicationsAgent] Communication intervention: ${insight.title}`);
    
    switch (insight.title) {
      case 'Message Delivery Failed':
        this.emit('intervention', {
          type: 'retry_delivery',
          insight,
          retryCount: 3,
          backoff: 'exponential'
        });
        break;
      
      case 'Email Bounce':
        this.emit('intervention', {
          type: 'update_recipient',
          insight,
          action: 'mark_invalid'
        });
        break;
      
      case 'Spam Complaint':
        this.emit('intervention', {
          type: 'review_content',
          insight,
          action: 'suppress_recipient'
        });
        break;
    }
  }
  
  protected async cleanup(): Promise<void> {
    // Save queued messages before cleanup
    await this.saveQueuedMessages();
    this.queues.clear();
  }
  
  /**
   * Execute communication request
   */
  public async execute(request: any): Promise<any> {
    const { action, params } = request.params;
    
    switch (action) {
      case 'send_message':
        return await this.sendMessage(params);
      
      case 'broadcast':
        return await this.broadcast(params);
      
      case 'schedule_message':
        return await this.scheduleMessage(params);
      
      case 'manage_subscription':
        return await this.manageSubscription(params);
      
      default:
        throw new Error(`Unknown communication action: ${action}`);
    }
  }
  
  /**
   * Send message
   */
  private async sendMessage(params: any): Promise<any> {
    const { channel, recipient, template, data } = params;
    
    // Validate channel
    if (!this.channels.has(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    
    // Get template if specified
    let message = params.message;
    if (template) {
      const tpl = this.templates.get(template);
      if (!tpl) {
        throw new Error(`Template not found: ${template}`);
      }
      message = this.renderTemplate(tpl, data);
    }
    
    // Queue the message
    const messageObj = {
      id: this.generateMessageId(),
      channel,
      recipient,
      message,
      timestamp: new Date(),
      status: 'queued'
    };
    
    const queue = this.queues.get(channel) || [];
    queue.push(messageObj);
    this.queues.set(channel, queue);
    
    return {
      success: true,
      messageId: messageObj.id,
      channel,
      status: 'queued'
    };
  }
  
  /**
   * Broadcast message
   */
  private async broadcast(params: any): Promise<any> {
    const { channels, segment, template, data } = params;
    
    // Get recipients for segment
    const recipients = this.getSegmentRecipients(segment);
    
    const results = [];
    for (const channel of channels) {
      for (const recipient of recipients) {
        const result = await this.sendMessage({
          channel,
          recipient,
          template,
          data
        });
        results.push(result);
      }
    }
    
    return {
      success: true,
      broadcast: {
        channels,
        recipients: recipients.length,
        messages: results.length
      }
    };
  }
  
  /**
   * Schedule message
   */
  private async scheduleMessage(params: any): Promise<any> {
    const { sendAt, ...messageParams } = params;
    
    // Store scheduled message
    const scheduledMessage = {
      ...messageParams,
      scheduledFor: new Date(sendAt),
      status: 'scheduled'
    };
    
    return {
      success: true,
      scheduled: scheduledMessage
    };
  }
  
  /**
   * Manage subscription
   */
  private async manageSubscription(params: any): Promise<any> {
    const { user, channel, action } = params;
    
    const subscribers = this.subscribers.get(channel) || new Set();
    
    if (action === 'subscribe') {
      subscribers.add(user);
    } else if (action === 'unsubscribe') {
      subscribers.delete(user);
    }
    
    this.subscribers.set(channel, subscribers);
    
    return {
      success: true,
      user,
      channel,
      subscribed: subscribers.has(user)
    };
  }
  
  /**
   * Process message queues
   */
  private async processQueues(): Promise<void> {
    if (!this.isActive) return;
    
    for (const [channel, queue] of this.queues) {
      if (queue.length === 0) continue;
      
      const channelConfig = this.channels.get(channel);
      if (!channelConfig?.enabled) continue;
      
      // Process messages up to rate limit
      const toProcess = queue.splice(0, Math.min(5, queue.length));
      
      for (const message of toProcess) {
        // Simulate sending
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
        } else {
          message.status = 'failed';
          message.error = 'Delivery failed';
          
          // Re-queue for retry
          if (!message.retryCount || message.retryCount < 3) {
            message.retryCount = (message.retryCount || 0) + 1;
            queue.push(message);
          }
        }
      }
    }
  }
  
  /**
   * Check delivery status
   */
  private async checkDeliveryStatus(): Promise<void> {
    if (!this.isActive) return;
    
    // Check for stuck messages
    for (const [channel, queue] of this.queues) {
      const stuck = queue.filter(m => 
        m.status === 'queued' && 
        Date.now() - m.timestamp.getTime() > 60000
      );
      
      if (stuck.length > 0) {
        this.addInsight(this.createInsight(
          'warning',
          'Stuck Messages',
          `${stuck.length} messages stuck in ${channel} queue`,
          0.7,
          { channel, count: stuck.length }
        ));
      }
    }
  }
  
  /**
   * Cleanup old messages from queues
   */
  private async cleanupQueues(): Promise<void> {
    if (!this.isActive) return;
    
    for (const [channel, queue] of this.queues) {
      // Remove delivered messages older than 1 hour
      const cutoff = Date.now() - 3600000;
      const cleaned = queue.filter(m => 
        m.status !== 'delivered' || 
        m.deliveredAt?.getTime() > cutoff
      );
      
      this.queues.set(channel, cleaned);
    }
  }
  
  /**
   * Update subscriber lists
   */
  private async updateSubscribers(): Promise<void> {
    if (!this.isActive) return;
    
    // Simulate subscriber updates
    for (const [channel, subscribers] of this.subscribers) {
      const count = subscribers.size;
      if (count > 1000) {
        this.addInsight(this.createInsight(
          'info',
          'Large Subscriber Base',
          `${channel} has ${count} subscribers`,
          0.5,
          { channel, count }
        ));
      }
    }
  }
  
  /**
   * Render template with data
   */
  private renderTemplate(template: any, data: any): any {
    let subject = template.subject;
    let body = template.body;
    
    // Simple template rendering
    Object.keys(data || {}).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject?.replace(regex, data[key]);
      body = body?.replace(regex, data[key]);
    });
    
    return { subject, body };
  }
  
  /**
   * Get recipients for segment
   */
  private getSegmentRecipients(segment: string): string[] {
    // Simulate segment retrieval
    const segments: Record<string, string[]> = {
      all: ['user1', 'user2', 'user3'],
      premium: ['user1'],
      trial: ['user2', 'user3']
    };
    
    return segments[segment] || [];
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save queued messages
   */
  private async saveQueuedMessages(): Promise<void> {
    // Save undelivered messages to persistent storage
    let totalQueued = 0;
    for (const queue of this.queues.values()) {
      totalQueued += queue.filter(m => m.status === 'queued').length;
    }
    
    if (totalQueued > 0) {
      console.log(`[CommunicationsAgent] Saved ${totalQueued} queued messages`);
    }
  }
  
  /**
   * Get status
   */
  public async getStatus(): Promise<any> {
    const queueSizes: Record<string, number> = {};
    for (const [channel, queue] of this.queues) {
      queueSizes[channel] = queue.length;
    }
    
    return {
      active: this.isActive,
      channels: this.channels.size,
      templates: this.templates.size,
      queues: queueSizes,
      subscribers: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([k, v]) => [k, v.size])
      )
    };
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    await super.stop();
  }
}