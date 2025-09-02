/**
 * Workflow Scheduler
 * Manages recurring workflows with cron-like scheduling
 * No third-party cron libraries - pure implementation
 */

import { EventEmitter } from 'events';
import { QueueOrchestrator } from '../core/QueueOrchestrator';

export interface ScheduleConfig {
  id?: string;
  licenseKey: string;
  skillId: string;
  params: any;
  schedule: {
    type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';
    value: string | number; // interval in ms, time string, or cron expression
    timezone?: string;
  };
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  maxExecutions?: number;
  metadata?: Record<string, any>;
}

export interface ScheduledJob {
  id: string;
  config: ScheduleConfig;
  nextRun: Date;
  lastRun?: Date;
  executionCount: number;
  status: 'active' | 'paused' | 'completed' | 'expired';
  createdAt: Date;
  timer?: NodeJS.Timeout;
}

export class WorkflowScheduler extends EventEmitter {
  private static instance: WorkflowScheduler;
  private jobs = new Map<string, ScheduledJob>();
  private running = false;
  private checkInterval?: NodeJS.Timeout;
  
  private constructor(private queueOrchestrator: QueueOrchestrator) {
    super();
    this.start();
  }
  
  public static getInstance(queueOrchestrator: QueueOrchestrator): WorkflowScheduler {
    if (!WorkflowScheduler.instance) {
      WorkflowScheduler.instance = new WorkflowScheduler(queueOrchestrator);
    }
    return WorkflowScheduler.instance;
  }
  
  /**
   * Schedule a recurring workflow
   */
  public scheduleWorkflow(config: ScheduleConfig): ScheduledJob {
    const jobId = config.id || `schedule_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const job: ScheduledJob = {
      id: jobId,
      config: { ...config, id: jobId },
      nextRun: this.calculateNextRun(config),
      executionCount: 0,
      status: config.enabled ? 'active' : 'paused',
      createdAt: new Date()
    };
    
    this.jobs.set(jobId, job);
    
    // Set up timer for interval-based schedules
    if (config.schedule.type === 'interval' && config.enabled) {
      this.setupIntervalTimer(job);
    }
    
    console.log(`[WorkflowScheduler] Scheduled workflow ${jobId} for license ${config.licenseKey}`);
    
    this.emit('schedule:created', job);
    
    return job;
  }
  
  /**
   * Calculate next run time based on schedule config
   */
  private calculateNextRun(config: ScheduleConfig): Date {
    const now = new Date();
    
    if (config.startDate && config.startDate > now) {
      return config.startDate;
    }
    
    switch (config.schedule.type) {
      case 'interval':
        const interval = Number(config.schedule.value);
        return new Date(now.getTime() + interval);
        
      case 'daily':
        const [hours, minutes] = config.schedule.value.toString().split(':').map(Number);
        const nextDaily = new Date(now);
        nextDaily.setHours(hours, minutes, 0, 0);
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        return nextDaily;
        
      case 'weekly':
        const [dayOfWeek, time] = config.schedule.value.toString().split(' ');
        const [weekHours, weekMinutes] = time.split(':').map(Number);
        const nextWeekly = new Date(now);
        const targetDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(dayOfWeek.toLowerCase());
        
        nextWeekly.setHours(weekHours, weekMinutes, 0, 0);
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
        if (daysUntilTarget === 0 && nextWeekly <= now) {
          nextWeekly.setDate(nextWeekly.getDate() + 7);
        } else {
          nextWeekly.setDate(nextWeekly.getDate() + daysUntilTarget);
        }
        return nextWeekly;
        
      case 'monthly':
        const [dayOfMonth, monthTime] = config.schedule.value.toString().split(' ');
        const [monthHours, monthMinutes] = monthTime.split(':').map(Number);
        const nextMonthly = new Date(now);
        nextMonthly.setDate(Number(dayOfMonth));
        nextMonthly.setHours(monthHours, monthMinutes, 0, 0);
        if (nextMonthly <= now) {
          nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        }
        return nextMonthly;
        
      case 'cron':
        return this.parseCronExpression(config.schedule.value.toString(), now);
        
      default:
        return new Date(now.getTime() + 60000); // Default to 1 minute
    }
  }
  
  /**
   * Parse cron expression (simplified)
   */
  private parseCronExpression(expression: string, fromDate: Date): Date {
    // Simple cron parser - supports: minute hour day month weekday
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }
    
    const [minute, hour, day, month, weekday] = parts;
    const next = new Date(fromDate);
    
    // Simple implementation - find next matching time
    for (let i = 0; i < 366; i++) { // Check up to 1 year ahead
      next.setDate(next.getDate() + (i === 0 ? 0 : 1));
      next.setHours(0, 0, 0, 0);
      
      if (month !== '*' && next.getMonth() + 1 !== Number(month)) continue;
      if (day !== '*' && next.getDate() !== Number(day)) continue;
      if (weekday !== '*' && next.getDay() !== Number(weekday)) continue;
      
      if (hour === '*') {
        next.setHours(0);
      } else {
        next.setHours(Number(hour));
      }
      
      if (minute === '*') {
        next.setMinutes(0);
      } else {
        next.setMinutes(Number(minute));
      }
      
      if (next > fromDate) {
        return next;
      }
    }
    
    return new Date(fromDate.getTime() + 86400000); // Default to tomorrow
  }
  
  /**
   * Set up interval timer for a job
   */
  private setupIntervalTimer(job: ScheduledJob): void {
    if (job.config.schedule.type !== 'interval') return;
    
    const interval = Number(job.config.schedule.value);
    
    job.timer = setInterval(async () => {
      if (job.status === 'active') {
        await this.executeJob(job);
      }
    }, interval);
  }
  
  /**
   * Execute a scheduled job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      // Check if job should still run
      if (job.config.endDate && new Date() > job.config.endDate) {
        job.status = 'expired';
        this.cancelSchedule(job.id);
        return;
      }
      
      if (job.config.maxExecutions && job.executionCount >= job.config.maxExecutions) {
        job.status = 'completed';
        this.cancelSchedule(job.id);
        return;
      }
      
      console.log(`[WorkflowScheduler] Executing scheduled job ${job.id}`);
      
      // Queue the task
      const taskId = await this.queueOrchestrator.queueTask(
        job.config.licenseKey,
        job.config.skillId,
        job.config.params,
        {
          metadata: {
            ...job.config.metadata,
            scheduledJobId: job.id,
            executionNumber: job.executionCount + 1
          }
        }
      );
      
      job.lastRun = new Date();
      job.executionCount++;
      
      // Calculate next run (except for interval-based which use timers)
      if (job.config.schedule.type !== 'interval') {
        job.nextRun = this.calculateNextRun(job.config);
      }
      
      this.emit('schedule:executed', {
        jobId: job.id,
        taskId,
        executionCount: job.executionCount
      });
      
    } catch (error: any) {
      console.error(`[WorkflowScheduler] Failed to execute job ${job.id}:`, error.message);
      
      this.emit('schedule:error', {
        jobId: job.id,
        error: error.message
      });
    }
  }
  
  /**
   * Start the scheduler
   */
  private start(): void {
    if (this.running) return;
    
    this.running = true;
    
    // Check for jobs to run every minute
    this.checkInterval = setInterval(() => {
      const now = new Date();
      
      for (const job of this.jobs.values()) {
        if (job.status === 'active' && 
            job.config.schedule.type !== 'interval' && 
            job.nextRun <= now) {
          this.executeJob(job);
        }
      }
    }, 60000); // Check every minute
    
    console.log('[WorkflowScheduler] Scheduler started');
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    this.running = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Clear all interval timers
    for (const job of this.jobs.values()) {
      if (job.timer) {
        clearInterval(job.timer);
      }
    }
    
    console.log('[WorkflowScheduler] Scheduler stopped');
  }
  
  /**
   * Pause a scheduled job
   */
  public pauseSchedule(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.status = 'paused';
    
    if (job.timer) {
      clearInterval(job.timer);
      job.timer = undefined;
    }
    
    this.emit('schedule:paused', { jobId });
    return true;
  }
  
  /**
   * Resume a scheduled job
   */
  public resumeSchedule(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.status = 'active';
    job.nextRun = this.calculateNextRun(job.config);
    
    if (job.config.schedule.type === 'interval') {
      this.setupIntervalTimer(job);
    }
    
    this.emit('schedule:resumed', { jobId });
    return true;
  }
  
  /**
   * Cancel a scheduled job
   */
  public cancelSchedule(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.timer) {
      clearInterval(job.timer);
    }
    
    this.jobs.delete(jobId);
    
    this.emit('schedule:cancelled', { jobId });
    return true;
  }
  
  /**
   * Get all schedules for a license key
   */
  public getLicenseSchedules(licenseKey: string): ScheduledJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.config.licenseKey === licenseKey);
  }
  
  /**
   * Get schedule by ID
   */
  public getSchedule(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * Update schedule configuration
   */
  public updateSchedule(jobId: string, updates: Partial<ScheduleConfig>): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    // Update config
    Object.assign(job.config, updates);
    
    // Recalculate next run if schedule changed
    if (updates.schedule) {
      job.nextRun = this.calculateNextRun(job.config);
      
      // Reset timer if interval changed
      if (job.timer) {
        clearInterval(job.timer);
        if (job.status === 'active' && job.config.schedule.type === 'interval') {
          this.setupIntervalTimer(job);
        }
      }
    }
    
    this.emit('schedule:updated', { jobId });
    return true;
  }
}