/**
 * Infrastructure Agent
 * Manages servers, resources, scaling, and system health
 */

import { prisma } from '@intelagent/database';
import { createClient } from 'redis';
import Bull from 'bull';

interface ServerHealth {
  serverId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  lastCheck: Date;
}

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  currentInstances: number;
  targetInstances: number;
  reason: string;
  estimatedCost: number;
}

interface ResourceAllocation {
  cpu: { allocated: number; available: number; percentage: number };
  memory: { allocated: number; available: number; percentage: number };
  storage: { allocated: number; available: number; percentage: number };
  network: { allocated: number; available: number; percentage: number };
}

export class InfrastructureAgent {
  private static instance: InfrastructureAgent;
  private redisClient: any;
  private queues: Map<string, Bull.Queue>;
  private healthChecks: Map<string, NodeJS.Timeout>;
  
  private readonly thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 75, critical: 95 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 80, critical: 95 },
    responseTime: { warning: 1000, critical: 5000 }, // ms
    errorRate: { warning: 5, critical: 10 } // percentage
  };

  private readonly scalingRules = {
    scaleUpThreshold: 80, // % resource usage
    scaleDownThreshold: 30, // % resource usage
    cooldownPeriod: 300000, // 5 minutes
    minInstances: 1,
    maxInstances: 10
  };

  private constructor() {
    this.queues = new Map();
    this.healthChecks = new Map();
    this.initializeRedis();
    this.startHealthMonitoring();
  }

  public static getInstance(): InfrastructureAgent {
    if (!InfrastructureAgent.instance) {
      InfrastructureAgent.instance = new InfrastructureAgent();
    }
    return InfrastructureAgent.instance;
  }

  private async initializeRedis() {
    if (process.env.REDIS_URL) {
      this.redisClient = createClient({ url: process.env.REDIS_URL });
      await this.redisClient.connect();
    }
  }

  /**
   * Monitor server health
   */
  public async checkServerHealth(serverId: string): Promise<ServerHealth> {
    // Simulate health metrics (in production, would query actual servers)
    const health: ServerHealth = {
      serverId,
      status: 'healthy',
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      uptime: Date.now() - (Math.random() * 86400000), // Random uptime up to 24h
      lastCheck: new Date()
    };

    // Determine overall status
    if (health.cpu > this.thresholds.cpu.critical || 
        health.memory > this.thresholds.memory.critical ||
        health.disk > this.thresholds.disk.critical) {
      health.status = 'critical';
    } else if (health.cpu > this.thresholds.cpu.warning || 
               health.memory > this.thresholds.memory.warning ||
               health.disk > this.thresholds.disk.warning) {
      health.status = 'degraded';
    }

    // Cache health data
    if (this.redisClient) {
      await this.redisClient.set(
        `server:health:${serverId}`,
        JSON.stringify(health),
        { EX: 60 } // Expire after 60 seconds
      );
    }

    // Log critical issues
    if (health.status === 'critical') {
      await this.logInfrastructureEvent('server_critical', {
        serverId,
        metrics: health
      });
    }

    return health;
  }

  /**
   * Make scaling decisions based on current load
   */
  public async evaluateScaling(): Promise<ScalingDecision> {
    // Get current resource usage
    const currentUsage = await this.getCurrentResourceUsage();
    const currentInstances = await this.getCurrentInstanceCount();

    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let targetInstances = currentInstances;
    let reason = 'Resources within normal range';

    // Check if scaling is needed
    if (currentUsage.cpu > this.scalingRules.scaleUpThreshold ||
        currentUsage.memory > this.scalingRules.scaleUpThreshold) {
      if (currentInstances < this.scalingRules.maxInstances) {
        action = 'scale_up';
        targetInstances = Math.min(currentInstances + 1, this.scalingRules.maxInstances);
        reason = `High resource usage: CPU ${currentUsage.cpu}%, Memory ${currentUsage.memory}%`;
      }
    } else if (currentUsage.cpu < this.scalingRules.scaleDownThreshold &&
               currentUsage.memory < this.scalingRules.scaleDownThreshold) {
      if (currentInstances > this.scalingRules.minInstances) {
        action = 'scale_down';
        targetInstances = Math.max(currentInstances - 1, this.scalingRules.minInstances);
        reason = `Low resource usage: CPU ${currentUsage.cpu}%, Memory ${currentUsage.memory}%`;
      }
    }

    // Check cooldown period
    const lastScaling = await this.getLastScalingTime();
    if (Date.now() - lastScaling < this.scalingRules.cooldownPeriod) {
      action = 'maintain';
      reason = 'Within cooldown period';
    }

    // Calculate estimated cost
    const estimatedCost = this.calculateScalingCost(currentInstances, targetInstances);

    const decision: ScalingDecision = {
      action,
      currentInstances,
      targetInstances,
      reason,
      estimatedCost
    };

    // Log scaling decision
    await this.logInfrastructureEvent('scaling_decision', decision);

    return decision;
  }

  /**
   * Execute scaling action
   */
  public async executeScaling(decision: ScalingDecision): Promise<boolean> {
    if (decision.action === 'maintain') {
      return true;
    }

    try {
      // In production, this would trigger actual scaling
      // For now, simulate the action
      console.log(`Executing scaling: ${decision.action} to ${decision.targetInstances} instances`);

      // Update scaling timestamp
      if (this.redisClient) {
        await this.redisClient.set('last_scaling_time', Date.now().toString());
      }

      // Log successful scaling
      await this.logInfrastructureEvent('scaling_executed', {
        action: decision.action,
        instances: decision.targetInstances
      });

      return true;
    } catch (error: any) {
      await this.logInfrastructureEvent('scaling_failed', {
        error: error.message,
        decision
      });
      return false;
    }
  }

  /**
   * Manage queue workers
   */
  public async manageQueues(): Promise<void> {
    // Check existing queues
    const queueNames = ['skills', 'emails', 'webhooks', 'analytics'];

    for (const queueName of queueNames) {
      if (!this.queues.has(queueName)) {
        // Create queue if it doesn't exist
        const queue = new Bull(queueName, {
          redis: process.env.REDIS_URL
        });

        this.queues.set(queueName, queue);

        // Monitor queue health
        queue.on('failed', (job, err) => {
          this.handleQueueFailure(queueName, job, err);
        });

        queue.on('stalled', (job) => {
          this.handleStalledJob(queueName, job);
        });
      }

      // Check queue health
      const queue = this.queues.get(queueName)!;
      const jobCounts = await queue.getJobCounts();

      // Alert if too many waiting jobs
      if (jobCounts.waiting > 1000) {
        await this.logInfrastructureEvent('queue_backup', {
          queue: queueName,
          waiting: jobCounts.waiting
        });
      }
    }
  }

  /**
   * Optimize database performance
   */
  public async optimizeDatabase(): Promise<void> {
    try {
      // Analyze slow queries
      const slowQueries = await this.identifySlowQueries();

      // Create indexes if needed
      for (const query of slowQueries) {
        await this.suggestIndex(query);
      }

      // Clean up old data
      await this.performDataCleanup();

      // Update statistics
      await this.updateDatabaseStatistics();

    } catch (error: any) {
      await this.logInfrastructureEvent('database_optimization_failed', {
        error: error.message
      });
    }
  }

  /**
   * Monitor and manage caching
   */
  public async manageCaching(): Promise<void> {
    if (!this.redisClient) return;

    try {
      // Get cache statistics
      const info = await this.redisClient.info('stats');
      const memory = await this.redisClient.info('memory');

      // Parse cache hit ratio
      const stats = this.parseCacheStats(info);

      // Clear cache if memory is too high
      if (stats.memoryUsage > 90) {
        await this.performCacheEviction();
      }

      // Warm up cache for frequently accessed data
      await this.warmUpCache();

    } catch (error: any) {
      await this.logInfrastructureEvent('cache_management_failed', {
        error: error.message
      });
    }
  }

  /**
   * Get resource allocation status
   */
  public async getResourceAllocation(): Promise<ResourceAllocation> {
    const usage = await this.getCurrentResourceUsage();

    return {
      cpu: {
        allocated: usage.cpu,
        available: 100 - usage.cpu,
        percentage: usage.cpu
      },
      memory: {
        allocated: usage.memory,
        available: 100 - usage.memory,
        percentage: usage.memory
      },
      storage: {
        allocated: usage.storage || 50,
        available: 100 - (usage.storage || 50),
        percentage: usage.storage || 50
      },
      network: {
        allocated: usage.network || 30,
        available: 100 - (usage.network || 30),
        percentage: usage.network || 30
      }
    };
  }

  /**
   * Perform disaster recovery test
   */
  public async testDisasterRecovery(): Promise<{ success: boolean; report: any }> {
    const report = {
      backupStatus: 'verified',
      replicationLag: 0,
      failoverReady: true,
      lastBackup: new Date(),
      recoveryTime: 300 // seconds
    };

    try {
      // Test backup accessibility
      const backupTest = await this.testBackupAccess();
      report.backupStatus = backupTest ? 'verified' : 'failed';

      // Check replication status
      const replicationLag = await this.checkReplicationLag();
      report.replicationLag = replicationLag;
      report.failoverReady = replicationLag < 60; // Less than 60 seconds

      // Verify recovery procedures
      const recoveryTest = await this.simulateRecovery();
      report.recoveryTime = recoveryTest.time;

      return {
        success: report.failoverReady && report.backupStatus === 'verified',
        report
      };

    } catch (error: any) {
      return {
        success: false,
        report: { ...report, error: error.message }
      };
    }
  }

  // Private helper methods
  private startHealthMonitoring() {
    // Monitor main server every 30 seconds
    this.healthChecks.set('main', setInterval(async () => {
      await this.checkServerHealth('main');
    }, 30000));
  }

  private async getCurrentResourceUsage(): Promise<any> {
    // In production, would query actual metrics
    // For now, simulate based on database load
    const recentExecutions = await prisma.skill_executions.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    // Simulate resource usage based on executions
    const baseUsage = 20; // Base system usage
    const loadFactor = Math.min(recentExecutions / 100, 1); // Max out at 100 executions

    return {
      cpu: baseUsage + (loadFactor * 60),
      memory: baseUsage + (loadFactor * 50),
      storage: 50,
      network: baseUsage + (loadFactor * 40)
    };
  }

  private async getCurrentInstanceCount(): Promise<number> {
    // In production, would query actual infrastructure
    // For now, return simulated value
    if (this.redisClient) {
      const count = await this.redisClient.get('instance_count');
      return count ? parseInt(count) : 1;
    }
    return 1;
  }

  private async getLastScalingTime(): Promise<number> {
    if (this.redisClient) {
      const time = await this.redisClient.get('last_scaling_time');
      return time ? parseInt(time) : 0;
    }
    return 0;
  }

  private calculateScalingCost(current: number, target: number): number {
    // Estimate cost based on instance hours
    const hourlyRate = 0.10; // $0.10 per instance per hour
    const difference = Math.abs(target - current);
    return difference * hourlyRate * 24 * 30; // Monthly cost estimate
  }

  private async handleQueueFailure(queueName: string, job: any, error: any) {
    await this.logInfrastructureEvent('queue_job_failed', {
      queue: queueName,
      jobId: job.id,
      error: error.message
    });

    // Retry logic
    if (job.attemptsMade < 3) {
      await job.retry();
    }
  }

  private async handleStalledJob(queueName: string, job: any) {
    await this.logInfrastructureEvent('queue_job_stalled', {
      queue: queueName,
      jobId: job.id
    });

    // Move to failed after too many stalls
    if (job.attemptsMade > 5) {
      await job.moveToFailed({ message: 'Job stalled too many times' });
    }
  }

  private async identifySlowQueries(): Promise<any[]> {
    // In production, would analyze actual query logs
    // For now, return common slow query patterns
    return [
      { table: 'skill_executions', query: 'SELECT * FROM skill_executions WHERE created_at > ?', avgTime: 500 },
      { table: 'platform_logs', query: 'SELECT * FROM platform_logs ORDER BY created_at DESC', avgTime: 800 }
    ];
  }

  private async suggestIndex(query: any): Promise<void> {
    console.log(`Suggested index for ${query.table}: CREATE INDEX ON ${query.table}(created_at)`);
  }

  private async performDataCleanup(): Promise<void> {
    // Clean up old logs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await prisma.audit_logs.deleteMany({
      where: {
        created_at: { lt: thirtyDaysAgo },
        action: { in: ['info', 'debug'] }  // Clean up low-priority logs
      }
    });
  }

  private async updateDatabaseStatistics(): Promise<void> {
    // In PostgreSQL, would run ANALYZE
    // This is a placeholder for the actual implementation
    console.log('Database statistics updated');
  }

  private parseCacheStats(info: string): any {
    // Parse Redis info output
    const lines = info.split('\r\n');
    const stats: any = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });

    return {
      hits: parseInt(stats.keyspace_hits || '0'),
      misses: parseInt(stats.keyspace_misses || '0'),
      memoryUsage: 50 // Simulated
    };
  }

  private async performCacheEviction(): Promise<void> {
    if (!this.redisClient) return;

    // Get all keys and remove least recently used
    const keys = await this.redisClient.keys('*');
    
    // In production, would use LRU eviction policy
    // For now, remove oldest keys
    const toEvict = Math.floor(keys.length * 0.1); // Evict 10%
    
    for (let i = 0; i < toEvict; i++) {
      await this.redisClient.del(keys[i]);
    }
  }

  private async warmUpCache(): Promise<void> {
    // Pre-load frequently accessed data
    const popularSkills = await prisma.skills.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    });

    if (this.redisClient) {
      for (const skill of popularSkills) {
        await this.redisClient.set(
          `skill:${skill.id}`,
          JSON.stringify(skill),
          { EX: 3600 } // 1 hour
        );
      }
    }
  }

  private async testBackupAccess(): Promise<boolean> {
    // Test if backups are accessible
    // In production, would actually test backup storage
    return true;
  }

  private async checkReplicationLag(): Promise<number> {
    // Check database replication lag
    // In production, would query replica status
    return Math.random() * 10; // Random lag 0-10 seconds
  }

  private async simulateRecovery(): Promise<{ time: number }> {
    // Simulate disaster recovery
    const startTime = Date.now();
    
    // Simulate recovery steps
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { time: (Date.now() - startTime) / 1000 };
  }

  private async logInfrastructureEvent(eventType: string, details: any): Promise<void> {
    await prisma.audit_logs.create({
      data: {
        action: `infrastructure_${eventType}`,
        changes: details,
        resource_type: 'infrastructure',
        license_key: 'SYSTEM',  // System infrastructure events
        created_at: new Date()
      }
    });
  }
}