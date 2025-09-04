/**
 * AI Intelligence Service
 * Provides intelligent insights, predictions, and recommendations
 * Integrates with execution monitoring for data-driven decisions
 */

import { PrismaClient } from '@prisma/client';

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'anomaly' | 'optimization';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-100
  data?: any;
  actions?: AIAction[];
  metadata?: Record<string, any>;
}

export interface AIAction {
  id: string;
  label: string;
  type: 'execute_skill' | 'adjust_setting' | 'alert_user' | 'auto_fix';
  params?: any;
}

export interface AIAnalysisRequest {
  licenseKey: string;
  context: 'performance' | 'cost' | 'errors' | 'usage' | 'security' | 'general';
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeRecommendations?: boolean;
  includePredictions?: boolean;
}

export class AIIntelligenceService {
  private prisma: PrismaClient;
  
  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Analyze execution patterns and provide insights
   */
  async analyzeExecutions(request: AIAnalysisRequest): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // TODO: Fix execution_entity table structure - it doesn't have license_key field
    // Temporarily return empty insights until table structure is fixed
    /*
    // Get execution data for analysis
    const executions = await this.prisma.execution_entity.findMany({
      where: {
        license_key: request.licenseKey,
        started_at: request.timeRange ? {
          gte: request.timeRange.start,
          lte: request.timeRange.end
        } : undefined
      },
      include: {
        execution_events: true,
        execution_metrics: true,
        data_flows: true
      },
      orderBy: { started_at: 'desc' },
      take: 1000
    });
    
    // Analyze performance patterns
    if (request.context === 'performance' || request.context === 'general') {
      const perfInsights = await this.analyzePerformance(executions);
      insights.push(...perfInsights);
    }

    // Analyze error patterns
    if (request.context === 'errors' || request.context === 'general') {
      const errorInsights = await this.analyzeErrors(executions);
      insights.push(...errorInsights);
    }

    // Analyze cost optimization
    if (request.context === 'cost' || request.context === 'general') {
      const costInsights = await this.analyzeCosts(executions);
      insights.push(...costInsights);
    }

    // Analyze security concerns
    if (request.context === 'security' || request.context === 'general') {
      const securityInsights = await this.analyzeSecurity(executions);
      insights.push(...securityInsights);
    }

    // Generate predictions if requested
    if (request.includePredictions) {
      const predictions = await this.generatePredictions(executions);
      insights.push(...predictions);
    }

    // Generate recommendations if requested
    if (request.includeRecommendations) {
      const recommendations = await this.generateRecommendations(executions, insights);
      insights.push(...recommendations);
    }
    */

    // Return empty insights until table structure is fixed
    return insights;
  }

  /**
   * Analyze performance patterns
   */
  private async analyzePerformance(executions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Calculate average execution times by type
    const executionTimes = new Map<string, number[]>();
    executions.forEach(exec => {
      if (exec.duration_ms) {
        const times = executionTimes.get(exec.execution_type) || [];
        times.push(exec.duration_ms);
        executionTimes.set(exec.execution_type, times);
      }
    });

    // Find slow execution types
    executionTimes.forEach((times, type) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      if (avg > 5000) { // Over 5 seconds average
        insights.push({
          id: `perf_slow_${type}`,
          type: 'anomaly',
          severity: avg > 10000 ? 'critical' : 'warning',
          title: `Slow ${type} executions detected`,
          description: `Average execution time is ${(avg / 1000).toFixed(2)}s (P95: ${(p95 / 1000).toFixed(2)}s)`,
          confidence: 95,
          data: { avg, p95, samples: times.length },
          actions: [{
            id: 'optimize',
            label: 'Optimize execution',
            type: 'execute_skill',
            params: { skill: 'performance_optimizer', target: type }
          }]
        });
      }
    });

    // Detect performance degradation trends
    const recentExecs = executions.slice(0, 100);
    const olderExecs = executions.slice(100, 200);
    
    if (recentExecs.length > 50 && olderExecs.length > 50) {
      const recentAvg = recentExecs.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / recentExecs.length;
      const olderAvg = olderExecs.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / olderExecs.length;
      
      if (recentAvg > olderAvg * 1.5) {
        insights.push({
          id: 'perf_degradation',
          type: 'anomaly',
          severity: 'warning',
          title: 'Performance degradation detected',
          description: `Recent executions are ${((recentAvg / olderAvg - 1) * 100).toFixed(0)}% slower than previous period`,
          confidence: 85,
          data: { recentAvg, olderAvg }
        });
      }
    }

    return insights;
  }

  /**
   * Analyze error patterns
   */
  private async analyzeErrors(executions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    const failedExecs = executions.filter(e => e.status === 'failed');
    const totalExecs = executions.length;
    const errorRate = (failedExecs.length / totalExecs) * 100;

    if (errorRate > 10) {
      insights.push({
        id: 'high_error_rate',
        type: 'anomaly',
        severity: errorRate > 25 ? 'critical' : 'warning',
        title: 'High error rate detected',
        description: `${errorRate.toFixed(1)}% of executions are failing`,
        confidence: 100,
        data: { errorRate, failed: failedExecs.length, total: totalExecs },
        actions: [{
          id: 'investigate',
          label: 'Investigate errors',
          type: 'execute_skill',
          params: { skill: 'error_analyzer' }
        }]
      });
    }

    // Group errors by type
    const errorTypes = new Map<string, number>();
    failedExecs.forEach(exec => {
      const errorMsg = exec.error_data?.message || 'Unknown error';
      errorTypes.set(errorMsg, (errorTypes.get(errorMsg) || 0) + 1);
    });

    // Find recurring errors
    errorTypes.forEach((count, error) => {
      if (count > 5) {
        insights.push({
          id: `recurring_error_${error.substring(0, 20)}`,
          type: 'anomaly',
          severity: count > 20 ? 'critical' : 'warning',
          title: 'Recurring error pattern',
          description: `"${error}" has occurred ${count} times`,
          confidence: 100,
          data: { error, count },
          actions: [{
            id: 'auto_fix',
            label: 'Apply automatic fix',
            type: 'auto_fix',
            params: { error }
          }]
        });
      }
    });

    return insights;
  }

  /**
   * Analyze costs and suggest optimizations
   */
  private async analyzeCosts(executions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
    const totalTokens = executions.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
    
    // Cost by execution type
    const costByType = new Map<string, number>();
    executions.forEach(exec => {
      const cost = costByType.get(exec.execution_type) || 0;
      costByType.set(exec.execution_type, cost + (exec.cost_usd || 0));
    });

    // Find expensive execution types
    const sortedCosts = Array.from(costByType.entries()).sort((a, b) => b[1] - a[1]);
    const topExpensive = sortedCosts[0];
    
    if (topExpensive && topExpensive[1] > totalCost * 0.5) {
      insights.push({
        id: 'high_cost_concentration',
        type: 'optimization',
        severity: 'warning',
        title: 'Cost concentration detected',
        description: `${topExpensive[0]} accounts for ${((topExpensive[1] / totalCost) * 100).toFixed(0)}% of total costs`,
        confidence: 100,
        data: { type: topExpensive[0], cost: topExpensive[1], totalCost },
        actions: [{
          id: 'optimize_cost',
          label: 'Optimize high-cost operations',
          type: 'execute_skill',
          params: { skill: 'cost_optimizer', target: topExpensive[0] }
        }]
      });
    }

    // Token usage optimization
    if (totalTokens > 100000) {
      const avgTokensPerExec = totalTokens / executions.length;
      insights.push({
        id: 'token_usage',
        type: 'optimization',
        severity: 'info',
        title: 'Token usage optimization available',
        description: `Average ${Math.round(avgTokensPerExec)} tokens per execution. Consider caching or prompt optimization.`,
        confidence: 80,
        data: { totalTokens, avgTokensPerExec },
        actions: [{
          id: 'enable_caching',
          label: 'Enable intelligent caching',
          type: 'adjust_setting',
          params: { setting: 'enable_cache', value: true }
        }]
      });
    }

    return insights;
  }

  /**
   * Analyze security concerns
   */
  private async analyzeSecurity(executions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Check for PII exposure
    const piiFlows = executions.flatMap(e => e.data_flows || []).filter(f => f.contains_pii);
    
    if (piiFlows.length > 0) {
      const unencrypted = piiFlows.filter(f => !f.encryption_used);
      
      if (unencrypted.length > 0) {
        insights.push({
          id: 'unencrypted_pii',
          type: 'anomaly',
          severity: 'critical',
          title: 'Unencrypted PII detected',
          description: `${unencrypted.length} data flows contain unencrypted PII`,
          confidence: 100,
          data: { count: unencrypted.length, flows: unencrypted.slice(0, 5) },
          actions: [{
            id: 'enable_encryption',
            label: 'Enable encryption for all PII',
            type: 'auto_fix',
            params: { action: 'encrypt_pii' }
          }]
        });
      }
    }

    // Check for unusual data access patterns
    const dataAccessByHour = new Map<number, number>();
    executions.forEach(exec => {
      const hour = new Date(exec.started_at).getHours();
      dataAccessByHour.set(hour, (dataAccessByHour.get(hour) || 0) + 1);
    });

    // Find unusual access times
    const nightAccess = Array.from(dataAccessByHour.entries())
      .filter(([hour]) => hour >= 0 && hour <= 6)
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (nightAccess > executions.length * 0.3) {
      insights.push({
        id: 'unusual_access_pattern',
        type: 'anomaly',
        severity: 'warning',
        title: 'Unusual access pattern detected',
        description: `${((nightAccess / executions.length) * 100).toFixed(0)}% of executions occur during night hours`,
        confidence: 75,
        data: { nightAccess, total: executions.length },
        actions: [{
          id: 'review_access',
          label: 'Review access logs',
          type: 'alert_user'
        }]
      });
    }

    return insights;
  }

  /**
   * Generate predictions based on historical data
   */
  private async generatePredictions(executions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Predict future costs
    if (executions.length > 100) {
      const dailyCosts = new Map<string, number>();
      executions.forEach(exec => {
        const date = new Date(exec.started_at).toDateString();
        dailyCosts.set(date, (dailyCosts.get(date) || 0) + (exec.cost_usd || 0));
      });
      
      const avgDailyCost = Array.from(dailyCosts.values()).reduce((a, b) => a + b, 0) / dailyCosts.size;
      const projectedMonthlyCost = avgDailyCost * 30;
      
      insights.push({
        id: 'cost_prediction',
        type: 'prediction',
        severity: 'info',
        title: 'Projected monthly costs',
        description: `Based on current usage, estimated monthly cost: $${projectedMonthlyCost.toFixed(2)}`,
        confidence: 70,
        data: { avgDailyCost, projectedMonthlyCost }
      });
    }

    // Predict capacity needs
    const executionsByHour = new Map<number, number>();
    executions.forEach(exec => {
      const hour = Math.floor(Date.now() - new Date(exec.started_at).getTime()) / (1000 * 60 * 60);
      if (hour < 24) {
        executionsByHour.set(hour, (executionsByHour.get(hour) || 0) + 1);
      }
    });
    
    const peakHourlyRate = Math.max(...Array.from(executionsByHour.values()));
    if (peakHourlyRate > 50) {
      insights.push({
        id: 'capacity_prediction',
        type: 'prediction',
        severity: 'warning',
        title: 'Capacity scaling needed',
        description: `Peak usage of ${peakHourlyRate} executions/hour may require scaling`,
        confidence: 80,
        data: { peakHourlyRate },
        actions: [{
          id: 'scale_resources',
          label: 'Auto-scale resources',
          type: 'adjust_setting',
          params: { setting: 'auto_scale', value: true }
        }]
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on insights
   */
  private async generateRecommendations(executions: any[], insights: AIInsight[]): Promise<AIInsight[]> {
    const recommendations: AIInsight[] = [];
    
    // Recommend batch processing for similar operations
    const executionGroups = new Map<string, any[]>();
    executions.forEach(exec => {
      const key = `${exec.execution_type}_${JSON.stringify(exec.input_data || {})}`;
      const group = executionGroups.get(key) || [];
      group.push(exec);
      executionGroups.set(key, group);
    });
    
    executionGroups.forEach((group, key) => {
      if (group.length > 10) {
        recommendations.push({
          id: `batch_recommendation_${key.substring(0, 20)}`,
          type: 'recommendation',
          severity: 'info',
          title: 'Batch processing recommended',
          description: `${group.length} similar operations could be batched for efficiency`,
          confidence: 90,
          data: { count: group.length, type: group[0].execution_type },
          actions: [{
            id: 'enable_batching',
            label: 'Enable batch processing',
            type: 'adjust_setting',
            params: { setting: 'batch_mode', value: true }
          }]
        });
      }
    });

    // Recommend caching for frequently repeated operations
    const frequentOps = new Map<string, number>();
    executions.forEach(exec => {
      const key = `${exec.execution_type}_${JSON.stringify(exec.input_data || {})}`;
      frequentOps.set(key, (frequentOps.get(key) || 0) + 1);
    });
    
    frequentOps.forEach((count, key) => {
      if (count > 20) {
        recommendations.push({
          id: `cache_recommendation_${key.substring(0, 20)}`,
          type: 'recommendation',
          severity: 'info',
          title: 'Caching recommended',
          description: `Operation repeated ${count} times - caching could save resources`,
          confidence: 95,
          data: { count, operation: key.substring(0, 50) },
          actions: [{
            id: 'enable_cache',
            label: 'Enable caching for this operation',
            type: 'adjust_setting',
            params: { operation: key, cache: true }
          }]
        });
      }
    });

    return recommendations;
  }

  /**
   * Get real-time alerts based on current conditions
   */
  async getRealTimeAlerts(licenseKey: string): Promise<AIInsight[]> {
    const alerts: AIInsight[] = [];
    
    // TODO: Fix execution_entity table structure - it doesn't have license_key field
    // Temporarily skip this check until table structure is fixed
    /*
    // Check for currently failing executions
    const runningExecs = await this.prisma.execution_entity.findMany({
      where: {
        license_key: licenseKey,
        status: 'running',
        started_at: {
          lte: new Date(Date.now() - 30 * 60 * 1000) // Running for over 30 minutes
        }
      }
    });
    */
    const runningExecs: any[] = [];
    
    if (runningExecs.length > 0) {
      alerts.push({
        id: 'stuck_executions',
        type: 'anomaly',
        severity: 'critical',
        title: 'Stuck executions detected',
        description: `${runningExecs.length} executions have been running for over 30 minutes`,
        confidence: 100,
        data: { executions: runningExecs },
        actions: [{
          id: 'terminate',
          label: 'Terminate stuck executions',
          type: 'auto_fix',
          params: { executionIds: runningExecs.map((e: any) => e.id) }
        }]
      });
    }

    return alerts;
  }
}

// Export singleton instance
export const aiIntelligence = new AIIntelligenceService();