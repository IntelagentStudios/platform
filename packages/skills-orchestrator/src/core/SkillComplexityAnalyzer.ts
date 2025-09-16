/**
 * Skill Complexity Analyzer
 * Prevents AI decision fatigue by analyzing and limiting skill complexity
 */

import { BaseSkill } from '../skills/BaseSkill';
import { SkillParams, SkillResult } from '../types';

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  dependencies: string[];
  asyncOperations: number;
  externalCalls: number;
  estimatedExecutionTime: number;
  recommendation: 'simple' | 'moderate' | 'complex' | 'refactor';
  suggestions: string[];
}

export class SkillComplexityAnalyzer {
  private static instance: SkillComplexityAnalyzer;

  // Thresholds for complexity
  private readonly THRESHOLDS = {
    MAX_CYCLOMATIC: 10,
    MAX_COGNITIVE: 15,
    MAX_DEPENDENCIES: 5,
    MAX_ASYNC_OPS: 3,
    MAX_EXTERNAL_CALLS: 2,
    MAX_EXECUTION_TIME: 5000 // 5 seconds
  };

  private constructor() {}

  static getInstance(): SkillComplexityAnalyzer {
    if (!this.instance) {
      this.instance = new SkillComplexityAnalyzer();
    }
    return this.instance;
  }

  /**
   * Analyze a skill's complexity before execution
   */
  async analyzeSkill(skill: BaseSkill, params: SkillParams): Promise<ComplexityMetrics> {
    const metrics: ComplexityMetrics = {
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      dependencies: [],
      asyncOperations: 0,
      externalCalls: 0,
      estimatedExecutionTime: 0,
      recommendation: 'simple',
      suggestions: []
    };

    // Analyze the skill's source code (simplified version)
    const skillName = skill.metadata.name;
    const skillCategory = skill.metadata.category;

    // Check params complexity
    const paramKeys = Object.keys(params);
    metrics.cognitiveComplexity = paramKeys.length;

    // Check for nested operations
    if (params._context) {
      metrics.dependencies.push('context');
      metrics.cognitiveComplexity += 2;
    }

    // Check for external service indicators
    if (skillName.includes('Email') || skillName.includes('API')) {
      metrics.externalCalls++;
      metrics.estimatedExecutionTime += 2000;
    }

    if (skillName.includes('Database') || skillName.includes('Query')) {
      metrics.externalCalls++;
      metrics.estimatedExecutionTime += 1000;
    }

    if (skillName.includes('AI') || skillName.includes('ML')) {
      metrics.asyncOperations++;
      metrics.estimatedExecutionTime += 3000;
    }

    // Calculate cyclomatic complexity based on skill characteristics
    if (params.action) {
      // Multiple actions increase complexity
      metrics.cyclomaticComplexity += 3;
    }

    if (params.conditions || params.filters) {
      metrics.cyclomaticComplexity += 2;
    }

    if (params.batch || params.bulk) {
      metrics.cyclomaticComplexity += 4;
      metrics.cognitiveComplexity += 3;
    }

    // Determine recommendation
    metrics.recommendation = this.getRecommendation(metrics);

    // Generate suggestions
    metrics.suggestions = this.generateSuggestions(metrics, skillName);

    return metrics;
  }

  /**
   * Break down complex skill into subtasks
   */
  async decomposeComplexSkill(
    skill: BaseSkill,
    params: SkillParams
  ): Promise<Array<{ skill: string; params: SkillParams }>> {
    const subtasks: Array<{ skill: string; params: SkillParams }> = [];
    const metrics = await this.analyzeSkill(skill, params);

    if (metrics.recommendation === 'refactor') {
      // Break down into smaller operations
      if (params.batch && Array.isArray(params.data)) {
        // Split batch operations
        const batchSize = 10;
        const batches = this.chunkArray(params.data, batchSize);

        batches.forEach((batch, index) => {
          subtasks.push({
            skill: skill.metadata.id,
            params: {
              ...params,
              data: batch,
              batch: false,
              _batchIndex: index,
              _totalBatches: batches.length
            }
          });
        });
      } else if (params.action && typeof params.action === 'string') {
        // Split multi-action operations
        const actions = params.action.split(',').map(a => a.trim());

        actions.forEach(action => {
          subtasks.push({
            skill: skill.metadata.id,
            params: {
              ...params,
              action,
              _isSubtask: true
            }
          });
        });
      } else {
        // Default: just add the original task
        subtasks.push({
          skill: skill.metadata.id,
          params
        });
      }
    } else {
      // Simple enough to execute as-is
      subtasks.push({
        skill: skill.metadata.id,
        params
      });
    }

    return subtasks;
  }

  /**
   * Monitor skill execution and provide feedback
   */
  async monitorExecution(
    skill: BaseSkill,
    startTime: number,
    endTime: number,
    result: SkillResult
  ): Promise<void> {
    const executionTime = endTime - startTime;
    const skillId = skill.metadata.id;

    // Log performance metrics
    if (executionTime > this.THRESHOLDS.MAX_EXECUTION_TIME) {
      console.warn(`[SkillComplexityAnalyzer] Skill ${skillId} took ${executionTime}ms (threshold: ${this.THRESHOLDS.MAX_EXECUTION_TIME}ms)`);
    }

    // Check for error patterns that indicate complexity issues
    if (!result.success && result.error) {
      if (result.error.includes('timeout') || result.error.includes('Too many')) {
        console.warn(`[SkillComplexityAnalyzer] Skill ${skillId} may be too complex: ${result.error}`);
      }
    }
  }

  /**
   * Get recommendation based on metrics
   */
  private getRecommendation(metrics: ComplexityMetrics): ComplexityMetrics['recommendation'] {
    let score = 0;

    if (metrics.cyclomaticComplexity > this.THRESHOLDS.MAX_CYCLOMATIC) score += 2;
    if (metrics.cognitiveComplexity > this.THRESHOLDS.MAX_COGNITIVE) score += 2;
    if (metrics.dependencies.length > this.THRESHOLDS.MAX_DEPENDENCIES) score += 1;
    if (metrics.asyncOperations > this.THRESHOLDS.MAX_ASYNC_OPS) score += 2;
    if (metrics.externalCalls > this.THRESHOLDS.MAX_EXTERNAL_CALLS) score += 1;
    if (metrics.estimatedExecutionTime > this.THRESHOLDS.MAX_EXECUTION_TIME) score += 1;

    if (score >= 6) return 'refactor';
    if (score >= 4) return 'complex';
    if (score >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(metrics: ComplexityMetrics, skillName: string): string[] {
    const suggestions: string[] = [];

    if (metrics.cyclomaticComplexity > this.THRESHOLDS.MAX_CYCLOMATIC) {
      suggestions.push('Consider breaking down conditional logic into separate methods');
    }

    if (metrics.cognitiveComplexity > this.THRESHOLDS.MAX_COGNITIVE) {
      suggestions.push('Simplify nested structures and reduce parameter count');
    }

    if (metrics.asyncOperations > this.THRESHOLDS.MAX_ASYNC_OPS) {
      suggestions.push('Use Promise.all() for parallel operations or queue sequential ones');
    }

    if (metrics.externalCalls > this.THRESHOLDS.MAX_EXTERNAL_CALLS) {
      suggestions.push('Cache external call results or batch API requests');
    }

    if (metrics.estimatedExecutionTime > this.THRESHOLDS.MAX_EXECUTION_TIME) {
      suggestions.push('Implement pagination or streaming for large data sets');
    }

    if (metrics.recommendation === 'refactor') {
      suggestions.push(`Split ${skillName} into multiple specialized skills`);
    }

    return suggestions;
  }

  /**
   * Utility function to chunk arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Validate skill configuration
   */
  validateSkillConfiguration(skill: BaseSkill): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check metadata
    if (!skill.metadata.id) errors.push('Skill missing required metadata.id');
    if (!skill.metadata.name) errors.push('Skill missing required metadata.name');
    if (!skill.metadata.category) errors.push('Skill missing required metadata.category');
    if (!skill.metadata.version) errors.push('Skill missing required metadata.version');

    // Check methods
    if (!skill.validate) errors.push('Skill missing required validate method');
    if (!(skill as any).executeImpl) errors.push('Skill missing required executeImpl method');

    // Check naming conventions
    if (skill.metadata.id && !skill.metadata.id.match(/^[a-z_]+$/)) {
      errors.push('Skill ID should be lowercase with underscores only');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const complexityAnalyzer = SkillComplexityAnalyzer.getInstance();