'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Mail,
  TrendingUp,
  Calendar,
  Plus,
  Upload,
  Settings,
  BarChart3,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Activity,
  Send,
  Eye,
  MousePointer,
  Reply,
  UserPlus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function SalesDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    emailsOpened: 0,
    linksClicked: 0,
    repliesReceived: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    avgLeadScore: 0,
    weeklyGrowth: 0
  });
  const [chartData, setChartData] = useState<any>({
    daily: [],
    funnel: [],
    sources: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkOnboarding();
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkOnboarding = async () => {
    try {
      const response = await fetch('/api/sales/configuration');
      if (response.ok) {
        const data = await response.json();
        if (data.onboardingComplete === false) {
          router.push('/dashboard/sales/onboarding');
        }
      } else if (response.status === 404) {
        router.push('/dashboard/sales/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      // Fetch all data in parallel
      const [campaignsRes, statsRes, sequencesRes, activityRes] = await Promise.all([
        fetch('/api/sales/campaigns'),
        fetch('/api/sales/stats'),
        fetch('/api/sales/sequences'),
        fetch('/api/sales/activity')
      ]);

      const campaignsData = await campaignsRes.json();
      const statsData = await statsRes.json();
      const sequencesData = await sequencesRes.json();
      const activityData = await activityRes.json();

      setCampaigns(campaignsData.campaigns || []);
      setStats(statsData);
      setSequences(sequencesData.sequences || []);
      setRecentActivity(activityData.activities || []);

      // Generate chart data
      generateChartData(statsData, campaignsData.campaigns);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateChartData = (stats: any, campaigns: any[]) => {
    // Generate daily activity data for last 7 days
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      daily.push({
        date: date.toLocaleDateString('en', { weekday: 'short' }),
        sent: Math.floor(Math.random() * 100) + 20,
        opened: Math.floor(Math.random() * 80) + 10,
        replied: Math.floor(Math.random() * 20) + 2
      });
    }

    // Conversion funnel data
    const funnel = [
      { stage: 'Leads', value: stats.totalLeads || 100, color: '#8884d8' },
      { stage: 'Contacted', value: stats.emailsSent || 80, color: '#83a6ed' },
      { stage: 'Opened', value: stats.emailsOpened || 60, color: '#8dd1e1' },
      { stage: 'Clicked', value: stats.linksClicked || 30, color: '#82ca9d' },
      { stage: 'Replied', value: stats.repliesReceived || 15, color: '#a4de6c' },
      { stage: 'Meetings', value: stats.meetingsBooked || 5, color: '#ffc658' }
    ];

    // Lead sources data
    const sources = [
      { name: 'LinkedIn', value: 35, color: '#0077B5' },
      { name: 'Website', value: 25, color: '#4285F4' },
      { name: 'Referral', value: 20, color: '#00C851' },
      { name: 'Email', value: 15, color: '#FF6B6B' },
      { name: 'Other', value: 5, color: '#95A5A6' }
    ];

    setChartData({ daily, funnel, sources });
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const response = await fetch(`/api/sales/campaigns/${campaignId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error ${action} campaign:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      case 'draft': return 'secondary';
      default: return 'destructive';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent': return <Send className="h-4 w-4" />;
      case 'email_opened': return <Eye className="h-4 w-4" />;
      case 'link_clicked': return <MousePointer className="h-4 w-4" />;
      case 'replied': return <Reply className="h-4 w-4" />;
      case 'meeting_booked': return <Calendar className="h-4 w-4" />;
      case 'lead_created': return <UserPlus className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your sales operations
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/sales/leads/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Leads
            </Button>
          </Link>
          <Link href="/dashboard/sales/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {stats.weeklyGrowth}% this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
            <Progress value={(stats.qualifiedLeads / stats.totalLeads) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {stats.openRate}% Open
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.clickRate}% CTR
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repliesReceived}</div>
            <p className="text-xs text-muted-foreground">
              {stats.replyRate}% reply rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetingsBooked}</div>
            <p className="text-xs text-muted-foreground">
              {stats.conversionRate}% conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Email Activity (Last 7 Days)</CardTitle>
              <CardDescription>Daily email performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="opened" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="replied" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through your sales process</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.funnel} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {chartData.funnel.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>{campaigns.length} total campaigns</CardDescription>
                </div>
                <Link href="/dashboard/sales/campaigns">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCampaignAction(campaign.id, 'pause')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCampaignAction(campaign.id, 'resume')}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/dashboard/sales/campaigns/${campaign.id}`}>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Leads</p>
                        <p className="font-medium">{campaign.total_leads || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sent</p>
                        <p className="font-medium">{campaign.emails_sent || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Opened</p>
                        <p className="font-medium">{campaign.emails_opened || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Replied</p>
                        <p className="font-medium">{campaign.replies_received || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meetings</p>
                        <p className="font-medium">{campaign.meetings_booked || 0}</p>
                      </div>
                    </div>
                    {campaign.sequence_steps && campaign.sequence_steps.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {campaign.sequence_steps.length} step sequence
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {campaigns.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No campaigns yet</p>
                    <Link href="/dashboard/sales/campaigns/new">
                      <Button size="sm" className="mt-2">Create Campaign</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Info */}
        <div className="space-y-6">
          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Where your leads come from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.sources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.sources.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Sequences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Sequences</CardTitle>
                <Link href="/dashboard/sales/sequences">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sequences.slice(0, 3).map((sequence) => (
                  <div key={sequence.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {sequence.lead?.full_name || sequence.lead?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Step {sequence.current_step} of {sequence.total_steps}
                      </p>
                    </div>
                    <Badge variant={sequence.status === 'active' ? 'default' : 'secondary'}>
                      {sequence.status}
                    </Badge>
                  </div>
                ))}

                {sequences.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active sequences
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.lead?.full_name || activity.lead?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.performed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/sales/leads">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Leads
                  </Button>
                </Link>
                <Link href="/dashboard/sales/templates">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                </Link>
                <Link href="/dashboard/sales/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/dashboard/sales/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}