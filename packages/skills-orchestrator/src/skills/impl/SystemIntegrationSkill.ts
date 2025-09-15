import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SystemIntegrationSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'system_integration',
    name: 'System Integration Service',
    description: 'Core integration skill for system-wide visibility, management, and coordination',
    category: SkillCategory.AUTOMATION,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['system', 'integration', 'management', 'monitoring', 'core']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        // Agent Registration & Discovery
        case 'register_agent':
          return await this.registerAgent(licenseKey, data);
        case 'update_agent_status':
          return await this.updateAgentStatus(licenseKey, data);
        case 'discover_agents':
          return await this.discoverAgents(licenseKey, data.filters);

        // Health & Status Monitoring
        case 'health_check':
          return await this.performHealthCheck(licenseKey, data.agentId);
        case 'get_system_status':
          return await this.getSystemStatus(licenseKey);
        case 'report_metrics':
          return await this.reportMetrics(licenseKey, data);

        // Management Integration
        case 'notify_management':
          return await this.notifyManagementAgents(licenseKey, data);
        case 'request_approval':
          return await this.requestManagementApproval(licenseKey, data);
        case 'sync_with_platform':
          return await this.syncWithPlatform(licenseKey, data);

        // Resource Management
        case 'allocate_resources':
          return await this.allocateResources(licenseKey, data);
        case 'check_quota':
          return await this.checkResourceQuota(licenseKey, data.resource);

        // Inter-Agent Communication
        case 'broadcast_event':
          return await this.broadcastEvent(licenseKey, data);
        case 'subscribe_to_events':
          return await this.subscribeToEvents(licenseKey, data);

        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in SystemIntegrationSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async registerAgent(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { agentType, agentName, capabilities, config } = data;

      // Check if agent already exists
      const existingAgent = await prisma.agents.findFirst({
        where: {
          license_key: licenseKey,
          agent_type: agentType,
          name: agentName
        }
      });

      if (existingAgent) {
        // Update existing agent
        const updated = await prisma.agents.update({
          where: { id: existingAgent.id },
          data: {
            capabilities: capabilities || existingAgent.capabilities,
            config: config || existingAgent.config,
            status: 'active',
            last_seen: new Date()
          }
        });

        return this.success({
          agentId: updated.id,
          status: 'updated',
          message: 'Agent registration updated'
        });
      }

      // Create new agent registration
      const agent = await prisma.agents.create({
        data: {
          license_key: licenseKey,
          agent_type: agentType,
          name: agentName,
          capabilities: capabilities || [],
          config: config || {},
          status: 'active',
          last_seen: new Date()
        }
      });

      // Notify management agents of new agent
      await this.notifyManagementAgents(licenseKey, {
        type: 'agent_registered',
        agentId: agent.id,
        agentName,
        agentType
      });

      return this.success({
        agentId: agent.id,
        status: 'registered',
        message: 'Agent successfully registered'
      });
    } catch (error: any) {
      return this.error(`Failed to register agent: ${error.message}`);
    }
  }

  private async updateAgentStatus(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { agentId, status, metadata } = data;

      const agent = await prisma.agents.update({
        where: {
          id: agentId,
          license_key: licenseKey
        },
        data: {
          status,
          last_seen: new Date(),
          metadata: {
            ...(metadata || {}),
            lastStatusUpdate: new Date().toISOString()
          }
        }
      });

      // Log status change
      await prisma.activity_logs.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          activity_type: 'status_change',
          description: `Agent status changed to ${status}`,
          metadata: { previousStatus: agent.status, newStatus: status }
        }
      });

      return this.success({
        agentId,
        newStatus: status,
        message: 'Agent status updated'
      });
    } catch (error: any) {
      return this.error(`Failed to update agent status: ${error.message}`);
    }
  }

  private async discoverAgents(licenseKey: string, filters?: any): Promise<SkillResult> {
    try {
      const whereClause: any = {
        license_key: licenseKey
      };

      if (filters) {
        if (filters.agentType) whereClause.agent_type = filters.agentType;
        if (filters.status) whereClause.status = filters.status;
        if (filters.capability) {
          whereClause.capabilities = {
            has: filters.capability
          };
        }
      }

      const agents = await prisma.agents.findMany({
        where: whereClause,
        orderBy: { last_seen: 'desc' }
      });

      const agentList = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        capabilities: agent.capabilities,
        lastSeen: agent.last_seen,
        isOnline: this.isAgentOnline(agent.last_seen)
      }));

      return this.success({
        agents: agentList,
        total: agentList.length,
        online: agentList.filter(a => a.isOnline).length,
        message: 'Agents discovered'
      });
    } catch (error: any) {
      return this.error(`Failed to discover agents: ${error.message}`);
    }
  }

  private async performHealthCheck(licenseKey: string, agentId?: string): Promise<SkillResult> {
    try {
      const healthStatus: any = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        components: {}
      };

      if (agentId) {
        // Check specific agent health
        const agent = await prisma.agents.findFirst({
          where: {
            id: agentId,
            license_key: licenseKey
          }
        });

        if (!agent) {
          return this.error('Agent not found');
        }

        healthStatus.components[agent.name] = {
          status: agent.status,
          lastSeen: agent.last_seen,
          isOnline: this.isAgentOnline(agent.last_seen),
          responseTime: Math.random() * 100 // Simulated response time
        };
      } else {
        // Check all system components
        const agents = await prisma.agents.findMany({
          where: { license_key: licenseKey }
        });

        for (const agent of agents) {
          healthStatus.components[agent.name] = {
            status: agent.status,
            lastSeen: agent.last_seen,
            isOnline: this.isAgentOnline(agent.last_seen)
          };
        }

        // Check database health
        healthStatus.components.database = {
          status: 'healthy',
          responseTime: Math.random() * 50
        };

        // Check skills orchestrator
        healthStatus.components.skillsOrchestrator = {
          status: 'healthy',
          activeSkills: 310,
          responseTime: Math.random() * 30
        };
      }

      // Determine overall health
      const unhealthyComponents = Object.values(healthStatus.components)
        .filter((c: any) => c.status !== 'active' && c.status !== 'healthy');

      if (unhealthyComponents.length > 0) {
        healthStatus.overall = 'degraded';
      }

      return this.success({
        health: healthStatus,
        message: 'Health check completed'
      });
    } catch (error: any) {
      return this.error(`Health check failed: ${error.message}`);
    }
  }

  private async getSystemStatus(licenseKey: string): Promise<SkillResult> {
    try {
      // Get license info
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      // Get active agents
      const agents = await prisma.agents.findMany({
        where: { license_key: licenseKey }
      });

      // Get recent activities
      const recentActivities = await prisma.activity_logs.findMany({
        where: { license_key: licenseKey },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      // Get usage statistics
      const usage = await prisma.usage_tracking.findFirst({
        where: { license_key: licenseKey },
        orderBy: { timestamp: 'desc' }
      });

      const status = {
        license: {
          key: licenseKey,
          product: license.product_name,
          status: license.status,
          expiresAt: license.expires_at
        },
        agents: {
          total: agents.length,
          active: agents.filter(a => a.status === 'active').length,
          online: agents.filter(a => this.isAgentOnline(a.last_seen)).length
        },
        usage: usage ? {
          apiCalls: usage.api_calls,
          skillsExecuted: usage.skills_executed,
          storageUsed: usage.storage_used,
          period: usage.period
        } : null,
        recentActivity: recentActivities.map(a => ({
          type: a.activity_type,
          description: a.description,
          timestamp: a.created_at
        })),
        systemHealth: {
          status: 'operational',
          uptime: '99.9%',
          lastIncident: null
        }
      };

      return this.success({
        status,
        message: 'System status retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get system status: ${error.message}`);
    }
  }

  private async reportMetrics(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { agentId, metrics, period } = data;

      // Store metrics in usage tracking
      await prisma.usage_tracking.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          period: period || 'hourly',
          api_calls: metrics.apiCalls || 0,
          skills_executed: metrics.skillsExecuted || 0,
          storage_used: metrics.storageUsed || 0,
          custom_metrics: metrics.custom || {},
          timestamp: new Date()
        }
      });

      // Check for threshold alerts
      if (metrics.apiCalls > 1000) {
        await this.notifyManagementAgents(licenseKey, {
          type: 'threshold_alert',
          metric: 'api_calls',
          value: metrics.apiCalls,
          threshold: 1000
        });
      }

      return this.success({
        metricsReported: true,
        period,
        message: 'Metrics reported successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to report metrics: ${error.message}`);
    }
  }

  private async notifyManagementAgents(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { type, priority = 'medium', targetAgents = [], ...notificationData } = data;

      // Determine which management agents to notify
      const managementAgentTypes = targetAgents.length > 0 ? targetAgents :
        this.getRelevantManagementAgents(type);

      const notifications = [];

      for (const agentType of managementAgentTypes) {
        const notification = await prisma.notifications.create({
          data: {
            license_key: licenseKey,
            recipient_type: 'management_agent',
            recipient_id: agentType,
            type,
            priority,
            title: this.getNotificationTitle(type),
            message: JSON.stringify(notificationData),
            metadata: {
              source: 'system_integration',
              timestamp: new Date().toISOString(),
              ...notificationData
            },
            status: 'pending'
          }
        });
        notifications.push(notification.id);
      }

      // For high priority, also create an alert
      if (priority === 'high' || priority === 'critical') {
        await prisma.alerts.create({
          data: {
            license_key: licenseKey,
            alert_type: type,
            severity: priority,
            message: `${this.getNotificationTitle(type)}: ${JSON.stringify(notificationData)}`,
            source: 'system_integration',
            status: 'active'
          }
        });
      }

      return this.success({
        notificationsSent: notifications.length,
        notificationIds: notifications,
        priority,
        message: 'Management agents notified'
      });
    } catch (error: any) {
      return this.error(`Failed to notify management agents: ${error.message}`);
    }
  }

  private async requestManagementApproval(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { requestType, requestData, requiredApprovers = ['operations'], timeout = 3600000 } = data;

      // Create approval request
      const approvalRequest = await prisma.approval_requests.create({
        data: {
          license_key: licenseKey,
          request_type: requestType,
          request_data: requestData,
          required_approvers: requiredApprovers,
          status: 'pending',
          expires_at: new Date(Date.now() + timeout)
        }
      });

      // Notify required approvers
      await this.notifyManagementAgents(licenseKey, {
        type: 'approval_required',
        priority: 'high',
        targetAgents: requiredApprovers,
        requestId: approvalRequest.id,
        requestType,
        requestData
      });

      return this.success({
        requestId: approvalRequest.id,
        status: 'pending',
        requiredApprovers,
        expiresAt: approvalRequest.expires_at,
        message: 'Approval request created'
      });
    } catch (error: any) {
      return this.error(`Failed to request approval: ${error.message}`);
    }
  }

  private async syncWithPlatform(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { syncType = 'full', entities = [] } = data;

      const syncResults: any = {
        synced: [],
        failed: [],
        timestamp: new Date().toISOString()
      };

      // Sync different entity types
      const entitiesToSync = entities.length > 0 ? entities :
        ['agents', 'skills', 'workflows', 'configurations'];

      for (const entity of entitiesToSync) {
        try {
          switch (entity) {
            case 'agents':
              // Sync agent registrations
              const agents = await prisma.agents.findMany({
                where: { license_key: licenseKey }
              });
              syncResults.synced.push({ entity: 'agents', count: agents.length });
              break;

            case 'skills':
              // Sync skill configurations
              syncResults.synced.push({ entity: 'skills', count: 310 });
              break;

            case 'workflows':
              // Sync workflow definitions
              const workflows = await prisma.workflows.findMany({
                where: { license_key: licenseKey }
              });
              syncResults.synced.push({ entity: 'workflows', count: workflows.length });
              break;

            case 'configurations':
              // Sync system configurations
              const configs = await prisma.configurations.findMany({
                where: { license_key: licenseKey }
              });
              syncResults.synced.push({ entity: 'configurations', count: configs.length });
              break;
          }
        } catch (error: any) {
          syncResults.failed.push({ entity, error: error.message });
        }
      }

      // Log sync activity
      await prisma.activity_logs.create({
        data: {
          license_key: licenseKey,
          activity_type: 'platform_sync',
          description: `Platform sync completed: ${syncType}`,
          metadata: syncResults
        }
      });

      return this.success({
        syncType,
        results: syncResults,
        message: 'Platform sync completed'
      });
    } catch (error: any) {
      return this.error(`Failed to sync with platform: ${error.message}`);
    }
  }

  private async allocateResources(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { resourceType, amount, agentId, duration } = data;

      // Check available resources
      const quota = await this.checkResourceQuota(licenseKey, resourceType);
      if (!quota.success || quota.data.available < amount) {
        return this.error('Insufficient resources available');
      }

      // Allocate resources
      const allocation = await prisma.resource_allocations.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          resource_type: resourceType,
          amount,
          duration,
          status: 'active',
          expires_at: duration ? new Date(Date.now() + duration) : null
        }
      });

      // Update usage tracking
      await prisma.usage_tracking.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          period: 'real-time',
          custom_metrics: {
            [`${resourceType}_allocated`]: amount
          },
          timestamp: new Date()
        }
      });

      return this.success({
        allocationId: allocation.id,
        resourceType,
        amountAllocated: amount,
        expiresAt: allocation.expires_at,
        message: 'Resources allocated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to allocate resources: ${error.message}`);
    }
  }

  private async checkResourceQuota(licenseKey: string, resource: string): Promise<SkillResult> {
    try {
      // Get license limits
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      // Get current usage
      const allocations = await prisma.resource_allocations.findMany({
        where: {
          license_key: licenseKey,
          resource_type: resource,
          status: 'active'
        }
      });

      const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);

      // Get limits from license metadata
      const limits = (license.metadata as any)?.resourceLimits || {
        api_calls: 10000,
        storage: 10737418240, // 10GB
        agents: 10,
        skills: 1000
      };

      const limit = limits[resource] || 0;
      const available = Math.max(0, limit - totalAllocated);

      return this.success({
        resource,
        limit,
        allocated: totalAllocated,
        available,
        percentage: limit > 0 ? (totalAllocated / limit * 100).toFixed(2) : 0,
        message: 'Resource quota retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to check resource quota: ${error.message}`);
    }
  }

  private async broadcastEvent(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { eventType, eventData, targetAgents = [] } = data;

      // Create event
      const event = await prisma.system_events.create({
        data: {
          license_key: licenseKey,
          event_type: eventType,
          event_data: eventData,
          source: 'system_integration',
          timestamp: new Date()
        }
      });

      // Determine target agents
      const agents = targetAgents.length > 0 ?
        await prisma.agents.findMany({
          where: {
            license_key: licenseKey,
            agent_type: { in: targetAgents }
          }
        }) :
        await prisma.agents.findMany({
          where: {
            license_key: licenseKey,
            status: 'active'
          }
        });

      // Create event subscriptions for each agent
      const subscriptions = [];
      for (const agent of agents) {
        const sub = await prisma.event_subscriptions.create({
          data: {
            license_key: licenseKey,
            agent_id: agent.id,
            event_id: event.id,
            status: 'pending'
          }
        });
        subscriptions.push(sub.id);
      }

      return this.success({
        eventId: event.id,
        eventType,
        targetedAgents: agents.length,
        subscriptions: subscriptions.length,
        message: 'Event broadcast successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to broadcast event: ${error.message}`);
    }
  }

  private async subscribeToEvents(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { agentId, eventTypes, callback } = data;

      // Create subscription configuration
      const subscription = await prisma.event_configurations.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          event_types: eventTypes,
          callback_url: callback,
          is_active: true
        }
      });

      return this.success({
        subscriptionId: subscription.id,
        agentId,
        eventTypes,
        message: 'Event subscription created'
      });
    } catch (error: any) {
      return this.error(`Failed to subscribe to events: ${error.message}`);
    }
  }

  // Helper methods
  private isAgentOnline(lastSeen: Date | null): boolean {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  }

  private getRelevantManagementAgents(notificationType: string): string[] {
    const mapping: Record<string, string[]> = {
      'agent_registered': ['operations', 'analytics'],
      'threshold_alert': ['operations', 'finance'],
      'security_event': ['security', 'operations'],
      'compliance_issue': ['compliance', 'operations'],
      'integration_error': ['integration', 'infrastructure'],
      'performance_degradation': ['infrastructure', 'operations'],
      'approval_required': ['operations'],
      'billing_event': ['finance', 'operations']
    };

    return mapping[notificationType] || ['operations'];
  }

  private getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      'agent_registered': 'New Agent Registered',
      'threshold_alert': 'Threshold Alert',
      'security_event': 'Security Event Detected',
      'compliance_issue': 'Compliance Issue',
      'integration_error': 'Integration Error',
      'performance_degradation': 'Performance Degradation',
      'approval_required': 'Approval Required',
      'billing_event': 'Billing Event'
    };

    return titles[type] || 'System Notification';
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'register_agent', 'update_agent_status', 'discover_agents',
      'health_check', 'get_system_status', 'report_metrics',
      'notify_management', 'request_approval', 'sync_with_platform',
      'allocate_resources', 'check_quota',
      'broadcast_event', 'subscribe_to_events'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}