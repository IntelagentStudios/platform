'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  Server,
  Zap,
  RefreshCw,
  Settings,
  Terminal,
  Activity,
  Info,
  ChevronRight,
  Wrench
} from 'lucide-react';

interface SystemIssue {
  id: string;
  component: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affected: string[];
  solution: string;
  autoFixAvailable: boolean;
  timestamp: Date;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  cpu: { usage: number; cores: number; temperature?: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  network: { latency: number; packetLoss: number };
  services: any[];
}

export default function SystemManagementPage() {
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Simulated data - replace with actual API calls
      setIssues([
        {
          id: '1',
          component: 'Database',
          type: 'critical',
          title: 'Database Connection Failed',
          description: 'DATABASE_URL environment variable is not configured',
          affected: ['User authentication', 'Data persistence', 'Session management'],
          solution: 'Configure DATABASE_URL in environment variables with valid PostgreSQL connection string',
          autoFixAvailable: false,
          timestamp: new Date()
        },
        {
          id: '2',
          component: 'Redis',
          type: 'warning',
          title: 'Cache Service Unavailable',
          description: 'Redis connection cannot be established',
          affected: ['Performance', 'Session caching'],
          solution: 'Start Redis service or configure REDIS_URL',
          autoFixAvailable: true,
          timestamp: new Date()
        }
      ]);

      setHealth({
        status: 'degraded',
        cpu: { usage: 45, cores: 8 },
        memory: { used: 6442450944, total: 17179869184, percentage: 37.5 },
        disk: { used: 53687091200, total: 256000000000, percentage: 21 },
        network: { latency: 12, packetLoss: 0 },
        services: []
      });
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async (issueId: string) => {
    setFixing(issueId);
    // Simulate auto-fix
    setTimeout(() => {
      setIssues(prev => prev.filter(i => i.id !== issueId));
      setFixing(null);
    }, 2000);
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'redis':
      case 'cache':
        return <Zap className="w-5 h-5" />;
      case 'server':
        return <Server className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const criticalIssues = issues.filter(i => i.type === 'critical');
  const warningIssues = issues.filter(i => i.type === 'warning');
  const infoIssues = issues.filter(i => i.type === 'info');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and resolve system issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSystemData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Terminal className="w-4 h-4 mr-2" />
            System Console
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={health?.status === 'healthy' ? 'border-green-500' : health?.status === 'critical' ? 'border-red-500' : 'border-yellow-500'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold capitalize">{health?.status || 'Unknown'}</p>
              </div>
              {health?.status === 'healthy' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : health?.status === 'critical' ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">{criticalIssues.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{warningIssues.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Fixable</p>
                <p className="text-2xl font-bold">{issues.filter(i => i.autoFixAvailable).length}</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Critical Issues Requiring Attention</CardTitle>
            <CardDescription>These issues are affecting system functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalIssues.map((issue) => (
              <Alert key={issue.id} className="border-red-200 dark:border-red-900">
                <div className="flex items-start gap-3">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {getComponentIcon(issue.component)}
                      {issue.title}
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                      <p>{issue.description}</p>
                      
                      <div>
                        <p className="font-medium text-sm mb-1">Affected Systems:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {issue.affected.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium text-sm mb-1">Solution:</p>
                        <p className="text-sm">{issue.solution}</p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {issue.autoFixAvailable ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleAutoFix(issue.id)}
                            disabled={fixing === issue.id}
                          >
                            {fixing === issue.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Fixing...
                              </>
                            ) : (
                              <>
                                <Wrench className="w-4 h-4 mr-2" />
                                Auto-Fix
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Manual Configuration
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warningIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
            <CardDescription>Non-critical issues that should be addressed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warningIssues.map((issue) => (
              <Alert key={issue.id}>
                <div className="flex items-start gap-3">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {getComponentIcon(issue.component)}
                      {issue.title}
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                      <p>{issue.description}</p>
                      
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium text-sm mb-1">Recommended Action:</p>
                        <p className="text-sm">{issue.solution}</p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {issue.autoFixAvailable && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAutoFix(issue.id)}
                            disabled={fixing === issue.id}
                          >
                            {fixing === issue.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Fixing...
                              </>
                            ) : (
                              <>
                                <Wrench className="w-4 h-4 mr-2" />
                                Auto-Fix
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Current resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span>{health?.cpu.usage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${health?.cpu.usage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {health?.cpu.cores} cores available
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="w-4 h-4" />
                <span className="font-medium">Memory</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span>{health?.memory.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (health?.memory.percentage || 0) > 80 
                        ? 'bg-red-400' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${health?.memory.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((health?.memory.used || 0) / 1024 / 1024 / 1024)}GB / 
                  {Math.round((health?.memory.total || 0) / 1024 / 1024 / 1024)}GB
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4" />
                <span className="font-medium">Disk Space</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span>{health?.disk.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (health?.disk.percentage || 0) > 90 
                        ? 'bg-red-400' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${health?.disk.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((health?.disk.used || 0) / 1024 / 1024 / 1024)}GB / 
                  {Math.round((health?.disk.total || 0) / 1024 / 1024 / 1024)}GB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Issues */}
      {issues.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Systems Operational</h3>
            <p className="text-muted-foreground">
              No issues detected. Your system is running smoothly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}