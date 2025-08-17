'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard,
  AlertCircle,
  Download,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { RevenueChart } from './revenue-chart'
import { CostBreakdown } from './cost-breakdown'
import { CustomerMetrics } from './customer-metrics'
import { InvoicesList } from './invoices-list'

export function FinancialDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [period])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/financial/metrics?period=${period}`)
      const data = await res.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const res = await fetch(`/api/financial/export?period=${period}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${period}.pdf`
      a.click()
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading financial data...</div>
  }

  if (!metrics) {
    return <div>No financial data available</div>
  }

  const { overview, customers, revenue, costs, payments } = metrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Financial Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.mrr)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overview.growthRate > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{formatPercentage(overview.growthRate)}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{formatPercentage(overview.growthRate)}</span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.arr)}</div>
            <p className="text-xs text-muted-foreground">
              Projected annual revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.ltv)}</div>
            <p className="text-xs text-muted-foreground">
              Avg. revenue per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Runway</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.runway === 999 ? '∞' : `${overview.runway} months`}
            </div>
            <p className="text-xs text-muted-foreground">
              At current burn rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Gross Margin</span>
                <span className="font-medium">{formatPercentage(overview.grossMargin)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    overview.grossMargin > 70 ? 'bg-green-500' :
                    overview.grossMargin > 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(overview.grossMargin, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Churn Rate</span>
                <span className="font-medium">{formatPercentage(overview.churnRate)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    overview.churnRate < 5 ? 'bg-green-500' :
                    overview.churnRate < 10 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(overview.churnRate * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Payment Success Rate</span>
                <span className="font-medium">{formatPercentage(payments.successRate)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    payments.successRate > 95 ? 'bg-green-500' :
                    payments.successRate > 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${payments.successRate}%` }}
                />
              </div>
            </div>
          </div>

          {overview.burnRate > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Current burn rate: {formatCurrency(overview.burnRate)}/month
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="costs">Cost Management</TabsTrigger>
          <TabsTrigger value="customers">Customer Metrics</TabsTrigger>
          <TabsTrigger value="invoices">Invoices & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueChart data={revenue} />
        </TabsContent>

        <TabsContent value="costs">
          <CostBreakdown data={costs} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerMetrics data={customers} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}