'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  LineChart,
  PieChart
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  const metrics = [
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

  const topPerformers = [
    { name: 'Cold Outreach v2', sent: 3245, opens: '48.2%', clicks: '12.3%', replies: '4.1%' },
    { name: 'Follow-up Sequence', sent: 2156, opens: '45.7%', clicks: '9.8%', replies: '3.5%' },
    { name: 'Re-engagement Campaign', sent: 1890, opens: '41.3%', clicks: '7.2%', replies: '2.8%' },
    { name: 'Product Launch', sent: 1567, opens: '39.8%', clicks: '6.5%', replies: '2.3%' }
  ];

  const emailPerformance = [
    { subject: 'Quick question about {{company}}', opens: 856, clicks: 142, replies: 28 },
    { subject: 'Following up on our conversation', opens: 734, clicks: 98, replies: 19 },
    { subject: 'Ideas for improving {{metric}}', opens: 692, clicks: 87, replies: 15 },
    { subject: 'Can we help with {{pain_point}}?', opens: 623, clicks: 76, replies: 12 }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>
          <p className="text-gray-400 mt-1">
            Track performance and optimize your sales campaigns
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
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
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
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
            className="border-gray-600 hover:bg-gray-700"
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
            <Card key={metric.label} className="bg-gray-800/50 border-gray-700 p-4">
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
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <p className="text-xs text-gray-400 mt-1">{metric.label}</p>
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
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <LineChart className="h-5 w-5 text-purple-500" />
              Email Engagement Trend
            </h3>
            <Badge variant="outline" className="border-gray-600">
              {timeRange === '7days' ? 'Weekly' : timeRange === '30days' ? 'Monthly' : 'Daily'}
            </Badge>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">
              [Line chart showing open rates, click rates, and reply rates over time]
            </p>
          </div>
        </Card>

        {/* Campaign Performance Comparison */}
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Campaign Performance
            </h3>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">
              [Bar chart comparing different campaigns]
            </p>
          </div>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Top Performing Campaigns
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Campaign</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Sent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Open Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Click Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Reply Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((campaign, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="py-3 px-4">
                    <span className="text-white font-medium">{campaign.name}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-300">{campaign.sent.toLocaleString()}</td>
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
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Best Performing Emails */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-500" />
          Best Performing Email Templates
        </h3>
        <div className="space-y-3">
          {emailPerformance.map((email, index) => (
            <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
              <p className="text-white font-medium mb-2">{email.subject}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1 text-gray-400">
                  <Eye className="h-3 w-3" />
                  {email.opens} opens
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <MousePointer className="h-3 w-3" />
                  {email.clicks} clicks
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <MessageSquare className="h-3 w-3" />
                  {email.replies} replies
                </span>
                <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400">
                  High Performer
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-500" />
          Conversion Funnel
        </h3>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">12,845</p>
            <p className="text-sm text-gray-400 mt-1">Emails Sent</p>
            <div className="mt-2 h-2 bg-purple-500 rounded"></div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">5,433</p>
            <p className="text-sm text-gray-400 mt-1">Opened (42.3%)</p>
            <div className="mt-2 h-2 bg-blue-500 rounded" style={{ width: '80%', margin: '0 auto' }}></div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">1,117</p>
            <p className="text-sm text-gray-400 mt-1">Clicked (8.7%)</p>
            <div className="mt-2 h-2 bg-green-500 rounded" style={{ width: '60%', margin: '0 auto' }}></div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">411</p>
            <p className="text-sm text-gray-400 mt-1">Replied (3.2%)</p>
            <div className="mt-2 h-2 bg-yellow-500 rounded" style={{ width: '40%', margin: '0 auto' }}></div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">47</p>
            <p className="text-sm text-gray-400 mt-1">Converted (0.4%)</p>
            <div className="mt-2 h-2 bg-red-500 rounded" style={{ width: '20%', margin: '0 auto' }}></div>
          </div>
        </div>
      </Card>
    </div>
  );
}