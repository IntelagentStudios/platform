/**
 * Customer Journey Orchestrator Skill
 * Advanced skill that tracks and orchestrates entire customer journeys
 * Integrates with multiple touchpoints and triggers automated actions
 */

import { EnhancedBaseSkill, IntentAnalysis, EnhancedSkillContext } from '../EnhancedBaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JourneyStage {
  stage: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'retention' | 'advocacy';
  confidence: number;
  signals: string[];
  nextActions: string[];
  timeInStage: number;
}

interface CustomerProfile {
  id: string;
  segments: string[];
  preferences: Record<string, any>;
  behaviorPatterns: string[];
  lifetimeValue: number;
  churnRisk: number;
}

export class CustomerJourneyOrchestratorSkill extends EnhancedBaseSkill {
  metadata = {
    id: 'customer_journey_orchestrator',
    name: 'Customer Journey Orchestrator',
    description: 'Tracks and orchestrates complete customer journeys with AI-driven personalization',
    category: SkillCategory.ANALYTICS,
    version: '2.0.0',
    author: 'Intelagent',
    tags: ["customer-journey", "orchestration", "personalization", "ai", "automation", "analytics"]
  };

  /**
   * Analyze customer journey stage and intent
   */
  protected async analyzeStrategy(
    params: SkillParams,
    context: EnhancedSkillContext
  ): Promise<IntentAnalysis> {
    const { customerId, action, eventType, metadata } = params;
    
    // Get customer history
    const customerHistory = await this.getCustomerHistory(customerId || context.sessionId);
    
    // Determine current journey stage
    const currentStage = this.detectJourneyStage(customerHistory, action);
    
    // Predict next best action
    const nextActions = this.predictNextActions(currentStage, customerHistory);
    
    return {
      intent: `journey_${currentStage.stage}`,
      confidence: currentStage.confidence,
      entities: {
        stage: currentStage,
        customerId,
        nextActions,
        riskFactors: this.identifyRiskFactors(customerHistory)
      },
      searchTerms: [currentStage.stage, 'customer', 'journey'],
      suggestedActions: nextActions
    };
  }

  /**
   * Generate personalized response based on journey stage
   */
  protected async generateResponse(
    strategy: IntentAnalysis,
    data: any,
    context: EnhancedSkillContext
  ): Promise<string> {
    const stage = strategy.entities?.stage as JourneyStage;
    const profile = data.profile as CustomerProfile;
    
    const stageResponses: Record<string, string> = {
      awareness: `Customer is discovering your brand. Engagement score: ${data.engagementScore}. Recommended: Educational content, brand storytelling.`,
      consideration: `Customer comparing options. Interest level: ${data.interestLevel}%. Suggested: Product demos, comparison guides, testimonials.`,
      decision: `Customer ready to purchase. Conversion probability: ${data.conversionProb}%. Action: Remove friction, offer incentives, provide support.`,
      purchase: `Transaction in progress. Order value: $${data.orderValue}. Ensure: Smooth checkout, order confirmation, shipping updates.`,
      retention: `Focus on customer satisfaction. NPS: ${data.npsScore}. Implement: Onboarding, support, loyalty programs.`,
      advocacy: `Customer is a brand champion. Referral potential: ${data.referralScore}. Enable: Reviews, referrals, community engagement.`
    };
    
    return stageResponses[stage.stage] + ` Next actions: ${strategy.suggestedActions?.join(', ')}.`;
  }

  /**
   * Orchestrate customer journey actions
   */
  protected async performAction(
    params: SkillParams,
    strategy: IntentAnalysis,
    context: EnhancedSkillContext
  ): Promise<any> {
    const { customerId, action, trigger } = params;
    const stage = strategy.entities?.stage as JourneyStage;
    
    // Create or update customer profile
    const profile = await this.getOrCreateProfile(customerId || context.sessionId);
    
    // Track journey event
    await this.trackJourneyEvent({
      customerId: profile.id,
      stage: stage.stage,
      action: action || 'view',
      timestamp: new Date(),
      metadata: {
        confidence: stage.confidence,
        signals: stage.signals,
        context
      }
    });
    
    // Execute stage-specific orchestrations
    const orchestrations = await this.executeOrchestrations(stage, profile, context);
    
    // Calculate metrics
    const metrics = await this.calculateJourneyMetrics(profile.id);
    
    return {
      profile,
      currentStage: stage,
      orchestrations,
      metrics,
      recommendations: strategy.suggestedActions,
      triggers: await this.getActiveTriggers(profile, stage)
    };
  }

  /**
   * Detect current journey stage based on signals
   */
  private detectJourneyStage(history: any[], action?: string): JourneyStage {
    const signals: string[] = [];
    let stage: JourneyStage['stage'] = 'awareness';
    let confidence = 0.5;
    
    // Analyze recent actions
    const recentActions = history.slice(-10);
    const actionTypes = recentActions.map(h => h.action);
    
    // Stage detection logic
    if (actionTypes.includes('purchase') || actionTypes.includes('checkout')) {
      stage = 'purchase';
      confidence = 0.95;
      signals.push('checkout_activity', 'payment_info');
    } else if (actionTypes.includes('add_to_cart') || actionTypes.includes('pricing_view')) {
      stage = 'decision';
      confidence = 0.85;
      signals.push('cart_activity', 'pricing_interest');
    } else if (actionTypes.filter(a => a.includes('product')).length > 3) {
      stage = 'consideration';
      confidence = 0.8;
      signals.push('product_research', 'comparison_behavior');
    } else if (history.length > 20 && actionTypes.includes('review')) {
      stage = 'advocacy';
      confidence = 0.9;
      signals.push('review_activity', 'high_engagement');
    } else if (history.some(h => h.action === 'purchase') && history.length > 10) {
      stage = 'retention';
      confidence = 0.85;
      signals.push('post_purchase', 'return_visitor');
    } else {
      stage = 'awareness';
      confidence = 0.7;
      signals.push('initial_exploration', 'content_discovery');
    }
    
    // Calculate time in stage
    const stageStartIndex = recentActions.findIndex(a => 
      this.getStageFromAction(a.action) === stage
    );
    const timeInStage = stageStartIndex === -1 ? 0 : recentActions.length - stageStartIndex;
    
    return {
      stage,
      confidence,
      signals,
      nextActions: this.getStageActions(stage),
      timeInStage
    };
  }

  /**
   * Predict next best actions using AI
   */
  private predictNextActions(stage: JourneyStage, history: any[]): string[] {
    const stageActions: Record<string, string[]> = {
      awareness: ['show_value_proposition', 'capture_email', 'offer_content'],
      consideration: ['schedule_demo', 'send_comparison', 'provide_testimonials'],
      decision: ['offer_discount', 'live_chat_support', 'urgency_messaging'],
      purchase: ['upsell_complementary', 'express_shipping', 'warranty_offer'],
      retention: ['onboarding_sequence', 'satisfaction_survey', 'loyalty_enrollment'],
      advocacy: ['referral_program', 'review_request', 'community_invite']
    };
    
    return stageActions[stage.stage] || ['engage_customer'];
  }

  /**
   * Execute orchestrations based on stage
   */
  private async executeOrchestrations(
    stage: JourneyStage,
    profile: CustomerProfile,
    context: EnhancedSkillContext
  ): Promise<any[]> {
    const orchestrations: any[] = [];
    
    switch (stage.stage) {
      case 'awareness':
        orchestrations.push(await this.triggerAwarenessCapture(profile, context));
        break;
      case 'consideration':
        orchestrations.push(await this.triggerNurtureSequence(profile, context));
        break;
      case 'decision':
        orchestrations.push(await this.triggerConversionOptimization(profile, context));
        break;
      case 'purchase':
        orchestrations.push(await this.triggerTransactionSupport(profile, context));
        break;
      case 'retention':
        orchestrations.push(await this.triggerRetentionProgram(profile, context));
        break;
      case 'advocacy':
        orchestrations.push(await this.triggerAdvocacyProgram(profile, context));
        break;
    }
    
    return orchestrations;
  }

  /**
   * Trigger awareness capture campaigns
   */
  private async triggerAwarenessCapture(profile: CustomerProfile, context: EnhancedSkillContext) {
    return {
      type: 'awareness_capture',
      actions: [
        { action: 'show_exit_intent_popup', delay: 30000 },
        { action: 'offer_lead_magnet', value: 'free_guide' },
        { action: 'retargeting_pixel', platform: 'facebook' }
      ],
      personalization: {
        content_type: profile.preferences?.contentType || 'educational',
        tone: 'informative'
      }
    };
  }

  /**
   * Trigger nurture sequence
   */
  private async triggerNurtureSequence(profile: CustomerProfile, context: EnhancedSkillContext) {
    return {
      type: 'nurture_sequence',
      actions: [
        { action: 'email_drip_campaign', sequence: 'consideration_series' },
        { action: 'personalized_recommendations', count: 3 },
        { action: 'social_proof_display', type: 'testimonials' }
      ],
      personalization: {
        messaging: profile.segments.includes('enterprise') ? 'roi_focused' : 'feature_focused'
      }
    };
  }

  /**
   * Trigger conversion optimization
   */
  private async triggerConversionOptimization(profile: CustomerProfile, context: EnhancedSkillContext) {
    const discount = profile.lifetimeValue === 0 ? 15 : 10; // Higher discount for new customers
    
    return {
      type: 'conversion_optimization',
      actions: [
        { action: 'limited_time_offer', discount: `${discount}%`, expires: 3600 },
        { action: 'cart_abandonment_email', delay: 3600 },
        { action: 'live_chat_proactive', message: 'Need help deciding?' }
      ],
      urgency: profile.churnRisk > 0.7 ? 'high' : 'medium'
    };
  }

  /**
   * Trigger transaction support
   */
  private async triggerTransactionSupport(profile: CustomerProfile, context: EnhancedSkillContext) {
    return {
      type: 'transaction_support',
      actions: [
        { action: 'order_confirmation_email', immediate: true },
        { action: 'shipping_updates', frequency: 'daily' },
        { action: 'post_purchase_upsell', delay: 300 }
      ]
    };
  }

  /**
   * Trigger retention program
   */
  private async triggerRetentionProgram(profile: CustomerProfile, context: EnhancedSkillContext) {
    return {
      type: 'retention_program',
      actions: [
        { action: 'onboarding_email_series', days: 7 },
        { action: 'loyalty_points_enrollment', automatic: true },
        { action: 'satisfaction_survey', delay: 604800 }, // 7 days
        { action: 'win_back_campaign', trigger: 'inactivity_30_days' }
      ],
      personalization: {
        rewards: profile.lifetimeValue > 1000 ? 'vip' : 'standard'
      }
    };
  }

  /**
   * Trigger advocacy program
   */
  private async triggerAdvocacyProgram(profile: CustomerProfile, context: EnhancedSkillContext) {
    return {
      type: 'advocacy_program',
      actions: [
        { action: 'referral_program_invite', incentive: '$50' },
        { action: 'review_request', platforms: ['google', 'trustpilot'] },
        { action: 'case_study_invitation', if: 'enterprise_customer' },
        { action: 'community_ambassador_program', if: 'high_engagement' }
      ]
    };
  }

  /**
   * Get or create customer profile
   */
  private async getOrCreateProfile(customerId: string): Promise<CustomerProfile> {
    // In production, this would fetch from database
    return {
      id: customerId,
      segments: ['engaged', 'high_value'],
      preferences: { channel: 'email', frequency: 'weekly' },
      behaviorPatterns: ['research_oriented', 'price_sensitive'],
      lifetimeValue: 2500,
      churnRisk: 0.3
    };
  }

  /**
   * Get customer history
   */
  private async getCustomerHistory(customerId: string): Promise<any[]> {
    try {
      const logs = await prisma.skill_audit_log.findMany({
        where: {
          OR: [
            { user_id: customerId },
            { event_data: { path: ['sessionId'], equals: customerId } }
          ]
        },
        orderBy: { created_at: 'desc' },
        take: 50
      });

      return logs.map(log => ({
        action: (log.event_data as any)?.action || 'view',
        timestamp: log.created_at,
        data: log.event_data
      }));
    } catch {
      return [];
    }
  }

  /**
   * Track journey event
   */
  private async trackJourneyEvent(event: any): Promise<void> {
    try {
      await prisma.skill_audit_log.create({
        data: {
          skill_id: this.metadata.id,
          event_type: 'journey_event',
          user_id: event.customerId,
          event_data: {
            ...event,
            sessionId: event.customerId,
            skillName: this.metadata.name
          }
        }
      });
    } catch (error) {
      console.log('Failed to track journey event:', error);
    }
  }

  /**
   * Calculate journey metrics
   */
  private async calculateJourneyMetrics(customerId: string): Promise<any> {
    const history = await this.getCustomerHistory(customerId);
    
    return {
      totalTouchpoints: history.length,
      daysActive: this.calculateDaysActive(history),
      engagementScore: this.calculateEngagementScore(history),
      conversionProbability: this.calculateConversionProbability(history),
      customerHealth: this.calculateCustomerHealth(history)
    };
  }

  /**
   * Get active triggers for customer
   */
  private async getActiveTriggers(profile: CustomerProfile, stage: JourneyStage): Promise<any[]> {
    const triggers = [];
    
    // Stage-based triggers
    if (stage.stage === 'decision' && profile.churnRisk > 0.5) {
      triggers.push({ type: 'urgency', action: 'limited_offer' });
    }
    
    if (stage.stage === 'retention' && profile.lifetimeValue > 1000) {
      triggers.push({ type: 'vip_treatment', action: 'premium_support' });
    }
    
    // Behavioral triggers
    if (stage.timeInStage > 5) {
      triggers.push({ type: 'stuck_in_stage', action: 'intervention' });
    }
    
    return triggers;
  }

  /**
   * Helper methods for calculations
   */
  private getStageFromAction(action: string): JourneyStage['stage'] {
    if (action.includes('purchase')) return 'purchase';
    if (action.includes('cart') || action.includes('pricing')) return 'decision';
    if (action.includes('product') || action.includes('compare')) return 'consideration';
    if (action.includes('review') || action.includes('refer')) return 'advocacy';
    if (action.includes('support') || action.includes('account')) return 'retention';
    return 'awareness';
  }

  private getStageActions(stage: JourneyStage['stage']): string[] {
    const actions: Record<string, string[]> = {
      awareness: ['capture_lead', 'educate', 'build_trust'],
      consideration: ['demonstrate_value', 'differentiate', 'nurture'],
      decision: ['remove_friction', 'create_urgency', 'support'],
      purchase: ['confirm', 'upsell', 'onboard'],
      retention: ['engage', 'satisfy', 'retain'],
      advocacy: ['reward', 'amplify', 'collaborate']
    };
    return actions[stage] || [];
  }

  private calculateDaysActive(history: any[]): number {
    if (history.length === 0) return 0;
    const firstDate = new Date(history[history.length - 1].timestamp);
    const lastDate = new Date(history[0].timestamp);
    return Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateEngagementScore(history: any[]): number {
    const score = Math.min(100, history.length * 2 + this.calculateDaysActive(history) * 5);
    return Math.round(score);
  }

  private calculateConversionProbability(history: any[]): number {
    const signals = history.filter(h => 
      h.action.includes('cart') || h.action.includes('pricing') || h.action.includes('demo')
    ).length;
    return Math.min(0.95, signals * 0.15 + 0.2);
  }

  private calculateCustomerHealth(history: any[]): string {
    const engagement = this.calculateEngagementScore(history);
    if (engagement > 80) return 'excellent';
    if (engagement > 60) return 'good';
    if (engagement > 40) return 'fair';
    return 'at_risk';
  }

  private identifyRiskFactors(history: any[]): string[] {
    const risks = [];
    if (history.length < 3) risks.push('low_engagement');
    if (!history.some(h => h.action.includes('product'))) risks.push('no_product_interest');
    if (this.calculateDaysActive(history) > 30) risks.push('prolonged_journey');
    return risks;
  }

  validate(params: SkillParams): boolean {
    return true; // Flexible validation - can work with any input
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'analytics',
      version: '2.0.0',
      features: [
        'journey-mapping',
        'stage-detection',
        'predictive-analytics',
        'automated-orchestration',
        'personalization',
        'multi-channel',
        'real-time-triggers'
      ]
    };
  }
}