'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Globe,
  Database,
  Zap,
  Users,
  DollarSign,
  Target,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  throughput: {
    current: number;
    peak: number;
    average: number;
  };
  errorRate: number;
  availability: number;
  apdex: number;
}

interface EndpointMetrics {
  endpoint: string;
  method: string;
  calls: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
}

interface DatabaseMetrics {
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  cache: {
    hitRate: number;
    misses: number;
    evictions: number;
  };
}

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    churn: number;
  };
  conversion: {
    rate: number;
    funnel: {
      visitors: number;
      signups: number;
      activated: number;
      paying: number;
    };
  };
}

export default function PerformanceAnalyticsPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointMetrics[]>([]);
  const [database, setDatabase] = useState<DatabaseMetrics | null>(null);
  const [business, setBusiness] = useState<BusinessMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAnalytics();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const fetchAnalytics = async () => {
    try {
      const [metricsRes, endpointsRes, dbRes, businessRes] = await Promise.all([
        fetch(`/api/admin/analytics/performance?range=${timeRange}`),
        fetch(`/api/admin/analytics/endpoints?range=${timeRange}`),
        fetch(`/api/admin/analytics/database?range=${timeRange}`),
        fetch(`/api/admin/analytics/business?range=${timeRange}`)
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (endpointsRes.ok) setEndpoints(await endpointsRes.json());
      if (dbRes.ok) setDatabase(await dbRes.json());
      if (businessRes.ok) setBusiness(await businessRes.json());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApdexColor = (score: number) => {
    if (score >= 0.94) return 'text-green-600';
    if (score >= 0.85) return 'text-yellow-600';
    if (score >= 0.70) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
            Performance Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time performance metrics and business analytics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

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
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Response Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics?.responseTime.avg.toFixed(0)}ms</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">P95: {metrics?.responseTime.p95}ms</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Throughput</span>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatNumber(metrics?.throughput.current || 0)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">req/min</span>
              {metrics && metrics.throughput.current > metrics.throughput.average ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Error Rate</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics?.errorRate.toFixed(2)}%</p>
            <div className="text-xs text-gray-500 mt-1">
              Target: &lt;1%
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Availability</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{metrics?.availability.toFixed(2)}%</p>
            <div className="text-xs text-gray-500 mt-1">
              SLA: 99.9%
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Apdex Score</span>
            <BarChart3 className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${getApdexColor(metrics?.apdex || 0)}`}>
              {metrics?.apdex.toFixed(2)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Target: &gt;0.85
            </div>
          </div>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Current MRR</span>
                <span className="text-xl font-bold">
                  {formatCurrency(business?.revenue.current || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {business && business.revenue.growth > 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      +{business.revenue.growth.toFixed(1)}% vs last period
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {business?.revenue.growth.toFixed(1)}% vs last period
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ARPU</span>
                <span className="font-medium">
                  {formatCurrency((business?.revenue.current || 0) / (business?.users.total || 1))}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">LTV</span>
                <span className="font-medium">
                  {formatCurrency(((business?.revenue.current || 0) / (business?.users.total || 1)) * 24)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Metrics
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-xl font-bold">{formatNumber(business?.users.total || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-xl font-bold">{formatNumber(business?.users.active || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">New Users</p>
                <p className="text-xl font-bold text-green-600">
                  +{formatNumber(business?.users.new || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Churn Rate</p>
                <p className="text-xl font-bold text-red-600">
                  {business?.users.churn.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500 mb-2">Engagement Rate</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${((business?.users.active || 0) / (business?.users.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((business?.users.active || 0) / (business?.users.total || 1) * 100).toFixed(1)}% active
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Conversion Funnel
          </h3>
          <div className="space-y-3">
            {business?.conversion.funnel && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Visitors</span>
                    <span className="font-medium">{formatNumber(business.conversion.funnel.visitors)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-6"></div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Signups</span>
                    <span className="font-medium">{formatNumber(business.conversion.funnel.signups)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-6">
                    <div 
                      className="bg-blue-500 h-6 rounded"
                      style={{ width: `${(business.conversion.funnel.signups / business.conversion.funnel.visitors) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((business.conversion.funnel.signups / business.conversion.funnel.visitors) * 100).toFixed(1)}% conversion
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Activated</span>
                    <span className="font-medium">{formatNumber(business.conversion.funnel.activated)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-6">
                    <div 
                      className="bg-green-500 h-6 rounded"
                      style={{ width: `${(business.conversion.funnel.activated / business.conversion.funnel.signups) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((business.conversion.funnel.activated / business.conversion.funnel.signups) * 100).toFixed(1)}% activation
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Paying</span>
                    <span className="font-medium">{formatNumber(business.conversion.funnel.paying)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-6">
                    <div 
                      className="bg-purple-500 h-6 rounded"
                      style={{ width: `${(business.conversion.funnel.paying / business.conversion.funnel.activated) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((business.conversion.funnel.paying / business.conversion.funnel.activated) * 100).toFixed(1)}% monetization
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Database Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Query Volume</p>
            <p className="text-2xl font-bold">{formatNumber(database?.queryCount || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Total queries</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Avg Query Time</p>
            <p className="text-2xl font-bold">{database?.avgQueryTime.toFixed(1)}ms</p>
            <p className="text-xs text-gray-500 mt-1">
              {database?.slowQueries || 0} slow queries
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Connections</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{database?.connections.active || 0}</p>
              <span className="text-sm text-gray-500">/ {database?.connections.total || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {database?.connections.idle || 0} idle
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Cache Hit Rate</p>
            <p className="text-2xl font-bold">{database?.cache.hitRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatNumber(database?.cache.misses || 0)} misses
            </p>
          </div>
        </div>
      </Card>

      {/* Top Endpoints */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top Endpoints by Traffic</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Calls</th>
                <th className="text-left py-3 px-4">Avg Time</th>
                <th className="text-left py-3 px-4">P95 Time</th>
                <th className="text-left py-3 px-4">Error Rate</th>
                <th className="text-left py-3 px-4">Throughput</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.slice(0, 10).map((endpoint, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-sm font-mono">
                    {endpoint.endpoint}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatNumber(endpoint.calls)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {endpoint.avgResponseTime.toFixed(0)}ms
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {endpoint.p95ResponseTime.toFixed(0)}ms
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={endpoint.errorRate > 1 ? 'text-red-600' : ''}>
                      {endpoint.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {endpoint.throughput.toFixed(1)}/min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Trends Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Performance trends chart will be rendered here with Chart.js or Recharts
        </div>
      </Card>
    </div>
  );
}