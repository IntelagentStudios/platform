import { redis, metrics } from './redis';
import { logger } from './monitoring';
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

    // Store in Redis for persistence
    await redis.setex('system:metrics:latest', 60, JSON.stringify(metrics));
    await redis.lpush('system:metrics:history', JSON.stringify(metrics));
    await redis.ltrim('system:metrics:history', 0, this.MAX_HISTORY - 1);

    return metrics;
  }

  private static async getDiskUsage(): Promise<any> {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.split('\n').filter(line => line.trim());
        let totalSize = 0;
        let totalFree = 0;

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 3 && parts[1] && parts[2]) {
            totalFree += parseInt(parts[1]) || 0;
            totalSize += parseInt(parts[2]) || 0;
          }
        }

        const used = totalSize - totalFree;
        return {
          total: totalSize,
          used,
          free: totalFree,
          percentage: totalSize > 0 ? Math.round((used / totalSize) * 100 * 100) / 100 : 0,
        };
      } else {
        const { stdout } = await execAsync('df -k / | tail -1');
        const parts = stdout.split(/\s+/);
        const total = parseInt(parts[1]) * 1024;
        const used = parseInt(parts[2]) * 1024;
        const free = parseInt(parts[3]) * 1024;

        return {
          total,
          used,
          free,
          percentage: Math.round((used / total) * 100 * 100) / 100,
        };
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get disk usage');
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }

  private static async getNetworkStats(): Promise<any> {
    // This is a simplified version - in production, you'd want to use more sophisticated monitoring
    const stats = await redis.hgetall('network:stats');
    return {
      bytesIn: parseInt(stats.bytesIn || '0'),
      bytesOut: parseInt(stats.bytesOut || '0'),
      packetsIn: parseInt(stats.packetsIn || '0'),
      packetsOut: parseInt(stats.packetsOut || '0'),
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

      // Get service metrics from Redis
      const errorCount = parseInt(await redis.get(`service:${service.name}:errors`) || '0');
      const requestCount = parseInt(await redis.get(`service:${service.name}:requests`) || '1');
      const errorRate = (errorCount / requestCount) * 100;

      const health: ServiceHealth = {
        name: service.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        uptime: parseInt(await redis.get(`service:${service.name}:uptime`) || '0'),
        responseTime,
        errorRate,
        requestsPerMinute: parseInt(await redis.get(`service:${service.name}:rpm`) || '0'),
        lastCheck: new Date().toISOString(),
        message: isHealthy ? 'Service is operational' : `Unexpected status: ${response.status}`,
      };

      // Update status
      if (health.status === 'unhealthy') {
        await metrics.increment(`service:${service.name}:errors`);
      }
      await metrics.gauge(`service:${service.name}:response_time`, responseTime);

      this.services.set(service.name, health);
      await redis.setex(`service:health:${service.name}`, 60, JSON.stringify(health));

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
      await redis.setex(`service:health:${service.name}`, 60, JSON.stringify(health));
      await metrics.increment(`service:${service.name}:errors`);

      return health;
    }
  }

  static async checkAllServices(): Promise<ServiceHealth[]> {
    const services = [
      { name: 'admin-portal', url: 'http://localhost:3000/api/health' },
      { name: 'customer-portal', url: 'http://localhost:3001/api/health' },
      { name: 'chatbot', url: 'http://localhost:3002/health' },
      { name: 'sales-agent', url: 'http://localhost:3003/health' },
      { name: 'enrichment', url: 'http://localhost:3004/health' },
      { name: 'database', url: 'http://localhost:5432', expectedStatus: 0 }, // PostgreSQL check
      { name: 'redis', url: 'http://localhost:6379', expectedStatus: 0 }, // Redis check
    ];

    const healthChecks = await Promise.all(
      services.map(service => this.checkServiceHealth(service))
    );

    return healthChecks;
  }

  static async getServiceLogs(serviceName: string, lines: number = 100): Promise<string[]> {
    const logs = await redis.lrange(`logs:${serviceName}`, 0, lines - 1);
    return logs;
  }

  static async getErrorLogs(lines: number = 100): Promise<any[]> {
    const errors = await redis.lrange('logs:errors', 0, lines - 1);
    return errors.map(e => {
      try {
        return JSON.parse(e);
      } catch {
        return { message: e, timestamp: new Date().toISOString() };
      }
    });
  }

  static async getMetricsHistory(): Promise<SystemMetrics[]> {
    if (this.metricsHistory.length > 0) {
      return this.metricsHistory;
    }

    // Load from Redis if not in memory
    const history = await redis.lrange('system:metrics:history', 0, this.MAX_HISTORY - 1);
    this.metricsHistory = history.map(h => JSON.parse(h));
    return this.metricsHistory;
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

    // Store alerts
    for (const alert of alerts) {
      await redis.lpush('system:alerts', JSON.stringify(alert));
    }
    await redis.ltrim('system:alerts', 0, 99); // Keep last 100 alerts

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
  // Collect metrics every 30 seconds
  setInterval(async () => {
    try {
      await SystemMonitor.collectSystemMetrics();
    } catch (error) {
      logger.error({ error }, 'Failed to collect system metrics');
    }
  }, 30000);

  // Check service health every minute
  setInterval(async () => {
    try {
      await SystemMonitor.checkAllServices();
    } catch (error) {
      logger.error({ error }, 'Failed to check service health');
    }
  }, 60000);

  // Check for alerts every 5 minutes
  setInterval(async () => {
    try {
      const alerts = await SystemMonitor.getAlerts();
      if (alerts.length > 0) {
        logger.warn({ alerts }, 'System alerts detected');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check alerts');
    }
  }, 300000);

  logger.info('System monitoring started');
};