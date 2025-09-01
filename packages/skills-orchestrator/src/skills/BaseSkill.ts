/**
 * Base class for all skills
 * All skills must extend this class
 */

import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../types';

export abstract class BaseSkill {
  abstract metadata: SkillMetadata;
  
  /**
   * Execute the skill with given parameters
   */
  abstract execute(params: SkillParams): Promise<SkillResult>;
  
  /**
   * Validate parameters before execution
   */
  abstract validate(params: SkillParams): boolean;
  
  /**
   * Get skill configuration
   */
  getConfig(): any {
    return {};
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
}