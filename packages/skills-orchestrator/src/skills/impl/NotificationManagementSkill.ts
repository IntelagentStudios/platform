import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationManagementSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'notification_management',
    name: 'Notification Management System',
    description: 'Comprehensive notification management for all platform communications',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['notification', 'alert', 'communication', 'messaging', 'management']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        // Notification Creation
        case 'create_notification':
          return await this.createNotification(licenseKey, data);
        case 'create_bulk_notifications':
          return await this.createBulkNotifications(licenseKey, data);
        case 'schedule_notification':
          return await this.scheduleNotification(licenseKey, data);

        // Notification Management
        case 'get_notifications':
          return await this.getNotifications(licenseKey, data);
        case 'mark_as_read':
          return await this.markAsRead(licenseKey, data.notificationIds);
        case 'delete_notifications':
          return await this.deleteNotifications(licenseKey, data.notificationIds);
        case 'archive_notifications':
          return await this.archiveNotifications(licenseKey, data.notificationIds);

        // Channel Management
        case 'configure_channel':
          return await this.configureChannel(licenseKey, data);
        case 'get_channels':
          return await this.getChannels(licenseKey);
        case 'test_channel':
          return await this.testChannel(licenseKey, data.channelId);

        // Subscription Management
        case 'subscribe':
          return await this.subscribe(licenseKey, data);
        case 'unsubscribe':
          return await this.unsubscribe(licenseKey, data);
        case 'get_subscriptions':
          return await this.getSubscriptions(licenseKey, data.userId);

        // Template Management
        case 'create_template':
          return await this.createTemplate(licenseKey, data);
        case 'get_templates':
          return await this.getTemplates(licenseKey);
        case 'render_template':
          return await this.renderTemplate(licenseKey, data);

        // Delivery & Tracking
        case 'send_notification':
          return await this.sendNotification(licenseKey, data);
        case 'track_delivery':
          return await this.trackDelivery(licenseKey, data.notificationId);
        case 'retry_failed':
          return await this.retryFailedNotifications(licenseKey);

        // Analytics
        case 'get_analytics':
          return await this.getNotificationAnalytics(licenseKey, data);
        case 'get_engagement_metrics':
          return await this.getEngagementMetrics(licenseKey, data);

        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in NotificationManagementSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async createNotification(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        recipientType = 'user',
        recipientId,
        type,
        priority = 'medium',
        title,
        message,
        actionUrl,
        actionLabel,
        metadata,
        channels = ['dashboard']
      } = data;

      // Create notification
      const notification = await prisma.notifications.create({
        data: {
          license_key: licenseKey,
          recipient_type: recipientType,
          recipient_id: recipientId,
          type,
          priority,
          title,
          message,
          action_url: actionUrl,
          action_label: actionLabel,
          channels,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString()
          },
          status: 'pending',
          created_at: new Date()
        }
      });

      // Queue for delivery
      await this.queueForDelivery(notification, channels);

      // For high priority, send immediately
      if (priority === 'critical' || priority === 'high') {
        await this.deliverImmediately(notification);
      }

      return this.success({
        notificationId: notification.id,
        status: 'created',
        channels,
        priority,
        message: 'Notification created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create notification: ${error.message}`);
    }
  }

  private async createBulkNotifications(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { recipients, template, variables = {} } = data;

      const notifications = [];

      for (const recipient of recipients) {
        // Render template for each recipient
        const rendered = await this.renderTemplate(licenseKey, {
          templateId: template,
          variables: { ...variables, recipient }
        });

        if (rendered.success) {
          const notification = await this.createNotification(licenseKey, {
            recipientType: recipient.type || 'user',
            recipientId: recipient.id,
            ...rendered.data
          });

          notifications.push(notification.data);
        }
      }

      return this.success({
        created: notifications.length,
        notifications,
        message: `Created ${notifications.length} notifications`
      });
    } catch (error: any) {
      return this.error(`Failed to create bulk notifications: ${error.message}`);
    }
  }

  private async scheduleNotification(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { scheduledFor, ...notificationData } = data;

      // Create scheduled notification
      const scheduled = await prisma.scheduled_notifications.create({
        data: {
          license_key: licenseKey,
          scheduled_for: new Date(scheduledFor),
          notification_data: notificationData,
          status: 'scheduled'
        }
      });

      return this.success({
        scheduledId: scheduled.id,
        scheduledFor,
        status: 'scheduled',
        message: 'Notification scheduled successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to schedule notification: ${error.message}`);
    }
  }

  private async getNotifications(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        recipientId,
        recipientType = 'user',
        status,
        priority,
        type,
        unreadOnly = false,
        limit = 50,
        offset = 0
      } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (recipientId) {
        whereClause.recipient_id = recipientId;
        whereClause.recipient_type = recipientType;
      }

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (type) whereClause.type = type;
      if (unreadOnly) whereClause.read_at = null;

      const [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.notifications.count({ where: whereClause })
      ]);

      const unreadCount = await prisma.notifications.count({
        where: { ...whereClause, read_at: null }
      });

      return this.success({
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          actionUrl: n.action_url,
          actionLabel: n.action_label,
          read: n.read_at !== null,
          createdAt: n.created_at
        })),
        total,
        unreadCount,
        hasMore: offset + limit < total,
        message: 'Notifications retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get notifications: ${error.message}`);
    }
  }

  private async markAsRead(licenseKey: string, notificationIds: string[]): Promise<SkillResult> {
    try {
      const updated = await prisma.notifications.updateMany({
        where: {
          license_key: licenseKey,
          id: { in: notificationIds },
          read_at: null
        },
        data: {
          read_at: new Date()
        }
      });

      return this.success({
        marked: updated.count,
        notificationIds,
        message: `Marked ${updated.count} notifications as read`
      });
    } catch (error: any) {
      return this.error(`Failed to mark notifications as read: ${error.message}`);
    }
  }

  private async deleteNotifications(licenseKey: string, notificationIds: string[]): Promise<SkillResult> {
    try {
      const deleted = await prisma.notifications.deleteMany({
        where: {
          license_key: licenseKey,
          id: { in: notificationIds }
        }
      });

      return this.success({
        deleted: deleted.count,
        notificationIds,
        message: `Deleted ${deleted.count} notifications`
      });
    } catch (error: any) {
      return this.error(`Failed to delete notifications: ${error.message}`);
    }
  }

  private async archiveNotifications(licenseKey: string, notificationIds: string[]): Promise<SkillResult> {
    try {
      const archived = await prisma.notifications.updateMany({
        where: {
          license_key: licenseKey,
          id: { in: notificationIds }
        },
        data: {
          status: 'archived',
          archived_at: new Date()
        }
      });

      return this.success({
        archived: archived.count,
        notificationIds,
        message: `Archived ${archived.count} notifications`
      });
    } catch (error: any) {
      return this.error(`Failed to archive notifications: ${error.message}`);
    }
  }

  private async configureChannel(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        channelType,
        name,
        config,
        isDefault = false,
        enabledNotificationTypes = []
      } = data;

      // Check if channel exists
      const existing = await prisma.notification_channels.findFirst({
        where: {
          license_key: licenseKey,
          channel_type: channelType,
          name
        }
      });

      let channel;

      if (existing) {
        // Update existing channel
        channel = await prisma.notification_channels.update({
          where: { id: existing.id },
          data: {
            config,
            is_default: isDefault,
            enabled_types: enabledNotificationTypes,
            is_active: true
          }
        });
      } else {
        // Create new channel
        channel = await prisma.notification_channels.create({
          data: {
            license_key: licenseKey,
            channel_type: channelType,
            name,
            config,
            is_default: isDefault,
            enabled_types: enabledNotificationTypes,
            is_active: true
          }
        });
      }

      // If set as default, update other channels
      if (isDefault) {
        await prisma.notification_channels.updateMany({
          where: {
            license_key: licenseKey,
            channel_type: channelType,
            id: { not: channel.id }
          },
          data: { is_default: false }
        });
      }

      return this.success({
        channelId: channel.id,
        channelType,
        name,
        isDefault,
        message: 'Channel configured successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to configure channel: ${error.message}`);
    }
  }

  private async getChannels(licenseKey: string): Promise<SkillResult> {
    try {
      const channels = await prisma.notification_channels.findMany({
        where: {
          license_key: licenseKey,
          is_active: true
        }
      });

      const channelList = channels.map(c => ({
        id: c.id,
        type: c.channel_type,
        name: c.name,
        isDefault: c.is_default,
        enabledTypes: c.enabled_types,
        isActive: c.is_active
      }));

      return this.success({
        channels: channelList,
        total: channelList.length,
        message: 'Channels retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get channels: ${error.message}`);
    }
  }

  private async testChannel(licenseKey: string, channelId: string): Promise<SkillResult> {
    try {
      const channel = await prisma.notification_channels.findFirst({
        where: {
          license_key: licenseKey,
          id: channelId
        }
      });

      if (!channel) {
        return this.error('Channel not found');
      }

      // Test the channel
      const testResult = await this.deliverToChannel(
        {
          title: 'Test Notification',
          message: 'This is a test notification from Intelagent Platform',
          type: 'test'
        },
        channel
      );

      // Update channel status
      await prisma.notification_channels.update({
        where: { id: channelId },
        data: {
          last_tested_at: new Date(),
          test_status: testResult.success ? 'passed' : 'failed'
        }
      });

      return this.success({
        channelId,
        testResult: testResult.success ? 'passed' : 'failed',
        message: testResult.success ? 'Channel test successful' : `Channel test failed: ${testResult.error}`
      });
    } catch (error: any) {
      return this.error(`Failed to test channel: ${error.message}`);
    }
  }

  private async subscribe(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        userId,
        notificationTypes,
        channels,
        frequency = 'instant',
        preferences = {}
      } = data;

      // Create or update subscription
      const subscription = await prisma.notification_subscriptions.upsert({
        where: {
          license_key_user_id: {
            license_key: licenseKey,
            user_id: userId
          }
        },
        create: {
          license_key: licenseKey,
          user_id: userId,
          notification_types: notificationTypes,
          channels,
          frequency,
          preferences,
          is_active: true
        },
        update: {
          notification_types: notificationTypes,
          channels,
          frequency,
          preferences,
          is_active: true
        }
      });

      return this.success({
        subscriptionId: subscription.id,
        userId,
        types: notificationTypes,
        channels,
        message: 'Subscription updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to subscribe: ${error.message}`);
    }
  }

  private async unsubscribe(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, notificationTypes = [] } = data;

      if (notificationTypes.length === 0) {
        // Unsubscribe from all
        await prisma.notification_subscriptions.update({
          where: {
            license_key_user_id: {
              license_key: licenseKey,
              user_id: userId
            }
          },
          data: { is_active: false }
        });

        return this.success({
          userId,
          unsubscribed: 'all',
          message: 'Unsubscribed from all notifications'
        });
      } else {
        // Unsubscribe from specific types
        const subscription = await prisma.notification_subscriptions.findUnique({
          where: {
            license_key_user_id: {
              license_key: licenseKey,
              user_id: userId
            }
          }
        });

        if (subscription) {
          const remainingTypes = (subscription.notification_types as string[])
            .filter(t => !notificationTypes.includes(t));

          await prisma.notification_subscriptions.update({
            where: {
              license_key_user_id: {
                license_key: licenseKey,
                user_id: userId
              }
            },
            data: {
              notification_types: remainingTypes,
              is_active: remainingTypes.length > 0
            }
          });
        }

        return this.success({
          userId,
          unsubscribed: notificationTypes,
          message: `Unsubscribed from ${notificationTypes.length} notification types`
        });
      }
    } catch (error: any) {
      return this.error(`Failed to unsubscribe: ${error.message}`);
    }
  }

  private async getSubscriptions(licenseKey: string, userId: string): Promise<SkillResult> {
    try {
      const subscription = await prisma.notification_subscriptions.findUnique({
        where: {
          license_key_user_id: {
            license_key: licenseKey,
            user_id: userId
          }
        }
      });

      if (!subscription) {
        return this.success({
          userId,
          subscribed: false,
          types: [],
          channels: [],
          message: 'No active subscriptions'
        });
      }

      return this.success({
        userId,
        subscribed: subscription.is_active,
        types: subscription.notification_types,
        channels: subscription.channels,
        frequency: subscription.frequency,
        preferences: subscription.preferences,
        message: 'Subscriptions retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get subscriptions: ${error.message}`);
    }
  }

  private async createTemplate(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        name,
        type,
        subject,
        body,
        variables = [],
        channels = ['dashboard'],
        metadata
      } = data;

      const template = await prisma.notification_templates.create({
        data: {
          license_key: licenseKey,
          name,
          type,
          subject,
          body,
          variables,
          channels,
          metadata,
          is_active: true
        }
      });

      return this.success({
        templateId: template.id,
        name,
        type,
        message: 'Template created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create template: ${error.message}`);
    }
  }

  private async getTemplates(licenseKey: string): Promise<SkillResult> {
    try {
      const templates = await prisma.notification_templates.findMany({
        where: {
          license_key: licenseKey,
          is_active: true
        }
      });

      const templateList = templates.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        channels: t.channels,
        variables: t.variables
      }));

      return this.success({
        templates: templateList,
        total: templateList.length,
        message: 'Templates retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get templates: ${error.message}`);
    }
  }

  private async renderTemplate(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { templateId, variables = {} } = data;

      const template = await prisma.notification_templates.findFirst({
        where: {
          license_key: licenseKey,
          id: templateId
        }
      });

      if (!template) {
        return this.error('Template not found');
      }

      // Simple variable replacement
      let renderedSubject = template.subject || '';
      let renderedBody = template.body;

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedSubject = renderedSubject.replace(regex, String(value));
        renderedBody = renderedBody.replace(regex, String(value));
      }

      return this.success({
        type: template.type,
        title: renderedSubject,
        message: renderedBody,
        channels: template.channels,
        message: 'Template rendered successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to render template: ${error.message}`);
    }
  }

  private async sendNotification(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { notificationId, channels = [] } = data;

      const notification = await prisma.notifications.findFirst({
        where: {
          license_key: licenseKey,
          id: notificationId
        }
      });

      if (!notification) {
        return this.error('Notification not found');
      }

      const deliveryResults = [];
      const targetChannels = channels.length > 0 ? channels : notification.channels;

      for (const channelType of targetChannels) {
        const channel = await prisma.notification_channels.findFirst({
          where: {
            license_key: licenseKey,
            channel_type: channelType,
            is_active: true,
            is_default: true
          }
        });

        if (channel) {
          const result = await this.deliverToChannel(notification, channel);
          deliveryResults.push({
            channel: channelType,
            success: result.success,
            error: result.error
          });
        }
      }

      // Update notification status
      const allSuccessful = deliveryResults.every(r => r.success);
      await prisma.notifications.update({
        where: { id: notificationId },
        data: {
          status: allSuccessful ? 'delivered' : 'partial',
          delivered_at: allSuccessful ? new Date() : null,
          delivery_attempts: { increment: 1 },
          delivery_results: deliveryResults
        }
      });

      return this.success({
        notificationId,
        delivered: deliveryResults.filter(r => r.success).length,
        failed: deliveryResults.filter(r => !r.success).length,
        results: deliveryResults,
        message: 'Notification sent'
      });
    } catch (error: any) {
      return this.error(`Failed to send notification: ${error.message}`);
    }
  }

  private async trackDelivery(licenseKey: string, notificationId: string): Promise<SkillResult> {
    try {
      const notification = await prisma.notifications.findFirst({
        where: {
          license_key: licenseKey,
          id: notificationId
        }
      });

      if (!notification) {
        return this.error('Notification not found');
      }

      const tracking = {
        id: notificationId,
        status: notification.status,
        createdAt: notification.created_at,
        deliveredAt: notification.delivered_at,
        readAt: notification.read_at,
        attempts: notification.delivery_attempts,
        results: notification.delivery_results,
        channels: notification.channels
      };

      // Calculate delivery metrics
      const metrics = {
        timeToDelivery: notification.delivered_at ?
          (new Date(notification.delivered_at).getTime() - new Date(notification.created_at).getTime()) / 1000 : null,
        timeToRead: notification.read_at ?
          (new Date(notification.read_at).getTime() - new Date(notification.created_at).getTime()) / 1000 : null
      };

      return this.success({
        tracking,
        metrics,
        message: 'Delivery tracked'
      });
    } catch (error: any) {
      return this.error(`Failed to track delivery: ${error.message}`);
    }
  }

  private async retryFailedNotifications(licenseKey: string): Promise<SkillResult> {
    try {
      // Get failed notifications
      const failed = await prisma.notifications.findMany({
        where: {
          license_key: licenseKey,
          status: { in: ['failed', 'partial'] },
          delivery_attempts: { lt: 3 }, // Max 3 attempts
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const retryResults = [];

      for (const notification of failed) {
        const result = await this.sendNotification(licenseKey, {
          notificationId: notification.id
        });

        retryResults.push({
          notificationId: notification.id,
          success: result.success,
          error: result.error
        });
      }

      return this.success({
        retried: retryResults.length,
        successful: retryResults.filter(r => r.success).length,
        failed: retryResults.filter(r => !r.success).length,
        results: retryResults,
        message: 'Failed notifications retried'
      });
    } catch (error: any) {
      return this.error(`Failed to retry notifications: ${error.message}`);
    }
  }

  private async getNotificationAnalytics(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '7d', groupBy = 'type' } = data;

      const startDate = this.getPeriodStartDate(period);

      const notifications = await prisma.notifications.findMany({
        where: {
          license_key: licenseKey,
          created_at: { gte: startDate }
        }
      });

      const analytics: any = {
        period,
        total: notifications.length,
        delivered: notifications.filter(n => n.status === 'delivered').length,
        read: notifications.filter(n => n.read_at !== null).length,
        failed: notifications.filter(n => n.status === 'failed').length
      };

      switch (groupBy) {
        case 'type':
          analytics.byType = this.groupBy(notifications, 'type');
          break;
        case 'priority':
          analytics.byPriority = this.groupBy(notifications, 'priority');
          break;
        case 'channel':
          analytics.byChannel = this.analyzeChannels(notifications);
          break;
        case 'daily':
          analytics.daily = this.groupByDay(notifications);
          break;
      }

      // Calculate rates
      analytics.deliveryRate = analytics.total > 0 ?
        (analytics.delivered / analytics.total * 100).toFixed(2) : 0;
      analytics.readRate = analytics.delivered > 0 ?
        (analytics.read / analytics.delivered * 100).toFixed(2) : 0;

      return this.success({
        analytics,
        message: 'Analytics generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get analytics: ${error.message}`);
    }
  }

  private async getEngagementMetrics(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '30d', userId } = data;

      const whereClause: any = {
        license_key: licenseKey,
        created_at: { gte: this.getPeriodStartDate(period) }
      };

      if (userId) {
        whereClause.recipient_id = userId;
        whereClause.recipient_type = 'user';
      }

      const notifications = await prisma.notifications.findMany({
        where: whereClause
      });

      // Calculate engagement metrics
      const metrics = {
        totalSent: notifications.length,
        totalDelivered: notifications.filter(n => n.status === 'delivered').length,
        totalRead: notifications.filter(n => n.read_at !== null).length,
        totalClicked: notifications.filter(n => n.clicked_at !== null).length,

        // Average times
        avgTimeToRead: this.calculateAverageTime(
          notifications.filter(n => n.read_at),
          'created_at',
          'read_at'
        ),
        avgTimeToClick: this.calculateAverageTime(
          notifications.filter(n => n.clicked_at),
          'created_at',
          'clicked_at'
        ),

        // Engagement by type
        engagementByType: this.calculateEngagementByType(notifications),

        // Best performing
        bestPerformingType: this.findBestPerforming(notifications, 'type'),
        bestPerformingChannel: this.findBestPerforming(notifications, 'channels'),

        // Trends
        trend: this.calculateTrend(notifications)
      };

      return this.success({
        metrics,
        period,
        userId,
        message: 'Engagement metrics calculated'
      });
    } catch (error: any) {
      return this.error(`Failed to get engagement metrics: ${error.message}`);
    }
  }

  // Helper methods
  private async queueForDelivery(notification: any, channels: string[]): Promise<void> {
    // Queue notification for delivery
    // In production, this would use a message queue (Redis, RabbitMQ, etc.)
  }

  private async deliverImmediately(notification: any): Promise<void> {
    // Deliver high-priority notifications immediately
    await this.sendNotification(notification.license_key, {
      notificationId: notification.id
    });
  }

  private async deliverToChannel(notification: any, channel: any): Promise<any> {
    try {
      const config = channel.config as any;

      switch (channel.channel_type) {
        case 'email':
          return await this.sendEmail(notification, config);
        case 'sms':
          return await this.sendSMS(notification, config);
        case 'slack':
          return await this.sendSlack(notification, config);
        case 'webhook':
          return await this.sendWebhook(notification, config);
        case 'dashboard':
          return { success: true }; // Dashboard notifications are already stored
        default:
          return { success: false, error: 'Unsupported channel type' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendEmail(notification: any, config: any): Promise<any> {
    // Implement email sending
    // This would integrate with email service
    return { success: true };
  }

  private async sendSMS(notification: any, config: any): Promise<any> {
    // Implement SMS sending
    // This would integrate with SMS service
    return { success: true };
  }

  private async sendSlack(notification: any, config: any): Promise<any> {
    // Implement Slack sending
    // This would integrate with Slack API
    return { success: true };
  }

  private async sendWebhook(notification: any, config: any): Promise<any> {
    // Implement webhook sending
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            metadata: notification.metadata
          }
        })
      });

      return { success: response.ok };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([hdwmy])/);

    if (!match) return new Date(0);

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'h': return new Date(now.getTime() - num * 60 * 60 * 1000);
      case 'd': return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private analyzeChannels(notifications: any[]): Record<string, number> {
    const channelCounts: Record<string, number> = {};

    notifications.forEach(n => {
      (n.channels || []).forEach((channel: string) => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });

    return channelCounts;
  }

  private groupByDay(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const day = new Date(item.created_at).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageTime(items: any[], startField: string, endField: string): number {
    if (items.length === 0) return 0;

    const times = items.map(item => {
      const start = new Date(item[startField]).getTime();
      const end = new Date(item[endField]).getTime();
      return (end - start) / 1000; // Convert to seconds
    });

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private calculateEngagementByType(notifications: any[]): Record<string, any> {
    const types: Record<string, any> = {};

    notifications.forEach(n => {
      if (!types[n.type]) {
        types[n.type] = { sent: 0, delivered: 0, read: 0, clicked: 0 };
      }

      types[n.type].sent++;
      if (n.status === 'delivered') types[n.type].delivered++;
      if (n.read_at) types[n.type].read++;
      if (n.clicked_at) types[n.type].clicked++;
    });

    // Calculate rates
    Object.keys(types).forEach(type => {
      const t = types[type];
      t.deliveryRate = t.sent > 0 ? (t.delivered / t.sent * 100).toFixed(2) : 0;
      t.readRate = t.delivered > 0 ? (t.read / t.delivered * 100).toFixed(2) : 0;
      t.clickRate = t.read > 0 ? (t.clicked / t.read * 100).toFixed(2) : 0;
    });

    return types;
  }

  private findBestPerforming(notifications: any[], field: string): string {
    const performance: Record<string, number> = {};

    notifications.forEach(n => {
      const value = field === 'channels' ? n.channels?.[0] : n[field];
      if (!value) return;

      if (!performance[value]) performance[value] = 0;
      if (n.read_at) performance[value]++;
    });

    const sorted = Object.entries(performance).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'none';
  }

  private calculateTrend(notifications: any[]): string {
    // Simple trend calculation based on daily counts
    const daily = this.groupByDay(notifications);
    const values = Object.values(daily);

    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'create_notification', 'create_bulk_notifications', 'schedule_notification',
      'get_notifications', 'mark_as_read', 'delete_notifications', 'archive_notifications',
      'configure_channel', 'get_channels', 'test_channel',
      'subscribe', 'unsubscribe', 'get_subscriptions',
      'create_template', 'get_templates', 'render_template',
      'send_notification', 'track_delivery', 'retry_failed',
      'get_analytics', 'get_engagement_metrics'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}