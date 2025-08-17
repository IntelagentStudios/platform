'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Line, Bar } from 'recharts'
import { 
  LineChart, 
  BarChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface FinancialMetrics {
  mrr: number
  arr: number
  customerCount: number
  growth: number
  churnRate: number
  arpu: number
  tierBreakdown: Record<string, number>
  revenueByMonth: Array<{
    month: string
    revenue: number
    invoiceCount: number
  }>
  recentTransactions: Array<{
    id: string
    customer: string
    amount: number
    status: string
    date: string
  }>
}

export default function BillingPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load financial data</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-500">Monitor your revenue and billing metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Recurring Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.growth > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={metrics.growth > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(metrics.growth)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annual Recurring Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.arr)}</div>
            <p className="text-xs text-muted-foreground">
              Projected annual revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerCount}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Churn: </span>
              <span className={metrics.churnRate < 5 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                {metrics.churnRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Revenue Per User
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.arpu)}</div>
            <p className="text-xs text-muted-foreground">
              Per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Monthly revenue and invoice trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    name="Revenue"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Distribution</CardTitle>
                <CardDescription>Breakdown by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(metrics.tierBreakdown).map(([tier, count]) => ({
                    tier: tier.charAt(0).toUpperCase() + tier.slice(1),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <Badge variant={metrics.growth > 0 ? "default" : "destructive"}>
                    {formatPercentage(metrics.growth)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Churn Rate</span>
                  <Badge variant={metrics.churnRate < 5 ? "default" : "destructive"}>
                    {metrics.churnRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">LTV:CAC Ratio</span>
                  <Badge>3.2:1</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payback Period</span>
                  <Badge>14 months</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.recentTransactions.length > 0 ? (
                  metrics.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium">{transaction.customer}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                        <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$49</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Up to 5 team members</li>
                  <li>✓ 1,000 API calls/month</li>
                  <li>✓ Basic analytics</li>
                  <li>✓ Email support</li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Customers: {metrics.tierBreakdown.basic || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500">
              <CardHeader>
                <Badge className="absolute top-2 right-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$149</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Up to 20 team members</li>
                  <li>✓ 10,000 API calls/month</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Priority support</li>
                  <li>✓ AI insights</li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Customers: {metrics.tierBreakdown.pro || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$499</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Unlimited team members</li>
                  <li>✓ Unlimited API calls</li>
                  <li>✓ Custom analytics</li>
                  <li>✓ Dedicated support</li>
                  <li>✓ Advanced AI features</li>
                  <li>✓ SLA guarantee</li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Customers: {metrics.tierBreakdown.enterprise || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}