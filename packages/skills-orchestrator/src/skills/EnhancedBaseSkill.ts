/**
 * Enhanced Base Skill Class
 * Incorporates successful patterns from the intelligent chatbot implementation
 */

import { SkillResult, SkillParams, SkillMetadata } from '../types';
import { PrismaClient } from '@prisma/client';

// Initialize shared Prisma instance
const prisma = new PrismaClient();

export interface EnhancedSkillContext {
  userId?: string;
  sessionId?: string;
  productKey?: string;
  domain?: string;
  companyName?: string;
  customKnowledge?: any;
  history?: any[];
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
  searchTerms?: string[];
  suggestedActions?: string[];
}

export interface DualAgentResult {
  strategy: any;
  response: string;
  metadata?: any;
}

export abstract class EnhancedBaseSkill {
  abstract metadata: SkillMetadata;
  
  /**
   * Agent 1: Intelligent Strategy Analysis
   * Determines the best approach based on input and context
   */
  protected abstract analyzeStrategy(
    params: SkillParams,
    context: EnhancedSkillContext
  ): Promise<IntentAnalysis>;
  
  /**
   * Agent 2: Response Generation
   * Creates concise, actionable responses with proper formatting
   */
  protected abstract generateResponse(
    strategy: IntentAnalysis,
    data: any,
    context: EnhancedSkillContext
  ): Promise<string>;
  
  /**
   * Main execution method using dual-agent architecture
   */
  async execute(params: SkillParams, context?: EnhancedSkillContext): Promise<SkillResult> {
    try {
      // Enhanced context with domain and tenant support
      const enhancedContext = await this.enhanceContext(params, context);
      
      // Log incoming request
      await this.logExecution('request', params, enhancedContext);
      
      // Agent 1: Analyze strategy
      const strategy = await this.analyzeStrategy(params, enhancedContext);
      this.log(`Strategy determined: ${strategy.intent} (confidence: ${strategy.confidence})`);
      
      // Execute skill-specific logic
      const data = await this.performAction(params, strategy, enhancedContext);
      
      // Agent 2: Generate response
      const response = await this.generateResponse(strategy, data, enhancedContext);
      
      // Log successful execution
      await this.logExecution('response', { response, strategy }, enhancedContext);
      
      return this.success({
        response,
        data,
        intent: strategy.intent,
        confidence: strategy.confidence
      }, {
        domain: enhancedContext.domain,
        sessionId: enhancedContext.sessionId
      });
      
    } catch (error: any) {
      await this.logExecution('error', { error: error.message }, context);
      return this.error(error.message);
    }
  }
  
  /**
   * Perform the actual skill action
   */
  protected abstract performAction(
    params: SkillParams,
    strategy: IntentAnalysis,
    context: EnhancedSkillContext
  ): Promise<any>;
  
  /**
   * Validate parameters before execution
   */
  abstract validate(params: SkillParams): boolean;
  
  /**
   * Enhance context with product key and domain information
   */
  protected async enhanceContext(
    params: SkillParams,
    context?: EnhancedSkillContext
  ): Promise<EnhancedSkillContext> {
    const enhanced: EnhancedSkillContext = {
      ...context,
      sessionId: context?.sessionId || params.sessionId || 'anonymous',
      userId: context?.userId || params.userId || 'anonymous'
    };
    
    // If we have a product key, fetch domain and company info
    if (params.productKey || context?.productKey) {
      const productKey = params.productKey || context?.productKey;
      
      try {
        const productKeyRecord = await prisma.product_keys.findFirst({
          where: {
            product_key: productKey,
            status: 'active'
          }
        });

        if (productKeyRecord) {
          const metadata = productKeyRecord.metadata as any;

          // Get license info if available
          let licenseInfo = null;
          if (productKeyRecord.license_key) {
            licenseInfo = await prisma.licenses.findUnique({
              where: { license_key: productKeyRecord.license_key }
            });
          }

          enhanced.domain = metadata?.domain || licenseInfo?.domain || enhanced.domain;
          enhanced.companyName = metadata?.company_name || licenseInfo?.customer_name || enhanced.companyName;
          enhanced.customKnowledge = metadata?.custom_knowledge || enhanced.customKnowledge;
        }
      } catch (error) {
        this.log(`Could not fetch product key info: ${error}`, 'warn');
      }
    }
    
    return enhanced;
  }
  
  /**
   * Log execution for monitoring and analytics
   */
  protected async logExecution(
    type: 'request' | 'response' | 'error',
    data: any,
    context?: EnhancedSkillContext
  ): Promise<void> {
    try {
      await prisma.skill_logs.create({
        data: {
          skill_id: this.metadata.id,
          skill_name: this.metadata.name,
          session_id: context?.sessionId || 'anonymous',
          user_id: context?.userId || 'anonymous',
          product_key: context?.productKey,
          domain: context?.domain,
          log_type: type,
          data: JSON.stringify(data),
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Fail silently - logging should not break execution
      this.log(`Failed to log execution: ${error}`, 'warn');
    }
  }
  
  /**
   * Extract relevant information based on keywords (similar to chatbot)
   */
  protected extractRelevantInfo(
    content: string,
    keywords: string[],
    maxSentences: number = 3
  ): string {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const relevant: string[] = [];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      for (const keyword of keywords) {
        if (lowerSentence.includes(keyword.toLowerCase())) {
          const cleaned = sentence.trim().replace(/\s+/g, ' ');
          if (cleaned.length > 20 && cleaned.length < 200 && !relevant.includes(cleaned)) {
            relevant.push(cleaned);
            break;
          }
        }
      }
      if (relevant.length >= maxSentences) break;
    }
    
    return relevant.join(' ');
  }
  
  /**
   * Format response with hyperlinks (for web-based responses)
   */
  protected formatWithLinks(
    text: string,
    domain?: string
  ): string {
    if (!domain) return text;
    
    const baseUrl = `https://${domain}`;
    
    // Auto-link common pages
    const replacements: Record<string, string> = {
      'products': `<a href="${baseUrl}/products">products</a>`,
      'services': `<a href="${baseUrl}/services">services</a>`,
      'pricing': `<a href="${baseUrl}/pricing">pricing</a>`,
      'contact': `<a href="${baseUrl}/contact">contact</a>`,
      'about': `<a href="${baseUrl}/about">about</a>`
    };
    
    let formatted = text;
    for (const [word, link] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      formatted = formatted.replace(regex, link);
    }
    
    return formatted;
  }
  
  /**
   * Helper method to create a success result
   */
  protected success(data: any, metadata?: any): SkillResult {
    return {
      success: true,
      data,
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date(),
        ...metadata
      }
    };
  }
  
  /**
   * Helper method to create an error result
   */
  protected error(error: string, metadata?: any): SkillResult {
    return {
      success: false,
      error,
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date(),
        ...metadata
      }
    };
  }
  
  /**
   * Log skill execution for monitoring
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.metadata.name}] [${level.toUpperCase()}] ${message}`);
  }
  
  /**
   * Get conversation history from database
   */
  protected async getHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    try {
      const logs = await prisma.skill_logs.findMany({
        where: {
          session_id: sessionId,
          log_type: { in: ['request', 'response'] }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      return logs.map(log => ({
        type: log.log_type,
        data: JSON.parse(log.data as string),
        timestamp: log.timestamp
      }));
    } catch (error) {
      this.log(`Failed to fetch history: ${error}`, 'warn');
      return [];
    }
  }
  
  /**
   * Determine journey stage based on conversation history
   */
  protected getJourneyStage(history: any[]): string {
    if (history.length === 0) return 'discovery';
    if (history.length < 3) return 'exploration';
    if (history.length < 10) return 'evaluation';
    return 'decision';
  }
}