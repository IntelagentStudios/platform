/**
 * Base class for all Specialist Agents
 * These agents monitor specific domains across all workflows
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentInsight {
  id: string;
  agentId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  domain: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  relevance: number;
  actionable: boolean;
  suggestedAction?: {
    type: string;
    params: any;
  };
}

export interface MonitoringMetrics {
  eventsProcessed: number;
  insightsGenerated: number;
  interventions: number;
  uptime: number;
  lastActivity: Date;
}

export abstract class SpecialistAgent extends EventEmitter {
  protected agentId: string;
  protected domain: string;
  protected isActive: boolean = false;
  protected insights: AgentInsight[] = [];
  protected metrics: MonitoringMetrics;
  
  constructor(agentId: string, domain: string) {
    super();
    this.agentId = agentId;
    this.domain = domain;
    this.metrics = {
      eventsProcessed: 0,
      insightsGenerated: 0,
      interventions: 0,
      uptime: 0,
      lastActivity: new Date()
    };
  }
  
  /**
   * Start monitoring workflows
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn(`${this.agentId} is already active`);
      return;
    }
    
    this.isActive = true;
    console.log(`[${this.agentId}] Starting specialist agent for domain: ${this.domain}`);
    
    await this.initialize();
    this.startMonitoring();
  }
  
  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      console.warn(`${this.agentId} is not active`);
      return;
    }
    
    this.isActive = false;
    console.log(`[${this.agentId}] Stopping specialist agent`);
    
    await this.cleanup();
  }
  
  /**
   * Process an event from a workflow
   */
  async processEvent(event: any): Promise<void> {
    if (!this.isActive) return;
    
    this.metrics.eventsProcessed++;
    this.metrics.lastActivity = new Date();
    
    // Analyze event for insights
    const insight = await this.analyzeEvent(event);
    
    if (insight) {
      this.addInsight(insight);
      
      // Check if intervention is needed
      if (this.shouldIntervene(insight)) {
        await this.intervene(insight);
        this.metrics.interventions++;
      }
    }
  }
  
  /**
   * Get all insights
   */
  getInsights(limit?: number): AgentInsight[] {
    const sorted = this.insights.sort((a, b) => b.relevance - a.relevance);
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * Get agent metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Clear old insights
   */
  pruneInsights(olderThan: Date): number {
    const before = this.insights.length;
    this.insights = this.insights.filter(i => i.timestamp > olderThan);
    return before - this.insights.length;
  }
  
  /**
   * Add an insight and log to database
   */
  protected async addInsight(insight: AgentInsight): Promise<void> {
    this.insights.push(insight);
    this.metrics.insightsGenerated++;
    
    // Log to skill_executions table
    try {
      await prisma.skill_executions.create({
        data: {
          skill_id: this.agentId,
          license_key: 'SYSTEM', // System agents don't have a license
          status: 'completed',
          input_params: {
            type: 'insight_generation',
            domain: this.domain,
            insightType: insight.type
          },
          output_result: {
            insight: {
              id: insight.id,
              title: insight.title,
              message: insight.message,
              relevance: insight.relevance,
              actionable: insight.actionable,
              suggestedAction: insight.suggestedAction
            },
            data: insight.data
          },
          started_at: insight.timestamp,
          completed_at: new Date(),
          execution_time_ms: 0,
          metadata: {
            agent: this.agentId,
            domain: this.domain,
            metrics: this.metrics
          }
        }
      });
    } catch (error) {
      console.error(`Failed to log insight for ${this.agentId}:`, error);
    }
    
    // Emit event for real-time updates
    this.emit('insight', insight);
    
    // Keep only recent insights (last 1000)
    if (this.insights.length > 1000) {
      this.insights = this.insights.slice(-1000);
    }
  }
  
  /**
   * Create an insight object
   */
  protected createInsight(
    type: AgentInsight['type'],
    title: string,
    message: string,
    relevance: number = 0.5,
    data?: any
  ): AgentInsight {
    return {
      id: `${this.agentId}-${Date.now()}`,
      agentId: this.agentId,
      type,
      domain: this.domain,
      title,
      message,
      data,
      timestamp: new Date(),
      relevance: Math.min(1, Math.max(0, relevance)),
      actionable: relevance > 0.7
    };
  }
  
  /**
   * Abstract methods to be implemented by specific agents
   */
  protected abstract initialize(): Promise<void>;
  protected abstract startMonitoring(): void;
  protected abstract analyzeEvent(event: any): Promise<AgentInsight | null>;
  protected abstract shouldIntervene(insight: AgentInsight): boolean;
  protected abstract intervene(insight: AgentInsight): Promise<void>;
  protected abstract cleanup(): Promise<void>;
}