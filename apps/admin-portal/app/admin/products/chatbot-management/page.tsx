'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  Globe,
  Key,
  MessageSquare,
  Users,
  Activity,
  TrendingUp,
  Shield,
  Settings,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  DollarSign,
  ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActiveDeployment {
  id: string;
  domain: string;
  licenseKey: string;
  siteKey: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastActive: string;
  messageCount: number;
  sessionCount: number;
  monthlyUsage: number;
  revenue: number;
}

export default function ChatbotManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeDeployments, setActiveDeployments] = useState<ActiveDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    activeDeployments: 0,
    totalMessages: 0,
    totalSessions: 0,
    monthlyRevenue: 0,
    monthlyMessages: 0
  });
  const [conversations, setConversations] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('deployments');

  // Fetch data based on active tab
  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations();
    } else if (activeTab === 'monitoring') {
      fetchHealthData();
    } else if (activeTab === 'insights') {
      fetchInsights();
    }
  }, [activeTab]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/admin/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/admin/deployments');
      if (response.ok) {
        const data = await response.json();
        setActiveDeployments(data.deployments.map((d: any) => ({
          id: d.id,
          domain: d.domain,
          licenseKey: d.licenseKey,
          siteKey: d.siteKey,
          status: d.status,
          plan: d.plan,
          createdAt: new Date(d.createdAt).toLocaleDateString(),
          lastActive: formatTimeAgo(d.lastActive),
          messageCount: d.messageCount,
          sessionCount: d.sessionCount,
          monthlyUsage: d.monthlyMessages,
          revenue: d.monthlyRevenue
        })));
        setTotals(data.totals);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const filteredDeployments = activeDeployments.filter(deployment =>
    deployment.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deployment.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/products')}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chatbot Management</h1>
              <p className="text-muted-foreground">Monitor all active chatbot deployments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deployments</p>
                <p className="text-2xl font-bold">{totals.activeDeployments}</p>
                <p className="text-xs text-green-600">+2 this week</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{totals.totalMessages.toLocaleString()}</p>
                <p className="text-xs text-blue-600">↑ 23% vs last month</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{totals.totalSessions.toLocaleString()}</p>
                <p className="text-xs text-purple-600">↑ 15% vs last month</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">£{totals.monthlyRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600">↑ 18% MRR growth</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="deployments">All Deployments</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="licenses">License Keys</TabsTrigger>
          <TabsTrigger value="monitoring">Health Monitor</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Chatbot Deployments</CardTitle>
                  <CardDescription>All domains with active chatbot installations</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search domains..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[300px]"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>License Key</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{deployment.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deployment.status === 'active' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          deployment.plan === 'enterprise' ? 'default' :
                          deployment.plan === 'pro' ? 'secondary' : 'outline'
                        }>
                          {deployment.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {deployment.licenseKey}
                        </code>
                      </TableCell>
                      <TableCell>{deployment.messageCount.toLocaleString()}</TableCell>
                      <TableCell>{deployment.sessionCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {deployment.revenue > 0 ? `£${deployment.revenue}` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {deployment.lastActive}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedDomain(deployment.domain)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Customer Conversations</CardTitle>
              <CardDescription>Monitor conversations across all deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>Real-time Monitoring</AlertTitle>
                <AlertDescription>
                  View live conversations from all client chatbots. Click on any domain to filter.
                </AlertDescription>
              </Alert>

              <div className="mt-4 space-y-4">
                {/* Conversation filters */}
                <div className="flex gap-4">
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Domains" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {filteredDeployments.map(d => (
                        <SelectItem key={d.id} value={d.domain}>{d.domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>

                {/* Conversation list */}
                <div className="border rounded-lg p-4 space-y-3">
                  {conversations.length > 0 ? (
                    conversations.slice(0, 10).map((session: any) => (
                      <div key={session.session_id} className="flex items-start justify-between p-3 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{session.domain}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Session #{session.session_id.slice(-6)} • {formatTimeAgo(session.lastActivity)}
                            </span>
                          </div>
                          {session.messages.slice(0, 2).map((msg: any, idx: number) => (
                            <p key={idx} className="text-sm">
                              <strong>{msg.role === 'user' ? 'User' : 'Bot'}:</strong> {msg.content?.slice(0, 100)}...
                            </p>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost">View Full</Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No conversations found
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Keys Tab */}
        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>License Key Management</CardTitle>
                  <CardDescription>Manage and monitor all issued license keys</CardDescription>
                </div>
                <Button>
                  <Key className="w-4 h-4 mr-2" />
                  Generate New License
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Key</TableHead>
                    <TableHead>Site Key</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {deployment.licenseKey}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {deployment.siteKey.substring(0, 20)}...
                        </code>
                      </TableCell>
                      <TableCell>{deployment.domain}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{deployment.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deployment.status === 'active' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{deployment.createdAt}</TableCell>
                      <TableCell>
                        {deployment.plan === 'enterprise' ? 'Never' : '2025-01-15'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">Revoke</Button>
                          <Button size="sm" variant="ghost">Extend</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertTitle>License Security</AlertTitle>
                <AlertDescription>
                  License keys are bound to domains. The setup agent validates both license key 
                  and domain before generating site keys.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>Real-time health status of all deployments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">n8n Webhooks</span>
                      <Badge className="bg-green-100 text-green-800">
                        {healthData?.systemHealth?.n8n?.status || 'Checking...'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Response Time</span>
                        <span>{healthData?.systemHealth?.n8n?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Success Rate</span>
                        <span>{healthData?.systemHealth?.n8n?.successRate || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Vector Database</span>
                      <Badge className="bg-green-100 text-green-800">
                        {healthData?.systemHealth?.vectorDatabase?.status || 'Checking...'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Indexed Domains</span>
                        <span>{healthData?.systemHealth?.vectorDatabase?.indexedDomains || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Total Vectors</span>
                        <span>{(healthData?.systemHealth?.vectorDatabase?.totalVectors / 1000 || 0).toFixed(1)}K</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">API Gateway</span>
                      <Badge className={healthData?.systemHealth?.apiGateway?.status === 'high-load' ? 
                        "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                        {healthData?.systemHealth?.apiGateway?.status || 'Checking...'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Requests/min</span>
                        <span>{healthData?.systemHealth?.apiGateway?.requestsPerMinute || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Error Rate</span>
                        <span>{healthData?.systemHealth?.apiGateway?.errorRate || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deployment Health List */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Widget Status</TableHead>
                      <TableHead>n8n Connection</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Last Check</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthData?.deployments ? (
                      healthData.deployments.map((deployment: any) => (
                        <TableRow key={deployment.domain}>
                          <TableCell>{deployment.domain}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                deployment.widgetStatus === 'online' ? 'bg-green-500 animate-pulse' :
                                deployment.widgetStatus === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                              <span className="text-sm capitalize">{deployment.widgetStatus}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              deployment.n8nStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                            }>
                              {deployment.n8nStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{deployment.responseTime}ms</TableCell>
                          <TableCell>{deployment.errorRate}%</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTimeAgo(deployment.lastCheck)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Loading health data...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Advanced analytics and recommendations across all deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.recommendations && insights.recommendations.length > 0 && (
                <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-900">{insights.recommendations[0].title}</AlertTitle>
                  <AlertDescription className="text-purple-700">
                    {insights.recommendations[0].description}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Performing Domains</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights?.insights?.topPerformers ? (
                        insights.insights.topPerformers.slice(0, 3).map((performer: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">{performer.domain}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{performer.value} msgs/session</span>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Common User Intents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights?.insights?.commonIntents ? (
                        insights.insights.commonIntents.slice(0, 3).map((intent: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">{intent.intent}</span>
                            <Badge variant="outline">{intent.percentage}%</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.recommendations ? (
                    insights.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                        rec.type === 'growth' ? 'bg-green-50' :
                        rec.type === 'retention' ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}>
                        {
                          rec.type === 'growth' ? <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" /> :
                          rec.type === 'retention' ? <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" /> :
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        }
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            rec.type === 'growth' ? 'text-green-900' :
                            rec.type === 'retention' ? 'text-yellow-900' : 'text-blue-900'
                          }`}>{rec.title}</p>
                          <p className={`text-xs mt-1 ${
                            rec.type === 'growth' ? 'text-green-700' :
                            rec.type === 'retention' ? 'text-yellow-700' : 'text-blue-700'
                          }`}>
                            {rec.description}
                          </p>
                        </div>
                        {rec.actionRequired && (
                          <Button size="sm" variant="outline">Action</Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">Loading recommendations...</div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Import Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';