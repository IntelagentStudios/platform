/**
 * Intelligent Skill Router for Chatbot
 * Routes conversations to appropriate skills from the 310 available
 */

import { SkillsMatrix } from '../agents/SkillsMatrix';
import { OrchestratorAgent } from '../core/OrchestratorAgent';

export interface RoutingDecision {
  primarySkills: SkillConfig[];
  secondarySkills: SkillConfig[];
  fallbackSkills: SkillConfig[];
  confidence: number;
  reasoning: string;
}

export interface SkillConfig {
  id: string;
  name: string;
  params: Record<string, any>;
  priority: number;
  required: boolean;
}

export class SkillRouter {
  private static instance: SkillRouter;
  private skillsMatrix: SkillsMatrix;
  private orchestrator: OrchestratorAgent;
  private routingCache = new Map<string, RoutingDecision>();
  
  // Predefined skill combinations for common scenarios
  private readonly workflows = {
    // E-commerce workflows
    purchase_flow: [
      'product_catalog_manager',
      'cart_optimizer',
      'checkout_processor',
      'payment_processor',
      'invoice_generator',
      'email_sender'
    ],
    
    refund_flow: [
      'order_processor',
      'refund_processor',
      'payment_reconciliation',
      'email_composer',
      'notification_hub'
    ],
    
    // Support workflows
    technical_support: [
      'ticket_manager',
      'knowledge_base',
      'escalation_manager',
      'remote_assistance',
      'solution_tracker'
    ],
    
    account_support: [
      'user_manager',
      'auth_manager',
      'password_reset',
      'profile_updater',
      'email_sender'
    ],
    
    // Analytics workflows
    business_intelligence: [
      'data_aggregator',
      'analytics_engine',
      'report_generator',
      'dashboard_builder',
      'pdf_generator'
    ],
    
    performance_analysis: [
      'metrics_collector',
      'performance_monitor',
      'anomaly_detector',
      'predictive_model',
      'alert_system'
    ],
    
    // Automation workflows
    task_automation: [
      'workflow_engine',
      'task_scheduler',
      'approval_workflow',
      'notification_hub',
      'status_tracker'
    ],
    
    data_processing: [
      'data_pipeline',
      'etl_processor',
      'data_cleaner',
      'data_validator',
      'batch_processor'
    ],
    
    // Communication workflows
    marketing_campaign: [
      'email_composer',
      'sms_composer',
      'push_notifier',
      'campaign_manager',
      'analytics_tracker'
    ],
    
    customer_engagement: [
      'chatbot_skill',
      'sentiment_analyzer',
      'response_generator',
      'feedback_collector',
      'loyalty_manager'
    ],
    
    // Integration workflows
    api_integration: [
      'api_connector',
      'webhook_handler',
      'data_transformer',
      'error_handler',
      'retry_manager'
    ],
    
    data_sync: [
      'database_connector',
      'data_merger',
      'conflict_resolver',
      'sync_monitor',
      'audit_logger'
    ],
    
    // Financial workflows
    billing_cycle: [
      'subscription_manager',
      'invoice_generator',
      'payment_processor',
      'dunning_manager',
      'revenue_recognition'
    ],
    
    expense_management: [
      'expense_monitor',
      'receipt_processor',
      'approval_workflow',
      'reimbursement_handler',
      'budget_tracker'
    ],
    
    // Security workflows
    security_audit: [
      'vulnerability_scanner',
      'compliance_checker',
      'audit_logger',
      'report_generator',
      'alert_system'
    ],
    
    access_control: [
      'auth_manager',
      'permission_validator',
      'role_manager',
      'session_manager',
      'activity_logger'
    ]
  };
  
  // Intent to workflow mapping
  private readonly intentMapping: { [key: string]: string } = {
    // Purchase intents
    'buy': 'purchase_flow',
    'purchase': 'purchase_flow',
    'order': 'purchase_flow',
    'checkout': 'purchase_flow',
    
    // Refund intents
    'refund': 'refund_flow',
    'return': 'refund_flow',
    'cancel': 'refund_flow',
    
    // Support intents
    'help': 'technical_support',
    'support': 'technical_support',
    'problem': 'technical_support',
    'account': 'account_support',
    'password': 'account_support',
    
    // Analytics intents
    'report': 'business_intelligence',
    'analytics': 'business_intelligence',
    'metrics': 'performance_analysis',
    'performance': 'performance_analysis',
    
    // Automation intents
    'automate': 'task_automation',
    'workflow': 'task_automation',
    'process': 'data_processing',
    
    // Communication intents
    'email': 'marketing_campaign',
    'notify': 'customer_engagement',
    'message': 'customer_engagement',
    
    // Integration intents
    'integrate': 'api_integration',
    'connect': 'api_integration',
    'sync': 'data_sync',
    
    // Financial intents
    'invoice': 'billing_cycle',
    'bill': 'billing_cycle',
    'expense': 'expense_management',
    
    // Security intents
    'security': 'security_audit',
    'permission': 'access_control',
    'login': 'access_control'
  };
  
  private constructor() {
    this.skillsMatrix = SkillsMatrix.getInstance();
    this.orchestrator = OrchestratorAgent.getInstance();
  }
  
  public static getInstance(): SkillRouter {
    if (!SkillRouter.instance) {
      SkillRouter.instance = new SkillRouter();
    }
    return SkillRouter.instance;
  }
  
  /**
   * Route a conversation to appropriate skills
   */
  public async route(
    message: string,
    context: any,
    productKey: string
  ): Promise<RoutingDecision> {
    // Check cache first
    const cacheKey = this.getCacheKey(message, context.intent);
    if (this.routingCache.has(cacheKey)) {
      return this.routingCache.get(cacheKey)!;
    }
    
    // Analyze the message and context
    const analysis = this.analyzeRequest(message, context);
    
    // Determine the workflow
    const workflow = this.selectWorkflow(analysis);
    
    // Get skills for the workflow
    const skills = this.getWorkflowSkills(workflow, analysis);
    
    // Build routing decision
    const decision: RoutingDecision = {
      primarySkills: skills.primary,
      secondarySkills: skills.secondary,
      fallbackSkills: skills.fallback,
      confidence: analysis.confidence,
      reasoning: `Selected ${workflow} workflow based on ${analysis.intent} intent`
    };
    
    // Cache the decision
    this.routingCache.set(cacheKey, decision);
    
    return decision;
  }
  
  /**
   * Execute a routed workflow
   */
  public async executeWorkflow(
    decision: RoutingDecision,
    params: any,
    context: { userId?: string; licenseKey: string; sessionId?: string; metadata?: Record<string, any> }
  ): Promise<any> {
    const results = {
      primary: {} as { [key: string]: any },
      secondary: {} as { [key: string]: any },
      fallback: {} as { [key: string]: any },
      success: true,
      errors: [] as any[]
    };
    
    try {
      // Execute primary skills (required)
      for (const skill of decision.primarySkills) {
        try {
          const result = await this.orchestrator.execute({
            skillId: skill.id,
            params: {
              ...params,
              ...skill.params
            },
            context: {
              userId: context.userId || 'unknown',
              licenseKey: context.licenseKey,
              sessionId: context.sessionId,
              metadata: context.metadata
            }
          });
          results.primary[skill.id] = result;
        } catch (error: any) {
          results.errors.push({
            skill: skill.id,
            error: error?.message || 'Unknown error',
            required: skill.required
          });
          
          if (skill.required) {
            results.success = false;
            break; // Stop if required skill fails
          }
        }
      }
      
      // Execute secondary skills (optional, in parallel)
      if (results.success && decision.secondarySkills.length > 0) {
        const secondaryPromises = decision.secondarySkills.map(async (skill) => {
          try {
            const result = await this.orchestrator.execute({
              skillId: skill.id,
              params: {
                ...params,
                ...skill.params,
                primaryResults: results.primary
              },
              context: {
                userId: context.userId || 'unknown',
                licenseKey: context.licenseKey,
                sessionId: context.sessionId,
                metadata: context.metadata
              }
            });
            return { skillId: skill.id, result };
          } catch (error: any) {
            return { skillId: skill.id, error: error?.message || 'Unknown error' };
          }
        });
        
        const secondaryResults = await Promise.all(secondaryPromises);
        secondaryResults.forEach(r => {
          if (r.error) {
            results.errors.push({ skill: r.skillId, error: r.error });
          } else {
            results.secondary[r.skillId] = r.result;
          }
        });
      }
      
      // Execute fallback skills if primary failed
      if (!results.success && decision.fallbackSkills.length > 0) {
        for (const skill of decision.fallbackSkills) {
          try {
            const result = await this.orchestrator.execute({
              skillId: skill.id,
              params: {
                ...params,
                ...skill.params,
                failureContext: results.errors
              },
              context: {
                userId: context.userId || 'unknown',
                licenseKey: context.licenseKey,
                sessionId: context.sessionId,
                metadata: context.metadata
              }
            });
            results.fallback[skill.id] = result;
            results.success = true; // Fallback succeeded
            break;
          } catch (error: any) {
            results.errors.push({
              skill: skill.id,
              error: error?.message || 'Unknown error',
              fallback: true
            });
          }
        }
      }
      
    } catch (error: any) {
      results.success = false;
      results.errors.push({
        general: error?.message || 'Unknown error'
      });
    }
    
    return results;
  }
  
  /**
   * Get recommended skills for a given context
   */
  public getRecommendations(context: any): string[] {
    const recommendations = [];
    
    // Based on recent usage
    if (context.recentSkills) {
      const related = this.getRelatedSkills(context.recentSkills);
      recommendations.push(...related);
    }
    
    // Based on user type
    if (context.userType === 'business') {
      recommendations.push(
        'report_generator',
        'analytics_engine',
        'dashboard_builder'
      );
    } else if (context.userType === 'developer') {
      recommendations.push(
        'api_connector',
        'webhook_handler',
        'testing_automation'
      );
    }
    
    // Based on time of day
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      recommendations.push('task_scheduler', 'workflow_engine');
    } else {
      recommendations.push('backup_automation', 'monitoring_agent');
    }
    
    return [...new Set(recommendations)].slice(0, 5);
  }
  
  /**
   * Private helper methods
   */
  
  private analyzeRequest(message: string, context: any): any {
    const analysis = {
      intent: context.intent || this.detectIntent(message),
      entities: context.entities || [],
      sentiment: context.sentiment || 'neutral',
      urgency: context.urgency || 'normal',
      confidence: 0.7,
      keywords: this.extractKeywords(message)
    };
    
    // Boost confidence if intent matches keywords
    if (analysis.keywords.some(k => k.includes(analysis.intent))) {
      analysis.confidence = Math.min(analysis.confidence + 0.2, 1.0);
    }
    
    return analysis;
  }
  
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, workflow] of Object.entries(this.intentMapping)) {
      if (lowerMessage.includes(keyword)) {
        return keyword;
      }
    }
    
    return 'general';
  }
  
  private selectWorkflow(analysis: any): string {
    // Direct mapping
    if (this.intentMapping[analysis.intent]) {
      return this.intentMapping[analysis.intent];
    }
    
    // Keyword-based selection
    for (const keyword of analysis.keywords) {
      if (this.intentMapping[keyword]) {
        return this.intentMapping[keyword];
      }
    }
    
    // Default to customer engagement
    return 'customer_engagement';
  }
  
  private getWorkflowSkills(workflow: string, analysis: any): any {
    const workflowSkills = this.workflows[workflow] || this.workflows.customer_engagement;
    
    // Categorize skills
    const primary = [];
    const secondary = [];
    const fallback = [];
    
    workflowSkills.forEach((skillId, index) => {
      const skill: SkillConfig = {
        id: skillId,
        name: skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        params: this.getSkillParams(skillId, analysis),
        priority: index,
        required: index < 3 // First 3 skills are required
      };
      
      if (index < 3) {
        primary.push(skill);
      } else if (index < 5) {
        secondary.push(skill);
      } else {
        fallback.push(skill);
      }
    });
    
    // Add urgency-based skills
    if (analysis.urgency === 'high') {
      primary.unshift({
        id: 'priority_handler',
        name: 'Priority Handler',
        params: { urgency: 'high' },
        priority: -1,
        required: true
      });
    }
    
    // Add sentiment-based skills
    if (analysis.sentiment === 'negative') {
      secondary.push({
        id: 'escalation_manager',
        name: 'Escalation Manager',
        params: { sentiment: 'negative' },
        priority: 10,
        required: false
      });
    }
    
    return { primary, secondary, fallback };
  }
  
  private getSkillParams(skillId: string, analysis: any): Record<string, any> {
    // Skill-specific parameters
    const params: Record<string, any> = {
      intent: analysis.intent,
      confidence: analysis.confidence
    };
    
    // Add entities as params
    if (analysis.entities && analysis.entities.length > 0) {
      params.entities = analysis.entities;
    }
    
    // Skill-specific configurations
    switch (skillId) {
      case 'email_sender':
      case 'email_composer':
        params.template = 'default';
        params.priority = analysis.urgency;
        break;
        
      case 'payment_processor':
        params.currency = 'USD';
        params.testMode = false;
        break;
        
      case 'report_generator':
        params.format = 'pdf';
        params.includeCharts = true;
        break;
        
      case 'notification_hub':
        params.channels = ['email', 'in-app'];
        break;
    }
    
    return params;
  }
  
  private extractKeywords(message: string): string[] {
    // Simple keyword extraction
    const words = message.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'from', 'that', 'this'].includes(word)
    );
    return keywords;
  }
  
  private getRelatedSkills(recentSkills: string[]): string[] {
    const related = [];
    
    // Define skill relationships
    const relationships = {
      'payment_processor': ['invoice_generator', 'receipt_generator'],
      'email_sender': ['email_composer', 'template_engine'],
      'data_aggregator': ['report_generator', 'dashboard_builder'],
      'workflow_engine': ['task_scheduler', 'approval_workflow']
    };
    
    for (const skill of recentSkills) {
      if (relationships[skill]) {
        related.push(...relationships[skill]);
      }
    }
    
    return related;
  }
  
  private getCacheKey(message: string, intent: string): string {
    // Simple cache key - in production would be more sophisticated
    return `${intent}:${message.slice(0, 50).toLowerCase().replace(/\s+/g, '_')}`;
  }
  
  /**
   * Clear routing cache
   */
  public clearCache(): void {
    this.routingCache.clear();
  }
  
  /**
   * Get available workflows
   */
  public getAvailableWorkflows(): string[] {
    return Object.keys(this.workflows);
  }
  
  /**
   * Get workflow details
   */
  public getWorkflowDetails(workflowId: string): any {
    return {
      id: workflowId,
      name: workflowId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      skills: this.workflows[workflowId] || [],
      description: this.getWorkflowDescription(workflowId)
    };
  }
  
  private getWorkflowDescription(workflowId: string): string {
    const descriptions = {
      purchase_flow: 'Complete e-commerce purchase workflow from cart to confirmation',
      refund_flow: 'Process refunds and returns with automated reconciliation',
      technical_support: 'Technical support ticket management and resolution',
      account_support: 'User account management and authentication support',
      business_intelligence: 'Generate business reports and analytics dashboards',
      performance_analysis: 'Monitor and analyze system performance metrics',
      task_automation: 'Automate repetitive tasks and workflows',
      data_processing: 'Process and transform large datasets',
      marketing_campaign: 'Create and manage multi-channel marketing campaigns',
      customer_engagement: 'Engage customers through intelligent conversations',
      api_integration: 'Integrate with external APIs and services',
      data_sync: 'Synchronize data across multiple systems',
      billing_cycle: 'Manage subscription billing and invoicing',
      expense_management: 'Track and manage business expenses',
      security_audit: 'Perform security audits and compliance checks',
      access_control: 'Manage user access and permissions'
    };
    
    return descriptions[workflowId] || 'Custom workflow for specific business needs';
  }
}