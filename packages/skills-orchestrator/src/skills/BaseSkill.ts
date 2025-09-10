/**
 * Base class for all skills
 * All skills must extend this class
 */

import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export abstract class BaseSkill {
  abstract metadata: SkillMetadata;
  private executionId?: string;
  
  /**
   * Execute the skill with given parameters
   * This is the method that subclasses implement
   */
  protected abstract executeImpl(params: SkillParams): Promise<SkillResult>;
  
  /**
   * Public execute method that wraps execution with logging
   */
  async execute(params: SkillParams): Promise<SkillResult> {
    const startTime = new Date();
    this.executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log execution start (commented out - skill_executions table fields don't exist)
    // try {
    //   await prisma.skill_executions.create({
    //     data: {
    //       id: this.executionId,
    //       skill_id: this.metadata.id,
    //       license_key: params.licenseKey || 'ANONYMOUS',
    //       user_id: params.userId,
    //       tenant_id: params.tenantId,
    //       status: 'running',
    //       input_params: params as any,
    //       started_at: startTime
    //     }
    //   });
    // } catch (error) {
    //   console.error('Failed to log skill execution start:', error);
    // }
    
    try {
      // Execute the actual skill logic
      const result = await this.executeImpl(params);
      
      // Log successful execution (commented out - skill_executions table fields don't exist)
      // const endTime = new Date();
      // const executionTime = endTime.getTime() - startTime.getTime();
      
      // try {
      //   await prisma.skill_executions.update({
      //     where: { id: this.executionId },
      //     data: {
      //       status: 'completed',
      //       output_result: result as any,
      //       completed_at: endTime,
      //       execution_time_ms: executionTime
      //     }
      //   });
      // } catch (error) {
      //   console.error('Failed to log skill execution completion:', error);
      // }
      
      return result;
    } catch (error: any) {
      // Log failed execution (commented out - skill_executions table fields don't exist)
      // const endTime = new Date();
      // const executionTime = endTime.getTime() - startTime.getTime();
      
      // try {
      //   await prisma.skill_executions.update({
      //     where: { id: this.executionId },
      //     data: {
      //       status: 'failed',
      //       error_message: error.message || 'Unknown error',
      //       completed_at: endTime,
      //       execution_time_ms: executionTime
      //     }
      //   });
      // } catch (logError) {
      //   console.error('Failed to log skill execution failure:', logError);
      // }
      
      throw error;
    }
  }
  
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