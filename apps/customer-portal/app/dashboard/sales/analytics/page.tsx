'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  MousePointer,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  Award,
  Download,
  Filter,
  ChevronRight,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  metrics: any[]
  engagementTrend: any[]
  campaignPerformance: any[]
  topPerformers: any[]
  emailPerformance: any[]
  conversionFunnel: any[]
  heatmapData: any[]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    metrics: [],
    engagementTrend: [],
    campaignPerformance: [],
    topPerformers: [],
    emailPerformance: [],
    conversionFunnel: [],
    heatmapData: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange, selectedCampaign]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        campaign: selectedCampaign
      });

      const response = await fetch(`/api/sales/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/sales/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, campaign: selectedCampaign })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Report exported successfully' });
      }
    } catch (error) {
      toast({ title: 'Failed to export report', variant: 'destructive' });
    }
  };

  // Generate mock data if no real data
  const metrics = analyticsData.metrics.length > 0 ? analyticsData.metrics : [
    {
      label: 'Total Emails Sent',
      value: '12,845',
      change: '+23.5%',
      trend: 'up',
      icon: Mail
    },
    {
      label: 'Open Rate',
      value: '42.3%',
      change: '+5.2%',
      trend: 'up',
      icon: Eye
    },
    {
      label: 'Click Rate',
      value: '8.7%',
      change: '-1.2%',
      trend: 'down',
      icon: MousePointer
    },
    {
      label: 'Reply Rate',
      value: '3.2%',
      change: '+0.8%',
      trend: 'up',
      icon: MessageSquare
    },
    {
      label: 'Meetings Booked',
      value: '47',
      change: '+15',
      trend: 'up',
      icon: Calendar
    },
    {
      label: 'Conversion Rate',
      value: '2.4%',
      change: '+0.3%',
      trend: 'up',
      icon: Target
    }
  ];

  // Mock engagement trend data for chart
  const engagementTrend = analyticsData.engagementTrend.length > 0 ? analyticsData.engagementTrend : [
    { date: 'Mon', opens: 45, clicks: 12, replies: 3 },
    { date: 'Tue', opens: 48, clicks: 14, replies: 4 },
    { date: 'Wed', opens: 42, clicks: 11, replies: 2 },
    { date: 'Thu', opens: 51, clicks: 15, replies: 5 },
    { date: 'Fri', opens: 46, clicks: 13, replies: 3 },
    { date: 'Sat', opens: 38, clicks: 9, replies: 2 },
    { date: 'Sun', opens: 35, clicks: 8, replies: 1 }
  ];

  // Mock campaign performance data
  const campaignData = analyticsData.campaignPerformance.length > 0 ? analyticsData.campaignPerformance : [
    { name: 'Cold Outreach', sent: 3245, opened: 1565, clicked: 399, replied: 133 },
    { name: 'Follow-up', sent: 2156, opened: 985, clicked: 211, replied: 75 },
    { name: 'Re-engagement', sent: 1890, opened: 780, clicked: 136, replied: 53 },
    { name: 'Product Launch', sent: 1567, opened: 623, clicked: 102, replied: 36 },
    { name: 'Nurture', sent: 987, opened: 412, clicked: 67, replied: 23 }
  ];

  // Mock funnel data
  const funnelData = analyticsData.conversionFunnel.length > 0 ? analyticsData.conversionFunnel : [
    { name: 'Emails Sent', value: 12845, fill: '#8b5cf6' },
    { name: 'Opened', value: 5433, fill: '#3b82f6' },
    { name: 'Clicked', value: 1117, fill: '#10b981' },
    { name: 'Replied', value: 411, fill: '#f59e0b' },
    { name: 'Converted', value: 47, fill: '#ef4444' }
  ];

  const topPerformers = analyticsData.topPerformers.length > 0 ? analyticsData.topPerformers : [
    { name: 'Cold Outreach v2', sent: 3245, opens: '48.2%', clicks: '12.3%', replies: '4.1%' },
    { name: 'Follow-up Sequence', sent: 2156, opens: '45.7%', clicks: '9.8%', replies: '3.5%' },
    { name: 'Re-engagement Campaign', sent: 1890, opens: '41.3%', clicks: '7.2%', replies: '2.8%' },
    { name: 'Product Launch', sent: 1567, opens: '39.8%', clicks: '6.5%', replies: '2.3%' }
  ];

  const emailPerformance = analyticsData.emailPerformance.length > 0 ? analyticsData.emailPerformance : [
    { subject: 'Quick question about {{company}}', opens: 856, clicks: 142, replies: 28 },
    { subject: 'Following up on our conversation', opens: 734, clicks: 98, replies: 19 },
    { subject: 'Ideas for improving {{metric}}', opens: 692, clicks: 87, replies: 15 },
    { subject: 'Can we help with {{pain_point}}?', opens: 623, clicks: 76, replies: 12 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and optimize your sales campaigns
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="re-engagement">Re-engagement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Icon className="h-4 w-4 text-purple-500" />
                </div>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              <p className={`text-xs mt-1 ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {metric.change} from last period
              </p>
            </Card>
          );
        })}
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Email Engagement Trend
              </span>
              <Badge variant="outline">
                {timeRange === '7days' ? 'Weekly' : timeRange === '30days' ? 'Monthly' : 'Daily'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={engagementTrend}>
                <defs>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Area type="monotone" dataKey="opens" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOpens)" name="Opens (%)" />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClicks)" name="Clicks (%)" />
                <Area type="monotone" dataKey="replies" stroke="#10b981" fillOpacity={1} fill="url(#colorReplies)" name="Replies (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campaign Performance
              </span>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Bar dataKey="sent" fill="#6b7280" name="Sent" />
                <Bar dataKey="opened" fill="#8b5cf6" name="Opened" />
                <Bar dataKey="clicked" fill="#3b82f6" name="Clicked" />
                <Bar dataKey="replied" fill="#10b981" name="Replied" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performing Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Sent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Open Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Click Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Reply Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((campaign, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <span className="font-medium">{campaign.name}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-muted-foreground">{campaign.sent.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">
                    <span className="text-green-400">{campaign.opens}</span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-blue-400">{campaign.clicks}</span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-purple-400">{campaign.replies}</span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      {/* Best Performing Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Best Performing Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailPerformance.map((email, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">{email.subject}</p>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {email.opens} opens
                </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MousePointer className="h-3 w-3" />
                    {email.clicks} clicks
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {email.replies} replies
                </span>
                  <Badge variant="secondary" className="ml-auto">
                  High Performer
                </Badge>
              </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.value.toLocaleString()}</p>
                    {index > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {((item.value / funnelData[0].value) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
