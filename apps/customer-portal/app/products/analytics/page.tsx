'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import WorkflowDisplay from '@/components/WorkflowDisplay';
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  GitBranch
} from 'lucide-react';

function ProductAnalyticsContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const product = searchParams.get('product') || 'chatbot';

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
  }, [product]);

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

  const StatCard = ({ icon: Icon, label, value, trend }: any) => (
    <div className="rounded-lg p-4" style={{ 
      backgroundColor: 'rgba(58, 64, 64, 0.5)',
      border: '1px solid rgba(169, 189, 203, 0.15)'
    }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2 text-xs" style={{ color: '#4CAF50' }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+{trend}%</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
          <Icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
        </div>
      </div>
    </div>
  );

  const BarChart = ({ data, height = 200 }: any) => {
    const maxValue = Math.max(...data.map((d: any) => d.count));
    
    return (
      <div className="relative" style={{ height }}>
        <div className="flex items-end justify-between h-full">
          {data.map((item: any, idx: number) => (
            <div key={idx} className="flex-1 mx-1 flex flex-col items-center justify-end">
              <div 
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{ 
                  height: `${(item.count / maxValue) * 100}%`,
                  backgroundColor: 'rgb(169, 189, 203)',
                  minHeight: '4px'
                }}
              />
              <span className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                {item.hour || item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data }: any) => {
    const total = data.successful + data.failed + data.partial;
    const successPercent = (data.successful / total) * 100;
    const failedPercent = (data.failed / total) * 100;
    
    return (
      <div className="flex items-center space-x-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="rgba(169, 189, 203, 0.1)"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#4CAF50"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${successPercent * 3.51} 351.86`}
              strokeDashoffset="0"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#ff6464"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${failedPercent * 3.51} 351.86`}
              strokeDashoffset={`-${successPercent * 3.51}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              {Math.round(successPercent)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
            <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              Successful ({data.successful})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff6464' }} />
            <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              Failed ({data.failed})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(169, 189, 203, 0.5)' }} />
            <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              Partial ({data.partial})
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Analytics
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Monitor performance and usage metrics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              className="px-3 py-2 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.2)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <button
              className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(48, 54, 54)'
              }}
            >
              Export Report
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" 
                 style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={MessageSquare}
                label="Total Conversations"
                value={analytics.totalConversations}
                trend={analytics.weeklyGrowth}
              />
              <StatCard 
                icon={Users}
                label="Active Users"
                value={analytics.activeUsers}
              />
              <StatCard 
                icon={Clock}
                label="Avg Response Time"
                value={`${analytics.averageResponseTime}s`}
              />
              <StatCard 
                icon={TrendingUp}
                label="Satisfaction Rate"
                value={`${analytics.satisfactionRate}%`}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <div className="rounded-lg p-6" style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                    Hourly Activity
                  </h3>
                  <Activity className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                </div>
                {analytics.hourlyActivity && analytics.hourlyActivity.length > 0 ? (
                  <BarChart data={analytics.hourlyActivity} />
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    No activity data available
                  </p>
                )}
              </div>

              {/* Response Metrics */}
              <div className="rounded-lg p-6" style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                    Response Success Rate
                  </h3>
                  <PieChart className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                </div>
                {analytics.responseMetrics ? (
                  <DonutChart data={analytics.responseMetrics} />
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    No response data available
                  </p>
                )}
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Questions */}
              <div className="rounded-lg p-6" style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}>
                <h3 className="font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  Top Questions
                </h3>
                <div className="space-y-3">
                  {analytics.topQuestions && analytics.topQuestions.length > 0 ? (
                    analytics.topQuestions.map((q: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                          {q.question}
                        </span>
                        <span className="text-xs ml-2 px-2 py-1 rounded" style={{ 
                          backgroundColor: 'rgba(169, 189, 203, 0.1)',
                          color: 'rgb(169, 189, 203)'
                        }}>
                          {q.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      No questions tracked yet
                    </p>
                  )}
                </div>
              </div>

              {/* Device Types */}
              <div className="rounded-lg p-6" style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}>
                <h3 className="font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  Device Types
                </h3>
                <div className="space-y-3">
                  {analytics.deviceTypes ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                          <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                            Desktop
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${analytics.deviceTypes.desktop}%`,
                                backgroundColor: 'rgb(169, 189, 203)'
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                            {analytics.deviceTypes.desktop}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                          <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                            Mobile
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${analytics.deviceTypes.mobile}%`,
                                backgroundColor: 'rgb(169, 189, 203)'
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                            {analytics.deviceTypes.mobile}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Tablet className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                          <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                            Tablet
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${analytics.deviceTypes.tablet}%`,
                                backgroundColor: 'rgb(169, 189, 203)'
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                            {analytics.deviceTypes.tablet}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      No device data available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Workflows and Skills Section */}
            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  <GitBranch className="h-5 w-5" />
                  Active Workflows & Skills
                </h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  Skills and workflows powering this product from our 310-skill infrastructure
                </p>
              </div>
              <div className="rounded-lg p-6" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}>
                <WorkflowDisplay 
                  productId={product}
                  activeWorkflows={['customer_engagement', 'support_automation', 'analytics_reporting']}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
            <p className="text-lg font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
              No analytics data available
            </p>
            <p className="text-sm mt-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
              Analytics will appear once your product starts receiving traffic
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ProductAnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    }>
      <ProductAnalyticsContent />
    </Suspense>
  );
}