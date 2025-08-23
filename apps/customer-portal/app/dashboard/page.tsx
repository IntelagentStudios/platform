'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp, Clock, Users, Activity, Shield, Package, Globe, FileText, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    avgResponseTime: '0s',
    uniqueUsers: 0,
    growthRate: 0,
    apiCalls: 0,
    dataProcessed: 0,
    products: [] as string[],
    plan: 'basic',
    hasAiPro: false,
    licenseStatus: 'active'
  });
  const [license, setLicense] = useState<any>(null);
  const [productStatus, setProductStatus] = useState<any>({});

  useEffect(() => {
    fetchStats();
    fetchLicense();
    fetchProductStatus();
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

  const fetchProductStatus = async () => {
    try {
      const response = await fetch('/api/products/status');
      if (response.ok) {
        const data = await response.json();
        setProductStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch product status:', error);
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
              <div className="flex gap-1 mt-1">
                {stats.products.map((product: string) => (
                  <span key={product} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded capitalize">
                    {product.replace('-', ' ')}
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

      {/* Pro Analytics Section - Only show if user has the upgrade */}
      {stats.hasAiPro && (
        <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pro Analytics
            </CardTitle>
            <CardDescription>Advanced insights and predictions for your products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Growth</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+{stats.growthRate * 1.5}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Optimal Response Time</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">1.2s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Score</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">92/100</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button className="w-full" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                View Insights Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product-Specific Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Setup and manage your licensed products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.products.map((product, index) => {
                const status = productStatus[product];
                const needsSetup = status && !status.isComplete;
                
                return (
                  <div key={product} className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        status?.isComplete 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-yellow-100 dark:bg-yellow-900/20'
                      }`}>
                        {status?.isComplete ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {product.replace('-', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {status?.isComplete 
                            ? `Active - ${status.usage?.current || 0} ${status.usage?.unit || 'uses'} this month`
                            : status?.inProgress 
                              ? `Setup ${status.progress}% complete`
                              : 'Setup required'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {needsSetup ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/setup/${product}`)}
                          className="text-xs"
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          {status?.inProgress ? 'Resume' : 'Start'} Setup
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {stats.products.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    No products purchased yet
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://intelagentstudios.com/products', '_blank')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </div>
              )}
            </div>
            {stats.products.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push('/products')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  View All Products
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Usage Metrics</CardTitle>
            <CardDescription>Your license usage this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Calls</span>
                <span className="text-sm font-medium">{stats.apiCalls.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Data Processed</span>
                <span className="text-sm font-medium">{stats.dataProcessed} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</span>
                <span className="text-sm font-medium">{stats.activeConversations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Unique Users</span>
                <span className="text-sm font-medium">{stats.uniqueUsers.toLocaleString()}</span>
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