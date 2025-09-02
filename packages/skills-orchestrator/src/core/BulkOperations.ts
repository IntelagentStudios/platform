/**
 * Bulk Operations Manager
 * Executes the same skill with multiple inputs efficiently
 * No third-party services - pure implementation
 */

import { EventEmitter } from 'events';
import { QueueOrchestrator } from './QueueOrchestrator';
import { SkillExecutor } from './SkillExecutor';

export interface BulkOperationConfig {
  licenseKey: string;
  skillId: string;
  inputs: any[];
  options?: {
    batchSize?: number;
    parallelism?: number;
    stopOnError?: boolean;
    timeout?: number;
    retryCount?: number;
  };
}

export interface BulkOperationResult {
  operationId: string;
  licenseKey: string;
  skillId: string;
  totalItems: number;
  successful: number;
  failed: number;
  results: Array<{
    index: number;
    input: any;
    output?: any;
    error?: string;
    duration?: number;
    status: 'success' | 'failed' | 'skipped';
  }>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class BulkOperations extends EventEmitter {
  private static instance: BulkOperations;
  private operations = new Map<string, BulkOperationResult>();
  private activeOperations = new Set<string>();
  
  private constructor(
    private queueOrchestrator: QueueOrchestrator,
    private skillExecutor: SkillExecutor
  ) {
    super();
  }
  
  public static getInstance(
    queueOrchestrator: QueueOrchestrator,
    skillExecutor: SkillExecutor
  ): BulkOperations {
    if (!BulkOperations.instance) {
      BulkOperations.instance = new BulkOperations(queueOrchestrator, skillExecutor);
    }
    return BulkOperations.instance;
  }
  
  /**
   * Execute a bulk operation
   */
  public async executeBulk(config: BulkOperationConfig): Promise<BulkOperationResult> {
    const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const result: BulkOperationResult = {
      operationId,
      licenseKey: config.licenseKey,
      skillId: config.skillId,
      totalItems: config.inputs.length,
      successful: 0,
      failed: 0,
      results: [],
      startTime: new Date()
    };
    
    this.operations.set(operationId, result);
    this.activeOperations.add(operationId);
    
    const batchSize = config.options?.batchSize || 10;
    const parallelism = config.options?.parallelism || 5;
    const stopOnError = config.options?.stopOnError || false;
    
    console.log(`[BulkOperations] Starting bulk operation ${operationId} for ${config.inputs.length} items`);
    
    try {
      // Process in batches
      for (let i = 0; i < config.inputs.length; i += batchSize) {
        const batch = config.inputs.slice(i, Math.min(i + batchSize, config.inputs.length));
        
        // Process batch in parallel
        const batchPromises = batch.map(async (input, batchIndex) => {
          const index = i + batchIndex;
          
          try {
            const startTime = Date.now();
            
            // Execute skill
            const output = await this.executeWithRetry(
              config.licenseKey,
              config.skillId,
              input,
              config.options?.retryCount || 2
            );
            
            const duration = Date.now() - startTime;
            
            result.results[index] = {
              index,
              input,
              output,
              duration,
              status: 'success'
            };
            
            result.successful++;
            
            this.emit('bulk:item:success', {
              operationId,
              index,
              output,
              duration
            });
            
          } catch (error: any) {
            result.results[index] = {
              index,
              input,
              error: error.message,
              status: 'failed'
            };
            
            result.failed++;
            
            this.emit('bulk:item:failed', {
              operationId,
              index,
              error: error.message
            });
            
            if (stopOnError) {
              throw new Error(`Operation stopped at index ${index}: ${error.message}`);
            }
          }
        });
        
        // Wait for batch with parallelism control
        await this.executeWithParallelism(batchPromises, parallelism);
        
        // Emit progress
        this.emit('bulk:progress', {
          operationId,
          processed: result.successful + result.failed,
          total: config.inputs.length,
          percentage: Math.round(((result.successful + result.failed) / config.inputs.length) * 100)
        });
      }
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      console.log(`[BulkOperations] Completed bulk operation ${operationId}: ${result.successful} successful, ${result.failed} failed`);
      
      this.emit('bulk:completed', result);
      
    } catch (error: any) {
      console.error(`[BulkOperations] Bulk operation ${operationId} failed:`, error.message);
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      this.emit('bulk:failed', {
        operationId,
        error: error.message,
        result
      });
      
    } finally {
      this.activeOperations.delete(operationId);
    }
    
    return result;
  }
  
  /**
   * Execute with retry logic
   */
  private async executeWithRetry(
    licenseKey: string,
    skillId: string,
    input: any,
    retryCount: number
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const taskId = await this.queueOrchestrator.queueTask(
          licenseKey,
          skillId,
          input,
          { priority: 'NORMAL' }
        );
        
        // Wait for completion
        return await this.waitForTask(taskId);
        
      } catch (error: any) {
        lastError = error;
        
        if (attempt < retryCount) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Execution failed');
  }
  
  /**
   * Wait for a task to complete
   */
  private waitForTask(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task timeout'));
      }, 30000); // 30 second timeout
      
      const checkInterval = setInterval(async () => {
        const status = await this.queueOrchestrator.getTaskStatus(taskId);
        
        if (status?.status === 'completed') {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(status.result);
        } else if (status?.status === 'failed') {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          reject(new Error(status.error || 'Task failed'));
        }
      }, 500);
    });
  }
  
  /**
   * Execute promises with parallelism control
   */
  private async executeWithParallelism<T>(
    promises: Promise<T>[],
    parallelism: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const promise of promises) {
      const p = promise.then(result => {
        results.push(result);
      }).then(() => {
        executing.splice(executing.indexOf(p), 1);
      });
      
      executing.push(p);
      
      if (executing.length >= parallelism) {
        await Promise.race(executing);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
  
  /**
   * Get operation status
   */
  public getOperationStatus(operationId: string): BulkOperationResult | undefined {
    return this.operations.get(operationId);
  }
  
  /**
   * Cancel an active operation
   */
  public cancelOperation(operationId: string): boolean {
    if (this.activeOperations.has(operationId)) {
      this.activeOperations.delete(operationId);
      
      const result = this.operations.get(operationId);
      if (result) {
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - result.startTime.getTime();
        
        // Mark remaining items as skipped
        for (let i = result.results.length; i < result.totalItems; i++) {
          result.results[i] = {
            index: i,
            input: null,
            status: 'skipped'
          };
        }
      }
      
      this.emit('bulk:cancelled', { operationId });
      return true;
    }
    return false;
  }
  
  /**
   * Get all operations for a license key
   */
  public getLicenseOperations(licenseKey: string): BulkOperationResult[] {
    return Array.from(this.operations.values())
      .filter(op => op.licenseKey === licenseKey);
  }
  
  /**
   * Clean up old operations
   */
  public cleanupOldOperations(olderThanDays = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    for (const [id, operation] of this.operations.entries()) {
      if (operation.endTime && operation.endTime < cutoffDate) {
        this.operations.delete(id);
      }
    }
  }
}