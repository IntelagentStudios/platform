'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Package, 
  TrendingUp, 
  PoundSterling, 
  Activity, 
  Shield, 
  Server,
  AlertCircle,
  CheckCircle,
  Brain,
  BarChart3,
  FileText,
  Zap,
  Database,
  Globe,
  CreditCard,
  Lock,
  Settings,
  MessageSquare,
  RefreshCw,
  Key,
  UserCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load the License Management component to avoid affecting initial load
const LicenseManagementTab = dynamic(
  () => import('@/components/admin/LicenseManagementTab'),
  { 
    loading: () => <div style={{ color: 'rgb(48, 54, 54)' }}>Loading license management...</div>,
    ssr: false 
  }
);

interface OverviewData {
  licenses: {
    total: number;
    active: number;
    trial: number;
    expired: number;
  };
  users: {
    total: number;
    verified: number;
    unverified: number;
  };
  productKeys: {
    total: number;
    active: number;
    distribution: Array<{ product: string; _count: number }>;
  };
  revenue: {
    monthly: number;
    currency: string;
  };
  systemHealth: {
    activeInLast24h: number;
    totalApiCalls: number;
    uptime: number;
    responseTime: number;
  };
  recentActivity: Array<{
    timestamp: Date;
    productKey: string;
    conversationId: string;
    type: string;
  }>;
  recentUsers: Array<{
    email: string;
    created_at: Date;
    email_verified: boolean;
    license_key: string | null;
  }>;
}

export default function AdminDashboardPage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchOverviewData();
    }
  }, [isAuthorized]);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/check');
      if (!response.ok) {
        router.push('/admin/login');
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchOverviewData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/overview');
      const data = await response.json();
      setOverviewData(data.overview);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(48, 54, 54)' }}></div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
        <div style={{ color: 'rgb(48, 54, 54)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                Master Admin Dashboard
              </h2>
              <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                Complete platform oversight and control
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <button
                onClick={fetchOverviewData}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: 'rgb(48, 54, 54)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                {isRefreshing ? (
                  <><RefreshCw className="inline h-4 w-4 mr-2 animate-spin" /> Refreshing...</>
                ) : (
                  <><RefreshCw className="inline h-4 w-4 mr-2" /> Refresh</>
                )}
              </button>
              <button 
                onClick={() => setShowAI(!showAI)}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'rgb(48, 54, 54)',
                  color: 'rgb(229, 227, 220)'
                }}
              >
                <Brain className="inline h-4 w-4 mr-2" />
                AI Assistant
              </button>
            </div>
          </div>

          {/* AI Assistant Interface */}
          {showAI && (
            <div className="rounded-lg p-6 border" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(48, 54, 54, 0.2)'
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5" style={{ color: 'rgb(48, 54, 54)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
                  Business Intelligence Assistant
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                Ask questions about your platform operations
              </p>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="What insights do you need?"
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'white',
                      borderColor: 'rgba(48, 54, 54, 0.3)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  />
                  <button className="px-4 py-2 rounded-lg" style={{ 
                    backgroundColor: 'rgb(48, 54, 54)',
                    color: 'rgb(229, 227, 220)'
                  }}>Ask AI</button>
                </div>
              </div>
            </div>
          )}

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full p-1 rounded-lg" style={{ 
              backgroundColor: 'rgba(48, 54, 54, 0.1)'
            }}>
              {['overview', 'licenses', 'financial', 'operations', 'system', 'compliance'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab}
                  className="capitalize rounded-md transition-colors data-[state=active]:shadow-sm"
                  style={{
                    color: 'rgb(48, 54, 54)'
                  }}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Monthly Revenue</span>
                    <PoundSterling className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                    {overviewData.revenue.monthly === 0 ? (
                      <span style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No revenue yet</span>
                    ) : (
                      `£${overviewData.revenue.monthly.toLocaleString()}`
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    {overviewData.licenses.active > 0 
                      ? `${overviewData.licenses.active} active licenses`
                      : 'Start with your first license'}
                  </p>
                </div>

                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Total Licenses</span>
                    <Key className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                    {overviewData.licenses.total}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    <span style={{ color: '#4CAF50' }}>{overviewData.licenses.active} active</span>,{' '}
                    <span style={{ color: '#2196F3' }}>{overviewData.licenses.trial} trial</span>,{' '}
                    <span style={{ color: 'rgba(48, 54, 54, 0.4)' }}>{overviewData.licenses.expired} expired</span>
                  </div>
                </div>

                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Total Users</span>
                    <UserCheck className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                    {overviewData.users.total}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    {overviewData.users.verified} verified, {overviewData.users.unverified} pending
                  </p>
                </div>

                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>System Health</span>
                    <Server className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2" style={{ color: 'rgb(48, 54, 54)' }}>
                    <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
                    Operational
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    {overviewData.systemHealth.uptime}% uptime • {overviewData.systemHealth.responseTime}ms avg
                  </p>
                </div>
              </div>

              {/* Activity and Product Usage */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Activity */}
                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                    Recent Activity
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    Last {overviewData.recentActivity.length} platform events
                  </p>
                  <div className="space-y-3">
                    {overviewData.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
                          <MessageSquare className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                            Chatbot Interaction
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                            Conversation: {activity.conversationId.slice(0, 8)}...
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.4)' }}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overviewData.recentActivity.length === 0 && (
                      <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No recent activity</p>
                    )}
                  </div>
                </div>

                {/* Product Distribution */}
                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                    Product Distribution
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    Active products across {overviewData.productKeys.total} keys
                  </p>
                  <div className="space-y-3">
                    {overviewData.productKeys.distribution.map((product, index) => {
                      const percentage = overviewData.productKeys.total > 0 
                        ? (product._count / overviewData.productKeys.total) * 100 
                        : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize" style={{ color: 'rgb(48, 54, 54)' }}>
                              {product.product}
                            </span>
                            <span style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                              {product._count} keys
                            </span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
                            <div 
                              className="h-2 rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: 'rgb(48, 54, 54)'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {overviewData.productKeys.distribution.length === 0 && (
                      <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                        No product keys issued yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Users */}
              <div className="rounded-lg p-6 border" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(48, 54, 54, 0.15)'
              }}>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                  Recent User Signups
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  Latest users joining the platform
                </p>
                <div className="space-y-2">
                  {overviewData.recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0" 
                         style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                          {user.email}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                          {new Date(user.created_at).toLocaleDateString()} • 
                          {user.license_key ? ' Has license' : ' No license'}
                        </p>
                      </div>
                      <span 
                        className="px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: user.email_verified ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                          color: user.email_verified ? '#4CAF50' : '#FF9800'
                        }}
                      >
                        {user.email_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {overviewData.recentUsers.length === 0 && (
                    <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No recent signups</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* License Management Tab */}
            <TabsContent value="licenses" className="space-y-4">
              <LicenseManagementTab />
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="rounded-lg p-6 border" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(48, 54, 54, 0.15)'
              }}>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                  Financial Overview
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  Revenue metrics and billing status
                </p>
                <div className="text-center py-8" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                  Financial analytics coming soon
                </div>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
                    License Management
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: Users, text: 'View All Licenses' },
                      { icon: Shield, text: 'Generate License Keys' },
                      { icon: Package, text: 'Manage Products' },
                      { icon: Settings, text: 'Configure Pricing' }
                    ].map((item, index) => (
                      <button 
                        key={index}
                        className="w-full text-left px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                        style={{ 
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(48, 54, 54, 0.2)',
                          color: 'rgb(48, 54, 54)'
                        }}
                      >
                        <item.icon className="inline h-4 w-4 mr-2" />
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg p-6 border" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(48, 54, 54, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: FileText, text: 'Generate Reports' },
                      { icon: MessageSquare, text: 'Send Announcement' },
                      { icon: Database, text: 'Database Backup' },
                      { icon: Zap, text: 'Run Diagnostics' }
                    ].map((item, index) => (
                      <button 
                        key={index}
                        className="w-full text-left px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                        style={{ 
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(48, 54, 54, 0.2)',
                          color: 'rgb(48, 54, 54)'
                        }}
                      >
                        <item.icon className="inline h-4 w-4 mr-2" />
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-4">
              <div className="rounded-lg p-6 border" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(48, 54, 54, 0.15)'
              }}>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                  System Status
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  Active in last 24h: {overviewData.systemHealth.activeInLast24h} events
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: 'API Gateway', status: 'Operational', detail: `Response time: ${overviewData.systemHealth.responseTime}ms` },
                    { name: 'Database', status: 'Operational', detail: 'Connections: Healthy' },
                    { name: 'Services', status: 'All Running', detail: `Uptime: ${overviewData.systemHealth.uptime}%` }
                  ].map((service, index) => (
                    <div key={index} className="p-4 rounded-lg border" style={{ 
                      backgroundColor: 'rgba(48, 54, 54, 0.05)',
                      borderColor: 'rgba(48, 54, 54, 0.1)'
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                          {service.name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded" style={{ 
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          color: '#4CAF50'
                        }}>
                          {service.status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                        {service.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <div className="rounded-lg p-6 border" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(48, 54, 54, 0.15)'
              }}>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                  Compliance & Security
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  Platform compliance status
                </p>
                <div className="text-center py-8" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                  Compliance dashboard coming soon
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}