'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  MemoryStick,
  DollarSign,
  Brain,
  Sparkles
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

interface LicenseStats {
  total_licenses: number;
  active_licenses: number;
  suspended_licenses: number;
  products_distribution: Record<string, number>;
  plan_distribution: Record<string, number>;
  total_revenue: number;
  mrr: number;
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [licenseStats, setLicenseStats] = useState<LicenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Quick action to go to Management System
  const goToManagementSystem = () => {
    router.push('/admin/management-system');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, statsRes, licenseRes] = await Promise.all([
          fetch('/api/admin/system/status'),
          fetch('/api/admin/stats'),
          fetch('/api/admin/licenses/stats')
        ]);

        if (statusRes.ok) {
          setStatus(await statusRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (licenseRes.ok) {
          setLicenseStats(await licenseRes.json());
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const healthyServices = status?.services?.filter(s => s.status === 'healthy').length || 0;
  const totalServices = status?.services?.length || 0;
  const systemHealth = status?.healthy ? 'Operational' : 'Issues Detected';
  const criticalAlerts = status?.alerts.filter(a => a.type === 'critical').length || 0;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            System Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and control center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status?.healthy 
              ? 'bg-primary/20 text-primary' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {systemHealth}
          </span>
        </div>
      </header>

      {/* Management System Master Control - Prominent Card */}
      <Card 
        className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
        onClick={goToManagementSystem}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Skills Management System</h2>
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full">
                  MASTER CONTROL
                </span>
              </div>
              <p className="text-muted-foreground">
                310 Skills • 4 Management Agents • Full Automation
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 dark:text-green-400">All Systems Operational</span>
                </span>
                <span className="text-muted-foreground">28 Active Executions</span>
                <span className="text-muted-foreground">45 Queued Tasks</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm font-medium">
              Open Control Panel →
            </button>
            <div className="text-xs text-muted-foreground">
              Click to manage agents & skills
            </div>
          </div>
        </div>
      </Card>

      {/* Critical Alerts - Actionable */}
      {criticalAlerts > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-500 dark:text-red-400/80 mt-1">
                  Database connection issue - DATABASE_URL not configured
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin/system')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Fix Now
            </button>
          </div>
        </div>
      )}

      {/* License & Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/licenses')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Licenses</p>
              <p className="text-2xl font-bold">
                {licenseStats?.active_licenses || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {licenseStats?.total_licenses || 0} total
              </p>
            </div>
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/revenue')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold">
                £{licenseStats?.mrr?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MRR
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/products')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chatbots Active</p>
              <p className="text-2xl font-bold">
                {licenseStats?.products_distribution?.['chatbot'] || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Configured
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/products')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">
                {Object.values(licenseStats?.products_distribution || {}).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Deployed
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* System Metrics Grid - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/services')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Services</p>
              <p className="text-2xl font-bold">
                {healthyServices}/{totalServices}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Healthy</p>
            </div>
            <Server className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/users')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">
                {stats?.users.active || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats?.users.new || 0} new today
              </p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/analytics')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Requests/min</p>
              <p className="text-2xl font-bold">
                {stats?.requests.rpm || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.requests.errors || 0} errors
              </p>
            </div>
            <Activity className="w-8 h-8 text-accent" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/queues')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Queue Jobs</p>
              <p className="text-2xl font-bold">
                {stats?.queues.processing || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.queues.failed || 0} failed
              </p>
            </div>
            <Zap className="w-8 h-8 text-secondary" />
          </div>
        </Card>
      </div>

      {/* System Resources - Clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/system')}
        >
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
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${status?.metrics?.cpu?.usage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {status?.metrics?.cpu?.cores || 0} cores available
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/system')}
        >
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
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (status?.metrics?.memory?.percentage || 0) > 80 
                      ? 'bg-red-400' 
                      : 'bg-primary'
                  }`}
                  style={{ width: `${status?.metrics?.memory?.percentage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((status?.metrics?.memory?.used || 0) / 1024 / 1024 / 1024)}GB / 
              {Math.round((status?.metrics?.memory?.total || 0) / 1024 / 1024 / 1024)}GB
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
          onClick={() => router.push('/admin/system')}
        >
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
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (status?.metrics?.disk?.percentage || 0) > 90 
                      ? 'bg-red-400' 
                      : 'bg-primary'
                  }`}
                  style={{ width: `${status?.metrics?.disk?.percentage || 0}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((status?.metrics?.disk?.free || 0) / 1024 / 1024 / 1024)}GB free
            </div>
          </div>
        </Card>
      </div>

      {/* Service Status Grid - Actionable */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Service Status</h3>
          <span className="text-sm text-muted-foreground">
            Click any service for details
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {status?.services?.map((service: any) => (
            <div 
              key={service.name} 
              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => {
                if (service.name.toLowerCase().includes('database')) {
                  router.push('/admin/database');
                } else if (service.name.toLowerCase().includes('api')) {
                  router.push('/admin/api');
                } else {
                  router.push('/admin/health');
                }
              }}
            >
              <div className="flex items-center gap-3">
                {service.status === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : service.status === 'degraded' ? (
                  <Clock className="w-5 h-5 text-secondary" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    {service.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {service.responseTime}ms
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                service.status === 'healthy' 
                  ? 'bg-primary/20 text-primary'
                  : service.status === 'degraded'
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-red-100 dark:bg-red-950/30 text-red-500'
              }`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
        {status?.services.some((s: any) => s.status !== 'healthy') && (
          <div className="mt-4 pt-4 border-t">
            <button 
              onClick={() => router.push('/admin/system')}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Troubleshoot Issues
            </button>
          </div>
        )}
      </Card>

      {/* Recent Alerts */}
      {status?.alerts && status.alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {status.alerts?.slice(0, 5).map((alert: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'critical' ? 'text-red-400' : 'text-secondary'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.type === 'critical'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-secondary/20 text-secondary'
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