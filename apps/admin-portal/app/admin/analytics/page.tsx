'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Shield,
  Server,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('24h')

  const sections = [
    {
      title: 'Financial Analytics',
      description: 'Revenue, billing, and payment metrics',
      icon: DollarSign,
      color: 'text-primary',
      href: '/admin/analytics/finances',
      metrics: [
        { label: 'Monthly Revenue', value: '$0', change: 0 },
        { label: 'Active Subscriptions', value: '0', change: 0 },
        { label: 'Payment Success Rate', value: '0%', change: 0 }
      ]
    },
    {
      title: 'User Analytics',
      description: 'User engagement and growth metrics',
      icon: Users,
      color: 'text-secondary',
      href: '/admin/analytics/users',
      metrics: [
        { label: 'Total Users', value: '0', change: 0 },
        { label: 'Active Users', value: '0', change: 0 },
        { label: 'User Retention', value: '0%', change: 0 }
      ]
    },
    {
      title: 'Infrastructure Analytics',
      description: 'System performance and health',
      icon: Server,
      color: 'text-accent',
      href: '/admin/analytics/infrastructure',
      metrics: [
        { label: 'Uptime', value: '99.9%', change: 0 },
        { label: 'Response Time', value: '0ms', change: 0 },
        { label: 'Error Rate', value: '0%', change: 0 }
      ]
    },
    {
      title: 'Compliance Analytics',
      description: 'Security and compliance tracking',
      icon: Shield,
      color: 'text-muted-foreground',
      href: '/admin/analytics/compliance',
      metrics: [
        { label: 'Compliance Score', value: '0%', change: 0 },
        { label: 'Security Events', value: '0', change: 0 },
        { label: 'Audit Logs', value: '0', change: 0 }
      ]
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor key metrics across your platform
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/analytics/finances')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">+0%</span> from last period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/analytics/users')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">+0%</span> from last period
                </p>
              </div>
              <Users className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/analytics/infrastructure')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">Stable</span>
                </p>
              </div>
              <Server className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/analytics/compliance')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-muted-foreground">No data</span>
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card 
              key={section.title}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${section.color}`} />
                      {section.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.metrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.value}</span>
                        {metric.change !== 0 && (
                          metric.change > 0 ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-destructive" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-sm text-primary hover:underline">
                    View Detailed Analytics →
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common analytics tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/admin/reports')}
              className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left"
            >
              <BarChart3 className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium">Generate Report</p>
              <p className="text-sm text-muted-foreground">Create custom analytics report</p>
            </button>
            <button 
              onClick={() => router.push('/admin/exports')}
              className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left"
            >
              <LineChart className="h-5 w-5 text-secondary mb-2" />
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">Download analytics data</p>
            </button>
            <button 
              onClick={() => router.push('/admin/settings')}
              className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left"
            >
              <PieChart className="h-5 w-5 text-accent mb-2" />
              <p className="font-medium">Configure Metrics</p>
              <p className="text-sm text-muted-foreground">Customize tracking settings</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}