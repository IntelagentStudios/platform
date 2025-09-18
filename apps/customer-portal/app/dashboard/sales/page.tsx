'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function SalesDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    fetchDashboardData();
  }, []);

  const checkOnboarding = async () => {
    try {
      const response = await fetch('/api/sales/configuration');

      // Only redirect if we have a valid response indicating onboarding is not complete
      if (response.ok) {
        const data = await response.json();
        if (data.onboardingComplete === false) {
          router.push('/dashboard/sales/onboarding');
        }
      } else if (response.status === 404) {
        // No configuration found, redirect to onboarding
        router.push('/dashboard/sales/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      // Don't redirect on error - let user stay on dashboard
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch campaigns
      const campaignsRes = await fetch('/api/sales/campaigns');
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch stats
      const statsRes = await fetch('/api/sales/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  return (
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
          <Link href="/dashboard/sales/conversations">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversations
            </Button>
          </Link>
          <Link href="/dashboard/sales/campaigns/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent.toLocaleString()}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {stats.openRate}% Open
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.clickRate}% Click
              </Badge>
            </div>
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
              {stats.replyRate}% reply rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <Progress value={stats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading campaigns...</div>
                </CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32 space-y-3">
                  <Target className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-lg font-medium">No campaigns yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first campaign to start reaching out to leads
                    </p>
                  </div>
                  <Link href="/dashboard/sales/campaigns/create">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          campaign.status === 'active' ? 'default' :
                          campaign.status === 'paused' ? 'secondary' :
                          campaign.status === 'completed' ? 'outline' :
                          'destructive'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Leads</p>
                        <p className="font-medium">{campaign.totalLeads}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sent</p>
                        <p className="font-medium">{campaign.emailsSent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Opened</p>
                        <p className="font-medium">{campaign.emailsOpened}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Replied</p>
                        <p className="font-medium">{campaign.repliesReceived}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meetings</p>
                        <p className="font-medium">{campaign.meetingsBooked}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/dashboard/sales/campaigns/${campaign.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/sales/campaigns/${campaign.id}/leads`}>
                        <Button size="sm" variant="outline">
                          Manage Leads
                        </Button>
                      </Link>
                      {campaign.status === 'paused' && (
                        <Button size="sm" variant="outline">
                          Resume
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button size="sm" variant="outline">
                          Pause
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Sequences</CardTitle>
              <CardDescription>
                Automated follow-up sequences for your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">5-Step Introduction Sequence</h3>
                  </div>
                  <Badge>Popular</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Warm introduction followed by value proposition and call-to-action
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    5 emails over 14 days
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    28% reply rate
                  </span>
                </div>
                <Button size="sm" className="mt-3">
                  Use Template
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">3-Step Follow-up</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Quick follow-up sequence for engaged leads
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    3 emails over 7 days
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    35% reply rate
                  </span>
                </div>
                <Button size="sm" className="mt-3">
                  Use Template
                </Button>
              </div>

              <Link href="/dashboard/sales/sequences/new">
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Sequence
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Reusable templates for your outreach campaigns
                  </CardDescription>
                </div>
                <Link href="/dashboard/sales/templates/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Introduction', 'Follow-up', 'Meeting Request', 'Value Proposition'].map((template) => (
                  <div key={template} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{template}</p>
                      <p className="text-sm text-muted-foreground">
                        Last used 2 days ago • 45% open rate
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">Preview</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Open Rate</span>
                    <span className="font-medium">42%</span>
                  </div>
                  <Progress value={42} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Click Rate</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <Progress value={18} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reply Rate</span>
                    <span className="font-medium">8%</span>
                  </div>
                  <Progress value={8} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meeting Conversion</span>
                    <span className="font-medium">3.5%</span>
                  </div>
                  <Progress value={3.5} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Value Prop A', rate: 12 },
                    { name: 'Introduction B', rate: 9 },
                    { name: 'Follow-up C', rate: 7 },
                    { name: 'Meeting Request D', rate: 5 }
                  ].map((template) => (
                    <div key={template.name} className="flex items-center justify-between">
                      <span className="text-sm">{template.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{template.rate}% reply</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/sales/analytics">
                  <Button variant="outline" className="w-full mt-4">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Full Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/sales/leads">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                View All Leads
              </Button>
            </Link>
            <Link href="/dashboard/sales/integrations">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Email Settings
              </Button>
            </Link>
            <Link href="/dashboard/sales/enrichment">
              <Button variant="outline" className="w-full">
                <Target className="mr-2 h-4 w-4" />
                Enrich Leads
              </Button>
            </Link>
            <Link href="/dashboard/sales/export">
              <Button variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}