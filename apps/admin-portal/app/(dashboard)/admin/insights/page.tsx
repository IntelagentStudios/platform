'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Sparkles,
  RefreshCw,
  Send,
  ChevronRight,
  Eye,
  Users,
  DollarSign,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface Insight {
  id: string
  type: 'growth' | 'risk' | 'opportunity' | 'anomaly'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric?: string
  value?: number
  change?: number
  recommendation?: string
  confidence: number
}

interface Prediction {
  metric: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

export default function InsightsPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [queryResult, setQueryResult] = useState<any>(null)

  useEffect(() => {
    fetchInsights()
    fetchPredictions()
  }, [])

  const fetchInsights = async () => {
    // Simulate AI-generated insights
    setInsights([
      {
        id: '1',
        type: 'growth',
        title: 'Revenue Growth Acceleration Detected',
        description: 'Your MRR has grown 23% faster than the previous quarter. This acceleration is primarily driven by enterprise customer acquisitions.',
        impact: 'high',
        metric: 'MRR Growth',
        value: 23,
        change: 8.5,
        recommendation: 'Consider increasing sales team capacity to maintain momentum.',
        confidence: 92
      },
      {
        id: '2',
        type: 'risk',
        title: 'Churn Risk in Basic Tier',
        description: 'Basic tier customers show 15% higher churn probability based on usage patterns. Low API usage correlates with cancellation.',
        impact: 'medium',
        metric: 'Churn Risk',
        value: 15,
        change: 3.2,
        recommendation: 'Implement engagement campaigns for low-usage basic customers.',
        confidence: 87
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Upsell Opportunity Identified',
        description: '12 Pro customers are consistently hitting 90%+ of their API limits, indicating readiness for Enterprise plan.',
        impact: 'high',
        metric: 'Upsell Potential',
        value: 12,
        change: 0,
        recommendation: 'Reach out to these customers with Enterprise plan benefits.',
        confidence: 94
      },
      {
        id: '4',
        type: 'anomaly',
        title: 'Unusual API Usage Pattern',
        description: 'API calls spike 3x every Tuesday afternoon, potentially indicating batch processing or automated workflows.',
        impact: 'low',
        metric: 'API Pattern',
        value: 300,
        change: 0,
        recommendation: 'Investigate to optimize infrastructure scaling.',
        confidence: 78
      }
    ])
  }

  const fetchPredictions = async () => {
    setPredictions([
      {
        metric: 'MRR (Next Month)',
        current: 5420,
        predicted: 6234,
        confidence: 85,
        trend: 'up'
      },
      {
        metric: 'Customer Count',
        current: 42,
        predicted: 48,
        confidence: 90,
        trend: 'up'
      },
      {
        metric: 'Churn Rate',
        current: 2.1,
        predicted: 1.8,
        confidence: 75,
        trend: 'down'
      },
      {
        metric: 'API Usage',
        current: 67000,
        predicted: 78500,
        confidence: 88,
        trend: 'up'
      }
    ])
  }

  const handleQuery = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/smart-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      if (response.ok) {
        const result = await response.json()
        setQueryResult(result)
      }
    } catch (error) {
      console.error('Query failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'risk':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case 'anomaly':
        return <Eye className="h-5 w-5 text-blue-500" />
      default:
        return <Brain className="h-5 w-5 text-purple-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      default:
        return 'secondary'
    }
  }

  // Sample data for visualizations
  const performanceData = [
    { month: 'Jul', actual: 3200, predicted: 3100, benchmark: 2800 },
    { month: 'Aug', actual: 3800, predicted: 3750, benchmark: 3200 },
    { month: 'Sep', actual: 4100, predicted: 4200, benchmark: 3600 },
    { month: 'Oct', actual: 4500, predicted: 4400, benchmark: 4000 },
    { month: 'Nov', actual: 4900, predicted: 4950, benchmark: 4400 },
    { month: 'Dec', actual: 5420, predicted: 5500, benchmark: 4800 },
    { month: 'Jan', actual: null, predicted: 6234, benchmark: 5200 }
  ]

  const healthMetrics = [
    { metric: 'Customer Satisfaction', value: 92, benchmark: 85 },
    { metric: 'Product Adoption', value: 78, benchmark: 70 },
    { metric: 'Feature Usage', value: 85, benchmark: 75 },
    { metric: 'Support Efficiency', value: 88, benchmark: 80 },
    { metric: 'System Reliability', value: 99.9, benchmark: 99 },
    { metric: 'API Performance', value: 94, benchmark: 90 }
  ]

  const segmentAnalysis = [
    { segment: 'Enterprise', revenue: 2500, growth: 35, health: 95 },
    { segment: 'Professional', revenue: 2200, growth: 20, health: 88 },
    { segment: 'Basic', revenue: 720, growth: 10, health: 72 }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Insights
          </h1>
          <p className="text-gray-500">Powered by advanced analytics and machine learning</p>
        </div>
        <Button onClick={fetchInsights}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      {/* Natural Language Query */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Ask AI Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about your business metrics in natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., What's driving our revenue growth? Which customers are at risk?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            />
            <Button onClick={handleQuery} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {queryResult && (
            <Alert className="mt-4">
              <Brain className="h-4 w-4" />
              <AlertTitle>AI Response</AlertTitle>
              <AlertDescription>{queryResult.answer || queryResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{prediction.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {prediction.metric.includes('Rate') 
                      ? `${prediction.predicted}%` 
                      : prediction.metric.includes('MRR')
                      ? `$${prediction.predicted.toLocaleString()}`
                      : prediction.predicted.toLocaleString()}
                  </span>
                  {prediction.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : prediction.trend === 'down' ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-500">
                  Current: {prediction.metric.includes('Rate') 
                    ? `${prediction.current}%` 
                    : prediction.metric.includes('MRR')
                    ? `$${prediction.current.toLocaleString()}`
                    : prediction.current.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {prediction.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Actionable insights discovered by our AI engine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="space-y-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="flex items-center gap-1 mt-2">
                          <ChevronRight className="h-4 w-4 text-blue-500" />
                          <p className="text-sm text-blue-600">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                    <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="health">Business Health</TabsTrigger>
          <TabsTrigger value="segments">Segment Analysis</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Predictions</CardTitle>
              <CardDescription>Actual performance compared to AI predictions and benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeDasharray="5 5" name="Predicted" />
                  <Line type="monotone" dataKey="benchmark" stroke="#ffc658" strokeDasharray="3 3" name="Industry Benchmark" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Business Health Metrics</CardTitle>
              <CardDescription>Key performance indicators vs benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={healthMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {segmentAnalysis.map((segment) => (
              <Card key={segment.segment}>
                <CardHeader>
                  <CardTitle>{segment.segment}</CardTitle>
                  <CardDescription>Segment performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="text-2xl font-bold">${segment.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Growth Rate</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-medium">{segment.growth}%</p>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Health Score</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            segment.health > 90 ? 'bg-green-500' : 
                            segment.health > 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${segment.health}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{segment.health}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>Unusual patterns detected by AI monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Spike in Failed Payments</AlertTitle>
                  <AlertDescription>
                    23% increase in payment failures detected yesterday. Pattern suggests potential payment gateway issue.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Unusual Login Pattern</AlertTitle>
                  <AlertDescription>
                    Multiple accounts showing synchronized login times from different regions. Investigating potential automation.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>API Usage Anomaly</AlertTitle>
                  <AlertDescription>
                    Customer ID #2847 showing 10x normal API usage. Could indicate integration issue or potential abuse.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}