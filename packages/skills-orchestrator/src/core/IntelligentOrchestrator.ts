/**
 * Intelligent Skills Orchestrator
 * Routes requests to appropriate skills using AI-driven intent analysis
 */

import { BaseSkill } from '../skills/BaseSkill';
import { EnhancedBaseSkill } from '../skills/EnhancedBaseSkill';
import { SkillResult, SkillParams, SkillMetadata } from '../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SkillRoute {
  skillId: string;
  confidence: number;
  reason: string;
  fallbacks?: string[];
}

interface OrchestrationContext {
  userId?: string;
  sessionId?: string;
  productKey?: string;
  domain?: string;
  companyName?: string;
  history?: any[];
}

export class IntelligentOrchestrator {
  private static instance: IntelligentOrchestrator;
  private skills: Map<string, BaseSkill | EnhancedBaseSkill> = new Map();
  private routingRules: Map<string, string[]> = new Map();
  
  private constructor() {
    this.initializeRoutingRules();
  }
  
  static getInstance(): IntelligentOrchestrator {
    if (!IntelligentOrchestrator.instance) {
      IntelligentOrchestrator.instance = new IntelligentOrchestrator();
    }
    return IntelligentOrchestrator.instance;
  }
  
  /**
   * Initialize intelligent routing rules
   */
  private initializeRoutingRules() {
    // Communication skills
    this.routingRules.set('email', ['email_sender_enhanced', 'email_sender']);
    this.routingRules.set('sms', ['sms_gateway', 'push_notifier']);
    this.routingRules.set('chat', ['slack_messenger', 'teams_connector', 'discord_bot']);
    
    // Data processing skills
    this.routingRules.set('data', ['data_cleaner', 'data_merger', 'csv_parser', 'excel_processor']);
    this.routingRules.set('scrape', ['web_scraper', 'browser_automator']);
    
    // AI/ML skills
    this.routingRules.set('analyze', ['sentiment_analyzer', 'text_classifier', 'pattern_recognizer']);
    this.routingRules.set('generate', ['content_generator', 'code_generator', 'report_generator']);
    
    // Business skills
    this.routingRules.set('invoice', ['invoice_generator', 'billing_system']);
    this.routingRules.set('customer', ['customer_manager', 'order_processor']);
    
    // Automation skills
    this.routingRules.set('workflow', ['workflow_engine', 'task_scheduler', 'batch_processor']);
    this.routingRules.set('monitor', ['monitoring_agent', 'alert_system', 'anomaly_detector']);
  }
  
  /**
   * Register a skill with the orchestrator
   */
  registerSkill(skill: BaseSkill | EnhancedBaseSkill): void {
    this.skills.set(skill.metadata.id, skill);
    console.log(`Registered skill: ${skill.metadata.name}`);
  }
  
  /**
   * Intelligently route request to appropriate skill
   */
  async route(
    request: string | SkillParams,
    context?: OrchestrationContext
  ): Promise<SkillResult> {
    try {
      // Analyze request to determine intent
      const route = await this.analyzeRequest(request, context);
      
      // Log routing decision
      await this.logRouting(route, request, context);
      
      // Get the skill
      const skill = this.skills.get(route.skillId);
      if (!skill) {
        // Try fallbacks
        if (route.fallbacks) {
          for (const fallbackId of route.fallbacks) {
            const fallbackSkill = this.skills.get(fallbackId);
            if (fallbackSkill) {
              console.log(`Using fallback skill: ${fallbackId}`);
              return await this.executeSkill(fallbackSkill, request, context);
            }
          }
        }
        
        throw new Error(`Skill not found: ${route.skillId}`);
      }
      
      // Execute the skill
      return await this.executeSkill(skill, request, context);
      
    } catch (error: any) {
      console.error('Orchestration error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date(),
          orchestrator: 'intelligent'
        }
      };
    }
  }
  
  /**
   * Analyze request to determine best skill
   */
  private async analyzeRequest(
    request: string | SkillParams,
    context?: OrchestrationContext
  ): Promise<SkillRoute> {
    // Extract intent from request
    const text = typeof request === 'string' ? request : 
                 (request.message || request.action || JSON.stringify(request));
    
    const lowerText = text.toLowerCase();
    
    // Check for explicit skill request
    if (typeof request === 'object' && request.skillId) {
      return {
        skillId: request.skillId,
        confidence: 1.0,
        reason: 'Explicit skill request'
      };
    }
    
    // Intelligent routing based on keywords and context
    let bestRoute: SkillRoute = {
      skillId: 'chatbot',
      confidence: 0.5,
      reason: 'Default fallback'
    };
    
    // Check each routing rule
    for (const [keyword, skillIds] of this.routingRules.entries()) {
      if (lowerText.includes(keyword)) {
        const primarySkill = skillIds[0];
        const confidence = this.calculateConfidence(lowerText, keyword);
        
        if (confidence > bestRoute.confidence) {
          bestRoute = {
            skillId: primarySkill,
            confidence,
            reason: `Keyword match: ${keyword}`,
            fallbacks: skillIds.slice(1)
          };
        }
      }
    }
    
    // Context-based routing enhancements
    if (context?.history && context.history.length > 0) {
      const lastSkill = context.history[context.history.length - 1]?.skillId;
      if (lastSkill && this.skills.has(lastSkill)) {
        // Boost confidence for continuing with same skill
        if (bestRoute.skillId === lastSkill) {
          bestRoute.confidence = Math.min(bestRoute.confidence * 1.2, 1.0);
          bestRoute.reason += ' (conversation continuity)';
        }
      }
    }
    
    // Industry-specific routing (from chatbot experience)
    if (lowerText.includes('recruitment') || lowerText.includes('hiring')) {
      bestRoute = {
        skillId: 'candidate_screener',
        confidence: 0.9,
        reason: 'Recruitment industry detection',
        fallbacks: ['resume_parser', 'email_sender_enhanced']
      };
    } else if (lowerText.includes('e-commerce') || lowerText.includes('shop')) {
      bestRoute = {
        skillId: 'order_processor',
        confidence: 0.9,
        reason: 'E-commerce detection',
        fallbacks: ['inventory_tracker', 'cart_optimizer']
      };
    }
    
    return bestRoute;
  }
  
  /**
   * Calculate confidence score for keyword match
   */
  private calculateConfidence(text: string, keyword: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const keywordCount = words.filter(w => w.includes(keyword)).length;
    const totalWords = words.length;
    
    // Base confidence from keyword frequency
    let confidence = Math.min(0.6 + (keywordCount * 0.1), 0.95);
    
    // Boost for exact match
    if (words.includes(keyword)) {
      confidence = Math.min(confidence * 1.1, 0.98);
    }
    
    // Reduce for very long texts (might be less specific)
    if (totalWords > 50) {
      confidence *= 0.9;
    }
    
    return confidence;
  }
  
  /**
   * Execute skill with proper context
   */
  private async executeSkill(
    skill: BaseSkill | EnhancedBaseSkill,
    request: string | SkillParams,
    context?: OrchestrationContext
  ): Promise<SkillResult> {
    // Prepare parameters
    const params: SkillParams = typeof request === 'string' 
      ? { message: request }
      : request;
    
    // Add context to parameters
    if (context) {
      params._context = {
        ...params._context,
        ...context
      };
    }
    
    // Check if it's an enhanced skill
    if (skill instanceof EnhancedBaseSkill) {
      // Use enhanced execution with context
      return await skill.execute(params, {
        userId: context?.userId,
        sessionId: context?.sessionId,
        productKey: context?.productKey,
        domain: context?.domain,
        companyName: context?.companyName,
        customKnowledge: undefined,
        history: context?.history
      });
    } else {
      // Use standard execution
      return await skill.execute(params);
    }
  }
  
  /**
   * Log routing decision for analytics
   */
  private async logRouting(
    route: SkillRoute,
    request: any,
    context?: OrchestrationContext
  ): Promise<void> {
    try {
      await prisma.skill_audit_log.create({
        data: {
          skill_id: route.skillId,
          event_type: 'routing',
          user_id: context?.userId,
          license_key: context?.productKey,
          event_data: {
            route,
            request: typeof request === 'string' ? request : request.action,
            confidence: route.confidence,
            reason: route.reason,
            sessionId: context?.sessionId || 'orchestrator',
            domain: context?.domain
          }
        }
      });
    } catch (error) {
      console.log('Failed to log routing:', error);
    }
  }
  
  /**
   * Get skill recommendations based on usage patterns
   */
  async getRecommendations(
    context: OrchestrationContext
  ): Promise<SkillMetadata[]> {
    const recommendations: SkillMetadata[] = [];
    
    try {
      // Get recent skill usage
      const recentLogs = await prisma.skill_audit_log.findMany({
        where: {
          event_type: 'response',
          event_data: {
            path: ['sessionId'],
            equals: context.sessionId
          }
        },
        orderBy: { created_at: 'desc' },
        take: 5
      });

      // Analyze patterns and recommend complementary skills
      const usedSkills = new Set(recentLogs.map(log => log.skill_id).filter(Boolean));
      
      // Recommend related skills
      for (const skillId of usedSkills) {
        const skill = this.skills.get(skillId);
        if (skill) {
          // Find related skills based on tags
          for (const [id, otherSkill] of this.skills.entries()) {
            if (!usedSkills.has(id)) {
              const commonTags = skill.metadata.tags?.filter(
                tag => otherSkill.metadata.tags?.includes(tag)
              );
              
              if (commonTags && commonTags.length > 0) {
                recommendations.push(otherSkill.metadata);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.log('Failed to get recommendations:', error);
    }
    
    return recommendations.slice(0, 5);
  }
  
  /**
   * Get all available skills
   */
  getAvailableSkills(): SkillMetadata[] {
    return Array.from(this.skills.values()).map(skill => skill.metadata);
  }
  
  /**
   * Clear all registered skills
   */
  clearSkills(): void {
    this.skills.clear();
  }
}