/**
 * Skills Executor
 * Handles skill execution with safety features
 */

import { BaseSkill } from './skills/BaseSkill';
import { SkillRegistry } from './registry';
import { SkillResult, SkillParams } from './types';

export interface ExecutionOptions {
  timeout?: number;
  userId?: string;
  metadata?: any;
}

export class SkillExecutor {
  private registry: SkillRegistry;
  private executionCount: Map<string, number> = new Map();
  
  constructor(registry?: SkillRegistry) {
    this.registry = registry || SkillRegistry.getInstance();
  }
  
  /**
   * Execute a skill by ID
   */
  async execute(
    skillId: string,
    params: SkillParams,
    options: ExecutionOptions = {}
  ): Promise<SkillResult> {
    const startTime = Date.now();
    
    try {
      // Get the skill from registry
      const skill = this.registry.getSkill(skillId);
      if (!skill) {
        return {
          success: false,
          error: `Skill '${skillId}' not found`,
          metadata: {
            skillId,
            skillName: 'Unknown',
            timestamp: new Date()
          }
        };
      }
      
      // Validate parameters
      if (!skill.validate(params)) {
        return {
          success: false,
          error: 'Invalid parameters provided',
          metadata: {
            skillId: skill.metadata.id,
            skillName: skill.metadata.name,
            timestamp: new Date(),
            params
          }
        };
      }
      
      // Execute with timeout
      const timeout = options.timeout || 30000; // Default 30 seconds
      const executionPromise = skill.execute(params);
      const timeoutPromise = new Promise<SkillResult>((_, reject) => {
        setTimeout(() => reject(new Error('Skill execution timeout')), timeout);
      });
      
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      // Add execution time
      result.executionTime = Date.now() - startTime;
      
      // Track execution count
      this.incrementExecutionCount(skillId);
      
      // Log successful execution
      console.log(`Skill '${skill.metadata.name}' executed successfully in ${result.executionTime}ms`);
      
      return result;
      
    } catch (error: any) {
      console.error(`Skill execution error: ${error.message}`);
      
      return {
        success: false,
        error: error.message || 'Skill execution failed',
        executionTime: Date.now() - startTime,
        metadata: {
          skillId,
          skillName: this.registry.getSkill(skillId)?.metadata.name || 'Unknown',
          timestamp: new Date(),
          errorDetails: error.stack
        }
      };
    }
  }
  
  /**
   * Execute multiple skills in parallel
   */
  async executeMultiple(
    executions: Array<{ skillId: string; params: SkillParams }>,
    options: ExecutionOptions = {}
  ): Promise<SkillResult[]> {
    const promises = executions.map(({ skillId, params }) =>
      this.execute(skillId, params, options)
    );
    
    return Promise.all(promises);
  }
  
  /**
   * Execute skills in sequence
   */
  async executeSequence(
    executions: Array<{ skillId: string; params: SkillParams }>,
    options: ExecutionOptions = {}
  ): Promise<SkillResult[]> {
    const results: SkillResult[] = [];
    
    for (const { skillId, params } of executions) {
      const result = await this.execute(skillId, params, options);
      results.push(result);
      
      // Stop on error if specified
      if (!result.success && options.metadata?.stopOnError) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Get execution statistics
   */
  getExecutionStats(): { [skillId: string]: number } {
    const stats: { [skillId: string]: number } = {};
    this.executionCount.forEach((count, skillId) => {
      stats[skillId] = count;
    });
    return stats;
  }
  
  /**
   * Reset execution statistics
   */
  resetStats(): void {
    this.executionCount.clear();
  }
  
  private incrementExecutionCount(skillId: string): void {
    const current = this.executionCount.get(skillId) || 0;
    this.executionCount.set(skillId, current + 1);
  }
}