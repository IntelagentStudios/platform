'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Zap,
  HardDrive,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Calendar,
  Activity
} from 'lucide-react'

interface UsageData {
  current: {
    apiCalls: {
      used: number
      limit: number
      percentage: number
      remaining: number
    }
    storage: {
      used: number
      limit: number
      percentage: number
      remaining: number
    }
    teamMembers: {
      used: number
      limit: number
      percentage: number
      remaining: number
    }
    chatbotMessages: {
      used: number
      limit: number
      percentage: number
      remaining: number
    }
    enrichmentRequests: {
      used: number
      limit: number
      percentage: number
      remaining: number
    }
  }
  historical: Array<{
    date: string
    apiCalls: number
    chatbotMessages: number
    enrichmentRequests: number
    storageAdded: number
  }>
  alerts: Array<{
    type: string
    resource: string
    message: string
    severity: string
  }>
  recommendations: Array<{
    type: string
    title: string
    description: string
    action: string
    priority: string
  }>
  plan: {
    current: string
    limits: any
    resetDate: string
  }
}

export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === -1) return 'Unlimited'
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    if (num === -1) return 'Unlimited'
    return num.toLocaleString()
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!usageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load usage data</p>
      </div>
    )
  }

  // Prepare chart data
  const usageOverTime = usageData.historical.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'API Calls': day.apiCalls,
    'Chatbot': day.chatbotMessages,
    'Enrichment': day.enrichmentRequests,
  }))

  const resourceUsage = [
    { name: 'API Calls', value: usageData.current.apiCalls.percentage },
    { name: 'Storage', value: usageData.current.storage.percentage },
    { name: 'Chatbot', value: usageData.current.chatbotMessages.percentage },
    { name: 'Enrichment', value: usageData.current.enrichmentRequests.percentage },
  ]

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usage & Limits</h1>
          <p className="text-gray-500">Monitor your resource usage and plan limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsageData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan: {usageData.plan.current.toUpperCase()}</CardTitle>
          <CardDescription>
            Billing cycle resets on {new Date(usageData.plan.resetDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {usageData.alerts.length > 0 && (
        <div className="space-y-2">
          {usageData.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              {getAlertIcon(alert.type)}
              <AlertTitle>{alert.resource}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatNumber(usageData.current.apiCalls.used)}</span>
                <span className="text-gray-500">/ {formatNumber(usageData.current.apiCalls.limit)}</span>
              </div>
              <Progress 
                value={usageData.current.apiCalls.percentage} 
                className={`h-2 ${getProgressColor(usageData.current.apiCalls.percentage)}`}
              />
              <p className="text-xs text-gray-500">
                {formatNumber(usageData.current.apiCalls.remaining)} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatBytes(usageData.current.storage.used)}</span>
                <span className="text-gray-500">/ {formatBytes(usageData.current.storage.limit)}</span>
              </div>
              <Progress 
                value={usageData.current.storage.percentage} 
                className={`h-2 ${getProgressColor(usageData.current.storage.percentage)}`}
              />
              <p className="text-xs text-gray-500">
                {formatBytes(usageData.current.storage.remaining)} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatNumber(usageData.current.teamMembers.used)}</span>
                <span className="text-gray-500">/ {formatNumber(usageData.current.teamMembers.limit)}</span>
              </div>
              <Progress 
                value={usageData.current.teamMembers.percentage} 
                className={`h-2 ${getProgressColor(usageData.current.teamMembers.percentage)}`}
              />
              <p className="text-xs text-gray-500">
                {formatNumber(usageData.current.teamMembers.remaining)} slots available
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Chatbot Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatNumber(usageData.current.chatbotMessages.used)}</span>
                <span className="text-gray-500">/ {formatNumber(usageData.current.chatbotMessages.limit)}</span>
              </div>
              <Progress 
                value={usageData.current.chatbotMessages.percentage} 
                className={`h-2 ${getProgressColor(usageData.current.chatbotMessages.percentage)}`}
              />
              <p className="text-xs text-gray-500">
                {formatNumber(usageData.current.chatbotMessages.remaining)} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Enrichment Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatNumber(usageData.current.enrichmentRequests.used)}</span>
                <span className="text-gray-500">/ {formatNumber(usageData.current.enrichmentRequests.limit)}</span>
              </div>
              <Progress 
                value={usageData.current.enrichmentRequests.percentage} 
                className={`h-2 ${getProgressColor(usageData.current.enrichmentRequests.percentage)}`}
              />
              <p className="text-xs text-gray-500">
                {formatNumber(usageData.current.enrichmentRequests.remaining)} remaining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Resource Breakdown</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <CardDescription>Last 30 days of resource consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="API Calls" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="Chatbot" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="Enrichment" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current usage as percentage of limits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resourceUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Average Usage</CardTitle>
                <CardDescription>Average consumption per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Calls/day</span>
                    <Badge>~233</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chatbot Messages/day</span>
                    <Badge>~30</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Enrichment Requests/day</span>
                    <Badge>~12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage Growth/day</span>
                    <Badge>~5 MB</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-4">
            {usageData.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <CardDescription>{rec.description}</CardDescription>
                    </div>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    {rec.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {usageData.recommendations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">Your usage is well within limits. Keep up the good work!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}