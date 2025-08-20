'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Zap,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield,
  Key,
  BarChart3,
  Server,
  Code,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';

interface Endpoint {
  path: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  requestsPerMin: number;
  lastError?: string;
}

interface ApiStats {
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  endpoints: Endpoint[];
  rateLimits: {
    requests: number;
    limit: number;
    reset: Date;
  };
  errors: {
    total: number;
    rate4xx: number;
    rate5xx: number;
  };
}

export default function ApiManagementPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.intelagentstudios.com/v1';

  useEffect(() => {
    fetchApiStats();
    const interval = setInterval(fetchApiStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApiStats = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      setStats({
        status: 'operational',
        uptime: 99.98,
        totalRequests: 1247832,
        successRate: 98.5,
        avgResponseTime: 145,
        requestsPerMinute: 523,
        endpoints: [
          {
            path: '/auth/login',
            method: 'POST',
            status: 'healthy',
            responseTime: 89,
            successRate: 99.2,
            requestsPerMin: 45
          },
          {
            path: '/licenses',
            method: 'GET',
            status: 'healthy',
            responseTime: 124,
            successRate: 98.7,
            requestsPerMin: 156
          },
          {
            path: '/analytics',
            method: 'GET',
            status: 'degraded',
            responseTime: 450,
            successRate: 94.3,
            requestsPerMin: 89,
            lastError: 'Slow response times detected'
          },
          {
            path: '/webhooks',
            method: 'POST',
            status: 'healthy',
            responseTime: 67,
            successRate: 99.8,
            requestsPerMin: 23
          }
        ],
        rateLimits: {
          requests: 4523,
          limit: 10000,
          reset: new Date(Date.now() + 3600000)
        },
        errors: {
          total: 1842,
          rate4xx: 1203,
          rate5xx: 639
        }
      });
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(API_BASE_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Down</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const healthyEndpoints = stats?.endpoints.filter(e => e.status === 'healthy').length || 0;
  const totalEndpoints = stats?.endpoints.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your API endpoints
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchApiStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Code className="w-4 h-4 mr-2" />
            API Documentation
          </Button>
        </div>
      </div>

      {/* API Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold capitalize">{stats?.status}</p>
              </div>
              {stats?.status === 'operational' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : stats?.status === 'degraded' ? (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-xl font-bold">{stats?.uptime}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests/min</p>
                <p className="text-xl font-bold">{stats?.requestsPerMinute}</p>
              </div>
              <Activity className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-xl font-bold">{stats?.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold">{stats?.successRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>API Base URL</CardTitle>
          <CardDescription>Use this URL for all API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
              {API_BASE_URL}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyApiUrl}
            >
              {copiedUrl ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>{healthyEndpoints}/{totalEndpoints} endpoints healthy</CardDescription>
                </div>
                <Badge variant="outline">
                  <Server className="w-3 h-3 mr-1" />
                  {totalEndpoints} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.endpoints.map((endpoint, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {endpoint.status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : endpoint.status === 'degraded' ? (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-medium">{endpoint.path}</code>
                        </div>
                        {endpoint.lastError && (
                          <p className="text-xs text-red-500 mt-1">{endpoint.lastError}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Response</p>
                        <p className="font-medium">{endpoint.responseTime}ms</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Success</p>
                        <p className="font-medium">{endpoint.successRate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Req/min</p>
                        <p className="font-medium">{endpoint.requestsPerMin}</p>
                      </div>
                      {getStatusBadge(endpoint.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>Total API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{(stats?.totalRequests || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xl font-semibold">{stats?.requestsPerMinute}</p>
                      <p className="text-xs text-muted-foreground">Per Minute</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold">{Math.round((stats?.requestsPerMinute || 0) * 60)}</p>
                      <p className="text-xs text-muted-foreground">Per Hour</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Response time metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Response Time</span>
                      <span className="font-medium">{stats?.avgResponseTime}ms</span>
                    </div>
                    <Progress 
                      value={Math.min((stats?.avgResponseTime || 0) / 500 * 100, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;200ms
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Success Rate</span>
                      <span className="font-medium">{stats?.successRate}%</span>
                    </div>
                    <Progress 
                      value={stats?.successRate || 0} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &gt;99%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>API usage limits and quotas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Rate limits help protect your API from abuse and ensure fair usage across all clients.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Current Usage</span>
                    <span className="text-sm text-muted-foreground">
                      Resets {new Date(stats?.rateLimits.reset || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{stats?.rateLimits.requests.toLocaleString()} / {stats?.rateLimits.limit.toLocaleString()} requests</span>
                    <span>{Math.round((stats?.rateLimits.requests || 0) / (stats?.rateLimits.limit || 1) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(stats?.rateLimits.requests || 0) / (stats?.rateLimits.limit || 1) * 100} 
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">10,000</p>
                    <p className="text-sm text-muted-foreground">Requests/hour</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">100</p>
                    <p className="text-sm text-muted-foreground">Burst limit</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">60s</p>
                    <p className="text-sm text-muted-foreground">Window</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Tracking</CardTitle>
              <CardDescription>API error rates and details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p className="text-2xl font-bold">{stats?.errors.total.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Errors</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{stats?.errors.rate4xx}</p>
                  <p className="text-sm text-muted-foreground">4xx Errors</p>
                  <p className="text-xs text-muted-foreground mt-1">Client errors</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{stats?.errors.rate5xx}</p>
                  <p className="text-sm text-muted-foreground">5xx Errors</p>
                  <p className="text-xs text-muted-foreground mt-1">Server errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Security</CardTitle>
              <CardDescription>Security configuration and authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">HTTPS Enforced</p>
                      <p className="text-sm text-muted-foreground">All API requests require HTTPS</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">API Key Authentication</p>
                      <p className="text-sm text-muted-foreground">Bearer token required for all requests</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Rate Limiting</p>
                      <p className="text-sm text-muted-foreground">10,000 requests per hour</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}