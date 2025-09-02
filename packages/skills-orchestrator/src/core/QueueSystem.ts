/**
 * Custom Queue System
 * In-house alternative to BullMQ - no external dependencies
 * Provides job queuing, processing, and monitoring capabilities
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused'
}

export enum JobPriority {
  LOW = 10,
  NORMAL = 0,
  HIGH = -5,
  CRITICAL = -10
}

export interface JobOptions {
  priority?: JobPriority;
  delay?: number;
  attempts?: number;
  backoff?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  licenseKey?: string;
  taskId?: string;
  userId?: string;
}

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  progress?: number;
  licenseKey?: string;
  taskId?: string;
  userId?: string;
  delayUntil?: Date;
  backoff?: number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  throughput: number;
  avgProcessingTime: number;
  errorRate: number;
}

export interface WorkerOptions {
  concurrency?: number;
  pollInterval?: number;
  maxStalledCount?: number;
  stalledInterval?: number;
}

type ProcessorFunction<T = any> = (job: Job<T>) => Promise<any>;

export class QueueSystem extends EventEmitter {
  private name: string;
  private jobs = new Map<string, Job>();
  private waitingJobs: string[] = [];
  private activeJobs = new Set<string>();
  private completedJobs: string[] = [];
  private failedJobs: string[] = [];
  private delayedJobs = new Map<string, string>(); // delayUntil -> jobId
  
  private processors = new Map<string, ProcessorFunction>();
  private workers: Worker[] = [];
  private isProcessing = false;
  private isPaused = false;
  
  private metrics: QueueMetrics = {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0,
    throughput: 0,
    avgProcessingTime: 0,
    errorRate: 0
  };
  
  private persistencePath?: string;
  private autoPersistInterval?: NodeJS.Timeout;
  private processingTimes: number[] = [];
  
  constructor(name: string, options?: { persistencePath?: string }) {
    super();
    this.name = name;
    
    if (options?.persistencePath) {
      this.persistencePath = path.join(options.persistencePath, `queue_${name}.json`);
      this.loadFromDisk();
      this.startAutoPersist();
    }
    
    this.startDelayedJobChecker();
    this.startMetricsCalculator();
  }
  
  /**
   * Add a job to the queue
   */
  public async add(name: string, data: any, options?: JobOptions): Promise<Job> {
    const job: Job = {
      id: this.generateJobId(),
      name,
      data,
      status: JobStatus.WAITING,
      priority: options?.priority || JobPriority.NORMAL,
      attempts: 0,
      maxAttempts: options?.attempts || 3,
      createdAt: new Date(),
      licenseKey: options?.licenseKey,
      taskId: options?.taskId,
      userId: options?.userId,
      backoff: options?.backoff || 1000
    };
    
    // Handle delayed jobs
    if (options?.delay) {
      job.delayUntil = new Date(Date.now() + options.delay);
      job.status = JobStatus.DELAYED;
      this.delayedJobs.set(job.delayUntil.toISOString(), job.id);
    } else {
      this.addToWaitingQueue(job);
    }
    
    this.jobs.set(job.id, job);
    this.updateMetrics();
    
    this.emit('job:added', job);
    
    // Start processing if not already running
    if (!this.isProcessing && !this.isPaused) {
      this.startProcessing();
    }
    
    return job;
  }
  
  /**
   * Add multiple jobs in bulk
   */
  public async addBulk(jobs: Array<{ name: string; data: any; options?: JobOptions }>): Promise<Job[]> {
    const addedJobs: Job[] = [];
    
    for (const jobData of jobs) {
      const job = await this.add(jobData.name, jobData.data, jobData.options);
      addedJobs.push(job);
    }
    
    return addedJobs;
  }
  
  /**
   * Register a processor for a job type
   */
  public process(name: string, processor: ProcessorFunction): void;
  public process(name: string, concurrency: number, processor: ProcessorFunction): void;
  public process(processor: ProcessorFunction): void;
  public process(...args: any[]): void {
    let name = '*';
    let concurrency = 1;
    let processor: ProcessorFunction;
    
    if (args.length === 1) {
      processor = args[0];
    } else if (args.length === 2) {
      if (typeof args[0] === 'string') {
        name = args[0];
        processor = args[1];
      } else {
        concurrency = args[0];
        processor = args[1];
      }
    } else {
      name = args[0];
      concurrency = args[1];
      processor = args[2];
    }
    
    this.processors.set(name, processor);
    
    // Create workers based on concurrency
    for (let i = 0; i < concurrency; i++) {
      const worker = new Worker(this, name, processor);
      this.workers.push(worker);
    }
    
    // Start processing
    if (!this.isProcessing && !this.isPaused) {
      this.startProcessing();
    }
  }
  
  /**
   * Get a job by ID
   */
  public getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * Get jobs by status
   */
  public getJobs(status?: JobStatus, limit?: number): Job[] {
    const jobs: Job[] = [];
    
    if (!status) {
      return Array.from(this.jobs.values()).slice(0, limit);
    }
    
    for (const job of this.jobs.values()) {
      if (job.status === status) {
        jobs.push(job);
        if (limit && jobs.length >= limit) break;
      }
    }
    
    return jobs;
  }
  
  /**
   * Get jobs by license key
   */
  public getJobsByLicenseKey(licenseKey: string): Job[] {
    const jobs: Job[] = [];
    
    for (const job of this.jobs.values()) {
      if (job.licenseKey === licenseKey) {
        jobs.push(job);
      }
    }
    
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get jobs by task ID
   */
  public getJobsByTaskId(taskId: string): Job[] {
    const jobs: Job[] = [];
    
    for (const job of this.jobs.values()) {
      if (job.taskId === taskId) {
        jobs.push(job);
      }
    }
    
    return jobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  /**
   * Pause the queue
   */
  public pause(): void {
    this.isPaused = true;
    this.emit('queue:paused');
  }
  
  /**
   * Resume the queue
   */
  public resume(): void {
    this.isPaused = false;
    this.emit('queue:resumed');
    
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }
  
  /**
   * Clear the queue
   */
  public async clear(status?: JobStatus): Promise<void> {
    if (!status) {
      this.jobs.clear();
      this.waitingJobs = [];
      this.activeJobs.clear();
      this.completedJobs = [];
      this.failedJobs = [];
      this.delayedJobs.clear();
    } else {
      const jobsToRemove = this.getJobs(status);
      for (const job of jobsToRemove) {
        this.removeJob(job.id);
      }
    }
    
    this.updateMetrics();
    this.emit('queue:cleared', { status });
  }
  
  /**
   * Get queue metrics
   */
  public getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get queue health status
   */
  public getHealth(): { status: string; details: any } {
    const errorRate = this.metrics.errorRate;
    const activeRatio = this.metrics.active / (this.metrics.waiting + this.metrics.active + 1);
    
    let status = 'healthy';
    if (errorRate > 0.1) status = 'degraded';
    if (errorRate > 0.3) status = 'unhealthy';
    if (this.isPaused) status = 'paused';
    
    return {
      status,
      details: {
        metrics: this.metrics,
        workers: this.workers.length,
        isPaused: this.isPaused,
        isProcessing: this.isProcessing,
        totalJobs: this.jobs.size
      }
    };
  }
  
  /**
   * Start processing jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing || this.isPaused) return;
    
    this.isProcessing = true;
    
    while (!this.isPaused && (this.waitingJobs.length > 0 || this.delayedJobs.size > 0)) {
      // Get next job from waiting queue
      const jobId = this.getNextJob();
      if (!jobId) {
        await this.sleep(100);
        continue;
      }
      
      const job = this.jobs.get(jobId);
      if (!job) continue;
      
      // Find available worker
      const worker = this.findAvailableWorker(job.name);
      if (!worker) {
        // Put job back in queue
        this.addToWaitingQueue(job);
        await this.sleep(100);
        continue;
      }
      
      // Process the job
      this.activeJobs.add(job.id);
      job.status = JobStatus.ACTIVE;
      job.processedAt = new Date();
      
      this.emit('job:active', job);
      
      try {
        const startTime = Date.now();
        const result = await worker.process(job);
        const processingTime = Date.now() - startTime;
        
        job.result = result;
        job.status = JobStatus.COMPLETED;
        job.completedAt = new Date();
        
        this.activeJobs.delete(job.id);
        this.completedJobs.push(job.id);
        this.processingTimes.push(processingTime);
        
        this.emit('job:completed', job);
        
        // Remove if configured
        if (job.maxAttempts > 0) {
          this.removeJob(job.id);
        }
        
      } catch (error: any) {
        job.attempts++;
        job.error = error.message;
        
        if (job.attempts >= job.maxAttempts) {
          job.status = JobStatus.FAILED;
          job.failedAt = new Date();
          
          this.activeJobs.delete(job.id);
          this.failedJobs.push(job.id);
          
          this.emit('job:failed', job);
        } else {
          // Retry with backoff
          job.status = JobStatus.DELAYED;
          job.delayUntil = new Date(Date.now() + job.backoff! * job.attempts);
          
          this.activeJobs.delete(job.id);
          this.delayedJobs.set(job.delayUntil.toISOString(), job.id);
          
          this.emit('job:retry', job);
        }
      }
      
      this.updateMetrics();
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Get next job from queue based on priority
   */
  private getNextJob(): string | undefined {
    if (this.waitingJobs.length === 0) return undefined;
    
    // Sort by priority and get first
    this.waitingJobs.sort((a, b) => {
      const jobA = this.jobs.get(a);
      const jobB = this.jobs.get(b);
      if (!jobA || !jobB) return 0;
      return jobA.priority - jobB.priority;
    });
    
    return this.waitingJobs.shift();
  }
  
  /**
   * Add job to waiting queue
   */
  private addToWaitingQueue(job: Job): void {
    this.waitingJobs.push(job.id);
    job.status = JobStatus.WAITING;
  }
  
  /**
   * Find available worker for job
   */
  private findAvailableWorker(jobName: string): Worker | undefined {
    for (const worker of this.workers) {
      if (!worker.isBusy && (worker.name === jobName || worker.name === '*')) {
        return worker;
      }
    }
    return undefined;
  }
  
  /**
   * Remove job from queue
   */
  private removeJob(jobId: string): void {
    this.jobs.delete(jobId);
    this.waitingJobs = this.waitingJobs.filter(id => id !== jobId);
    this.activeJobs.delete(jobId);
    this.completedJobs = this.completedJobs.filter(id => id !== jobId);
    this.failedJobs = this.failedJobs.filter(id => id !== jobId);
    
    // Remove from delayed jobs
    for (const [key, id] of this.delayedJobs) {
      if (id === jobId) {
        this.delayedJobs.delete(key);
      }
    }
  }
  
  /**
   * Update queue metrics
   */
  private updateMetrics(): void {
    this.metrics.waiting = this.waitingJobs.length;
    this.metrics.active = this.activeJobs.size;
    this.metrics.completed = this.completedJobs.length;
    this.metrics.failed = this.failedJobs.length;
    this.metrics.delayed = this.delayedJobs.size;
    this.metrics.paused = this.isPaused ? 1 : 0;
    
    // Calculate error rate
    const total = this.metrics.completed + this.metrics.failed;
    this.metrics.errorRate = total > 0 ? this.metrics.failed / total : 0;
    
    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      this.metrics.avgProcessingTime = sum / this.processingTimes.length;
    }
  }
  
  /**
   * Check for delayed jobs that are ready
   */
  private startDelayedJobChecker(): void {
    setInterval(() => {
      const now = new Date();
      
      for (const [delayUntilStr, jobId] of this.delayedJobs) {
        const delayUntil = new Date(delayUntilStr);
        
        if (delayUntil <= now) {
          const job = this.jobs.get(jobId);
          if (job) {
            this.delayedJobs.delete(delayUntilStr);
            this.addToWaitingQueue(job);
            
            if (!this.isProcessing && !this.isPaused) {
              this.startProcessing();
            }
          }
        }
      }
    }, 1000);
  }
  
  /**
   * Calculate throughput metrics
   */
  private startMetricsCalculator(): void {
    let lastCompleted = 0;
    
    setInterval(() => {
      const currentCompleted = this.metrics.completed;
      this.metrics.throughput = (currentCompleted - lastCompleted) * 6; // per minute
      lastCompleted = currentCompleted;
      
      // Keep only last 100 processing times
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100);
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Load queue state from disk
   */
  private loadFromDisk(): void {
    if (!this.persistencePath) return;
    
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const state = JSON.parse(data);
        
        // Restore jobs
        for (const jobData of state.jobs) {
          const job = {
            ...jobData,
            createdAt: new Date(jobData.createdAt),
            processedAt: jobData.processedAt ? new Date(jobData.processedAt) : undefined,
            completedAt: jobData.completedAt ? new Date(jobData.completedAt) : undefined,
            failedAt: jobData.failedAt ? new Date(jobData.failedAt) : undefined,
            delayUntil: jobData.delayUntil ? new Date(jobData.delayUntil) : undefined
          };
          
          this.jobs.set(job.id, job);
          
          // Restore to appropriate queue
          if (job.status === JobStatus.WAITING) {
            this.waitingJobs.push(job.id);
          } else if (job.status === JobStatus.DELAYED && job.delayUntil) {
            this.delayedJobs.set(job.delayUntil.toISOString(), job.id);
          } else if (job.status === JobStatus.COMPLETED) {
            this.completedJobs.push(job.id);
          } else if (job.status === JobStatus.FAILED) {
            this.failedJobs.push(job.id);
          }
        }
        
        this.updateMetrics();
      }
    } catch (error) {
      console.error(`Failed to load queue state from disk: ${error}`);
    }
  }
  
  /**
   * Save queue state to disk
   */
  private saveToDisk(): void {
    if (!this.persistencePath) return;
    
    try {
      const state = {
        name: this.name,
        jobs: Array.from(this.jobs.values()),
        metrics: this.metrics,
        timestamp: new Date()
      };
      
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.persistencePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error(`Failed to save queue state to disk: ${error}`);
    }
  }
  
  /**
   * Start auto-persist interval
   */
  private startAutoPersist(): void {
    this.autoPersistInterval = setInterval(() => {
      this.saveToDisk();
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Cleanup resources
   */
  public async close(): Promise<void> {
    this.isPaused = true;
    
    if (this.autoPersistInterval) {
      clearInterval(this.autoPersistInterval);
    }
    
    this.saveToDisk();
    
    this.emit('queue:closed');
  }
}

/**
 * Worker class for processing jobs
 */
class Worker {
  public name: string;
  public isBusy = false;
  private queue: QueueSystem;
  private processor: ProcessorFunction;
  
  constructor(queue: QueueSystem, name: string, processor: ProcessorFunction) {
    this.queue = queue;
    this.name = name;
    this.processor = processor;
  }
  
  async process(job: Job): Promise<any> {
    this.isBusy = true;
    
    try {
      const result = await this.processor(job);
      return result;
    } finally {
      this.isBusy = false;
    }
  }
}

// Export singleton manager for all queues
export class QueueManager {
  private static instance: QueueManager;
  private queues = new Map<string, QueueSystem>();
  
  private constructor() {}
  
  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }
  
  public createQueue(name: string, options?: { persistencePath?: string }): QueueSystem {
    if (!this.queues.has(name)) {
      const queue = new QueueSystem(name, options);
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }
  
  public getQueue(name: string): QueueSystem | undefined {
    return this.queues.get(name);
  }
  
  public async closeAll(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}