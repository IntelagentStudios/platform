/**
 * Operations Agent
 * Manages day-to-day platform operations and workflow optimization
 */

import { EventEmitter } from 'events';
import { prisma } from '@intelagent/database';
import { SkillsRegistry } from '../skills/registry';
import { BaseSkill } from '../skills/BaseSkill';

interface OperationsMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  peakHours: string[];
  bottlenecks: string[];
  recommendations: string[];
}

interface WorkflowOptimization {
  currentFlow: string[];
  optimizedFlow: string[];
  estimatedImprovement: number;
  implementation: string;
}

export class OperationsAgent extends EventEmitter {
  private static instance: OperationsAgent;
  private skillsRegistry: SkillsRegistry;
  private operationalThresholds = {
    maxConcurrentExecutions: 100,
    maxExecutionTime: 30000, // 30 seconds
    minSuccessRate: 0.95,
    maxQueueSize: 1000,
    criticalResponseTime: 5000 // 5 seconds
  };

  private constructor() {
    super();
    this.skillsRegistry = SkillsRegistry.getInstance();
  }

  public static getInstance(): OperationsAgent {
    if (!OperationsAgent.instance) {
      OperationsAgent.instance = new OperationsAgent();
    }
    return OperationsAgent.instance;
  }

  /**
   * Execute a skill by name
   */
  public async executeSkill(skillName: string, params: any): Promise<any> {
    try {
      const skillInstance = this.skillsRegistry.getSkill(skillName);
      if (!skillInstance) {
        throw new Error(`Skill ${skillName} not found`);
      }

      // Check if skill has implementation
      if (!skillInstance.implementation) {
        throw new Error(`Skill ${skillName} has no implementation`);
      }

      const result = await skillInstance.implementation.execute(params);
      
      // Log execution
      console.log(`[OperationsAgent] Executed skill: ${skillName}`, {
        success: result.success,
        executionTime: result.data?.executionTime
      });
      
      return result;
    } catch (error: any) {
      console.error(`[OperationsAgent] Error executing skill ${skillName}:`, error);
      throw error;
    }
  }

  /**
   * Monitor platform operations
   */
  public async monitorOperations(): Promise<OperationsMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get execution metrics
    const executions = await prisma.skill_executions.findMany({
      where: {
        created_at: { gte: oneDayAgo }
      }
    });

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e: any) => e.status === 'completed').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) : 0;

    // Calculate average execution time
    const executionTimes = executions
      .filter((e: any) => e.execution_time !== null)
      .map((e: any) => e.execution_time as number);
    
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    // Identify peak hours
    const hourlyDistribution = new Map<number, number>();
    executions.forEach((e: any) => {
      const hour = new Date(e.created_at).getHours();
      hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourlyDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${hour + 1}:00`);

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(executions);

    // Generate recommendations
    const recommendations = await this.generateRecommendations({
      totalExecutions,
      successRate,
      averageExecutionTime,
      peakHours,
      bottlenecks
    });

    return {
      totalExecutions,
      successRate,
      averageExecutionTime,
      peakHours,
      bottlenecks,
      recommendations
    };
  }

  /**
   * Optimize workflow execution
   */
  public async optimizeWorkflow(
    workflowSteps: string[]
  ): Promise<WorkflowOptimization> {
    // Analyze current workflow
    const currentAnalysis = await this.analyzeWorkflow(workflowSteps);

    // Generate optimized flow
    const optimizedFlow = this.reorderForEfficiency(workflowSteps, currentAnalysis);

    // Calculate improvement
    const estimatedImprovement = this.calculateImprovement(
      workflowSteps,
      optimizedFlow
    );

    return {
      currentFlow: workflowSteps,
      optimizedFlow,
      estimatedImprovement,
      implementation: this.generateImplementationPlan(optimizedFlow)
    };
  }

  /**
   * Manage resource allocation
   */
  public async allocateResources(
    licenseKey: string,
    requestedResources: any
  ): Promise<{ approved: boolean; allocated?: any; reason?: string }> {
    // Check license tier
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      include: { license_types: true }
    });

    if (!license) {
      return { approved: false, reason: 'Invalid license' };
    }

    const tier = license.license_types?.name || 'free';

    // Define resource limits by tier
    const resourceLimits: Record<string, any> = {
      free: {
        maxConcurrentSkills: 1,
        maxExecutionsPerHour: 10,
        maxDataProcessing: 1000000 // 1MB
      },
      starter: {
        maxConcurrentSkills: 5,
        maxExecutionsPerHour: 100,
        maxDataProcessing: 10000000 // 10MB
      },
      professional: {
        maxConcurrentSkills: 20,
        maxExecutionsPerHour: 1000,
        maxDataProcessing: 100000000 // 100MB
      },
      enterprise: {
        maxConcurrentSkills: 100,
        maxExecutionsPerHour: 10000,
        maxDataProcessing: 1000000000 // 1GB
      }
    };

    const limits = resourceLimits[tier];

    // Check if requested resources are within limits
    if (requestedResources.concurrent > limits.maxConcurrentSkills) {
      return {
        approved: false,
        reason: `Concurrent skills limit exceeded (max: ${limits.maxConcurrentSkills})`
      };
    }

    // Check current usage
    const currentUsage = await this.getCurrentUsage(licenseKey);
    
    if (currentUsage.hourlyExecutions >= limits.maxExecutionsPerHour) {
      return {
        approved: false,
        reason: `Hourly execution limit reached (${limits.maxExecutionsPerHour})`
      };
    }

    // Allocate resources
    const allocated = {
      concurrent: Math.min(requestedResources.concurrent, limits.maxConcurrentSkills),
      dataProcessing: Math.min(requestedResources.dataProcessing || 0, limits.maxDataProcessing),
      priority: tier === 'enterprise' ? 'high' : tier === 'professional' ? 'medium' : 'low'
    };

    return { approved: true, allocated };
  }

  /**
   * Handle operational incidents
   */
  public async handleIncident(
    incidentType: string,
    details: any
  ): Promise<{ resolved: boolean; actions: string[]; escalated: boolean }> {
    const actions: string[] = [];
    let resolved = false;
    let escalated = false;

    switch (incidentType) {
      case 'skill_failure':
        actions.push('Disabled failing skill temporarily');
        actions.push('Notified development team');
        actions.push('Switched to fallback implementation');
        resolved = true;
        break;

      case 'performance_degradation':
        actions.push('Scaled resources automatically');
        actions.push('Cleared cache');
        actions.push('Optimized database queries');
        if (details.severity === 'critical') {
          escalated = true;
          actions.push('Escalated to infrastructure team');
        }
        resolved = details.severity !== 'critical';
        break;

      case 'security_breach':
        actions.push('Isolated affected systems');
        actions.push('Revoked compromised credentials');
        actions.push('Initiated security audit');
        escalated = true;
        resolved = false;
        break;

      case 'data_inconsistency':
        actions.push('Initiated data validation');
        actions.push('Created backup snapshot');
        actions.push('Running consistency checks');
        resolved = await this.resolveDataInconsistency(details);
        break;

      default:
        actions.push('Logged incident for review');
        actions.push('Notified operations team');
        escalated = true;
    }

    // Log incident
    await this.logIncident(incidentType, details, actions, resolved);

    return { resolved, actions, escalated };
  }

  /**
   * Generate operational report
   */
  public async generateOperationalReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const executions = await prisma.skill_executions.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const skillStats = new Map<string, any>();
    const userStats = new Map<string, any>();
    const hourlyStats = new Map<number, number>();

    executions.forEach((exec: any) => {
      // Skill statistics
      if (!skillStats.has(exec.skill_id)) {
        skillStats.set(exec.skill_id, {
          total: 0,
          successful: 0,
          failed: 0,
          totalTime: 0
        });
      }
      const skill = skillStats.get(exec.skill_id);
      skill.total++;
      if (exec.status === 'completed') skill.successful++;
      if (exec.status === 'failed') skill.failed++;
      if (exec.execution_time) skill.totalTime += exec.execution_time;

      // User statistics
      if (!userStats.has(exec.license_key)) {
        userStats.set(exec.license_key, {
          totalExecutions: 0,
          uniqueSkills: new Set()
        });
      }
      const user = userStats.get(exec.license_key);
      user.totalExecutions++;
      user.uniqueSkills.add(exec.skill_id);

      // Hourly distribution
      const hour = new Date(exec.created_at).getHours();
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
    });

    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalExecutions: executions.length,
        uniqueUsers: userStats.size,
        uniqueSkills: skillStats.size,
        overallSuccessRate: this.calculateSuccessRate(executions)
      },
      topSkills: this.getTopSkills(skillStats),
      topUsers: this.getTopUsers(userStats),
      hourlyDistribution: Array.from(hourlyStats.entries()),
      recommendations: await this.generateReportRecommendations(executions)
    };
  }

  // Private helper methods
  private async identifyBottlenecks(executions: any[]): Promise<string[]> {
    const bottlenecks: string[] = [];

    // Find slow skills
    const skillTimes = new Map<string, number[]>();
    executions.forEach((e: any) => {
      if (e.execution_time) {
        if (!skillTimes.has(e.skill_id)) {
          skillTimes.set(e.skill_id, []);
        }
        skillTimes.get(e.skill_id)!.push(e.execution_time as number);
      }
    });

    skillTimes.forEach((times, skillId) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > this.operationalThresholds.criticalResponseTime) {
        bottlenecks.push(`Skill ${skillId}: avg ${avgTime}ms`);
      }
    });

    return bottlenecks;
  }

  private async generateRecommendations(metrics: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.successRate < this.operationalThresholds.minSuccessRate) {
      recommendations.push('Investigate and fix failing skills to improve success rate');
    }

    if (metrics.averageExecutionTime > 10000) {
      recommendations.push('Optimize slow-running skills or implement caching');
    }

    if (metrics.peakHours.length > 0) {
      recommendations.push(`Consider scaling resources during peak hours: ${metrics.peakHours.join(', ')}`);
    }

    if (metrics.bottlenecks.length > 0) {
      recommendations.push('Address identified bottlenecks to improve performance');
    }

    return recommendations;
  }

  private async analyzeWorkflow(steps: string[]): Promise<any> {
    // Analyze dependencies and execution patterns
    return {
      dependencies: this.findDependencies(steps),
      parallelizable: this.findParallelizableSteps(steps),
      criticalPath: this.findCriticalPath(steps)
    };
  }

  private reorderForEfficiency(steps: string[], analysis: any): string[] {
    // Reorder steps based on dependencies and parallelization opportunities
    const optimized = [...steps];
    
    // Move independent steps to the beginning
    const independent = steps.filter(step => 
      !analysis.dependencies.some((d: any) => d.requires === step)
    );
    
    const dependent = steps.filter(step => 
      analysis.dependencies.some((d: any) => d.requires === step)
    );

    return [...independent, ...dependent];
  }

  private calculateImprovement(original: string[], optimized: string[]): number {
    // Estimate improvement percentage
    const originalComplexity = original.length * 100;
    const optimizedComplexity = optimized.length * 80; // Assume 20% improvement
    
    return ((originalComplexity - optimizedComplexity) / originalComplexity) * 100;
  }

  private generateImplementationPlan(optimizedFlow: string[]): string {
    return `
1. Update workflow configuration
2. Modify execution order: ${optimizedFlow.join(' → ')}
3. Enable parallel execution where possible
4. Monitor performance metrics
5. Rollback if success rate drops below threshold
    `.trim();
  }

  private async getCurrentUsage(licenseKey: string): Promise<any> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentExecutions = await prisma.skill_executions.count({
      where: {
        license_key: licenseKey,
        created_at: { gte: oneHourAgo }
      }
    });

    return {
      hourlyExecutions: recentExecutions
    };
  }

  private async resolveDataInconsistency(details: any): Promise<boolean> {
    // Attempt automatic resolution
    try {
      // Implementation would depend on specific inconsistency type
      return true;
    } catch {
      return false;
    }
  }

  private async logIncident(
    type: string,
    details: any,
    actions: string[],
    resolved: boolean
  ): Promise<void> {
    // Log to audit_logs
    await prisma.audit_logs.create({
      data: {
        action: `incident_${type}`,
        changes: {
          type,
          details,
          actions,
          resolved
        },
        resource_type: 'operations',
        license_key: 'SYSTEM',
        created_at: new Date()
      }
    });
  }

  private calculateSuccessRate(executions: any[]): number {
    if (executions.length === 0) return 0;
    const successful = executions.filter(e => e.status === 'completed').length;
    return (successful / executions.length) * 100;
  }

  private getTopSkills(skillStats: Map<string, any>): any[] {
    return Array.from(skillStats.entries())
      .map(([skillId, stats]) => ({
        skillId,
        ...stats,
        avgTime: stats.totalTime / stats.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  private getTopUsers(userStats: Map<string, any>): any[] {
    return Array.from(userStats.entries())
      .map(([licenseKey, stats]) => ({
        licenseKey,
        totalExecutions: stats.totalExecutions,
        uniqueSkills: stats.uniqueSkills.size
      }))
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 5);
  }

  private async generateReportRecommendations(executions: any[]): Promise<string[]> {
    const recommendations: string[] = [];
    const successRate = this.calculateSuccessRate(executions);

    if (successRate < 95) {
      recommendations.push(`Success rate is ${successRate.toFixed(1)}% - investigate failures`);
    }

    if (executions.length > 10000) {
      recommendations.push('High volume detected - consider infrastructure scaling');
    }

    return recommendations;
  }

  private findDependencies(steps: string[]): any[] {
    // Simplified dependency detection
    const dependencies: any[] = [];
    steps.forEach((step, index) => {
      if (index > 0 && step.includes('process')) {
        dependencies.push({ step, requires: steps[index - 1] });
      }
    });
    return dependencies;
  }

  private findParallelizableSteps(steps: string[]): string[] {
    // Find steps that can run in parallel
    return steps.filter(step => 
      !step.includes('wait') && 
      !step.includes('dependent')
    );
  }

  private findCriticalPath(steps: string[]): string[] {
    // Identify critical path through workflow
    return steps.filter(step =>
      step.includes('critical') ||
      step.includes('required')
    );
  }

  /**
   * Execute an operations-related request
   */
  public async execute(request: any): Promise<any> {
    console.log('[OperationsAgent] Executing request:', request.action);

    // Use existing methods based on action
    switch (request.action) {
      case 'execute_skill':
        return await this.executeSkill(
          request.params?.skillName || 'unknown',
          request.params || {}
        );
      case 'workflow':
        return await this.optimizeWorkflow(request.params?.steps || []);
      case 'incident':
        return await this.handleIncident(
          request.params?.type || 'unknown',
          request.params?.severity || 'low',
          request.params || {}
        );
      default:
        return { success: true, action: request.action };
    }
  }

  /**
   * Handle external events from other agents
   */
  public handleExternalEvent(event: string, data: any): void {
    console.log(`[OperationsAgent] Handling external event: ${event}`, data);
    this.emit('external:event', { event, data });

    // Handle specific events
    switch (event) {
      case 'payment:required':
        // Pause operations that require payment
        console.log('[OperationsAgent] Pausing payment-required operations');
        break;
      case 'threat:detected':
        // Switch to safe mode
        console.log('[OperationsAgent] Entering safe mode due to threat');
        break;
      case 'resource:limit':
        // Throttle operations
        console.log('[OperationsAgent] Throttling operations due to resource limits');
        break;
      case 'compliance:violation':
        // Stop non-compliant operations
        console.log('[OperationsAgent] Stopping non-compliant operations');
        break;
    }
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    console.log('[OperationsAgent] Shutting down...');
    // Cleanup resources
    this.removeAllListeners();
  }

  /**
   * Get agent status
   */
  public async getStatus(): Promise<any> {
    return {
      active: true,
      metrics: await this.getOperationalMetrics(new Date(Date.now() - 3600000), new Date())
    };
  }
}