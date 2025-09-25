/**
 * Data Catalog System
 * Maps UI widgets to skills, integrations, and data sources
 */

import { SkillRegistry } from '@intelagent/skills-orchestrator';

export interface CatalogRead {
  source: 'db' | 'analytics' | 'integration' | 'skill';
  query?: string;
  metric?: string;
  endpoint?: string;
  skill?: string;
  filters?: string[];
  fields?: string[];
  window?: string;
  group_by?: string;
  cache_ttl?: number;
}

export interface CatalogAction {
  skill: string;
  integration?: string;
  args?: Record<string, any>;
  args_schema?: Record<string, string>;
  confirmation_required?: boolean;
  audit_log?: boolean;
}

export interface CatalogIntegration {
  scopes: string[];
  rate_limit?: {
    requests: number;
    window: string;
  };
  auth_type?: 'oauth2' | 'api_key' | 'basic';
}

export interface DataCatalogNamespace {
  namespace: string;
  reads: Record<string, CatalogRead>;
  actions: Record<string, CatalogAction>;
  integrations: Record<string, CatalogIntegration>;
}

export class DataCatalog {
  private catalogs: Map<string, DataCatalogNamespace> = new Map();
  private skillRegistry: typeof SkillRegistry;

  constructor() {
    this.skillRegistry = SkillRegistry;
    this.initializeDefaultCatalogs();
  }

  private initializeDefaultCatalogs() {
    // Chatbot catalog
    this.registerCatalog({
      namespace: 'chatbot',
      reads: {
        'tables.conversations': {
          source: 'db',
          query: 'SELECT * FROM chatbot_logs WHERE product_key = :productKey ORDER BY created_at DESC',
          filters: ['date_range', 'topic', 'sentiment'],
          cache_ttl: 30
        },
        'metrics.total_conversations': {
          source: 'analytics',
          metric: 'conversation_count',
          window: '30d'
        },
        'metrics.response_time': {
          source: 'analytics',
          metric: 'avg_response_time',
          window: '7d'
        },
        'metrics.satisfaction_score': {
          source: 'analytics',
          metric: 'avg_satisfaction',
          window: '30d'
        },
        'charts.conversation_trends': {
          source: 'analytics',
          metric: 'conversations',
          group_by: 'day',
          window: '30d'
        },
        'charts.topic_distribution': {
          source: 'analytics',
          metric: 'topics',
          group_by: 'topic',
          window: '7d'
        }
      },
      actions: {
        'actions.export_conversations': {
          skill: 'DataExportSkill',
          args: { format: 'csv', entity: 'conversations' }
        },
        'actions.train_model': {
          skill: 'ChatbotKnowledgeManagerSkill',
          args: { action: 'train' },
          confirmation_required: true
        },
        'actions.clear_cache': {
          skill: 'CacheManagementSkill',
          args: { target: 'chatbot' }
        }
      },
      integrations: {}
    });

    // Operations Agent catalog
    this.registerCatalog({
      namespace: 'ops-agent',
      reads: {
        'tables.workflows': {
          source: 'db',
          query: 'SELECT * FROM workflow_runs WHERE agent_id = :agentId ORDER BY start_time DESC',
          filters: ['status', 'date_range', 'workflow_type'],
          cache_ttl: 10
        },
        'metrics.active_workflows': {
          source: 'skill',
          skill: 'WorkflowMonitor',
          cache_ttl: 5
        },
        'metrics.sla_compliance': {
          source: 'analytics',
          metric: 'sla_compliance_rate',
          window: '24h'
        },
        'metrics.success_rate': {
          source: 'analytics',
          metric: 'workflow_success_rate',
          window: '7d'
        },
        'charts.workflow_timeline': {
          source: 'skill',
          skill: 'WorkflowVisualizationSkill'
        },
        'charts.exception_trends': {
          source: 'analytics',
          metric: 'exceptions',
          group_by: 'hour',
          window: '24h'
        }
      },
      actions: {
        'actions.restart_workflow': {
          skill: 'WorkflowManagementSkill',
          args: { action: 'restart' },
          confirmation_required: true,
          audit_log: true
        },
        'actions.pause_all': {
          skill: 'WorkflowManagementSkill',
          args: { action: 'pause_all' },
          confirmation_required: true,
          audit_log: true
        },
        'actions.create_workflow': {
          skill: 'WorkflowBuilderSkill',
          args_schema: {
            name: 'string',
            steps: 'array',
            trigger: 'string'
          }
        }
      },
      integrations: {}
    });

    // Data/Insights Agent catalog
    this.registerCatalog({
      namespace: 'data-insights',
      reads: {
        'tables.datasets': {
          source: 'db',
          query: 'SELECT * FROM datasets WHERE agent_id = :agentId',
          filters: ['status', 'type'],
          cache_ttl: 60
        },
        'metrics.conversion_rate': {
          source: 'analytics',
          metric: 'conversion_rate',
          window: '30d'
        },
        'metrics.average_order_value': {
          source: 'analytics',
          metric: 'aov',
          window: '30d'
        },
        'metrics.data_quality': {
          source: 'skill',
          skill: 'DataQualitySkill'
        },
        'charts.kpi_trends': {
          source: 'analytics',
          metric: 'kpis',
          group_by: 'day',
          window: '90d'
        },
        'tables.ai_insights': {
          source: 'skill',
          skill: 'AIInsightsGeneratorSkill',
          cache_ttl: 300
        },
        'charts.anomaly_detection': {
          source: 'skill',
          skill: 'AnomalyDetectionSkill'
        }
      },
      actions: {
        'actions.generate_insights': {
          skill: 'AIInsightsGeneratorSkill',
          args: { depth: 'deep' },
          confirmation_required: false,
          audit_log: true
        },
        'actions.export_report': {
          skill: 'ReportGenerationSkill',
          args_schema: {
            format: 'string',
            metrics: 'array',
            date_range: 'string'
          }
        },
        'actions.refresh_data': {
          skill: 'DataIngestionSkill',
          args: { source: 'all' },
          confirmation_required: true
        }
      },
      integrations: {}
    });

    // Sales Outreach catalog with integrations
    this.registerCatalog({
      namespace: 'outreach',
      reads: {
        'tables.campaigns': {
          source: 'db',
          query: 'SELECT * FROM campaigns WHERE tenant_id = :tenantId',
          filters: ['status', 'owner'],
          cache_ttl: 30
        },
        'metrics.reply_rate.weekly': {
          source: 'analytics',
          metric: 'reply_rate',
          window: '7d'
        },
        'metrics.replies_over_time': {
          source: 'analytics',
          metric: 'replies',
          group_by: 'week'
        },
        'crm.leads': {
          source: 'integration',
          endpoint: '/query',
          fields: ['Name', 'Email', 'Status']
        },
        'shopify.orders': {
          source: 'integration',
          endpoint: '/orders',
          fields: ['id', 'customer', 'total', 'status']
        }
      },
      actions: {
        'actions.send_followups': {
          skill: 'EmailSenderSkill',
          args: { template: 'followup_v1' }
        },
        'actions.start_onboarding_flow': {
          skill: 'WorkflowManagementSkill',
          args: { flow: 'onboarding' }
        },
        'actions.create_sf_opportunity': {
          skill: 'CRMIntegrationSkill',
          integration: 'salesforce',
          args_schema: {
            accountId: 'string',
            amount: 'number'
          }
        },
        'actions.sync_gmail': {
          skill: 'EmailIntegrationSkill',
          integration: 'gmail'
        }
      },
      integrations: {
        salesforce: {
          scopes: ['read:leads', 'write:opportunities'],
          auth_type: 'oauth2'
        },
        shopify: {
          scopes: ['read:orders', 'read:customers'],
          auth_type: 'api_key'
        },
        gmail: {
          scopes: ['send:email', 'read:inbox'],
          auth_type: 'oauth2'
        }
      }
    });
  }

  registerCatalog(catalog: DataCatalogNamespace) {
    this.catalogs.set(catalog.namespace, catalog);
  }

  getCatalog(namespace: string): DataCatalogNamespace | undefined {
    return this.catalogs.get(namespace);
  }

  async executeRead(namespace: string, readKey: string, params: Record<string, any>) {
    const catalog = this.getCatalog(namespace);
    if (!catalog) throw new Error(`Catalog ${namespace} not found`);

    const readDef = catalog.reads[readKey];
    if (!readDef) throw new Error(`Read ${readKey} not found in ${namespace}`);

    switch (readDef.source) {
      case 'db':
        return this.executeDbQuery(readDef, params);
      case 'skill':
        return this.executeSkill(readDef.skill!, params);
      case 'analytics':
        return this.fetchAnalytics(readDef, params);
      case 'integration':
        return this.fetchFromIntegration(namespace, readKey, params);
      default:
        throw new Error(`Unknown source type: ${readDef.source}`);
    }
  }

  async executeAction(namespace: string, actionKey: string, params: Record<string, any>, userId: string) {
    const catalog = this.getCatalog(namespace);
    if (!catalog) throw new Error(`Catalog ${namespace} not found`);

    const actionDef = catalog.actions[actionKey];
    if (!actionDef) throw new Error(`Action ${actionKey} not found in ${namespace}`);

    // Audit log if required
    if (actionDef.audit_log) {
      await this.logAudit(namespace, actionKey, params, userId);
    }

    // Execute the skill
    const skill = this.skillRegistry.getSkill(actionDef.skill);
    if (!skill) throw new Error(`Skill ${actionDef.skill} not found`);

    const mergedParams = { ...actionDef.args, ...params };
    return await skill.execute(mergedParams);
  }

  private async executeDbQuery(readDef: CatalogRead, params: Record<string, any>) {
    // Implementation would execute the query with parameters
    // This is a placeholder
    return { data: [], query: readDef.query, params };
  }

  private async executeSkill(skillName: string, params: Record<string, any>) {
    const skill = this.skillRegistry.getSkill(skillName);
    if (!skill) throw new Error(`Skill ${skillName} not found`);
    return await skill.execute(params);
  }

  private async fetchAnalytics(readDef: CatalogRead, params: Record<string, any>) {
    // Implementation would fetch from analytics service
    // This is a placeholder
    return {
      metric: readDef.metric,
      value: 0,
      window: readDef.window,
      group_by: readDef.group_by
    };
  }

  private async fetchFromIntegration(namespace: string, readKey: string, params: Record<string, any>) {
    // Implementation would fetch from third-party integration
    // This is a placeholder
    return { data: [], source: 'integration', endpoint: readKey };
  }

  private async logAudit(namespace: string, action: string, params: Record<string, any>, userId: string) {
    // Log to audit trail
    console.log(`[AUDIT] User ${userId} executed ${namespace}.${action}`, params);
  }

  // Get all available widgets for a namespace
  getAvailableWidgets(namespace: string): string[] {
    const catalog = this.getCatalog(namespace);
    if (!catalog) return [];

    return Object.keys(catalog.reads).concat(
      Object.keys(catalog.actions).map(key => `action:${key}`)
    );
  }
}

export const dataCatalog = new DataCatalog();