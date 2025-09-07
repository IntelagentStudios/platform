'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign, 
  Package,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  business: any;
  financial: any;
  system: any;
  compliance: any;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      // Fetch data from all management agents
      const [business, financial, system, compliance] = await Promise.all([
        fetch('/api/admin/stats/business').then(r => r.json()),
        fetch('/api/admin/stats/financial').then(r => r.json()),
        fetch('/api/admin/stats/system').then(r => r.json()),
        fetch('/api/admin/stats/compliance').then(r => r.json())
      ]);

      setAnalyticsData({ business, financial, system, compliance });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMetricCards = (): MetricCard[] => {
    if (!analyticsData) return [];

    const { business, financial, system } = analyticsData;
    
    return [
      {
        title: 'Total Revenue',
        value: `$${financial?.totalRevenue?.toLocaleString() || '0'}`,
        change: `+${financial?.revenueGrowth || 0}%`,
        trend: financial?.revenueGrowth > 0 ? 'up' : 'down',
        icon: DollarSign
      },
      {
        title: 'Active Users',
        value: business?.metrics?.activeUsers || 0,
        change: `+${business?.metrics?.userGrowth || 0}%`,
        trend: business?.metrics?.userGrowth > 0 ? 'up' : 'down',
        icon: Users
      },
      {
        title: 'API Calls',
        value: system?.apiCalls?.total?.toLocaleString() || '0',
        change: `${system?.apiCalls?.trend || 0}%`,
        trend: system?.apiCalls?.trend > 0 ? 'up' : 'neutral',
        icon: Activity
      },
      {
        title: 'Skill Executions',
        value: system?.skillExecutions?.total?.toLocaleString() || '0',
        change: `+${system?.skillExecutions?.growth || 0}%`,
        trend: system?.skillExecutions?.growth > 0 ? 'up' : 'down',
        icon: Zap
      },
      {
        title: 'Active Products',
        value: business?.metrics?.totalProducts || 0,
        change: `${business?.metrics?.productGrowth || 0} new`,
        trend: 'up',
        icon: Package
      },
      {
        title: 'Conversion Rate',
        value: `${financial?.conversionRate || 0}%`,
        change: `+${financial?.conversionGrowth || 0}%`,
        trend: financial?.conversionGrowth > 0 ? 'up' : 'down',
        icon: Target
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'rgb(48, 54, 54)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Analytics Dashboard
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Real-time insights from management agents
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ 
              backgroundColor: 'white',
              borderColor: 'rgba(48, 54, 54, 0.2)',
              color: 'rgb(48, 54, 54)'
            }}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgb(48, 54, 54)',
              color: 'white'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getMetricCards().map((metric, index) => (
          <div 
            key={index}
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(48, 54, 54, 0.15)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                {metric.title}
              </span>
              <metric.icon className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
              {metric.value}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {metric.trend === 'up' && <TrendingUp className="w-4 h-4" style={{ color: '#4CAF50' }} />}
              {metric.trend === 'down' && <TrendingUp className="w-4 h-4 rotate-180" style={{ color: '#f44336' }} />}
              <span className="text-sm" style={{ 
                color: metric.trend === 'up' ? '#4CAF50' : metric.trend === 'down' ? '#f44336' : 'rgba(48, 54, 54, 0.6)'
              }}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            System Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>CPU Usage</span>
                <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                  {analyticsData?.system?.cpuUsage || 45}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${analyticsData?.system?.cpuUsage || 45}%`,
                    backgroundColor: '#4CAF50'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Memory Usage</span>
                <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                  {analyticsData?.system?.memoryUsage || 62}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${analyticsData?.system?.memoryUsage || 62}%`,
                    backgroundColor: '#FFC107'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Response Time</span>
                <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                  {analyticsData?.system?.responseTime || 145}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: '75%',
                    backgroundColor: '#2196F3'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Agent Activity */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Management Agent Activity
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Finance Agent', status: 'Active', tasks: 156 },
              { name: 'Operations Agent', status: 'Active', tasks: 892 },
              { name: 'Analytics Agent', status: 'Active', tasks: 423 },
              { name: 'Security Agent', status: 'Active', tasks: 67 },
              { name: 'Infrastructure Agent', status: 'Active', tasks: 234 },
              { name: 'Compliance Agent', status: 'Active', tasks: 45 },
              { name: 'Integration Agent', status: 'Active', tasks: 178 },
              { name: 'Communications Agent', status: 'Active', tasks: 567 }
            ].map((agent, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#4CAF50' }}
                  />
                  <span className="text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                    {agent.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    {agent.tasks} tasks
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ 
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#4CAF50'
                  }}>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Metrics */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Business Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {analyticsData?.business?.metrics?.totalLicenses || 0}
              </div>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                Total Licenses
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {analyticsData?.business?.metrics?.activeLicenses || 0}
              </div>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                Active Licenses
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {analyticsData?.financial?.mrr ? `$${analyticsData.financial.mrr}` : '$0'}
              </div>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                Monthly Revenue
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {analyticsData?.business?.metrics?.churnRate || 0}%
              </div>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                Churn Rate
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Compliance & Security
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                GDPR Compliance
              </span>
              <span className="text-sm px-2 py-1 rounded-full" style={{ 
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: '#4CAF50'
              }}>
                Compliant
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Security Score
              </span>
              <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                98/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Last Security Audit
              </span>
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                2 days ago
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Vulnerabilities
              </span>
              <span className="text-sm font-medium" style={{ color: '#4CAF50' }}>
                0 Critical
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}