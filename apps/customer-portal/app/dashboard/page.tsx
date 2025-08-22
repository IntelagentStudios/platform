'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp, Clock, Users, Activity, Shield, Package, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    avgResponseTime: '0s',
    uniqueUsers: 0,
    growthRate: 0
  });
  const [license, setLicense] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchLicense();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchLicense = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setLicense(data);
      }
    } catch (error) {
      console.error('Failed to fetch license:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Conversations',
      value: stats.totalConversations.toLocaleString(),
      icon: MessageSquare,
      change: '+12%',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Active Sessions',
      value: stats.activeConversations.toLocaleString(),
      icon: Activity,
      change: '+8%',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Avg Response Time',
      value: stats.avgResponseTime,
      icon: Clock,
      change: '-15%',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Unique Users',
      value: stats.uniqueUsers.toLocaleString(),
      icon: Users,
      change: '+23%',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your products and usage metrics
        </p>
      </div>

      {/* License Info Card */}
      <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Welcome back!</CardTitle>
              <CardDescription>
                Your license is active and ready to use
              </CardDescription>
            </div>
            <Shield className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Key</p>
              <p className="font-mono text-sm font-semibold">{license?.licenseKey || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-sm font-semibold capitalize">{license?.plan || 'Standard'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
              <div className="flex gap-1 mt-1">
                {(license?.products || ['chatbot']).map((product: string) => (
                  <span key={product} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                    {product}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className={card.change.startsWith('+') ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {card.change}
                  </span>
                  {' '}from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Package className="h-4 w-4 mr-2" />
              Configure Products
            </Button>
            <Button variant="outline" className="justify-start">
              <Globe className="h-4 w-4 mr-2" />
              View Live Chat
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest chat sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      New conversation started
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      5 minutes ago • 12 messages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Service health and uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-medium">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                <span className="text-sm font-medium">99.99%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rate Limit</span>
                <span className="text-sm font-medium">892/1000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}