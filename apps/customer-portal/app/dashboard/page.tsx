'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  Bot,
  Users,
  Mail,
  Search,
  Brain,
  Package,
  TrendingUp,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Lock,
  Unlock,
  Settings,
  HelpCircle,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeUpdates } from '@/components/realtime/realtime-updates';

interface DashboardData {
  license: {
    key: string;
    plan: string;
    status: string;
    products: string[];
    usage: Record<string, { current: number; limit: number }>;
    expiration?: string;
  };
  products: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'not_purchased';
    metrics?: Record<string, any>;
  }[];
  insights?: {
    available: boolean;
    summary?: string;
    recommendations?: any[];
  };
  activity: any[];
}

const PRODUCT_ICONS: Record<string, any> = {
  chatbot: Bot,
  sales_agent: Users,
  setup_agent: Settings,
  enrichment: Search,
  ai_insights: Brain
};

const PRODUCT_COLORS: Record<string, string> = {
  chatbot: '#3b82f6',
  sales_agent: '#10b981',
  setup_agent: '#f59e0b',
  enrichment: '#8b5cf6',
  ai_insights: '#ec4899'
};

export default function CustomerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?range=${timeRange}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (productId?: string) => {
    // Navigate to upgrade flow
    window.location.href = productId 
      ? `/upgrade?product=${productId}`
      : '/upgrade';
  };

  const handleProductSetup = (productId: string) => {
    // Launch setup agent for product configuration
    window.location.href = `/setup?product=${productId}`;
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isPremium = dashboardData.license.plan === 'professional' || 
                    dashboardData.license.plan === 'enterprise';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your business automation overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {dashboardData.license.plan} Plan
          </Badge>
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => handleUpgrade()}>
            <Sparkles className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>

      {/* Real-time Updates Component */}
      <RealtimeUpdates licenseKey={dashboardData.license.key} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardData.products.filter(p => p.status === 'active').map(product => {
          const Icon = PRODUCT_ICONS[product.id] || Package;
          const usage = dashboardData.license.usage[product.id];
          const usagePercent = usage ? (usage.current / usage.limit) * 100 : 0;
          
          return (
            <Card key={product.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {product.name.replace('_', ' ')}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {product.metrics?.primary || '0'}
                </div>
                {usage && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Usage</span>
                      <span>{usage.current} / {usage.limit === -1 ? '∞' : usage.limit}</span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {product.metrics?.trend > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {product.metrics.trend}% from last week
                    </span>
                  ) : (
                    <span>No change from last week</span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Product Card */}
        {dashboardData.products.filter(p => p.status === 'not_purchased').length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Add Product</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Expand your capabilities
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleUpgrade()}
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Dashboards */}
      <Tabs value={selectedProduct} onValueChange={setSelectedProduct}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {dashboardData.products
            .filter(p => p.status === 'active')
            .map(product => (
              <TabsTrigger key={product.id} value={product.id}>
                {product.name.replace('_', ' ')}
              </TabsTrigger>
            ))}
          {isPremium && <TabsTrigger value="insights">AI Insights</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewDashboard data={dashboardData} onUpgrade={handleUpgrade} />
        </TabsContent>

        {dashboardData.products
          .filter(p => p.status === 'active')
          .map(product => (
            <TabsContent key={product.id} value={product.id} className="space-y-4">
              <ProductDashboard 
                product={product} 
                licenseKey={dashboardData.license.key}
                timeRange={timeRange}
              />
            </TabsContent>
          ))}

        {isPremium && (
          <TabsContent value="insights" className="space-y-4">
            <AIInsightsDashboard 
              insights={dashboardData.insights}
              isPremium={isPremium}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events across all your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.activity.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-${item.color}-100`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Overview Dashboard Component
function OverviewDashboard({ data, onUpgrade }: any) {
  const chartData = [
    { name: 'Mon', chatbot: 120, sales: 45, setup: 12 },
    { name: 'Tue', chatbot: 132, sales: 52, setup: 15 },
    { name: 'Wed', chatbot: 145, sales: 48, setup: 18 },
    { name: 'Thu', chatbot: 158, sales: 61, setup: 22 },
    { name: 'Fri', chatbot: 175, sales: 55, setup: 25 },
    { name: 'Sat', chatbot: 142, sales: 42, setup: 20 },
    { name: 'Sun', chatbot: 138, sales: 38, setup: 16 }
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Product usage over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="chatbot" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                <Area type="monotone" dataKey="sales" stackId="1" stroke="#10b981" fill="#10b981" />
                <Area type="monotone" dataKey="setup" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
            <CardDescription>Resource allocation across products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Chatbot', value: 45 },
                    { name: 'Sales Agent', value: 30 },
                    { name: 'Setup Agent', value: 15 },
                    { name: 'Enrichment', value: 10 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(PRODUCT_COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Available Products */}
      {data.products.filter((p: any) => p.status === 'not_purchased').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>Expand your automation capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.products
                .filter((p: any) => p.status === 'not_purchased')
                .map((product: any) => {
                  const Icon = PRODUCT_ICONS[product.id] || Package;
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                        <Badge variant="secondary">New</Badge>
                      </div>
                      <h3 className="font-semibold capitalize mb-1">
                        {product.name.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {product.description}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => onUpgrade(product.id)}
                      >
                        Learn More
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Product-specific Dashboard Component
function ProductDashboard({ product, licenseKey, timeRange }: any) {
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, [product.id, timeRange]);

  const fetchProductData = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/dashboard?range=${timeRange}`);
      const data = await response.json();
      setProductData(data);
    } catch (error) {
      console.error('Failed to fetch product data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !productData) {
    return <div>Loading {product.name} data...</div>;
  }

  // Render product-specific dashboard based on product.id
  switch (product.id) {
    case 'chatbot':
      return <ChatbotDashboard data={productData} />;
    case 'sales_agent':
      return <SalesAgentDashboard data={productData} />;
    case 'setup_agent':
      return <SetupAgentDashboard data={productData} />;
    case 'enrichment':
      return <EnrichmentDashboard data={productData} />;
    default:
      return <div>Dashboard for {product.name} coming soon...</div>;
  }
}

// Chatbot Dashboard
function ChatbotDashboard({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_conversations}</div>
            <p className="text-xs text-muted-foreground">
              {data.active_sessions} active now
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resolution_rate}%</div>
            <Progress value={data.resolution_rate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avg_response_time}s</div>
            <p className="text-xs text-muted-foreground">
              {data.response_trend > 0 ? '↑' : '↓'} {Math.abs(data.response_trend)}% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversation Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.conversation_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="conversations" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.top_topics?.map((topic: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{topic.name}</span>
                <div className="flex items-center gap-2">
                  <Progress value={topic.percentage} className="w-24" />
                  <span className="text-sm text-muted-foreground w-10">
                    {topic.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sales Agent Dashboard
function SalesAgentDashboard({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leads_generated}</div>
            <p className="text-xs text-green-600">
              +{data.new_leads_today} today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.emails_sent}</div>
            <p className="text-xs text-muted-foreground">
              {data.open_rate}% open rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.response_rate}%</div>
            <Progress value={data.response_rate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.qualified_leads}</div>
            <p className="text-xs text-muted-foreground">
              {data.qualification_rate}% qualification
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.campaign_performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaign" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="#3b82f6" />
              <Bar dataKey="opened" fill="#10b981" />
              <Bar dataKey="replied" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Setup Agent Dashboard
function SetupAgentDashboard({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Forms Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.forms_completed}</div>
            <p className="text-xs text-muted-foreground">
              {data.completion_rate}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avg_completion_time}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_sessions}</div>
            <p className="text-xs text-muted-foreground">
              {data.abandoned_sessions} abandoned today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Enrichment Dashboard
function EnrichmentDashboard({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lookups Performed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_lookups}</div>
            <p className="text-xs text-muted-foreground">
              {data.lookups_today} today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.success_rate}%</div>
            <Progress value={data.success_rate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.data_points}</div>
            <p className="text-xs text-muted-foreground">enriched fields</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// AI Insights Dashboard (Premium Feature)
function AIInsightsDashboard({ insights, isPremium }: any) {
  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            AI Insights - Premium Feature
          </CardTitle>
          <CardDescription>
            Upgrade to Professional or Enterprise to unlock AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get intelligent recommendations and predictions across all your products:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Pattern detection across products
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Predictive analytics and forecasting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Automated recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Anomaly detection and alerts
              </li>
            </ul>
            <Button className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Unlock
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Intelligent analysis and recommendations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights?.summary && (
            <Alert className="mb-4">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>{insights.summary}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {insights?.recommendations?.map((rec: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Potential impact: {rec.impact}
                  </span>
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}