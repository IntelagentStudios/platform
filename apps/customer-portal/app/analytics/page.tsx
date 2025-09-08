'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    // Check authentication
        fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // TODO: Connect to real data sources (PostgreSQL/Skills Matrix)
  const metrics = [
    { 
      label: 'Total Revenue', 
      value: '-', 
      change: 'No data', 
      trend: 'neutral',
      icon: DollarSign
    },
    { 
      label: 'Active Users', 
      value: '-', 
      change: 'No data', 
      trend: 'neutral',
      icon: Users
    },
    { 
      label: 'API Calls', 
      value: '-', 
      change: 'No data', 
      trend: 'neutral',
      icon: Activity
    },
    { 
      label: 'Products Active', 
      value: '1', 
      change: 'Chatbot', 
      trend: 'neutral',
      icon: Package
    }
  ];

  // TODO: Connect to real usage data from PostgreSQL
  const productMetrics = [
    { name: 'Chatbot', usage: 'Active', revenue: '-', growth: 'No data' }
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Analytics
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Track your performance and usage metrics
            </p>
          </div>
          {/* Date Range Selector */}
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-transparent"
            style={{ 
              borderColor: 'rgba(169, 189, 203, 0.2)',
              color: 'rgb(229, 227, 220)'
            }}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  {metric.label}
                </span>
                <metric.icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                {metric.value}
              </div>
              <div className="flex items-center space-x-2">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4" style={{ color: '#4CAF50' }} />
                ) : metric.trend === 'down' ? (
                  <ArrowDownRight className="h-4 w-4" style={{ color: '#ff6464' }} />
                ) : null}
                <span className="text-sm" style={{ 
                  color: metric.trend === 'up' ? '#4CAF50' : 
                         metric.trend === 'down' ? '#ff6464' : 
                         'rgba(169, 189, 203, 0.8)'
                }}>
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Revenue Trend
            </h2>
            <div className="h-64 flex items-center justify-center">
              <span style={{ color: 'rgba(169, 189, 203, 0.6)' }}>No data available</span>
            </div>
          </div>

          {/* Usage Chart */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              API Usage
            </h2>
            <div className="h-64 flex items-center justify-center">
              <span style={{ color: 'rgba(169, 189, 203, 0.6)' }}>No data available</span>
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div 
          className="rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
            Product Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <th className="text-left py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Product
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Usage
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody>
                {productMetrics.map((product, idx) => (
                  <tr 
                    key={idx}
                    className="border-b hover:bg-opacity-10"
                    style={{ borderColor: 'rgba(169, 189, 203, 0.05)' }}
                  >
                    <td className="py-4 px-4" style={{ color: 'rgb(229, 227, 220)' }}>
                      {product.name}
                    </td>
                    <td className="py-4 px-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                      {product.usage}
                    </td>
                    <td className="py-4 px-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                      {product.revenue}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" style={{ color: '#4CAF50' }} />
                        <span style={{ color: '#4CAF50' }}>{product.growth}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}