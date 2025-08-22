'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, TrendingUp, PoundSterling, Activity, Shield, Clock, Globe } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    totalRevenue: 0,
    activeProducts: 0,
    recentActivity: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetchStats();
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

  const statCards = [
    {
      title: 'Total Licenses',
      value: stats.totalLicenses.toLocaleString(),
      icon: Users,
      change: '+12%',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Active Licenses',
      value: stats.activeLicenses.toLocaleString(),
      icon: Shield,
      change: '+8%',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Monthly Revenue',
      value: `£${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: PoundSterling,
      change: '+23%',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts.toLocaleString(),
      icon: Package,
      change: '+5%',
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
          Monitor your platform performance and key metrics
        </p>
      </div>

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
                  <span className="text-green-600 dark:text-green-400">{card.change}</span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>License Growth</CardTitle>
            <CardDescription>Monthly license activations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart placeholder - Implement with recharts
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Product Distribution</CardTitle>
            <CardDescription>Active products by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart placeholder - Implement with recharts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    New license activated
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    2 minutes ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}