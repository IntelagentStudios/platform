'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
  RefreshCw,
  FileText,
  GitBranch
} from 'lucide-react';
import Link from 'next/link';

export default function SalesDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Restore tab from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salesDashboardTab') || 'overview';
    }
    return 'overview';
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    weeklyGrowth: 0,
    avgLeadScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Save tab selection to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('salesDashboardTab', activeTab);
    }
  }, [activeTab]);

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
      const [campaignsRes, statsRes, activityRes] = await Promise.all([
        fetch('/api/sales/campaigns'),
        fetch('/api/sales/stats'),
        fetch('/api/sales/activity')
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const QuickActions = () => (
    <div className="grid gap-3 md:grid-cols-4">
      <Link href="/dashboard/sales/leads">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Manage Leads</p>
              <p className="text-sm text-muted-foreground">View all leads</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/sales/campaigns">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Campaigns</p>
              <p className="text-sm text-muted-foreground">Create & manage</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/sales/templates">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Templates</p>
              <p className="text-sm text-muted-foreground">Email library</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/sales/analytics">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Analytics</p>
              <p className="text-sm text-muted-foreground">View insights</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Outreach Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your campaigns, leads, and track performance
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/sales/leads/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Leads
              </Button>
            </Link>
            <Link href="/dashboard/sales/campaigns">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <QuickActions />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest sales activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="p-2 bg-primary/10 rounded">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.activity_type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.lead?.full_name} • {new Date(activity.performed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Currently running campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : campaigns.filter(c => c.status === 'active').length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No active campaigns</p>
                      <Link href="/dashboard/sales/campaigns">
                        <Button variant="outline" size="sm" className="mt-2">
                          Create Campaign
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.filter(c => c.status === 'active').map((campaign) => (
                        <Link key={campaign.id} href={`/dashboard/sales/campaigns`}>
                          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{campaign.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {campaign.leads_count} leads • {campaign.emails_sent} sent
                                  </p>
                                </div>
                                <Badge>{campaign.status}</Badge>
                              </div>
                              <div className="mt-2 flex gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {campaign.open_rate}%
                                </span>
                                <span className="flex items-center gap-1">
                                  <MousePointer className="h-3 w-3" />
                                  {campaign.click_rate}%
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {campaign.reply_rate}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Manage your email campaigns and sequences
            </p>
            <Link href="/dashboard/sales/campaigns">
              <Button>
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.type} • {campaign.leads_count} leads
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                      <Link href="/dashboard/sales/campaigns">
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Email sequences and automation workflows
            </p>
            <Link href="/dashboard/sales/campaigns">
              <Button>
                Create Sequence
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Email Sequences</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Create automated email sequences that nurture leads and drive conversions
              </p>
              <Link href="/dashboard/sales/campaigns">
                <Button className="mt-4">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Performance metrics and insights
            </p>
            <Link href="/dashboard/sales/analytics">
              <Button>
                View Full Analytics
                <BarChart3 className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Open Rate</span>
                    <span className="font-semibold">{stats.openRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Click Rate</span>
                    <span className="font-semibold">{stats.clickRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reply Rate</span>
                    <span className="font-semibold">{stats.replyRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Lead Score</span>
                    <span className="font-semibold">{stats.avgLeadScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Qualified Leads</span>
                    <span className="font-semibold">24%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Meeting Rate</span>
                    <span className="font-semibold">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <span className="font-semibold">{stats.activeCampaigns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conversion</span>
                    <span className="font-semibold">{stats.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ROI</span>
                    <span className="font-semibold text-green-600">+245%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}