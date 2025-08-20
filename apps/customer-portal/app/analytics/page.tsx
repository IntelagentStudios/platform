'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Users, MessageSquare,
  Mail, Database, Zap, Brain, Target, Award, AlertCircle,
  Calendar, Filter, Download, RefreshCw, Sparkles
} from 'lucide-react';

export default function CrossProductAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['all']);

  useEffect(() => {
    fetchAnalyticsData();
    fetchAIInsights();
  }, [timeRange, selectedProducts]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/cross-product?range=${timeRange}&products=${selectedProducts.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/analytics/ai-insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Sample data - would come from API
  const usageOverTime = [
    { date: 'Mon', chatbot: 450, salesAgent: 320, enrichment: 180, total: 950 },
    { date: 'Tue', chatbot: 480, salesAgent: 340, enrichment: 220, total: 1040 },
    { date: 'Wed', chatbot: 520, salesAgent: 380, enrichment: 240, total: 1140 },
    { date: 'Thu', chatbot: 490, salesAgent: 360, enrichment: 200, total: 1050 },
    { date: 'Fri', chatbot: 550, salesAgent: 400, enrichment: 260, total: 1210 },
    { date: 'Sat', chatbot: 380, salesAgent: 280, enrichment: 150, total: 810 },
    { date: 'Sun', chatbot: 350, salesAgent: 250, enrichment: 140, total: 740 }
  ];

  const productPerformance = [
    { product: 'Chatbot', score: 92, usage: 85, satisfaction: 88 },
    { product: 'Sales Agent', score: 85, usage: 72, satisfaction: 90 },
    { product: 'Enrichment', score: 88, usage: 68, satisfaction: 95 }
  ];

  const conversionFunnel = [
    { stage: 'Visitors', value: 10000, conversion: '100%' },
    { stage: 'Engaged', value: 6500, conversion: '65%' },
    { stage: 'Qualified', value: 3200, conversion: '32%' },
    { stage: 'Contacted', value: 1800, conversion: '18%' },
    { stage: 'Converted', value: 450, conversion: '4.5%' }
  ];

  const correlationData = [
    { x: 'Chatbot Messages', y: 'Sales Emails', correlation: 0.78 },
    { x: 'Enrichment Lookups', y: 'Lead Quality', correlation: 0.85 },
    { x: 'Response Time', y: 'Satisfaction', correlation: -0.72 }
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cross-Product Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Unified insights across all your automation products
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={
                      insight.impact === 'critical' ? 'destructive' :
                      insight.impact === 'high' ? 'default' :
                      'secondary'
                    }>
                      {insight.impact}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47.3K</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +12.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +0.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/3</div>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="text-xs">Chatbot</Badge>
              <Badge variant="outline" className="text-xs">Sales</Badge>
              <Badge variant="outline" className="text-xs">Enrich</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Efficiency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88/100</div>
            <Progress value={88} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="correlation">Correlations</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Product Usage Over Time</CardTitle>
              <CardDescription>
                Combined usage metrics across all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="chatbot" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                  <Area type="monotone" dataKey="salesAgent" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                  <Area type="monotone" dataKey="enrichment" stackId="1" stroke="#10b981" fill="#10b981" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={productPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="product" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Radar name="Usage" dataKey="usage" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Satisfaction" dataKey="satisfaction" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productPerformance.map((product) => (
                  <div key={product.product} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{product.product}</span>
                      <Badge variant="outline">{product.score}/100</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Usage</span>
                        <span>{product.usage}%</span>
                      </div>
                      <Progress value={product.usage} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Satisfaction</span>
                        <span>{product.satisfaction}%</span>
                      </div>
                      <Progress value={product.satisfaction} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Unified Conversion Funnel</CardTitle>
              <CardDescription>
                Customer journey across all touchpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={conversionFunnel} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6">
                    {conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>Product Correlation Analysis</CardTitle>
              <CardDescription>
                How products work together to drive results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {correlationData.map((item) => (
                  <div key={item.x} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.x}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{item.y}</span>
                      </div>
                      <Badge 
                        variant={Math.abs(item.correlation) > 0.8 ? 'default' : 'secondary'}
                      >
                        {item.correlation > 0 ? '+' : ''}{item.correlation}
                      </Badge>
                    </div>
                    <Progress 
                      value={Math.abs(item.correlation) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(item.correlation) > 0.8 ? 'Strong' : 
                       Math.abs(item.correlation) > 0.5 ? 'Moderate' : 'Weak'} 
                      {item.correlation > 0 ? ' positive' : ' negative'} correlation
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product-Specific Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chatbot Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Response Time</span>
              <Badge variant="outline">1.2s avg</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Resolution Rate</span>
              <Badge variant="outline">78%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Top Intent</span>
              <Badge variant="outline">Support</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sales Agent Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Open Rate</span>
              <Badge variant="outline">23.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reply Rate</span>
              <Badge variant="outline">8.2%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Best Day</span>
              <Badge variant="outline">Tuesday</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Enrichment Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Match Rate</span>
              <Badge variant="outline">87%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Quality</span>
              <Badge variant="outline">94%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Fields</span>
              <Badge variant="outline">12</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}