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
    loading: () => <div className="text-purple-600">Loading license management...</div>,
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Checking authorization...</div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Master Admin Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Complete platform oversight and control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button
              onClick={fetchOverviewData}
              disabled={isRefreshing}
              className="bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600"
            >
              {isRefreshing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Refreshing...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Refresh</>
              )}
            </Button>
            <Button 
              onClick={() => setShowAI(!showAI)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* AI Assistant Interface */}
        {showAI && (
          <Card className="border-2 border-purple-600 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Brain className="h-5 w-5 text-purple-600" />
                Business Intelligence Assistant
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ask questions about your platform operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="What insights do you need?"
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-purple-300 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">Ask AI</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">Revenue forecast</Button>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">User analytics</Button>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">Growth opportunities</Button>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">System optimization</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full bg-white border-2 border-purple-200">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="licenses" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              Licenses
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              Financial
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              Operations
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              System
            </TabsTrigger>
            <TabsTrigger 
              value="compliance" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-purple-600"
            >
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
                  <PoundSterling className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {overviewData.revenue.monthly === 0 ? (
                      <span className="text-gray-400">No revenue yet</span>
                    ) : (
                      `£${overviewData.revenue.monthly.toLocaleString()}`
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData.licenses.active > 0 
                      ? `${overviewData.licenses.active} active licenses`
                      : 'Start with your first license'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Licenses</CardTitle>
                  <Key className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overviewData.licenses.total}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">{overviewData.licenses.active} active</span>,{' '}
                    <span className="text-blue-600">{overviewData.licenses.trial} trial</span>,{' '}
                    <span className="text-gray-400">{overviewData.licenses.expired} expired</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overviewData.users.total}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData.users.verified} verified, {overviewData.users.unverified} pending
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">System Health</CardTitle>
                  <Server className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Operational
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overviewData.systemHealth.uptime}% uptime • {overviewData.systemHealth.responseTime}ms avg
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Activity and Product Usage */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Activity */}
              <Card className="bg-white border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-800">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600">
                    Last {overviewData.recentActivity.length} platform events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overviewData.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 rounded-full border-2 border-purple-200 bg-white">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Chatbot Interaction</p>
                          <p className="text-xs text-gray-600">
                            Conversation: {activity.conversationId.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overviewData.recentActivity.length === 0 && (
                      <p className="text-sm text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Distribution */}
              <Card className="bg-white border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-800">Product Distribution</CardTitle>
                  <CardDescription className="text-gray-600">
                    Active products across {overviewData.productKeys.total} keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overviewData.productKeys.distribution.map((product, index) => {
                      const percentage = overviewData.productKeys.total > 0 
                        ? (product._count / overviewData.productKeys.total) * 100 
                        : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-900 capitalize">{product.product}</span>
                            <span className="text-gray-600">{product._count} keys</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {overviewData.productKeys.distribution.length === 0 && (
                      <p className="text-sm text-gray-500">No product keys issued yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Users */}
            <Card className="bg-white border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Recent User Signups</CardTitle>
                <CardDescription className="text-gray-600">
                  Latest users joining the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overviewData.recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()} • 
                          {user.license_key ? ' Has license' : ' No license'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={user.email_verified 
                          ? 'border-green-500 text-green-700' 
                          : 'border-yellow-500 text-yellow-700'}
                      >
                        {user.email_verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                  {overviewData.recentUsers.length === 0 && (
                    <p className="text-sm text-gray-500">No recent signups</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* License Management Tab */}
          <TabsContent value="licenses" className="space-y-4">
            <LicenseManagementTab />
          </TabsContent>

          {/* Financial Tab - Keep placeholder for now */}
          <TabsContent value="financial" className="space-y-4">
            <Card className="bg-white border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Financial Overview</CardTitle>
                <CardDescription className="text-gray-600">Revenue metrics and billing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Financial analytics coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-800">License Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    View All Licenses
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Generate License Keys
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Pricing
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-gray-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Database Backup
                  </Button>
                  <Button className="w-full justify-start bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Run Diagnostics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card className="bg-white border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-gray-800">System Status</CardTitle>
                <CardDescription className="text-gray-600">
                  Active in last 24h: {overviewData.systemHealth.activeInLast24h} events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border-2 border-purple-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">API Gateway</span>
                      <Badge variant="outline" className="border-green-500 text-green-700">Operational</Badge>
                    </div>
                    <p className="text-xs text-gray-600">Response time: {overviewData.systemHealth.responseTime}ms</p>
                  </div>
                  <div className="p-4 border-2 border-purple-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Database</span>
                      <Badge variant="outline" className="border-green-500 text-green-700">Operational</Badge>
                    </div>
                    <p className="text-xs text-gray-600">Connections: Healthy</p>
                  </div>
                  <div className="p-4 border-2 border-purple-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Services</span>
                      <Badge variant="outline" className="border-green-500 text-green-700">All Running</Badge>
                    </div>
                    <p className="text-xs text-gray-600">Uptime: {overviewData.systemHealth.uptime}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card className="bg-white border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Compliance & Security</CardTitle>
                <CardDescription className="text-gray-600">Platform compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Compliance dashboard coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}