'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  HardDrive, 
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Terminal,
  Zap,
  BarChart3,
  Table
} from 'lucide-react';

interface DatabaseStats {
  connected: boolean;
  type: string;
  version: string;
  uptime: number;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  size: {
    total: number;
    tables: number;
    indexes: number;
  };
  performance: {
    queries: number;
    slowQueries: number;
    avgResponseTime: number;
  };
  tables: Array<{
    name: string;
    rows: number;
    size: number;
    lastModified: Date;
  }>;
}

export default function DatabaseManagementPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      setStats({
        connected: false,
        type: 'PostgreSQL',
        version: '14.5',
        uptime: 0,
        connections: {
          active: 0,
          idle: 0,
          max: 100
        },
        size: {
          total: 0,
          tables: 0,
          indexes: 0
        },
        performance: {
          queries: 0,
          slowQueries: 0,
          avgResponseTime: 0
        },
        tables: []
      });
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    // Simulate connection attempt
    setTimeout(() => {
      setConnecting(false);
    }, 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return 'Not connected';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your database connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDatabaseStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Terminal className="w-4 h-4 mr-2" />
            SQL Console
          </Button>
        </div>
      </div>

      {/* Connection Alert */}
      {!stats?.connected && (
        <Alert className="border-red-200 dark:border-red-900">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Database Not Connected</strong>
              <p className="text-sm mt-1">
                DATABASE_URL environment variable is not configured. Please configure it with a valid PostgreSQL connection string.
              </p>
            </div>
            <Button 
              onClick={handleConnect}
              disabled={connecting}
              className="ml-4"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Configure Connection
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {stats?.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              {stats?.connected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-2xl font-bold">{stats?.type || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">v{stats?.version}</p>
              </div>
              <Database className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(stats?.uptime || 0)}</p>
              </div>
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="text-2xl font-bold">
                  {formatBytes(stats?.size.total || 0)}
                </p>
              </div>
              <HardDrive className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.connected ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Pool</CardTitle>
                  <CardDescription>Active database connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Connections</span>
                        <span>{stats.connections.active}/{stats.connections.max}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(stats.connections.active / stats.connections.max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Active</p>
                        <p className="font-medium">{stats.connections.active}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Idle</p>
                        <p className="font-medium">{stats.connections.idle}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Storage Usage</CardTitle>
                  <CardDescription>Database storage breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tables</span>
                      <Badge>{formatBytes(stats.size.tables)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Indexes</span>
                      <Badge>{formatBytes(stats.size.indexes)}</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-sm font-medium">Total</span>
                      <Badge variant="outline">{formatBytes(stats.size.total)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common database operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto flex-col py-4">
                    <Zap className="w-5 h-5 mb-2" />
                    <span className="text-xs">Optimize</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col py-4">
                    <Download className="w-5 h-5 mb-2" />
                    <span className="text-xs">Backup</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col py-4">
                    <Upload className="w-5 h-5 mb-2" />
                    <span className="text-xs">Restore</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col py-4">
                    <Settings className="w-5 h-5 mb-2" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Currently active database connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active connections</p>
                  <p className="text-sm mt-1">Connections will appear here when the database is connected</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>All tables in your database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tables found</p>
                  <p className="text-sm mt-1">Tables will appear here when the database is connected</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Database query statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stats.performance.queries}</p>
                    <p className="text-sm text-muted-foreground">Total Queries</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{stats.performance.slowQueries}</p>
                    <p className="text-sm text-muted-foreground">Slow Queries</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="text-2xl font-bold">{stats.performance.avgResponseTime}ms</p>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>Manage database backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Regular backups are essential for data recovery. Configure automatic backups to prevent data loss.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="h-auto py-6">
                      <Download className="w-5 h-5 mr-2" />
                      Create Backup
                    </Button>
                    <Button variant="outline" className="h-auto py-6">
                      <Upload className="w-5 h-5 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Database Not Configured</h3>
            <p className="text-muted-foreground mb-4">
              Configure your database connection to access management features
            </p>
            <Button onClick={handleConnect}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Database
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}