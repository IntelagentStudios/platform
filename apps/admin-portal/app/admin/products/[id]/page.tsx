'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  MessageSquare,
  Mail,
  Users,
  Activity,
  Shield,
  Server,
  PoundSterling,
  TrendingUp,
  Clock,
  Globe,
  Send,
  Inbox,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  User,
  Calendar,
  FileText,
  Target,
  Settings2,
  Zap,
  BarChart3
} from 'lucide-react';

interface Message {
  id: string;
  timestamp: string;
  type: 'sent' | 'received';
  content: string;
  userId: string;
  userName: string;
  domain: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  resolved?: boolean;
}

interface Email {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  status: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  campaign?: string;
  leadScore?: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  company?: string;
  totalInteractions: number;
  lastActive: string;
  revenue: number;
  satisfaction?: number;
}

const mockMessages: Message[] = [
  {
    id: '1',
    timestamp: '2024-12-20T10:30:00Z',
    type: 'received',
    content: 'How do I reset my password?',
    userId: 'user123',
    userName: 'John Smith',
    domain: 'support.example.com',
    sentiment: 'neutral',
    resolved: true
  },
  {
    id: '2',
    timestamp: '2024-12-20T10:31:00Z',
    type: 'sent',
    content: 'I can help you reset your password. Please click on the "Forgot Password" link on the login page.',
    userId: 'user123',
    userName: 'John Smith',
    domain: 'support.example.com',
    sentiment: 'positive',
    resolved: true
  },
  {
    id: '3',
    timestamp: '2024-12-20T11:15:00Z',
    type: 'received',
    content: 'What are your pricing plans?',
    userId: 'user456',
    userName: 'Sarah Johnson',
    domain: 'sales.example.com',
    sentiment: 'neutral',
    resolved: true
  },
  {
    id: '4',
    timestamp: '2024-12-20T11:16:00Z',
    type: 'sent',
    content: 'We offer three pricing tiers: Starter (£29/mo), Professional (£99/mo), and Enterprise (custom pricing).',
    userId: 'user456',
    userName: 'Sarah Johnson',
    domain: 'sales.example.com',
    sentiment: 'positive',
    resolved: true
  }
];

const mockEmails: Email[] = [
  {
    id: '1',
    timestamp: '2024-12-20T09:00:00Z',
    to: 'lead1@company.com',
    subject: 'Following up on our conversation',
    status: 'opened',
    campaign: 'Q4 Outreach',
    leadScore: 75
  },
  {
    id: '2',
    timestamp: '2024-12-20T10:00:00Z',
    to: 'lead2@business.com',
    subject: 'Special offer for your team',
    status: 'clicked',
    campaign: 'Holiday Promotion',
    leadScore: 85
  },
  {
    id: '3',
    timestamp: '2024-12-20T11:00:00Z',
    to: 'prospect@enterprise.com',
    subject: 'Quick question about your needs',
    status: 'replied',
    campaign: 'Enterprise Outreach',
    leadScore: 95
  }
];

const mockUserActivities: UserActivity[] = [
  {
    userId: 'user123',
    userName: 'John Smith',
    email: 'john@example.com',
    company: 'Tech Corp',
    totalInteractions: 45,
    lastActive: '2024-12-20T10:31:00Z',
    revenue: 299,
    satisfaction: 4.5
  },
  {
    userId: 'user456',
    userName: 'Sarah Johnson',
    email: 'sarah@business.com',
    company: 'Business Inc',
    totalInteractions: 28,
    lastActive: '2024-12-20T11:16:00Z',
    revenue: 599,
    satisfaction: 4.8
  },
  {
    userId: 'user789',
    userName: 'Mike Wilson',
    email: 'mike@enterprise.com',
    company: 'Enterprise Co',
    totalInteractions: 67,
    lastActive: '2024-12-19T15:45:00Z',
    revenue: 1299,
    satisfaction: 4.2
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [userActivities, setUserActivities] = useState<UserActivity[]>(mockUserActivities);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Get product details based on ID
  const getProductDetails = () => {
    switch (productId) {
      case '1':
        return {
          name: 'AI Chatbot',
          type: 'chatbot',
          icon: <Bot className="w-6 h-6" />,
          status: 'active',
          description: 'Intelligent conversational AI assistant'
        };
      case '2':
        return {
          name: 'Sales Agent',
          type: 'sales-agent',
          icon: <TrendingUp className="w-6 h-6" />,
          status: 'active',
          description: 'AI-powered sales assistant'
        };
      case '3':
        return {
          name: 'Setup Agent',
          type: 'setup-agent',
          icon: <Settings2 className="w-6 h-6" />,
          status: 'beta',
          description: 'Automated onboarding assistant'
        };
      default:
        return {
          name: 'Unknown Product',
          type: 'unknown',
          icon: <Bot className="w-6 h-6" />,
          status: 'inactive',
          description: 'Product not found'
        };
    }
  };

  const product = getProductDetails();
  const uniqueDomains = [...new Set(messages.map(m => m.domain))];

  // Filter messages based on domain and search
  const filteredMessages = messages.filter(msg => {
    const matchesDomain = selectedDomain === 'all' || msg.domain === selectedDomain;
    const matchesSearch = !searchQuery || 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  // Filter emails based on search
  const filteredEmails = emails.filter(email => {
    return !searchQuery || 
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter user activities based on search
  const filteredUsers = userActivities.filter(user => {
    return !searchQuery || 
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleRefresh = () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/admin/users/${userId}?product=${productId}`);
  };

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
            Back to Products
          </Button>
          <div className="flex items-center gap-3">
            {product.icon}
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            <Badge className={
              product.status === 'active' ? 'bg-green-100 text-green-800' :
              product.status === 'beta' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }>
              {product.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">1,250</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {product.type === 'chatbot' ? 'Messages' : 'Emails Sent'}
                </p>
                <p className="text-2xl font-bold">
                  {product.type === 'chatbot' ? '45K' : '1.2K'}
                </p>
              </div>
              {product.type === 'chatbot' ? 
                <MessageSquare className="w-8 h-8 text-secondary" /> :
                <Mail className="w-8 h-8 text-secondary" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">£8,500</p>
              </div>
              <PoundSterling className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health</p>
                <p className="text-lg font-bold text-green-600">99.9%</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-lg font-bold text-green-600">Passed</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">
            {product.type === 'chatbot' ? 'Messages' : 'Emails'}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-medium">98.5%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '98.5%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Satisfaction Score</span>
                    <span className="font-medium">4.6/5.0</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Resolution Rate</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Domains</CardTitle>
                <CardDescription>Most active domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uniqueDomains.slice(0, 5).map((domain) => {
                    const domainMessages = messages.filter(m => m.domain === domain);
                    return (
                      <div key={domain} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{domain}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{domainMessages.length} msgs</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((domainMessages.length / messages.length) * 100)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions across all channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMessages.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      msg.type === 'sent' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {msg.type === 'sent' ? 
                        <Send className="w-4 h-4 text-blue-600" /> :
                        <Inbox className="w-4 h-4 text-gray-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.userName}</span>
                          <Badge variant="outline" className="text-xs">
                            {msg.domain}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages/Emails Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {product.type === 'chatbot' ? 'Message History' : 'Email Campaign'}
                  </CardTitle>
                  <CardDescription>
                    {product.type === 'chatbot' ? 
                      'All conversations and interactions' : 
                      'Sent emails and campaign performance'
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    icon={<Search className="w-4 h-4" />}
                  />
                  {product.type === 'chatbot' && (
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All domains" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All domains</SelectItem>
                        {uniqueDomains.map(domain => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.type === 'chatbot' ? (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/10 transition-colors">
                      <div className={`p-2 rounded-full ${
                        msg.type === 'sent' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {msg.type === 'sent' ? 
                          <Bot className="w-5 h-5 text-blue-600" /> :
                          <User className="w-5 h-5 text-gray-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleUserClick(msg.userId)}
                              className="font-medium hover:underline"
                            >
                              {msg.userName}
                            </button>
                            <Badge variant="outline" className="text-xs">
                              {msg.domain}
                            </Badge>
                            {msg.sentiment && (
                              <Badge className={
                                msg.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                msg.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {msg.sentiment}
                              </Badge>
                            )}
                            {msg.resolved && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lead Score</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.to}</TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{email.campaign}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            email.status === 'replied' ? 'bg-green-100 text-green-800' :
                            email.status === 'clicked' ? 'bg-blue-100 text-blue-800' :
                            email.status === 'opened' ? 'bg-yellow-100 text-yellow-800' :
                            email.status === 'bounced' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {email.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{email.leadScore}</span>
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  email.leadScore! > 80 ? 'bg-green-500' :
                                  email.leadScore! > 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${email.leadScore}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(email.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>
                    Track individual user interactions with {product.name}
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Interactions</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <button
                          onClick={() => handleUserClick(user.userId)}
                          className="hover:underline"
                        >
                          <div className="font-medium">{user.userName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </button>
                      </TableCell>
                      <TableCell>{user.company || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          {user.totalInteractions}
                        </div>
                      </TableCell>
                      <TableCell>£{user.revenue}</TableCell>
                      <TableCell>
                        {user.satisfaction && (
                          <div className="flex items-center gap-1">
                            <span>{user.satisfaction}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(user.satisfaction!) 
                                      ? 'text-yellow-500' 
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserClick(user.userId)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">£8,500</div>
                <p className="text-sm text-green-600 mt-2">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Revenue per User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">£6.80</div>
                <p className="text-sm text-muted-foreground mt-2">Based on 1,250 users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Paid</span>
                    <span className="font-medium">1,180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trial</span>
                    <span className="font-medium">50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue</span>
                    <span className="font-medium text-red-600">20</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>By pricing tier and billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Enterprise</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell>£199/user</TableCell>
                    <TableCell>£4,975</TableCell>
                    <TableCell>58.5%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Professional</TableCell>
                    <TableCell>85</TableCell>
                    <TableCell>£49/user</TableCell>
                    <TableCell>£2,465</TableCell>
                    <TableCell>29%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Starter</TableCell>
                    <TableCell>1,140</TableCell>
                    <TableCell>£0.002/msg</TableCell>
                    <TableCell>£1,060</TableCell>
                    <TableCell>12.5%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Alert className="border-green-200 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Compliance Status: Passed</AlertTitle>
            <AlertDescription>
              All compliance checks passed. Last audit: {new Date().toLocaleDateString()}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GDPR Compliant</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Encryption</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Consent Tracking</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Retention Policy</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Measures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL/TLS Encryption</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Access Control</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regular Backups</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Security Audit Completed</p>
                      <p className="text-sm text-muted-foreground">All checks passed</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">2 days ago</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">GDPR Compliance Review</p>
                      <p className="text-sm text-muted-foreground">No issues found</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">1 week ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">99.9%</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-2xl font-bold">45ms</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">0.1%</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold">35%</p>
                  </div>
                  <Server className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Health</CardTitle>
              <CardDescription>Real-time status of product services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">API Service</p>
                      <p className="text-sm text-muted-foreground">Response time: 45ms</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Message Queue</p>
                      <p className="text-sm text-muted-foreground">0 items in queue</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">ML Model</p>
                      <p className="text-sm text-muted-foreground">Version 2.4.1</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Configuration</CardTitle>
              <CardDescription>Manage product settings and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Status</Label>
                <Select defaultValue={product.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Response Mode</Label>
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic</SelectItem>
                    <SelectItem value="manual">Manual Review</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Auto-Scaling</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scale resources based on demand
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Collect Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Track usage and performance metrics
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}