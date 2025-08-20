'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  Play,
  Info
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
  error?: string;
}

export default function DatabaseManagementPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Database stats fetch timed out');
        setLoading(false);
        setStats({
          connected: false,
          type: 'PostgreSQL',
          version: 'Unknown',
          uptime: 0,
          connections: { active: 0, idle: 0, max: 100 },
          size: { total: 0, tables: 0, indexes: 0 },
          performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
          tables: []
        });
      }
    }, 15000); // 15 second timeout

    fetchDatabaseStats();
    
    // Refresh stats every 30 seconds instead of constantly
    const intervalId = setInterval(() => {
      if (!loading) {
        fetchDatabaseStats();
      }
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDatabaseStats = async () => {
    try {
      // Don't set loading if we're refreshing in the background
      if (!stats) {
        setLoading(true);
      }
      console.log('Fetching database stats...');
      
      // Also fetch connection status for debugging
      const statusResponse = await fetch('/api/admin/database/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Connection status:', statusData);
        setConnectionStatus(statusData);
      }
      
      const response = await fetch('/api/admin/database', {
        // Add cache control to prevent stale data
        cache: 'no-store'
      });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Database stats:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch database stats:', response.status, errorText);
        // Set default disconnected state
        setStats({
          connected: false,
          type: 'PostgreSQL',
          version: 'Unknown',
          uptime: 0,
          connections: { active: 0, idle: 0, max: 100 },
          size: { total: 0, tables: 0, indexes: 0 },
          performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
          tables: [],
          error: 'Failed to fetch database stats'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch database stats:', error);
      // Set default disconnected state on error
      setStats({
        connected: false,
        type: 'PostgreSQL',
        version: 'Unknown',
        uptime: 0,
        connections: { active: 0, idle: 0, max: 100 },
        size: { total: 0, tables: 0, indexes: 0 },
        performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
        tables: [],
        error: error.message || 'Connection error'
      });
    } finally {
      setLoading(false);
    }
  };


  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);
    
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', query: sqlQuery })
      });
      
      const result = await response.json();
      if (result.success) {
        setQueryResult(result.result);
      } else {
        setQueryError(result.error || 'Query execution failed');
      }
    } catch (error) {
      setQueryError('Failed to execute query');
    } finally {
      setExecuting(false);
    }
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
      <div className="flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Loading database information...</p>
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

      {/* Connection Status */}
      {!stats?.connected && (
        <Alert className="border-yellow-200 dark:border-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div>
              <strong>Connecting to Railway Database...</strong>
              <p className="text-sm mt-1">
                Attempting to connect to the configured Railway PostgreSQL database.
              </p>
              {stats?.error && (
                <p className="text-sm mt-2 text-red-500">
                  Error: {stats.error}
                </p>
              )}
            </div>
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
            <TabsTrigger value="sql">SQL Editor</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats?.connected && (
              <Alert className="border-green-200 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <div>
                    <strong>Database Connected</strong>
                    <p className="text-sm mt-1">Successfully connected to Railway PostgreSQL database</p>
                    <p className="text-xs mt-1 text-muted-foreground">Version: PostgreSQL {stats.version}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
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

          <TabsContent value="sql" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>SQL Editor</CardTitle>
                    <CardDescription>Execute SQL queries directly on your database</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSqlQuery('')}
                    >
                      Clear
                    </Button>
                    <Button 
                      size="sm"
                      onClick={executeQuery}
                      disabled={executing || !sqlQuery.trim()}
                    >
                      {executing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sql-query">SQL Query</Label>
                  <Textarea
                    id="sql-query"
                    placeholder="SELECT * FROM users LIMIT 10;"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="font-mono text-sm min-h-[200px]"
                    rows={8}
                  />
                </div>

                {/* Query Templates */}
                <div>
                  <Label>Quick Templates</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSqlQuery('SELECT * FROM pg_tables WHERE schemaname = \'public\';')}
                    >
                      Show Tables
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSqlQuery('SELECT tablename, pg_total_relation_size(schemaname||\'.\'||tablename) AS size FROM pg_tables WHERE schemaname = \'public\' ORDER BY size DESC;')}
                    >
                      Table Sizes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSqlQuery('SELECT * FROM pg_stat_activity;')}
                    >
                      Active Queries
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSqlQuery('SELECT pg_database_size(current_database());')}
                    >
                      Database Size
                    </Button>
                  </div>
                </div>

                {/* Query Result */}
                {queryError && (
                  <Alert className="border-red-200 dark:border-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Query Error</AlertTitle>
                    <AlertDescription className="font-mono text-sm">
                      {queryError}
                    </AlertDescription>
                  </Alert>
                )}

                {queryResult && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Query Result</Label>
                      <span className="text-sm text-muted-foreground">
                        {Array.isArray(queryResult) ? `${queryResult.length} rows` : 'Command executed'}
                      </span>
                    </div>
                    <div className="border rounded-lg overflow-auto max-h-[400px]">
                      {Array.isArray(queryResult) && queryResult.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              {Object.keys(queryResult[0]).map((key) => (
                                <th key={key} className="text-left p-2 border-b font-medium">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-accent/10">
                                {Object.values(row).map((value: any, vidx: number) => (
                                  <td key={vidx} className="p-2 border-b">
                                    {value === null ? (
                                      <span className="text-muted-foreground italic">NULL</span>
                                    ) : typeof value === 'object' ? (
                                      <span className="font-mono text-xs">{JSON.stringify(value)}</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {Array.isArray(queryResult) ? 'No results returned' : 'Query executed successfully'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                {stats.tables.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Table Name</th>
                          <th className="text-left p-2">Size</th>
                          <th className="text-left p-2">Rows</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.tables.map((table, idx) => (
                          <tr key={idx} className="border-b hover:bg-accent/10">
                            <td className="p-2 font-mono text-sm">{table.name}</td>
                            <td className="p-2 text-sm">{formatBytes(table.size)}</td>
                            <td className="p-2 text-sm">{table.rows.toLocaleString()}</td>
                            <td className="p-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSqlQuery(`SELECT * FROM ${table.name} LIMIT 100;`);
                                  // Switch to SQL tab
                                  const sqlTab = document.querySelector('[value="sql"]') as HTMLButtonElement;
                                  sqlTab?.click();
                                }}
                              >
                                <Terminal className="w-4 h-4 mr-2" />
                                Query
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Table className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tables found</p>
                    <p className="text-sm mt-1">Tables will appear here when the database is connected</p>
                  </div>
                )}
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
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Connecting to Database</h3>
            <p className="text-muted-foreground mb-4">
              Establishing connection to Railway PostgreSQL database...
            </p>
            {stats?.error && (
              <p className="text-sm text-red-500 mt-2">
                {stats.error}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}