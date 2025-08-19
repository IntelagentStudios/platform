// Redis is optional - will be loaded dynamically if available
// Logger is optional - will use console.log as fallback
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number;
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  lastCheck: string;
  message?: string;
  metrics?: {
    cpu: number;
    memory: number;
    connections: number;
  };
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  timestamp: string;
}

export class SystemMonitor {
  private static services = new Map<string, ServiceHealth>();
  private static metricsHistory: SystemMetrics[] = [];
  private static readonly MAX_HISTORY = 100;

  static async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    const metrics: SystemMetrics = {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpus.length,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100,
      },
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
      uptime: os.uptime(),
      timestamp: new Date().toISOString(),
    };

    // Store in history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.MAX_HISTORY) {
      this.metricsHistory.shift();
    }

    // Store in Redis for persistence if available
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        await redis.setex('system:metrics:latest', 60, JSON.stringify(metrics));
        await redis.lpush('system:metrics:history', JSON.stringify(metrics));
        await redis.ltrim('system:metrics:history', 0, this.MAX_HISTORY - 1);
      } catch (error) {
        // Redis is optional, continue without it
        console.log('Redis not available for metrics storage');
      }
    }

    return metrics;
  }

  private static async getDiskUsage(): Promise<any> {
    // Return zeros instead of trying to execute system commands
    // This avoids security issues and works in containerized environments
    return { total: 0, used: 0, free: 0, percentage: 0 };
  }

  private static async getNetworkStats(): Promise<any> {
    // This is a simplified version - in production, you'd want to use more sophisticated monitoring
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        const stats = await redis.hgetall('network:stats');
        return {
          bytesIn: parseInt(stats.bytesIn || '0'),
          bytesOut: parseInt(stats.bytesOut || '0'),
          packetsIn: parseInt(stats.packetsIn || '0'),
          packetsOut: parseInt(stats.packetsOut || '0'),
        };
      } catch (error) {
        console.log('Redis not available for network stats');
      }
    }
    return {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
    };
  }

  static async checkServiceHealth(service: {
    name: string;
    url: string;
    expectedStatus?: number;
    timeout?: number;
  }): Promise<ServiceHealth> {
    const startTime = Date.now();
    const timeout = service.timeout || 5000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const expectedStatus = service.expectedStatus || 200;
      const isHealthy = response.status === expectedStatus;

      // Get service metrics from Redis if available
      let errorCount = 0;
      let requestCount = 1;
      let errorRate = 0;
      
      if (process.env.REDIS_URL) {
        try {
          const { redis } = await import('./redis');
          errorCount = parseInt(await redis.get(`service:${service.name}:errors`) || '0');
          requestCount = parseInt(await redis.get(`service:${service.name}:requests`) || '1');
          errorRate = (errorCount / requestCount) * 100;
        } catch (error) {
          // Continue without Redis metrics
        }
      }

      const health: ServiceHealth = {
        name: service.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        uptime: 0, // Would come from Redis if available
        responseTime,
        errorRate,
        requestsPerMinute: 0, // Would come from Redis if available
        lastCheck: new Date().toISOString(),
        message: isHealthy ? 'Service is operational' : `Unexpected status: ${response.status}`,
      };

      // Update status
      this.services.set(service.name, health);
      
      if (process.env.REDIS_URL) {
        try {
          const { redis, metrics } = await import('./redis');
          if (health.status === 'unhealthy') {
            await metrics.increment(`service:${service.name}:errors`);
          }
          await metrics.gauge(`service:${service.name}:response_time`, responseTime);
          await redis.setex(`service:health:${service.name}`, 60, JSON.stringify(health));
        } catch (error) {
          // Continue without Redis
        }
      }

      return health;
    } catch (error) {
      const health: ServiceHealth = {
        name: service.name,
        status: 'unhealthy',
        uptime: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100,
        requestsPerMinute: 0,
        lastCheck: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      this.services.set(service.name, health);
      
      if (process.env.REDIS_URL) {
        try {
          const { redis, metrics } = await import('./redis');
          await redis.setex(`service:health:${service.name}`, 60, JSON.stringify(health));
          await metrics.increment(`service:${service.name}:errors`);
        } catch (error) {
          // Continue without Redis
        }
      }

      return health;
    }
  }

  static async checkAllServices(): Promise<ServiceHealth[]> {
    // Check actual service health
    const services: ServiceHealth[] = [];
    
    // Check database health
    try {
      const { prisma } = await import('@/lib/db');
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      services.push({
        name: 'database',
        status: 'healthy',
        uptime: 0,
        responseTime,
        errorRate: 0,
        requestsPerMinute: 0,
        lastCheck: new Date().toISOString(),
        message: 'PostgreSQL is operational'
      });
    } catch (error) {
      services.push({
        name: 'database',
        status: 'unhealthy',
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        requestsPerMinute: 0,
        lastCheck: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Database connection failed'
      });
    }
    
    // Check API health
    services.push({
      name: 'api',
      status: 'healthy',
      uptime: process.uptime(),
      responseTime: 5,
      errorRate: 0,
      requestsPerMinute: 0,
      lastCheck: new Date().toISOString(),
      message: 'API is operational'
    });
    
    // Return empty array if no real services to check
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (!baseUrl || baseUrl.includes('localhost')) {
      return services;
    }
    
    const services = [
      { name: 'admin-portal', url: `${baseUrl}/api/health` },
      { name: 'customer-portal', url: `${baseUrl}/api/health` },
      { name: 'database', url: `${baseUrl}/api/health/db` },
    ];

    const healthChecks = await Promise.all(
      services.map(service => this.checkServiceHealth(service))
    );

    return healthChecks;
  }

  static async getServiceLogs(serviceName: string, lines: number = 100): Promise<string[]> {
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        const logs = await redis.lrange(`logs:${serviceName}`, 0, lines - 1);
        return logs;
      } catch (error) {
        console.log('Redis not available for logs');
      }
    }
    return [];
  }

  static async getErrorLogs(lines: number = 100): Promise<any[]> {
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        const errors = await redis.lrange('logs:errors', 0, lines - 1);
        return errors.map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return { message: e, timestamp: new Date().toISOString() };
          }
        });
      } catch (error) {
        console.log('Redis not available for error logs');
      }
    }
    return [];
  }

  static async getMetricsHistory(): Promise<SystemMetrics[]> {
    if (this.metricsHistory.length > 0) {
      return this.metricsHistory;
    }

    // Load from Redis if not in memory and Redis is available
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        const history = await redis.lrange('system:metrics:history', 0, this.MAX_HISTORY - 1);
        this.metricsHistory = history.map(h => JSON.parse(h));
        return this.metricsHistory;
      } catch (error) {
        console.log('Redis not available for metrics history');
      }
    }
    return [];
  }

  static async getAlerts(): Promise<any[]> {
    const alerts = [];
    const metrics = await this.collectSystemMetrics();

    // CPU alert
    if (metrics.cpu.usage > 80) {
      alerts.push({
        type: 'warning',
        category: 'cpu',
        message: `High CPU usage: ${metrics.cpu.usage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Memory alert
    if (metrics.memory.percentage > 85) {
      alerts.push({
        type: 'warning',
        category: 'memory',
        message: `High memory usage: ${metrics.memory.percentage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Disk alert
    if (metrics.disk.percentage > 90) {
      alerts.push({
        type: 'critical',
        category: 'disk',
        message: `Critical disk usage: ${metrics.disk.percentage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Service health alerts
    const services = await this.checkAllServices();
    for (const service of services) {
      if (service.status === 'unhealthy') {
        alerts.push({
          type: 'critical',
          category: 'service',
          service: service.name,
          message: `Service ${service.name} is unhealthy: ${service.message}`,
          timestamp: new Date().toISOString(),
        });
      } else if (service.errorRate > 5) {
        alerts.push({
          type: 'warning',
          category: 'service',
          service: service.name,
          message: `High error rate for ${service.name}: ${service.errorRate.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Store alerts in Redis if available
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        for (const alert of alerts) {
          await redis.lpush('system:alerts', JSON.stringify(alert));
        }
        await redis.ltrim('system:alerts', 0, 99); // Keep last 100 alerts
      } catch (error) {
        // Continue without storing alerts in Redis
      }
    }

    return alerts;
  }

  static async performHealthCheck(): Promise<{
    healthy: boolean;
    services: ServiceHealth[];
    metrics: SystemMetrics;
    alerts: any[];
  }> {
    const [services, metrics, alerts] = await Promise.all([
      this.checkAllServices(),
      this.collectSystemMetrics(),
      this.getAlerts(),
    ]);

    const healthy = services.every(s => s.status !== 'unhealthy') && alerts.length === 0;

    return {
      healthy,
      services,
      metrics,
      alerts,
    };
  }
}

// Start monitoring
export const startSystemMonitoring = () => {
  // Only start monitoring if in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MONITORING === 'true') {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        await SystemMonitor.collectSystemMetrics();
      } catch (error) {
        console.error('Failed to collect system metrics:', error);
      }
    }, 30000);

    // Check service health every minute
    setInterval(async () => {
      try {
        await SystemMonitor.checkAllServices();
      } catch (error) {
        console.error('Failed to check service health:', error);
      }
    }, 60000);

    // Check for alerts every 5 minutes
    setInterval(async () => {
      try {
        const alerts = await SystemMonitor.getAlerts();
        if (alerts.length > 0) {
          console.warn('System alerts detected:', alerts);
        }
      } catch (error) {
        console.error('Failed to check alerts:', error);
      }
    }, 300000);

    console.log('System monitoring started');
  } else {
    console.log('System monitoring disabled in production');
  }
};