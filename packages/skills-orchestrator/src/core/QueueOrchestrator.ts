/**
 * Queue Orchestrator
 * Manages skill execution through our custom queue system
 * Handles license key tagging and workflow tracking
 */

import { EventEmitter } from 'events';
import { QueueManager, QueueSystem, Job, JobStatus, JobPriority } from './QueueSystem';
import { SkillExecutionEngine } from './SkillExecutionEngine';
import { SkillsRegistry } from '../skills/registry';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowContext {
  licenseKey: string;
  taskId: string;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface SkillExecution {
  skillName: string;
  params: any;
  context: WorkflowContext;
  priority?: JobPriority;
  delay?: number;
  dependencies?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: SkillExecution[];
  context: WorkflowContext;
  parallel?: boolean;
}

export interface WorkflowResult {
  workflowId: string;
  taskId: string;
  licenseKey: string;
  status: 'completed' | 'failed' | 'partial';
  results: Map<string, any>;
  errors?: Map<string, string>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface QueuedTask {
  taskId: string;
  licenseKey: string;
  skillId: string;
  params: any;
  priority?: number;
  retryCount?: number;
  parentTaskId?: string;
  metadata?: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  licenseKey: string;
  skillId: string;
  status: 'completed' | 'failed' | 'pending' | 'active';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  executionTime?: number;
  retryCount?: number;
}

export interface WorkflowExecution {
  workflowId: string;
  licenseKey: string;
  tasks: QueuedTask[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Map<string, TaskResult>;
  startTime: Date;
  endTime?: Date;
}

export class QueueOrchestrator extends EventEmitter {
  private static instance: QueueOrchestrator;
  
  private queueManager: QueueManager;
  private skillQueue: QueueSystem;
  private workflowQueue: QueueSystem;
  private executionEngine: SkillExecutionEngine;
  private registry: SkillsRegistry;
  
  // Tracking
  private activeWorkflows = new Map<string, WorkflowExecution>();
  private workflowResults = new Map<string, Map<string, any>>();
  private licenseKeyWorkflows = new Map<string, Set<string>>();
  private taskIdWorkflows = new Map<string, string>();
  
  // Monitoring
  private executionHistory: any[] = [];
  private metricsInterval?: NodeJS.Timeout;
  
  // Configuration
  private readonly CONCURRENCY = 10;
  private readonly MAX_RETRIES = 3;
  
  private constructor() {
    super();
    
    this.queueManager = QueueManager.getInstance();
    this.executionEngine = SkillExecutionEngine.getInstance();
    this.registry = SkillsRegistry.getInstance();
    
    // Create queues with persistence
    this.skillQueue = this.queueManager.createQueue('skills', {
      persistencePath: './queue-data'
    });
    
    this.workflowQueue = this.queueManager.createQueue('workflows', {
      persistencePath: './queue-data'
    });
    
    this.setupProcessors();
    this.startMonitoring();
    
    console.log('[QueueOrchestrator] Initialized with custom queue system');
  }
  
  public static getInstance(): QueueOrchestrator {
    if (!QueueOrchestrator.instance) {
      QueueOrchestrator.instance = new QueueOrchestrator();
    }
    return QueueOrchestrator.instance;
  }
  
  /**
   * Setup queue processors
   */
  private setupProcessors(): void {
    // Process individual skills with concurrency
    this.skillQueue.process('skill', this.CONCURRENCY, async (job: Job<QueuedTask>) => {
      return await this.processSkill(job);
    });
    
    // Process workflows
    this.workflowQueue.process('workflow', 5, async (job: Job<WorkflowDefinition>) => {
      return await this.processWorkflow(job);
    });
  }
  
  /**
   * Process a skill execution job
   */
  private async processSkill(job: Job<QueuedTask>): Promise<TaskResult> {
    const { taskId, licenseKey, skillId, params, metadata } = job.data;
    const startTime = new Date();
    
    console.log(`[QueueOrchestrator] Processing task ${taskId} for license ${licenseKey}`);
    
    try {
      // Load skill from registry
      const skill = await this.registry.loadSkill(skillId);
      if (!skill) {
        throw new Error(`Skill ${skillId} not found or could not be loaded`);
      }
      
      // Execute skill with license context
      const enrichedParams = {
        ...params,
        _context: {
          licenseKey,
          taskId,
          metadata
        }
      };
      
      const result = await skill.execute(enrichedParams);
      
      // Check for skill failure and implement failover
      if (!result.success && job.attempts < this.MAX_RETRIES) {
        // Try alternative skills if available
        const alternativeSkill = await this.findAlternativeSkill(skillId);
        if (alternativeSkill) {
          console.log(`[QueueOrchestrator] Trying alternative skill ${alternativeSkill} for failed ${skillId}`);
          const altSkill = await this.registry.loadSkill(alternativeSkill);
          if (altSkill) {
            const altResult = await altSkill.execute(enrichedParams);
            if (altResult?.success) {
              result.success = true;
              result.data = { ...altResult.data, usedAlternative: alternativeSkill };
            }
          }
        }
      }
      
      const endTime = new Date();
      const taskResult: TaskResult = {
        taskId,
        licenseKey,
        skillId,
        status: result.success ? 'completed' : 'failed',
        result,
        startTime,
        endTime,
        executionTime: endTime.getTime() - startTime.getTime(),
        retryCount: job.attempts
      };
      
      // Track execution
      this.trackExecution({
        ...taskResult,
        timestamp: new Date()
      });
      
      // Update workflow if part of one
      this.updateTaskStatus(taskId, taskResult.status, result, undefined);
      
      this.emit('task:completed', taskResult);
      
      return taskResult;
      
    } catch (error: any) {
      const endTime = new Date();
      
      console.error(`[QueueOrchestrator] Task ${taskId} failed:`, error);
      
      const taskResult: TaskResult = {
        taskId,
        licenseKey,
        skillId,
        status: 'failed',
        error: error.message,
        startTime,
        endTime,
        executionTime: endTime.getTime() - startTime.getTime(),
        retryCount: job.attempts
      };
      
      // Track failure
      this.trackExecution({
        ...taskResult,
        timestamp: new Date()
      });
      
      // Update workflow if part of one
      this.updateTaskStatus(taskId, 'failed', undefined, error.message);
      
      this.emit('task:failed', taskResult);
      
      throw error;
    }
  }
  
  /**
   * Process a workflow
   */
  private async processWorkflow(job: Job<WorkflowDefinition>): Promise<WorkflowResult> {
    const workflow = job.data;
    
    console.log(`[QueueOrchestrator] Processing workflow: ${workflow.name} | License: ${workflow.context.licenseKey}`);
    
    this.activeWorkflows.set(workflow.id, {
      workflowId: workflow.id,
      licenseKey: workflow.context.licenseKey,
      tasks: [],
      status: 'running',
      results: new Map(),
      startTime: new Date()
    });
    
    this.trackLicenseKeyWorkflow(workflow.context.licenseKey, workflow.id);
    this.taskIdWorkflows.set(workflow.context.taskId, workflow.id);
    
    const startTime = new Date();
    const results = new Map<string, any>();
    const errors = new Map<string, string>();
    
    try {
      if (workflow.parallel) {
        // Execute all steps in parallel
        const promises = workflow.steps.map(step => 
          this.queueSkill(
            workflow.context.licenseKey,
            step.skillName,
            step.params,
            {
              priority: step.priority,
              delay: step.delay,
              parentTaskId: workflow.id,
              metadata: { ...step.context.metadata, workflowId: workflow.id }
            }
          )
        );
        
        const taskIds = await Promise.all(promises);
        
        // Wait for all tasks to complete
        const taskResults = await Promise.allSettled(
          taskIds.map(taskId => this.waitForTask(taskId))
        );
        
        taskResults.forEach((result, index) => {
          const step = workflow.steps[index];
          if (result.status === 'fulfilled' && result.value) {
            results.set(step.skillName, result.value.result);
          } else {
            errors.set(step.skillName, 
              result.status === 'rejected' ? result.reason?.message : 'Task failed');
          }
        });
        
      } else {
        // Execute steps sequentially
        for (const step of workflow.steps) {
          try {
            const taskId = await this.queueSkill(
              workflow.context.licenseKey,
              step.skillName,
              step.params,
              {
                priority: step.priority,
                delay: step.delay,
                parentTaskId: workflow.id,
                metadata: { ...step.context.metadata, workflowId: workflow.id }
              }
            );
            
            const taskResult = await this.waitForTask(taskId);
            if (taskResult) {
              results.set(step.skillName, taskResult.result);
            }
          } catch (error: any) {
            errors.set(step.skillName, error.message);
            
            // Continue or stop based on configuration
            if (!workflow.context.metadata?.continueOnError) {
              break;
            }
          }
        }
      }
      
      const endTime = new Date();
      const workflowResult: WorkflowResult = {
        workflowId: workflow.id,
        taskId: workflow.context.taskId,
        licenseKey: workflow.context.licenseKey,
        status: errors.size === 0 ? 'completed' : (results.size > 0 ? 'partial' : 'failed'),
        results,
        errors: errors.size > 0 ? errors : undefined,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime()
      };
      
      const workflowExec = this.activeWorkflows.get(workflow.id);
      if (workflowExec) {
        workflowExec.status = workflowResult.status === 'completed' ? 'completed' : 'failed';
        workflowExec.endTime = endTime;
      }
      
      this.emit('workflow:completed', workflowResult);
      
      return workflowResult;
      
    } finally {
      this.activeWorkflows.delete(workflow.id);
      this.workflowResults.delete(workflow.id);
    }
  }
  
  /**
   * Queue a single skill for execution
   */
  public async queueSkill(
    licenseKey: string,
    skillId: string,
    params: any,
    options?: {
      priority?: number;
      delay?: number;
      parentTaskId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const taskId = `task_${licenseKey}_${uuidv4()}`;
    
    const task: QueuedTask = {
      taskId,
      licenseKey,
      skillId,
      params,
      priority: options?.priority,
      parentTaskId: options?.parentTaskId,
      metadata: options?.metadata
    };
    
    const job = await this.skillQueue.add('skill', task, {
      priority: options?.priority as JobPriority,
      delay: options?.delay,
      licenseKey,
      taskId,
      userId: params.userId || 'system'
    });
    
    console.log(`[QueueOrchestrator] Queued task ${taskId} (Job ID: ${job.id})`);
    
    return taskId;
  }
  
  /**
   * Queue a workflow of multiple skills
   */
  public async queueWorkflow(
    licenseKey: string,
    workflowDefinition: {
      name: string;
      steps: Array<{
        skillId: string;
        params: any;
        parallel?: boolean;
        dependsOn?: string[];
      }>;
    },
    metadata?: Record<string, any>
  ): Promise<string> {
    const workflowId = `workflow_${licenseKey}_${uuidv4()}`;
    const taskId = `task_${uuidv4()}`;
    
    const workflow: WorkflowDefinition = {
      id: workflowId,
      name: workflowDefinition.name,
      steps: workflowDefinition.steps.map(step => ({
        skillName: step.skillId,
        params: step.params,
        context: {
          licenseKey,
          taskId,
          userId: metadata?.userId || 'system',
          metadata
        }
      })),
      context: {
        licenseKey,
        taskId,
        userId: metadata?.userId || 'system',
        metadata
      },
      parallel: workflowDefinition.steps.some(s => s.parallel)
    };
    
    const job = await this.workflowQueue.add('workflow', workflow, {
      priority: JobPriority.NORMAL,
      licenseKey,
      taskId,
      userId: metadata?.userId || 'system'
    });
    
    console.log(`[QueueOrchestrator] Queued workflow ${workflowId} with ${workflow.steps.length} steps`);
    
    return workflowId;
  }
  
  /**
   * Wait for a task to complete
   */
  private async waitForTask(taskId: string, timeout = 60000): Promise<TaskResult | null> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Check in execution history
        const completed = this.executionHistory.find(
          exec => exec.taskId === taskId && (exec.status === 'completed' || exec.status === 'failed')
        );
        
        if (completed) {
          clearInterval(checkInterval);
          resolve(completed);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
  }
  
  /**
   * Get task status
   */
  public async getTaskStatus(taskId: string): Promise<TaskResult | null> {
    // Check execution history first
    const completed = this.executionHistory.find(exec => exec.taskId === taskId);
    if (completed) {
      return completed;
    }
    
    // Check active jobs
    const jobs = this.skillQueue.getJobs();
    const job = jobs.find(j => j.data?.taskId === taskId);
    
    if (!job) return null;
    
    return {
      taskId: job.data.taskId,
      licenseKey: job.data.licenseKey,
      skillId: job.data.skillId,
      status: this.mapJobStatus(job.status),
      result: job.result,
      error: job.error,
      retryCount: job.attempts
    };
  }
  
  /**
   * Get workflow status
   */
  public getWorkflowStatus(workflowId: string): WorkflowExecution | null {
    return this.activeWorkflows.get(workflowId) || null;
  }
  
  /**
   * Get all tasks for a license key
   */
  public async getTasksForLicense(licenseKey: string): Promise<TaskResult[]> {
    const skillJobs = this.skillQueue.getJobsByLicenseKey(licenseKey);
    
    return skillJobs.map(job => ({
      taskId: job.data?.taskId || job.id,
      licenseKey: job.licenseKey || licenseKey,
      skillId: job.data?.skillId || job.name,
      status: this.mapJobStatus(job.status),
      result: job.result,
      error: job.error,
      retryCount: job.attempts
    }));
  }
  
  /**
   * Cancel a task
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    const jobs = this.skillQueue.getJobs();
    const job = jobs.find(j => j.data?.taskId === taskId);
    
    if (job && (job.status === JobStatus.WAITING || job.status === JobStatus.DELAYED)) {
      // Can't directly remove, but we can mark it
      job.status = JobStatus.FAILED;
      job.error = 'Cancelled by user';
      return true;
    }
    
    return false;
  }
  
  /**
   * Get queue metrics
   */
  public async getQueueMetrics(): Promise<any> {
    const skillMetrics = this.skillQueue.getMetrics();
    const workflowMetrics = this.workflowQueue.getMetrics();
    
    return {
      skills: skillMetrics,
      workflows: workflowMetrics,
      activeWorkflows: this.activeWorkflows.size,
      executionHistory: this.executionHistory.length,
      health: this.getHealth()
    };
  }
  
  /**
   * Get health status
   */
  public getHealth(): {
    overall: string;
    skills: any;
    workflows: any;
  } {
    const skillHealth = this.skillQueue.getHealth();
    const workflowHealth = this.workflowQueue.getHealth();
    
    let overall = 'healthy';
    if (skillHealth.status !== 'healthy' || workflowHealth.status !== 'healthy') {
      overall = 'degraded';
    }
    if (skillHealth.status === 'unhealthy' || workflowHealth.status === 'unhealthy') {
      overall = 'unhealthy';
    }
    
    return {
      overall,
      skills: skillHealth,
      workflows: workflowHealth
    };
  }
  
  /**
   * Find alternative skill for failover
   */
  private async findAlternativeSkill(skillId: string): Promise<string | null> {
    // Map of primary skills to their alternatives
    const alternatives: Record<string, string[]> = {
      'email_sender': ['smtp_sender', 'sendgrid_sender'],
      'pdf_generator': ['pdf_creator', 'document_generator'],
      'web_scraper': ['html_parser', 'content_extractor']
    };
    
    const alts = alternatives[skillId];
    if (alts && alts.length > 0) {
      // Return first available alternative
      for (const alt of alts) {
        if (this.registry.isSkillEnabled(alt)) {
          return alt;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Update task status in workflow
   */
  private updateTaskStatus(
    taskId: string,
    status: 'completed' | 'failed' | 'active',
    result?: any,
    error?: string
  ): void {
    // Update workflow status if this task is part of a workflow
    this.activeWorkflows.forEach((workflow) => {
      const task = workflow.tasks.find(t => t.taskId === taskId);
      if (task) {
        const taskResult: TaskResult = {
          taskId: task.taskId,
          licenseKey: task.licenseKey,
          skillId: task.skillId,
          status: status as any,
          result,
          error
        };
        
        workflow.results.set(task.taskId, taskResult);
        
        // Check if workflow is complete
        if (workflow.results.size === workflow.tasks.length) {
          const allCompleted = Array.from(workflow.results.values())
            .every(r => r.status === 'completed' || r.status === 'failed');
          
          if (allCompleted) {
            workflow.status = 'completed';
            workflow.endTime = new Date();
            this.emit('workflow:completed', workflow);
          }
        }
      }
    });
  }
  
  /**
   * Map job status to our status
   */
  private mapJobStatus(status: JobStatus): 'completed' | 'failed' | 'pending' | 'active' {
    switch (status) {
      case JobStatus.COMPLETED: return 'completed';
      case JobStatus.FAILED: return 'failed';
      case JobStatus.ACTIVE: return 'active';
      default: return 'pending';
    }
  }
  
  /**
   * Track license key workflow
   */
  private trackLicenseKeyWorkflow(licenseKey: string, workflowId: string): void {
    const workflows = this.licenseKeyWorkflows.get(licenseKey) || new Set();
    workflows.add(workflowId);
    this.licenseKeyWorkflows.set(licenseKey, workflows);
  }
  
  /**
   * Track execution history
   */
  private trackExecution(execution: any): void {
    this.executionHistory.push(execution);
    
    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
    
    // Emit for real-time monitoring
    this.emit('execution:tracked', execution);
  }
  
  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.getQueueMetrics();
      const health = this.getHealth();
      
      this.emit('metrics:updated', { metrics, health });
      
      // Log if unhealthy
      if (health.overall !== 'healthy') {
        console.warn('[QueueOrchestrator] System health degraded:', health);
      }
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('[QueueOrchestrator] Shutting down...');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    await this.queueManager.closeAll();
    
    console.log('[QueueOrchestrator] Shutdown complete');
  }
}