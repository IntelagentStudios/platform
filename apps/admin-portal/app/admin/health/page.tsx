'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface ServiceHealth {
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

interface HealthData {
  services: ServiceHealth[];
  metrics: {
    cpu: { usage: number; cores: number; loadAverage: number[] };
    memory: { total: number; used: number; free: number; percentage: number };
    disk: { total: number; used: number; free: number; percentage: number };
    network: { bytesIn: number; bytesOut: number };
  };
  history: any[];
}

export default function HealthMonitoringPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleServiceAction = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/admin/services/${serviceName}/${action}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchHealthData();
      }
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Health Monitoring
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time service health and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Auto-refresh
            </label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={fetchHealthData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">CPU Usage</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {healthData?.metrics.cpu.usage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (healthData?.metrics.cpu.usage ?? 0) > 80 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${healthData?.metrics.cpu.usage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Load: {healthData?.metrics.cpu.loadAverage[0].toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Memory</span>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {healthData?.metrics.memory.percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (healthData?.metrics.memory.percentage ?? 0) > 85 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${healthData?.metrics.memory.percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((healthData?.metrics.memory.used ?? 0) / 1024 / 1024 / 1024)}GB / 
              {Math.round((healthData?.metrics.memory.total ?? 0) / 1024 / 1024 / 1024)}GB
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Disk</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {healthData?.metrics.disk.percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (healthData?.metrics.disk.percentage ?? 0) > 90 ? 'bg-red-500' : 'bg-purple-500'
                }`}
                style={{ width: `${healthData?.metrics.disk.percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((healthData?.metrics.disk.free ?? 0) / 1024 / 1024 / 1024)}GB free
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>{Math.round((healthData?.metrics.network.bytesOut ?? 0) / 1024 / 1024)} MB/s</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-blue-500" />
                <span>{Math.round((healthData?.metrics.network.bytesIn ?? 0) / 1024 / 1024)} MB/s</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Services Health */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Service Health Status</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Export Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Service</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Uptime</th>
                <th className="text-left py-3 px-4">Response Time</th>
                <th className="text-left py-3 px-4">Error Rate</th>
                <th className="text-left py-3 px-4">RPM</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {healthData?.services.map((service) => (
                <tr key={service.name} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatUptime(service.uptime)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {service.responseTime}ms
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={service.errorRate > 5 ? 'text-red-600' : ''}>
                      {service.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {service.requestsPerMinute}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {service.status === 'healthy' ? (
                        <button
                          onClick={() => handleServiceAction(service.name, 'restart')}
                          className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Restart"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleServiceAction(service.name, 'start')}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Start"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleServiceAction(service.name, 'stop')}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Stop"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Graph */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance History</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Performance graph will be rendered here
        </div>
      </Card>
    </div>
  );
}