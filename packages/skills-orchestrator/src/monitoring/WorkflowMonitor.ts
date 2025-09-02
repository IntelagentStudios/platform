/**
 * Workflow Monitor
 * Real-time monitoring and visualization system for skill executions
 * Tracks all workflows by license key and task ID
 */

import { EventEmitter } from 'events';
import { QueueOrchestrator, TaskResult, WorkflowExecution } from '../core/QueueOrchestrator';

export interface MonitoringMetrics {
  totalExecutions: number;
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
}

export interface LicenseMetrics {
  licenseKey: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalCost: number;
  lastActivity: Date;
  workflows: WorkflowSummary[];
}

export interface WorkflowSummary {
  workflowId: string;
  name: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  taskCount: number;
  completedTasks: number;
  failedTasks: number;
}

export interface SkillMetrics {
  skillId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageTime: number;
  lastExecution?: Date;
  errorMessages: string[];
}

export interface LiveExecution {
  taskId: string;
  licenseKey: string;
  skillId: string;
  status: string;
  progress?: number;
  startTime: Date;
  estimatedCompletion?: Date;
  parentWorkflow?: string;
}

export class WorkflowMonitor extends EventEmitter {
  private static instance: WorkflowMonitor;
  private orchestrator: QueueOrchestrator;
  
  // Metrics storage
  private globalMetrics: MonitoringMetrics;
  private licenseMetrics = new Map<string, LicenseMetrics>();
  private skillMetrics = new Map<string, SkillMetrics>();
  private liveExecutions = new Map<string, LiveExecution>();
  
  // Historical data
  private executionHistory: TaskResult[] = [];
  private workflowHistory: WorkflowExecution[] = [];
  
  // Real-time tracking
  private updateInterval?: NodeJS.Timeout;
  private metricsWindow: number[] = []; // For throughput calculation
  
  private constructor() {
    super();
    
    this.orchestrator = QueueOrchestrator.getInstance();
    
    this.globalMetrics = {
      totalExecutions: 0,
      activeExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      successRate: 0,
      throughput: 0,
      errorRate: 0
    };
    
    this.setupEventListeners();
    this.startRealTimeUpdates();
  }
  
  public static getInstance(): WorkflowMonitor {
    if (!WorkflowMonitor.instance) {
      WorkflowMonitor.instance = new WorkflowMonitor();
    }
    return WorkflowMonitor.instance;
  }
  
  /**
   * Setup event listeners for real-time tracking
   */
  private setupEventListeners(): void {
    // Task events
    this.orchestrator.on('task:completed', (task: TaskResult) => {
      this.handleTaskCompleted(task);
    });
    
    this.orchestrator.on('task:failed', (task: TaskResult) => {
      this.handleTaskFailed(task);
    });
    
    this.orchestrator.on('task:active', (data: any) => {
      this.handleTaskActive(data);
    });
    
    // Workflow events
    this.orchestrator.on('workflow:completed', (workflow: WorkflowExecution) => {
      this.handleWorkflowCompleted(workflow);
    });
    
    // Metrics events
    this.orchestrator.on('metrics:updated', (data: any) => {
      this.updateMetrics(data.metrics);
    });
    
    // Execution tracking
    this.orchestrator.on('execution:tracked', (execution: any) => {
      this.trackExecution(execution);
    });
  }
  
  /**
   * Handle task completion
   */
  private handleTaskCompleted(task: TaskResult): void {
    // Update global metrics
    this.globalMetrics.completedExecutions++;
    this.globalMetrics.totalExecutions++;
    
    // Update license metrics
    this.updateLicenseMetrics(task.licenseKey, 'completed', task);
    
    // Update skill metrics
    this.updateSkillMetrics(task.skillId, true, task.executionTime);
    
    // Remove from live executions
    this.liveExecutions.delete(task.taskId);
    
    // Add to history
    this.executionHistory.push(task);
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }
    
    // Emit real-time update
    this.emit('task:completed', {
      task,
      metrics: this.getMetrics()
    });
  }
  
  /**
   * Handle task failure
   */
  private handleTaskFailed(task: TaskResult): void {
    // Update global metrics
    this.globalMetrics.failedExecutions++;
    this.globalMetrics.totalExecutions++;
    
    // Update license metrics
    this.updateLicenseMetrics(task.licenseKey, 'failed', task);
    
    // Update skill metrics
    this.updateSkillMetrics(task.skillId, false, task.executionTime, task.error);
    
    // Remove from live executions
    this.liveExecutions.delete(task.taskId);
    
    // Add to history
    this.executionHistory.push(task);
    
    // Emit real-time update
    this.emit('task:failed', {
      task,
      metrics: this.getMetrics()
    });
    
    // Alert if error rate is high
    this.checkErrorRate();
  }
  
  /**
   * Handle task becoming active
   */
  private handleTaskActive(data: any): void {
    const { jobId, task } = data;
    
    if (task) {
      const liveExec: LiveExecution = {
        taskId: task.taskId,
        licenseKey: task.licenseKey,
        skillId: task.skillId,
        status: 'active',
        startTime: new Date(),
        parentWorkflow: task.parentTaskId
      };
      
      this.liveExecutions.set(task.taskId, liveExec);
      this.globalMetrics.activeExecutions = this.liveExecutions.size;
      
      // Emit real-time update
      this.emit('task:active', {
        execution: liveExec,
        activeCount: this.liveExecutions.size
      });
    }
  }
  
  /**
   * Handle workflow completion
   */
  private handleWorkflowCompleted(workflow: WorkflowExecution): void {
    // Add to history
    this.workflowHistory.push(workflow);
    if (this.workflowHistory.length > 100) {
      this.workflowHistory.shift();
    }
    
    // Update license metrics with workflow info
    const licenseMetric = this.licenseMetrics.get(workflow.licenseKey);
    if (licenseMetric) {
      const summary: WorkflowSummary = {
        workflowId: workflow.workflowId,
        name: workflow.workflowId,
        status: workflow.status,
        startTime: workflow.startTime,
        endTime: workflow.endTime,
        duration: workflow.endTime ? 
          workflow.endTime.getTime() - workflow.startTime.getTime() : undefined,
        taskCount: workflow.tasks.length,
        completedTasks: Array.from(workflow.results.values())
          .filter(r => r.status === 'completed').length,
        failedTasks: Array.from(workflow.results.values())
          .filter(r => r.status === 'failed').length
      };
      
      licenseMetric.workflows.push(summary);
      if (licenseMetric.workflows.length > 10) {
        licenseMetric.workflows.shift();
      }
    }
    
    // Emit real-time update
    this.emit('workflow:completed', {
      workflow,
      summary: this.getWorkflowSummary(workflow)
    });
  }
  
  /**
   * Update license metrics
   */
  private updateLicenseMetrics(
    licenseKey: string, 
    status: 'completed' | 'failed', 
    task: TaskResult
  ): void {
    let metric = this.licenseMetrics.get(licenseKey);
    
    if (!metric) {
      metric = {
        licenseKey,
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalCost: 0,
        lastActivity: new Date(),
        workflows: []
      };
      this.licenseMetrics.set(licenseKey, metric);
    }
    
    metric.totalTasks++;
    metric.lastActivity = new Date();
    
    if (status === 'completed') {
      metric.completedTasks++;
    } else {
      metric.failedTasks++;
    }
    
    // Update active count
    metric.activeTasks = Array.from(this.liveExecutions.values())
      .filter(exec => exec.licenseKey === licenseKey).length;
    
    // Calculate cost (example: $0.001 per execution)
    metric.totalCost += 0.001;
  }
  
  /**
   * Update skill metrics
   */
  private updateSkillMetrics(
    skillId: string, 
    success: boolean, 
    executionTime?: number,
    error?: string
  ): void {
    let metric = this.skillMetrics.get(skillId);
    
    if (!metric) {
      metric = {
        skillId,
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        averageTime: 0,
        errorMessages: []
      };
      this.skillMetrics.set(skillId, metric);
    }
    
    metric.executionCount++;
    metric.lastExecution = new Date();
    
    if (success) {
      metric.successCount++;
    } else {
      metric.failureCount++;
      if (error && !metric.errorMessages.includes(error)) {
        metric.errorMessages.push(error);
        if (metric.errorMessages.length > 10) {
          metric.errorMessages.shift();
        }
      }
    }
    
    // Update average time
    if (executionTime) {
      metric.averageTime = 
        (metric.averageTime * (metric.executionCount - 1) + executionTime) / 
        metric.executionCount;
    }
  }
  
  /**
   * Track execution for metrics
   */
  private trackExecution(execution: any): void {
    // Add to metrics window for throughput calculation
    this.metricsWindow.push(Date.now());
    
    // Keep only last minute of data
    const oneMinuteAgo = Date.now() - 60000;
    this.metricsWindow = this.metricsWindow.filter(time => time > oneMinuteAgo);
  }
  
  /**
   * Update global metrics
   */
  private updateMetrics(queueMetrics: any): void {
    if (queueMetrics) {
      // Update active executions
      this.globalMetrics.activeExecutions = 
        queueMetrics.skills?.active || 0 + 
        queueMetrics.workflows?.active || 0;
      
      // Calculate success rate
      const total = this.globalMetrics.completedExecutions + this.globalMetrics.failedExecutions;
      this.globalMetrics.successRate = total > 0 ? 
        (this.globalMetrics.completedExecutions / total) * 100 : 0;
      
      // Calculate error rate
      this.globalMetrics.errorRate = total > 0 ? 
        (this.globalMetrics.failedExecutions / total) * 100 : 0;
      
      // Calculate throughput (executions per minute)
      this.globalMetrics.throughput = this.metricsWindow.length;
      
      // Calculate average execution time
      if (this.executionHistory.length > 0) {
        const recentExecutions = this.executionHistory.slice(-100);
        const totalTime = recentExecutions.reduce(
          (sum, exec) => sum + (exec.executionTime || 0), 0
        );
        this.globalMetrics.averageExecutionTime = totalTime / recentExecutions.length;
      }
    }
  }
  
  /**
   * Check error rate and emit alerts
   */
  private checkErrorRate(): void {
    if (this.globalMetrics.errorRate > 10) {
      this.emit('alert:high_error_rate', {
        errorRate: this.globalMetrics.errorRate,
        failedCount: this.globalMetrics.failedExecutions,
        totalCount: this.globalMetrics.totalExecutions
      });
    }
  }
  
  /**
   * Get workflow summary
   */
  private getWorkflowSummary(workflow: WorkflowExecution): WorkflowSummary {
    return {
      workflowId: workflow.workflowId,
      name: workflow.workflowId,
      status: workflow.status,
      startTime: workflow.startTime,
      endTime: workflow.endTime,
      duration: workflow.endTime ? 
        workflow.endTime.getTime() - workflow.startTime.getTime() : undefined,
      taskCount: workflow.tasks.length,
      completedTasks: Array.from(workflow.results.values())
        .filter(r => r.status === 'completed').length,
      failedTasks: Array.from(workflow.results.values())
        .filter(r => r.status === 'failed').length
    };
  }
  
  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      // Update metrics
      this.updateMetrics(null);
      
      // Emit current state
      this.emit('monitor:update', {
        metrics: this.globalMetrics,
        liveExecutions: Array.from(this.liveExecutions.values()),
        licenseMetrics: Array.from(this.licenseMetrics.values()),
        timestamp: new Date()
      });
    }, 1000); // Every second
  }
  
  /**
   * Get global metrics
   */
  public getMetrics(): MonitoringMetrics {
    return { ...this.globalMetrics };
  }
  
  /**
   * Get license metrics
   */
  public getLicenseMetrics(licenseKey?: string): LicenseMetrics | LicenseMetrics[] {
    if (licenseKey) {
      return this.licenseMetrics.get(licenseKey) || {
        licenseKey,
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalCost: 0,
        lastActivity: new Date(),
        workflows: []
      };
    }
    
    return Array.from(this.licenseMetrics.values());
  }
  
  /**
   * Get skill metrics
   */
  public getSkillMetrics(skillId?: string): SkillMetrics | SkillMetrics[] {
    if (skillId) {
      return this.skillMetrics.get(skillId) || {
        skillId,
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        averageTime: 0,
        errorMessages: []
      };
    }
    
    return Array.from(this.skillMetrics.values())
      .sort((a, b) => b.executionCount - a.executionCount);
  }
  
  /**
   * Get live executions
   */
  public getLiveExecutions(licenseKey?: string): LiveExecution[] {
    const executions = Array.from(this.liveExecutions.values());
    
    if (licenseKey) {
      return executions.filter(exec => exec.licenseKey === licenseKey);
    }
    
    return executions;
  }
  
  /**
   * Get execution history
   */
  public getExecutionHistory(
    licenseKey?: string, 
    limit = 100
  ): TaskResult[] {
    let history = this.executionHistory;
    
    if (licenseKey) {
      history = history.filter(exec => exec.licenseKey === licenseKey);
    }
    
    return history.slice(-limit);
  }
  
  /**
   * Get workflow history
   */
  public getWorkflowHistory(
    licenseKey?: string, 
    limit = 20
  ): WorkflowExecution[] {
    let history = this.workflowHistory;
    
    if (licenseKey) {
      history = history.filter(wf => wf.licenseKey === licenseKey);
    }
    
    return history.slice(-limit);
  }
  
  /**
   * Get health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    // Check error rate
    if (this.globalMetrics.errorRate > 20) {
      status = 'critical';
      issues.push(`High error rate: ${this.globalMetrics.errorRate.toFixed(1)}%`);
      recommendations.push('Investigate failing skills and check system resources');
    } else if (this.globalMetrics.errorRate > 10) {
      status = 'warning';
      issues.push(`Elevated error rate: ${this.globalMetrics.errorRate.toFixed(1)}%`);
      recommendations.push('Monitor error trends and review recent changes');
    }
    
    // Check throughput
    if (this.globalMetrics.throughput === 0 && this.globalMetrics.activeExecutions > 0) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push('No completed executions in the last minute');
      recommendations.push('Check for stuck or blocked tasks');
    }
    
    // Check average execution time
    if (this.globalMetrics.averageExecutionTime > 30000) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High average execution time: ${(this.globalMetrics.averageExecutionTime / 1000).toFixed(1)}s`);
      recommendations.push('Optimize slow-running skills or increase resources');
    }
    
    // Check for stuck executions
    const stuckExecutions = Array.from(this.liveExecutions.values())
      .filter(exec => {
        const runtime = Date.now() - exec.startTime.getTime();
        return runtime > 300000; // 5 minutes
      });
    
    if (stuckExecutions.length > 0) {
      status = 'warning';
      issues.push(`${stuckExecutions.length} executions running for over 5 minutes`);
      recommendations.push('Review long-running tasks for potential issues');
    }
    
    return { status, issues, recommendations };
  }
  
  /**
   * Generate report
   */
  public generateReport(
    startDate?: Date, 
    endDate?: Date
  ): {
    summary: MonitoringMetrics;
    topSkills: SkillMetrics[];
    topLicenses: LicenseMetrics[];
    issues: string[];
    period: { start: Date; end: Date };
  } {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 86400000); // 24 hours ago
    
    // Filter history by period
    const periodExecutions = this.executionHistory.filter(exec => {
      const execTime = exec.startTime?.getTime() || 0;
      return execTime >= start.getTime() && execTime <= end.getTime();
    });
    
    // Calculate period metrics
    const completed = periodExecutions.filter(e => e.status === 'completed').length;
    const failed = periodExecutions.filter(e => e.status === 'failed').length;
    const total = completed + failed;
    
    const summary: MonitoringMetrics = {
      totalExecutions: total,
      activeExecutions: this.globalMetrics.activeExecutions,
      completedExecutions: completed,
      failedExecutions: failed,
      averageExecutionTime: periodExecutions.reduce((sum, e) => 
        sum + (e.executionTime || 0), 0) / (total || 1),
      successRate: total > 0 ? (completed / total) * 100 : 0,
      throughput: total / ((end.getTime() - start.getTime()) / 60000), // per minute
      errorRate: total > 0 ? (failed / total) * 100 : 0
    };
    
    // Get top skills
    const topSkills = Array.from(this.skillMetrics.values())
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10);
    
    // Get top licenses
    const topLicenses = Array.from(this.licenseMetrics.values())
      .sort((a, b) => b.totalTasks - a.totalTasks)
      .slice(0, 10);
    
    // Identify issues
    const issues: string[] = [];
    
    // High failure skills
    const problemSkills = Array.from(this.skillMetrics.values())
      .filter(s => s.failureCount > s.successCount && s.executionCount > 10);
    
    if (problemSkills.length > 0) {
      issues.push(`${problemSkills.length} skills have >50% failure rate`);
    }
    
    // Inactive licenses
    const inactiveLicenses = Array.from(this.licenseMetrics.values())
      .filter(l => {
        const inactive = Date.now() - l.lastActivity.getTime() > 86400000; // 24 hours
        return inactive && l.totalTasks > 0;
      });
    
    if (inactiveLicenses.length > 0) {
      issues.push(`${inactiveLicenses.length} licenses have been inactive for >24 hours`);
    }
    
    return {
      summary,
      topSkills,
      topLicenses,
      issues,
      period: { start, end }
    };
  }
  
  /**
   * Cleanup
   */
  public shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.removeAllListeners();
  }
}