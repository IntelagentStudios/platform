/**
 * Workflow Engine Skill
 * Orchestrates and executes complex workflows
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class WorkflowEngineSkill extends BaseSkill {
  metadata = {
    id: 'workflow_engine',
    name: 'Workflow Engine',
    description: 'Orchestrate and execute complex workflows',
    category: SkillCategory.AUTOMATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['workflow', 'automation', 'orchestration', 'process']
  };

  validate(params: SkillParams): boolean {
    return !!(params.workflow || params.steps);
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { workflow, steps, data = {}, options = {} } = params;
      
      // Parse workflow definition
      const workflowDef = workflow || { steps };
      const executionId = this.generateExecutionId();
      
      // Initialize execution context
      const context: any = {
        executionId,
        data: { ...data },
        variables: {},
        results: {},
        logs: [],
        startTime: Date.now()
      };

      // Validate workflow
      const validation = this.validateWorkflow(workflowDef);
      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }

      // Execute workflow
      const result = await this.executeWorkflow(workflowDef, context, options);

      // Calculate execution metrics
      const metrics = this.calculateExecutionMetrics(context);

      return {
        success: result.success,
        data: {
          executionId,
          workflow: workflowDef.name || 'Unnamed Workflow',
          status: result.status,
          results: result.results,
          variables: context.variables,
          logs: context.logs,
          metrics,
          errors: result.errors || []
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      errors.push('Workflow must have steps array');
    } else {
      // Validate each step
      workflow.steps.forEach((step: any, index: number) => {
        if (!step.id) {
          errors.push(`Step ${index} missing ID`);
        }
        if (!step.type) {
          errors.push(`Step ${index} missing type`);
        }
        
        // Validate step dependencies
        if (step.dependencies) {
          if (!Array.isArray(step.dependencies)) {
            errors.push(`Step ${step.id} dependencies must be an array`);
          } else {
            step.dependencies.forEach((dep: string) => {
              if (!workflow.steps.find((s: any) => s.id === dep)) {
                errors.push(`Step ${step.id} has invalid dependency: ${dep}`);
              }
            });
          }
        }
      });

      // Check for circular dependencies
      const circular = this.detectCircularDependencies(workflow.steps);
      if (circular.length > 0) {
        errors.push(`Circular dependencies detected: ${circular.join(' -> ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async executeWorkflow(workflow: any, context: any, options: any): Promise<any> {
    const steps = workflow.steps || [];
    const executionOrder = this.determineExecutionOrder(steps);
    
    const results: any = {
      success: true,
      status: 'completed',
      results: {},
      errors: []
    };

    // Execute steps in order
    for (const stepId of executionOrder) {
      const step = steps.find((s: any) => s.id === stepId);
      if (!step) continue;

      try {
        // Check if step should be skipped
        if (step.condition && !this.evaluateCondition(step.condition, context)) {
          this.addToContextLog(context, `Skipping step ${step.id} (condition not met)`, 'info');
          context.results[step.id] = { skipped: true };
          continue;
        }

        // Wait for dependencies
        if (step.dependencies) {
          await this.waitForDependencies(step.dependencies, context);
        }

        // Execute step
        this.addToContextLog(context, `Executing step ${step.id}`, 'info');
        const stepResult = await this.executeStep(step, context, options);
        
        // Store result
        context.results[step.id] = stepResult;
        results.results[step.id] = stepResult;

        // Handle step failure
        if (!stepResult.success && step.onError === 'stop') {
          results.success = false;
          results.status = 'failed';
          results.errors.push(`Step ${step.id} failed: ${stepResult.error}`);
          break;
        }

        // Handle retries
        if (!stepResult.success && step.retries) {
          const retryResult = await this.retryStep(step, context, options);
          if (retryResult.success) {
            context.results[step.id] = retryResult;
            results.results[step.id] = retryResult;
          }
        }

      } catch (error: any) {
        this.addToContextLog(context, `Error in step ${step.id}: ${error.message}`, 'error');
        results.errors.push(`Step ${step.id}: ${error.message}`);
        
        if (step.onError === 'stop') {
          results.success = false;
          results.status = 'failed';
          break;
        }
      }
    }

    // Execute cleanup steps if any
    if (workflow.cleanup) {
      await this.executeCleanup(workflow.cleanup, context);
    }

    return results;
  }

  private async executeStep(step: any, context: any, options: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result: any;

      switch (step.type) {
        case 'action':
          result = await this.executeAction(step, context);
          break;
        case 'decision':
          result = await this.executeDecision(step, context);
          break;
        case 'loop':
          result = await this.executeLoop(step, context, options);
          break;
        case 'parallel':
          result = await this.executeParallel(step, context, options);
          break;
        case 'wait':
          result = await this.executeWait(step, context);
          break;
        case 'transform':
          result = await this.executeTransform(step, context);
          break;
        case 'validate':
          result = await this.executeValidation(step, context);
          break;
        case 'notify':
          result = await this.executeNotification(step, context);
          break;
        default:
          result = await this.executeCustomStep(step, context);
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        type: step.type,
        duration,
        output: result,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        type: step.type,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private async executeAction(step: any, context: any): Promise<any> {
    // Simulate action execution
    const { action, params = {} } = step;
    
    // Resolve parameters with context variables
    const resolvedParams = this.resolveParams(params, context);
    
    // Simulate different actions
    switch (action) {
      case 'http_request':
        return this.simulateHttpRequest(resolvedParams);
      case 'database_query':
        return this.simulateDatabaseQuery(resolvedParams);
      case 'file_operation':
        return this.simulateFileOperation(resolvedParams);
      case 'calculation':
        return this.performCalculation(resolvedParams);
      default:
        return { action, params: resolvedParams, executed: true };
    }
  }

  private async executeDecision(step: any, context: any): Promise<any> {
    const { conditions, branches } = step;
    
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, context)) {
        const branch = branches[condition.branch];
        if (branch) {
          return { 
            decision: condition.branch, 
            nextSteps: branch.steps || [] 
          };
        }
      }
    }
    
    // Default branch
    if (branches.default) {
      return { 
        decision: 'default', 
        nextSteps: branches.default.steps || [] 
      };
    }
    
    return { decision: 'none' };
  }

  private async executeLoop(step: any, context: any, options: any): Promise<any> {
    const { items, iterator, body, maxIterations = 100 } = step;
    const results: any[] = [];
    
    // Resolve items
    const itemsToIterate = this.resolveValue(items, context);
    
    if (!Array.isArray(itemsToIterate)) {
      throw new Error('Loop items must be an array');
    }
    
    let iteration = 0;
    for (const item of itemsToIterate) {
      if (iteration >= maxIterations) {
        this.addToContextLog(context, `Loop reached max iterations (${maxIterations})`, 'warning');
        break;
      }
      
      // Set iterator variable
      context.variables[iterator || 'item'] = item;
      context.variables[`${iterator || 'item'}_index`] = iteration;
      
      // Execute loop body
      const bodyResult = await this.executeWorkflow({ steps: body }, context, options);
      results.push(bodyResult);
      
      iteration++;
    }
    
    return { iterations: iteration, results };
  }

  private async executeParallel(step: any, context: any, options: any): Promise<any> {
    const { tasks, maxConcurrency = 5 } = step;
    
    // Execute tasks in parallel with concurrency limit
    const results = await this.executeTasksWithConcurrency(
      tasks,
      async (task: any) => {
        const taskContext = { ...context, variables: { ...context.variables } };
        return await this.executeStep(task, taskContext, options);
      },
      maxConcurrency
    );
    
    return { 
      parallel: true, 
      tasksExecuted: tasks.length,
      results 
    };
  }

  private async executeWait(step: any, context: any): Promise<any> {
    const { duration, until } = step;
    
    if (duration) {
      const ms = this.parseDuration(duration);
      this.addToContextLog(context, `Waiting for ${ms}ms`, 'info');
      await this.delay(ms);
      return { waited: ms };
    }
    
    if (until) {
      // Wait until condition is met
      const maxWait = 60000; // 1 minute max
      const checkInterval = 1000; // Check every second
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        if (this.evaluateCondition(until, context)) {
          return { waited: Date.now() - startTime };
        }
        await this.delay(checkInterval);
      }
      
      throw new Error('Wait condition timeout');
    }
    
    return { waited: 0 };
  }

  private async executeTransform(step: any, context: any): Promise<any> {
    const { input, transformation, output } = step;
    
    // Get input data
    const inputData = this.resolveValue(input, context);
    
    // Apply transformation
    let transformed: any;
    switch (transformation.type) {
      case 'map':
        transformed = this.applyMapping(inputData, transformation.mapping);
        break;
      case 'filter':
        transformed = this.applyFilter(inputData, transformation.condition);
        break;
      case 'aggregate':
        transformed = this.applyAggregation(inputData, transformation.aggregation);
        break;
      case 'custom':
        transformed = this.applyCustomTransformation(inputData, transformation.function);
        break;
      default:
        transformed = inputData;
    }
    
    // Store output
    if (output) {
      context.variables[output] = transformed;
    }
    
    return { transformed, stored: output };
  }

  private async executeValidation(step: any, context: any): Promise<any> {
    const { input, rules } = step;
    
    // Get input data
    const data = this.resolveValue(input, context);
    
    // Apply validation rules
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const rule of rules) {
      const result = this.validateRule(data, rule);
      if (!result.valid) {
        if (rule.severity === 'warning') {
          warnings.push(result.message);
        } else {
          errors.push(result.message);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async executeNotification(step: any, context: any): Promise<any> {
    const { channel, recipient, message, template } = step;
    
    // Resolve message
    const resolvedMessage = template 
      ? this.applyTemplate(template, context)
      : this.resolveValue(message, context);
    
    // Simulate notification sending
    this.addToContextLog(context, `Sending notification via ${channel} to ${recipient}`, 'info');
    
    return {
      channel,
      recipient,
      message: resolvedMessage,
      sent: true,
      timestamp: new Date()
    };
  }

  private async executeCustomStep(step: any, context: any): Promise<any> {
    // Custom step execution
    return {
      custom: true,
      stepId: step.id,
      type: step.type,
      executed: true
    };
  }

  // Helper methods
  private determineExecutionOrder(steps: any[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (!step) return;
      
      // Visit dependencies first
      if (step.dependencies) {
        step.dependencies.forEach((dep: string) => visit(dep));
      }
      
      order.push(stepId);
    };
    
    // Visit all steps
    steps.forEach(step => visit(step.id));
    
    return order;
  }

  private detectCircularDependencies(steps: any[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);
      path.push(stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (step && step.dependencies) {
        for (const dep of step.dependencies) {
          if (!visited.has(dep)) {
            if (hasCycle(dep)) return true;
          } else if (recursionStack.has(dep)) {
            path.push(dep);
            return true;
          }
        }
      }
      
      recursionStack.delete(stepId);
      path.pop();
      return false;
    };
    
    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          return path;
        }
      }
    }
    
    return [];
  }

  private async waitForDependencies(dependencies: string[], context: any): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 100;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const allCompleted = dependencies.every(dep => dep in context.results);
      if (allCompleted) return;
      await this.delay(checkInterval);
    }
    
    throw new Error(`Dependencies timeout: ${dependencies.join(', ')}`);
  }

  private async retryStep(step: any, context: any, options: any): Promise<any> {
    const { retries = 3, retryDelay = 1000 } = step;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      this.addToContextLog(context, `Retrying step ${step.id} (attempt ${attempt}/${retries})`, 'info');
      await this.delay(retryDelay * attempt);
      
      const result = await this.executeStep(step, context, options);
      if (result.success) {
        return result;
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  private async executeCleanup(cleanup: any, context: any): Promise<void> {
    this.addToContextLog(context, 'Executing cleanup steps', 'info');
    
    for (const step of cleanup) {
      try {
        await this.executeStep(step, context, {});
      } catch (error: any) {
        this.addToContextLog(context, `Cleanup error: ${error.message}`, 'error');
      }
    }
  }

  private evaluateCondition(condition: any, context: any): boolean {
    const { left, operator, right } = condition;
    
    const leftValue = this.resolveValue(left, context);
    const rightValue = this.resolveValue(right, context);
    
    switch (operator) {
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      case '>': return leftValue > rightValue;
      case '>=': return leftValue >= rightValue;
      case '<': return leftValue < rightValue;
      case '<=': return leftValue <= rightValue;
      case 'contains': return String(leftValue).includes(rightValue);
      case 'matches': return new RegExp(rightValue).test(leftValue);
      case 'exists': return leftValue !== null && leftValue !== undefined;
      case 'empty': return !leftValue || (Array.isArray(leftValue) && leftValue.length === 0);
      default: return false;
    }
  }

  private resolveValue(value: any, context: any): any {
    if (typeof value === 'string' && value.startsWith('$')) {
      // Variable reference
      const path = value.substring(1);
      return this.getNestedValue(context, path);
    }
    return value;
  }

  private resolveParams(params: any, context: any): any {
    const resolved: any = {};
    
    for (const key in params) {
      resolved[key] = this.resolveValue(params[key], context);
    }
    
    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeTasksWithConcurrency(
    tasks: any[],
    executor: (task: any) => Promise<any>,
    maxConcurrency: number
  ): Promise<any[]> {
    const results: any[] = [];
    const executing: Promise<any>[] = [];
    
    for (const task of tasks) {
      const promise = executor(task).then(result => {
        results.push(result);
        return result;
      });
      
      executing.push(promise);
      
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(ms|s|m|h)$/);
    if (!match) return 1000;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'ms': return value;
      case 's': return value * 1000;
      case 'm': return value * 60000;
      case 'h': return value * 3600000;
      default: return 1000;
    }
  }

  private applyMapping(data: any, mapping: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.mapItem(item, mapping));
    }
    return this.mapItem(data, mapping);
  }

  private mapItem(item: any, mapping: any): any {
    const mapped: any = {};
    
    for (const key in mapping) {
      const source = mapping[key];
      mapped[key] = this.getNestedValue(item, source);
    }
    
    return mapped;
  }

  private applyFilter(data: any, condition: any): any {
    if (!Array.isArray(data)) return data;
    
    return data.filter(item => {
      const testContext = { variables: { item } };
      return this.evaluateCondition(condition, testContext);
    });
  }

  private applyAggregation(data: any, aggregation: any): any {
    if (!Array.isArray(data)) return data;
    
    const { type, field } = aggregation;
    const values = data.map(item => this.getNestedValue(item, field));
    
    switch (type) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      case 'count': return values.length;
      default: return values;
    }
  }

  private applyCustomTransformation(data: any, func: string): any {
    // Simulate custom transformation
    return { custom: true, original: data };
  }

  private applyTemplate(template: string, context: any): string {
    return template.replace(/\{\{(\w+(\.\w+)*)\}\}/g, (match, path) => {
      return this.getNestedValue(context, path) || match;
    });
  }

  private validateRule(data: any, rule: any): { valid: boolean; message: string } {
    const { type, params } = rule;
    
    switch (type) {
      case 'required':
        return {
          valid: data !== null && data !== undefined && data !== '',
          message: 'Value is required'
        };
      case 'type':
        return {
          valid: typeof data === params.expected,
          message: `Expected type ${params.expected}, got ${typeof data}`
        };
      case 'range':
        return {
          valid: data >= params.min && data <= params.max,
          message: `Value must be between ${params.min} and ${params.max}`
        };
      case 'pattern':
        return {
          valid: new RegExp(params.regex).test(data),
          message: `Value does not match pattern ${params.regex}`
        };
      default:
        return { valid: true, message: '' };
    }
  }

  private simulateHttpRequest(params: any): any {
    return {
      type: 'http',
      url: params.url,
      method: params.method || 'GET',
      status: 200,
      response: { success: true }
    };
  }

  private simulateDatabaseQuery(params: any): any {
    return {
      type: 'database',
      query: params.query,
      rows: [],
      affected: 0
    };
  }

  private simulateFileOperation(params: any): any {
    return {
      type: 'file',
      operation: params.operation,
      path: params.path,
      success: true
    };
  }

  private performCalculation(params: any): any {
    const { operation, values } = params;
    
    switch (operation) {
      case 'add': return values.reduce((a: number, b: number) => a + b, 0);
      case 'multiply': return values.reduce((a: number, b: number) => a * b, 1);
      case 'divide': return values[0] / values[1];
      case 'subtract': return values[0] - values[1];
      default: return 0;
    }
  }

  private addToContextLog(context: any, message: string, level: string = 'info'): void {
    context.logs.push({
      timestamp: new Date(),
      level,
      message
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateExecutionId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateExecutionMetrics(context: any): any {
    const duration = Date.now() - context.startTime;
    const stepCount = Object.keys(context.results).length;
    const successCount = Object.values(context.results).filter((r: any) => r.success).length;
    const failureCount = stepCount - successCount;
    
    return {
      duration,
      stepCount,
      successCount,
      failureCount,
      successRate: stepCount > 0 ? (successCount / stepCount * 100).toFixed(2) + '%' : '0%',
      averageStepDuration: stepCount > 0 ? Math.round(duration / stepCount) : 0
    };
  }

  getConfig(): Record<string, any> {
    return {
      stepTypes: ['action', 'decision', 'loop', 'parallel', 'wait', 'transform', 'validate', 'notify'],
      maxSteps: 100,
      maxExecutionTime: 300000, // 5 minutes
      supportedActions: ['http_request', 'database_query', 'file_operation', 'calculation'],
      supportedChannels: ['email', 'sms', 'webhook', 'slack']
    };
  }
}