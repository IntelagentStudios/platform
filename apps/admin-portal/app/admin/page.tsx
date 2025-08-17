'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Activity, 
  Users, 
  Database, 
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';

interface SystemStatus {
  healthy: boolean;
  services: any[];
  metrics: any;
  alerts: any[];
}

interface Stats {
  users: { total: number; active: number; new: number };
  requests: { total: number; rpm: number; errors: number };
  database: { connections: number; queries: number; slow: number };
  queues: { total: number; processing: number; failed: number };
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, statsRes] = await Promise.all([
          fetch('/api/admin/system/status'),
          fetch('/api/admin/stats')
        ]);

        if (statusRes.ok) {
          setStatus(await statusRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const healthyServices = status?.services.filter(s => s.status === 'healthy').length || 0;
  const totalServices = status?.services.length || 0;
  const systemHealth = status?.healthy ? 'Operational' : 'Issues Detected';
  const criticalAlerts = status?.alerts.filter(a => a.type === 'critical').length || 0;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time monitoring and control center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status?.healthy 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {systemHealth}
          </span>
        </div>
      </header>

      {/* Critical Alerts */}
      {criticalAlerts > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Immediate attention required
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Services</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthyServices}/{totalServices}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Healthy</p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.users.active || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                +{stats?.users.new || 0} new today
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Requests/min</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.requests.rpm || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.requests.errors || 0} errors
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Queue Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.queues.processing || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.queues.failed || 0} failed
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            CPU Usage
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Usage</span>
                <span>{status?.metrics?.cpu?.usage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${status?.metrics?.cpu?.usage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {status?.metrics?.cpu?.cores || 0} cores available
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MemoryStick className="w-5 h-5" />
            Memory
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Usage</span>
                <span>{status?.metrics?.memory?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (status?.metrics?.memory?.percentage || 0) > 80 
                      ? 'bg-red-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${status?.metrics?.memory?.percentage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((status?.metrics?.memory?.used || 0) / 1024 / 1024 / 1024)}GB / 
              {Math.round((status?.metrics?.memory?.total || 0) / 1024 / 1024 / 1024)}GB
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Disk Space
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Usage</span>
                <span>{status?.metrics?.disk?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (status?.metrics?.disk?.percentage || 0) > 90 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${status?.metrics?.disk?.percentage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((status?.metrics?.disk?.free || 0) / 1024 / 1024 / 1024)}GB free
            </div>
          </div>
        </Card>
      </div>

      {/* Service Status Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {status?.services.map((service: any) => (
            <div key={service.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {service.status === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : service.status === 'degraded' ? (
                  <Clock className="w-5 h-5 text-yellow-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {service.responseTime}ms
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                service.status === 'healthy' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : service.status === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Alerts */}
      {status?.alerts && status.alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {status.alerts.slice(0, 5).map((alert: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.type === 'critical'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}