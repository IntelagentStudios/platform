import { prisma } from '@intelagent/database';
import { RedisManager, pubsub } from '@intelagent/redis';
import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import twilio from 'twilio';

interface Notification {
  id?: string;
  licenseKey: string;
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'in-app';
  channel?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  subject: string;
  message: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  retryCount?: number;
}

interface NotificationPreferences {
  email?: {
    enabled: boolean;
    address: string;
    types: string[];
  };
  sms?: {
    enabled: boolean;
    phone: string;
    types: string[];
  };
  slack?: {
    enabled: boolean;
    webhook: string;
    channel: string;
    types: string[];
  };
  webhook?: {
    enabled: boolean;
    url: string;
    secret: string;
    types: string[];
  };
  inApp?: {
    enabled: boolean;
    types: string[];
  };
}

class NotificationService {
  private redis: any = null;
  private emailTransporter: nodemailer.Transporter | null = null;
  private slackClient: WebClient | null = null;
  private twilioClient: any = null;
  private queue: Notification[] = [];
  private processing: boolean = false;

  constructor() {
    this.initServices();
    this.startProcessor();
  }

  private initServices() {
    // Use centralized Redis client for pub/sub
    try {
      this.redis = RedisManager.getClient('pubsub');
      if (this.redis) {
        console.log('Notification service using Redis');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis for notifications:', error);
    }

    // Initialize email transport
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Initialize Slack client
    if (process.env.SLACK_BOT_TOKEN) {
      this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    }

    // Initialize Twilio client
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  private startProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  async send(notification: Notification): Promise<void> {
    // Add to queue
    this.queue.push({
      ...notification,
      id: this.generateId()
    });

    // Store in database for audit trail
    await this.storeNotification(notification);

    // Process immediately if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (!notification) continue;

      try {
        // Get user preferences
        const preferences = await this.getUserPreferences(notification.licenseKey);

        // Send based on type and preferences
        switch (notification.type) {
          case 'email':
            if (preferences.email?.enabled) {
              await this.sendEmail(notification, preferences.email.address);
            }
            break;
          
          case 'sms':
            if (preferences.sms?.enabled) {
              await this.sendSMS(notification, preferences.sms.phone);
            }
            break;
          
          case 'slack':
            if (preferences.slack?.enabled) {
              await this.sendSlack(notification, preferences.slack);
            }
            break;
          
          case 'webhook':
            if (preferences.webhook?.enabled) {
              await this.sendWebhook(notification, preferences.webhook);
            }
            break;
          
          case 'in-app':
            await this.sendInApp(notification);
            break;
        }

        // Update status
        await this.updateNotificationStatus(notification.id!, 'sent');

      } catch (error) {
        console.error('Failed to send notification:', error);
        
        // Retry logic
        if ((notification.retryCount || 0) < 3) {
          notification.retryCount = (notification.retryCount || 0) + 1;
          this.queue.push(notification); // Re-queue for retry
        } else {
          await this.updateNotificationStatus(notification.id!, 'failed');
        }
      }
    }

    this.processing = false;
  }

  private async sendEmail(notification: Notification, to: string): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transport not configured');
    }

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@intelagent.ai',
      to,
      subject: notification.subject,
      html: this.formatEmailContent(notification),
      priority: notification.priority === 'critical' ? 'high' : 'normal'
    });
  }

  private async sendSMS(notification: Notification, to: string): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    await this.twilioClient.messages.create({
      body: `${notification.subject}: ${notification.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  }

  private async sendSlack(notification: Notification, config: any): Promise<void> {
    if (!this.slackClient) {
      // Use webhook URL if available
      if (config.webhook) {
        const response = await fetch(config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: config.channel,
            text: notification.subject,
            attachments: [{
              color: this.getPriorityColor(notification.priority),
              text: notification.message,
              footer: 'Intelagent Platform',
              ts: Math.floor(Date.now() / 1000)
            }]
          })
        });

        if (!response.ok) {
          throw new Error('Slack webhook failed');
        }
      } else {
        throw new Error('Slack not configured');
      }
    } else {
      await this.slackClient.chat.postMessage({
        channel: config.channel,
        text: notification.subject,
        attachments: [{
          color: this.getPriorityColor(notification.priority),
          text: notification.message,
          footer: 'Intelagent Platform',
          ts: Math.floor(Date.now() / 1000).toString()
        }]
      });
    }
  }

  private async sendWebhook(notification: Notification, config: any): Promise<void> {
    const payload = {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      subject: notification.subject,
      message: notification.message,
      metadata: notification.metadata,
      timestamp: new Date().toISOString()
    };

    const signature = this.generateWebhookSignature(JSON.stringify(payload), config.secret);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Notification-Id': notification.id!
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }

  private async sendInApp(notification: Notification): Promise<void> {
    // Store in database for in-app display
    await prisma.notifications.create({
      data: {
        license_key: notification.licenseKey,
        type: 'in-app',
        subject: notification.subject,
        message: notification.message,
        priority: notification.priority,
        metadata: notification.metadata || {},
        status: 'unread',
        created_at: new Date()
      }
    });

    // Publish to real-time channel if Redis available
    if (this.redis) {
      await this.redis.publish(
        `notifications:${notification.licenseKey}`,
        JSON.stringify({
          type: 'new-notification',
          data: notification
        })
      );
    }
  }

  private async getUserPreferences(licenseKey: string): Promise<NotificationPreferences> {
    // Get from database
    const preferences = await prisma.notification_preferences.findUnique({
      where: { license_key: licenseKey }
    });

    if (preferences) {
      return preferences.preferences as NotificationPreferences;
    }

    // Default preferences
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    return {
      email: {
        enabled: true,
        address: license?.email || '',
        types: ['all']
      },
      inApp: {
        enabled: true,
        types: ['all']
      }
    };
  }

  private async storeNotification(notification: Notification): Promise<void> {
    await prisma.notifications.create({
      data: {
        id: notification.id,
        license_key: notification.licenseKey,
        type: notification.type,
        channel: notification.channel,
        priority: notification.priority,
        subject: notification.subject,
        message: notification.message,
        metadata: notification.metadata || {},
        scheduled_for: notification.scheduledFor,
        status: 'pending',
        created_at: new Date()
      }
    });
  }

  private async updateNotificationStatus(id: string, status: string): Promise<void> {
    await prisma.notifications.update({
      where: { id },
      data: {
        status,
        sent_at: status === 'sent' ? new Date() : undefined,
        updated_at: new Date()
      }
    });
  }

  private formatEmailContent(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f7f7f7; }
            .priority-${notification.priority} { border-left: 4px solid ${this.getPriorityColor(notification.priority)}; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.subject}</h2>
            </div>
            <div class="content priority-${notification.priority}">
              <p>${notification.message}</p>
              ${notification.metadata?.actionUrl ? `
                <p style="text-align: center; margin-top: 30px;">
                  <a href="${notification.metadata.actionUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    ${notification.metadata.actionText || 'Take Action'}
                  </a>
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: '#94a3b8',
      normal: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority] || colors.normal;
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateWebhookSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}

// Singleton instance
const notificationService = new NotificationService();

// Predefined notification templates
export async function sendUsageAlert(licenseKey: string, product: string, percentage: number) {
  await notificationService.send({
    licenseKey,
    type: 'email',
    priority: percentage >= 90 ? 'high' : 'normal',
    subject: `Usage Alert: ${product} at ${percentage}% capacity`,
    message: `Your ${product} usage has reached ${percentage}% of your plan limit. Consider upgrading to avoid service interruption.`,
    metadata: {
      product,
      percentage,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      actionText: 'Upgrade Now'
    }
  });
}

export async function sendPaymentReminder(licenseKey: string, daysUntilDue: number) {
  await notificationService.send({
    licenseKey,
    type: 'email',
    priority: daysUntilDue <= 3 ? 'high' : 'normal',
    subject: `Payment Reminder: Invoice due in ${daysUntilDue} days`,
    message: `Your invoice is due in ${daysUntilDue} days. Please ensure your payment method is up to date.`,
    metadata: {
      daysUntilDue,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      actionText: 'View Billing'
    }
  });
}

export async function sendSystemAlert(licenseKey: string, alertType: string, details: string) {
  await notificationService.send({
    licenseKey,
    type: 'in-app',
    priority: 'high',
    subject: `System Alert: ${alertType}`,
    message: details,
    metadata: {
      alertType,
      timestamp: new Date().toISOString()
    }
  });
}

export async function sendWelcomeNotification(licenseKey: string, customerName: string) {
  await notificationService.send({
    licenseKey,
    type: 'email',
    priority: 'normal',
    subject: 'Welcome to Intelagent Platform!',
    message: `Hi ${customerName}, welcome to Intelagent! Your account is now active and ready to use. Get started by setting up your first product.`,
    metadata: {
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      actionText: 'Get Started'
    }
  });
}

export { notificationService, NotificationService, Notification, NotificationPreferences };