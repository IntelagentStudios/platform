/**
 * Orchestrator Agent
 * Central controller for all skill execution and management
 * This is the ONLY interface between skills and the rest of the system
 */

import { SkillsRegistry } from '../skills/registry';
import { BaseSkill } from '../skills/BaseSkill';
import { SkillResult, SkillParams } from '../types';
import { SkillConfigManager } from '../config/SkillConfig';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface OrchestrationRequest {
  skillId?: string;
  workflow?: WorkflowDefinition;
  params: any;
  context: {
    userId: string;
    licenseKey: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  skillId: string;
  params?: any;
  condition?: string;
  onSuccess?: string;
  onFailure?: string;
  parallel?: boolean;
}

export interface OrchestrationResult {
  requestId: string;
  success: boolean;
  results: SkillResult[];
  workflow?: WorkflowExecutionResult;
  error?: string;
  executionTime: number;
  metadata: Record<string, any>;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  steps: Array<{
    stepId: string;
    skillId: string;
    result: SkillResult;
    executionTime: number;
  }>;
  totalTime: number;
}

export class OrchestratorAgent extends EventEmitter {
  private static instance: OrchestratorAgent;
  private registry: SkillsRegistry;
  private configManager: SkillConfigManager;
  private activeRequests: Map<string, OrchestrationRequest> = new Map();
  private executionQueue: Map<string, Promise<any>> = new Map();

  private constructor() {
    super();
    this.registry = SkillsRegistry.getInstance();
    this.configManager = SkillConfigManager.getInstance();
    this.initialize();
  }

  public static getInstance(): OrchestratorAgent {
    if (!OrchestratorAgent.instance) {
      OrchestratorAgent.instance = new OrchestratorAgent();
    }
    return OrchestratorAgent.instance;
  }

  private initialize(): void {
    console.log('[OrchestratorAgent] Initializing...');
    
    // Set up event listeners
    this.on('skill:start', (data) => this.logExecution('start', data));
    this.on('skill:complete', (data) => this.logExecution('complete', data));
    this.on('skill:error', (data) => this.logExecution('error', data));
    
    console.log('[OrchestratorAgent] Ready');
  }

  /**
   * Main entry point - Execute a skill or workflow
   * This is the ONLY method external systems should call
   */
  public async execute(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Validate license
      await this.validateLicense(request.context.licenseKey);
      
      // Store active request
      this.activeRequests.set(requestId, request);
      
      // Load user-specific configurations
      await this.configManager.loadUserConfig(request.context.licenseKey);
      
      let result: OrchestrationResult;
      
      if (request.workflow) {
        // Execute workflow
        result = await this.executeWorkflow(requestId, request.workflow, request);
      } else if (request.skillId) {
        // Execute single skill
        result = await this.executeSingleSkill(requestId, request.skillId, request);
      } else {
        throw new Error('Either skillId or workflow must be specified');
      }
      
      // Clean up
      this.activeRequests.delete(requestId);
      
      return result;
      
    } catch (error: any) {
      this.activeRequests.delete(requestId);
      
      return {
        requestId,
        success: false,
        results: [],
        error: error.message,
        executionTime: Date.now() - startTime,
        metadata: {
          context: request.context,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Execute a single skill
   */
  private async executeSingleSkill(
    requestId: string,
    skillId: string,
    request: OrchestrationRequest
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    
    this.emit('skill:start', {
      requestId,
      skillId,
      context: request.context
    });
    
    try {
      // Check if skill exists and is enabled
      const skillInstance = this.registry.getSkill(skillId);
      if (!skillInstance) {
        throw new Error(`Skill ${skillId} not found`);
      }
      
      if (!this.registry.isSkillEnabled(skillId)) {
        throw new Error(`Skill ${skillId} is disabled`);
      }
      
      // Check if skill can be used (has required config)
      if (!this.configManager.canUseSkill(skillId)) {
        throw new Error(`Skill ${skillId} is not configured`);
      }
      
      // Load skill implementation
      const skill = await this.registry.loadSkill(skillId);
      if (!skill) {
        throw new Error(`Failed to load skill ${skillId}`);
      }
      
      // Execute skill
      const result = await skill.execute(request.params);
      
      // Update stats
      await this.registry.updateSkillStats(skillId, {
        success: result.success,
        duration: Date.now() - startTime
      });
      
      this.emit('skill:complete', {
        requestId,
        skillId,
        result,
        executionTime: Date.now() - startTime
      });
      
      return {
        requestId,
        success: result.success,
        results: [result],
        executionTime: Date.now() - startTime,
        metadata: {
          skillId,
          context: request.context,
          timestamp: new Date()
        }
      };
      
    } catch (error: any) {
      this.emit('skill:error', {
        requestId,
        skillId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Execute a workflow of multiple skills
   */
  private async executeWorkflow(
    requestId: string,
    workflow: WorkflowDefinition,
    request: OrchestrationRequest
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: SkillResult[] = [];
    const stepResults: WorkflowExecutionResult['steps'] = [];
    
    console.log(`[OrchestratorAgent] Executing workflow: ${workflow.name}`);
    
    // Group steps by execution order
    const parallelGroups = this.groupParallelSteps(workflow.steps);
    
    for (const group of parallelGroups) {
      if (group.length === 1) {
        // Execute single step
        const step = group[0];
        const stepResult = await this.executeWorkflowStep(
          step,
          request,
          results
        );
        
        results.push(stepResult.result);
        stepResults.push(stepResult);
        
      } else {
        // Execute parallel steps
        const parallelPromises = group.map(step =>
          this.executeWorkflowStep(step, request, results)
        );
        
        const parallelResults = await Promise.all(parallelPromises);
        
        parallelResults.forEach(stepResult => {
          results.push(stepResult.result);
          stepResults.push(stepResult);
        });
      }
    }
    
    return {
      requestId,
      success: results.every(r => r.success),
      results,
      workflow: {
        workflowId: workflow.id,
        steps: stepResults,
        totalTime: Date.now() - startTime
      },
      executionTime: Date.now() - startTime,
      metadata: {
        workflowName: workflow.name,
        context: request.context,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    request: OrchestrationRequest,
    previousResults: SkillResult[]
  ): Promise<WorkflowExecutionResult['steps'][0]> {
    const stepStartTime = Date.now();
    
    // Prepare params (may include data from previous steps)
    const params = this.prepareStepParams(step, request.params, previousResults);
    
    // Check condition
    if (step.condition && !this.evaluateCondition(step.condition, previousResults)) {
      return {
        stepId: step.id,
        skillId: step.skillId,
        result: {
          success: true,
          data: { skipped: true, reason: 'Condition not met' },
          metadata: { timestamp: new Date() }
        },
        executionTime: 0
      };
    }
    
    // Execute skill
    const skillResult = await this.executeSingleSkill(
      `${request.context.sessionId}-${step.id}`,
      step.skillId,
      { ...request, params, skillId: step.skillId }
    );
    
    return {
      stepId: step.id,
      skillId: step.skillId,
      result: skillResult.results[0],
      executionTime: Date.now() - stepStartTime
    };
  }

  /**
   * Group workflow steps for parallel execution
   */
  private groupParallelSteps(steps: WorkflowStep[]): WorkflowStep[][] {
    const groups: WorkflowStep[][] = [];
    let currentGroup: WorkflowStep[] = [];
    
    for (const step of steps) {
      if (step.parallel && currentGroup.length > 0) {
        currentGroup.push(step);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [step];
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  /**
   * Prepare parameters for a workflow step
   */
  private prepareStepParams(
    step: WorkflowStep,
    baseParams: any,
    previousResults: SkillResult[]
  ): any {
    const params = { ...baseParams, ...step.params };
    
    // Inject data from previous steps if needed
    if (previousResults.length > 0) {
      params._previous = previousResults[previousResults.length - 1].data;
      params._allResults = previousResults.map(r => r.data);
    }
    
    return params;
  }

  /**
   * Evaluate a workflow condition
   */
  private evaluateCondition(condition: string, results: SkillResult[]): boolean {
    // Simple condition evaluation
    // In production, use a safe expression evaluator
    try {
      const lastResult = results[results.length - 1];
      
      if (condition === 'success') {
        return lastResult?.success === true;
      }
      if (condition === 'failure') {
        return lastResult?.success === false;
      }
      
      // More complex conditions would be evaluated here
      return true;
      
    } catch {
      return true; // Default to true if evaluation fails
    }
  }

  /**
   * Validate license
   */
  private async validateLicense(licenseKey: string): Promise<void> {
    // In production, validate against database
    if (!licenseKey) {
      throw new Error('License key required');
    }
    
    // Check license validity, tier, quotas, etc.
    console.log(`[OrchestratorAgent] License validated: ${licenseKey}`);
  }

  /**
   * Log execution events
   */
  private logExecution(event: string, data: any): void {
    console.log(`[OrchestratorAgent] ${event}:`, {
      requestId: data.requestId,
      skillId: data.skillId,
      timestamp: new Date()
    });
    
    // In production, save to database for monitoring
  }

  /**
   * Get orchestrator status
   */
  public getStatus(): any {
    return {
      active: true,
      activeRequests: this.activeRequests.size,
      registeredSkills: this.registry.getAllSkills().length,
      enabledSkills: this.registry.getEnabledSkills().length,
      configuredServices: this.configManager.getConfiguredServices()
    };
  }

  /**
   * Create a workflow from a natural language description
   */
  public async createWorkflowFromDescription(
    description: string,
    context: any
  ): Promise<WorkflowDefinition> {
    // This would use AI to parse the description and create a workflow
    // For now, return a sample workflow
    return {
      id: uuidv4(),
      name: 'Generated Workflow',
      steps: [
        {
          id: 'step1',
          skillId: 'text_summarizer',
          params: { text: description }
        }
      ]
    };
  }
}