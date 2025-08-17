import { SystemMonitor } from '@/lib/system-monitor';
import { HealthChecker } from '@/lib/monitoring';
import { redis } from '@/lib/redis';

describe('Health Monitoring Integration Tests', () => {
  describe('SystemMonitor', () => {
    it('should collect system metrics', async () => {
      const metrics = await SystemMonitor.collectSystemMetrics();
      
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should check service health', async () => {
      const service = {
        name: 'test-service',
        url: 'http://localhost:3000/health',
        expectedStatus: 200,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          ok: true,
        } as Response)
      );

      const health = await SystemMonitor.checkServiceHealth(service);
      
      expect(health.name).toBe('test-service');
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
    });

    it('should detect unhealthy services', async () => {
      const service = {
        name: 'failing-service',
        url: 'http://localhost:3000/health',
      };

      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Connection refused'))
      );

      const health = await SystemMonitor.checkServiceHealth(service);
      
      expect(health.name).toBe('failing-service');
      expect(health.status).toBe('unhealthy');
      expect(health.message).toContain('Connection refused');
    });

    it('should generate alerts for high resource usage', async () => {
      // Mock high CPU usage
      jest.spyOn(SystemMonitor as any, 'collectSystemMetrics').mockResolvedValue({
        cpu: { usage: 85, cores: 4, loadAverage: [2.5, 2.0, 1.8] },
        memory: { total: 8000000000, used: 7000000000, free: 1000000000, percentage: 87.5 },
        disk: { total: 100000000000, used: 92000000000, free: 8000000000, percentage: 92 },
        network: { bytesIn: 1000000, bytesOut: 2000000, packetsIn: 1000, packetsOut: 2000 },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      });

      const alerts = await SystemMonitor.getAlerts();
      
      expect(alerts).toHaveLength(3);
      expect(alerts.some(a => a.category === 'cpu')).toBe(true);
      expect(alerts.some(a => a.category === 'memory')).toBe(true);
      expect(alerts.some(a => a.category === 'disk')).toBe(true);
    });
  });

  describe('HealthChecker', () => {
    beforeEach(() => {
      HealthChecker.register('test-check', async () => true);
    });

    it('should register and execute health checks', async () => {
      const results = await HealthChecker.checkAll();
      
      expect(results).toHaveProperty('test-check');
      expect(results['test-check'].status).toBe('healthy');
    });

    it('should handle failing health checks', async () => {
      HealthChecker.register('failing-check', async () => {
        throw new Error('Check failed');
      });

      const results = await HealthChecker.checkAll();
      
      expect(results['failing-check'].status).toBe('error');
      expect(results['failing-check'].message).toBe('Check failed');
    });

    it('should determine overall health status', async () => {
      HealthChecker.register('healthy-check', async () => true);
      HealthChecker.register('unhealthy-check', async () => false);

      const isHealthy = await HealthChecker.isHealthy();
      
      expect(isHealthy).toBe(false);
    });
  });
});