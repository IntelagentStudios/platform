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
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    // Business Metrics
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    trialLicenses: 0,
    
    // Financial
    monthlyRevenue: 0,
    annualRevenue: 0,
    mrr: 0,
    arr: 0,
    churnRate: 0,
    
    // Products
    totalProducts: 0,
    activeProducts: 0,
    productUsage: {},
    
    // System
    serverStatus: 'operational',
    uptime: 99.99,
    apiLatency: 45,
    errorRate: 0.01,
    
    // Compliance
    gdprCompliant: true,
    lastAudit: new Date(),
    pendingCompliance: []
  });
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
    if (isAuthorized) {
      fetchAllStats();
      // Set up real-time monitoring
      const interval = setInterval(fetchSystemStatus, 30000); // Every 30 seconds
      return () => clearInterval(interval);
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

  const fetchAllStats = async () => {
    try {
      const [businessStats, financialStats, systemStats, complianceStats] = await Promise.all([
        fetch('/api/admin/stats/business').then(r => r.json()),
        fetch('/api/admin/stats/financial').then(r => r.json()),
        fetch('/api/admin/stats/system').then(r => r.json()),
        fetch('/api/admin/stats/compliance').then(r => r.json())
      ]);
      
      setStats({
        ...businessStats,
        ...financialStats,
        ...systemStats,
        ...complianceStats
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/stats/system');
      const data = await response.json();
      setStats(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  if (!isAuthorized) {
    return <div className="flex items-center justify-center h-screen">Checking authorization...</div>;
  }

  return (
    <div className="space-y-6">
      {/* AI Pro Interface Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Master Admin Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete business management and monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            onClick={fetchAllStats}
            disabled={isRefreshing}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {isRefreshing ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Refreshing...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Refresh</>
            )}
          </Button>
          <Button 
            onClick={() => setShowAI(!showAI)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Pro Assistant
          </Button>
        </div>
      </div>

      {/* AI Pro Interface */}
      {showAI && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Pro Business Intelligence
            </CardTitle>
            <CardDescription>
              Ask me anything about your business operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="What would you like to know about your business?"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <Button>Ask AI</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Revenue forecast</Button>
                <Button variant="outline" size="sm">Churn analysis</Button>
                <Button variant="outline" size="sm">Growth opportunities</Button>
                <Button variant="outline" size="sm">System optimization</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Overview Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <PoundSterling className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +23% from last month
                </p>
                <div className="text-xs mt-2">
                  MRR: £{stats.mrr.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeLicenses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.trialLicenses} trials, {stats.expiredLicenses} expired
                </p>
                <div className="text-xs mt-2">
                  Total: {stats.totalLicenses}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Server className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {stats.serverStatus}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.uptime}% uptime
                </p>
                <div className="text-xs mt-2">
                  Latency: {stats.apiLatency}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.churnRate}%</div>
                <p className="text-xs text-muted-foreground">
                  -2% from last month
                </p>
                <div className="text-xs mt-2">
                  Net growth: +18%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity</CardTitle>
                <CardDescription>Real-time platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ActivityItem 
                    icon={<Users className="h-4 w-4" />}
                    title="New license activated"
                    description="Enterprise plan - Acme Corp"
                    time="2 minutes ago"
                    color="text-green-600"
                  />
                  <ActivityItem 
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Chatbot conversation spike"
                    description="TechStartup Ltd - 150 messages/hour"
                    time="5 minutes ago"
                    color="text-blue-600"
                  />
                  <ActivityItem 
                    icon={<CreditCard className="h-4 w-4" />}
                    title="Payment received"
                    description="£299 - BigCorp renewal"
                    time="12 minutes ago"
                    color="text-green-600"
                  />
                  <ActivityItem 
                    icon={<AlertCircle className="h-4 w-4" />}
                    title="API rate limit warning"
                    description="ClientXYZ approaching limit"
                    time="18 minutes ago"
                    color="text-orange-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Usage</CardTitle>
                <CardDescription>Active products across all licenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ProductUsage name="Chatbot" active={145} total={200} percentage={72.5} />
                  <ProductUsage name="Sales Agent" active={89} total={200} percentage={44.5} />
                  <ProductUsage name="Setup Agent" active={67} total={200} percentage={33.5} />
                  <ProductUsage name="Enrichment" active={123} total={200} percentage={61.5} />
                  <ProductUsage name="AI Insights" active={45} total={200} percentage={22.5} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MetricRow label="MRR" value={`£${stats.mrr.toLocaleString()}`} />
                <MetricRow label="ARR" value={`£${stats.arr.toLocaleString()}`} />
                <MetricRow label="ARPU" value="£149" />
                <MetricRow label="LTV" value="£1,788" />
                <MetricRow label="CAC" value="£230" />
                <MetricRow label="LTV:CAC Ratio" value="7.8:1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MetricRow label="Pending Invoices" value="12" />
                <MetricRow label="Overdue" value="3" />
                <MetricRow label="Failed Payments" value="2" />
                <MetricRow label="Upcoming Renewals" value="28" />
                <MetricRow label="Trial Conversions" value="68%" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MetricRow label="Basic" value="45 (£1,305/mo)" />
                <MetricRow label="Professional" value="89 (£8,811/mo)" />
                <MetricRow label="Enterprise" value="23 (£6,877/mo)" />
                <MetricRow label="Trial" value="18" />
                <MetricRow label="Custom" value="5" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>AI-powered projections for next 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Revenue chart placeholder - Connect to charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>License Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View All Licenses
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Generate License Keys
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Pricing
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Database Backup
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ServiceStatus name="API Gateway" status="operational" latency={45} />
            <ServiceStatus name="Database" status="operational" latency={12} />
            <ServiceStatus name="Redis Cache" status="operational" latency={3} />
            <ServiceStatus name="Chatbot Service" status="operational" latency={67} />
            <ServiceStatus name="Email Service" status="degraded" latency={230} />
            <ServiceStatus name="Analytics Engine" status="operational" latency={89} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="CPU Usage" value="42%" status="good" />
                <MetricCard label="Memory" value="6.2GB / 16GB" status="good" />
                <MetricCard label="Disk Space" value="124GB / 500GB" status="good" />
                <MetricCard label="Network I/O" value="1.2 Gbps" status="good" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ComplianceItem name="GDPR" status="compliant" lastAudit="2024-01-15" />
                <ComplianceItem name="SOC 2" status="in-progress" lastAudit="2023-12-01" />
                <ComplianceItem name="ISO 27001" status="compliant" lastAudit="2024-02-01" />
                <ComplianceItem name="PCI DSS" status="compliant" lastAudit="2024-01-20" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MetricRow label="Failed Login Attempts" value="23 today" />
                <MetricRow label="Suspicious Activities" value="2 flagged" />
                <MetricRow label="Data Breaches" value="0" />
                <MetricRow label="SSL Certificate" value="Valid (89 days)" />
                <MetricRow label="Last Security Scan" value="2 hours ago" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function ActivityItem({ icon, title, description, time, color }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

function ProductUsage({ name, active, total, percentage }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{name}</span>
        <span className="text-gray-500">{active}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ServiceStatus({ name, status, latency }: any) {
  const statusColor = status === 'operational' ? 'text-green-600' : 
                      status === 'degraded' ? 'text-orange-600' : 'text-red-600';
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge className={statusColor} variant="outline">
            {status}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">Latency: {latency}ms</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, status }: any) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      <Badge variant={status === 'good' ? 'default' : 'destructive'} className="text-xs">
        {status}
      </Badge>
    </div>
  );
}

function ComplianceItem({ name, status, lastAudit }: any) {
  const statusIcon = status === 'compliant' ? 
    <CheckCircle className="h-4 w-4 text-green-600" /> : 
    <AlertCircle className="h-4 w-4 text-orange-600" />;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {statusIcon}
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-right">
        <Badge variant={status === 'compliant' ? 'default' : 'secondary'}>
          {status}
        </Badge>
        <p className="text-xs text-gray-500 mt-1">Audit: {lastAudit}</p>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}