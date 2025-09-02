'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Shield, 
  DollarSign, 
  Settings, 
  Server,
  Users,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Network
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  skillCount: number;
  activeSkills: number;
  decisions: number;
  health: number;
}

interface SystemMetrics {
  totalSkills: number;
  activeExecutions: number;
  queuedTasks: number;
  systemHealth: number;
  successRate: number;
  avgExecutionTime: number;
}

interface SkillExecution {
  id: string;
  skillName: string;
  agent: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  executionTime?: number;
  licenseKey: string;
}

export default function ManagementSystemDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      id: 'finance',
      name: 'Finance Agent',
      status: 'active',
      skillCount: 30,
      activeSkills: 3,
      decisions: 145,
      health: 98
    },
    {
      id: 'operations',
      name: 'Operations Agent',
      status: 'busy',
      skillCount: 80,
      activeSkills: 12,
      decisions: 523,
      health: 95
    },
    {
      id: 'security',
      name: 'Security Agent',
      status: 'active',
      skillCount: 40,
      activeSkills: 5,
      decisions: 89,
      health: 100
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Agent',
      status: 'active',
      skillCount: 60,
      activeSkills: 8,
      decisions: 267,
      health: 97
    }
  ]);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalSkills: 310,
    activeExecutions: 28,
    queuedTasks: 45,
    systemHealth: 97.5,
    successRate: 99.2,
    avgExecutionTime: 127
  });

  const [recentExecutions, setRecentExecutions] = useState<SkillExecution[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real-time data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/management/status');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setAgents(data.agents);
          setRecentExecutions(data.executions);
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Failed to fetch management data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'finance': return <DollarSign className="h-5 w-5" />;
      case 'operations': return <Settings className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      case 'infrastructure': return <Server className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const executeBusinessRequest = async () => {
    try {
      const response = await fetch('/api/management/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'automated_workflow',
          description: 'Process customer onboarding',
          requirements: {
            steps: ['create_account', 'send_welcome_email', 'schedule_demo'],
            priority: 5
          },
          licenseKey: 'MASTER'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Business request executed:', result);
      }
    } catch (error) {
      console.error('Failed to execute business request:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Skills Management System</h1>
          <p className="text-muted-foreground">310 Skills • 4 Management Agents • Fully Autonomous</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={executeBusinessRequest} className="bg-green-600">
            <Zap className="mr-2 h-4 w-4" />
            Execute Request
          </Button>
          <Button variant="outline">
            <Brain className="mr-2 h-4 w-4" />
            Train Agents
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSkills}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeExecutions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.queuedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.successRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgExecutionTime}ms</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.systemHealth}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Management Agents
          </CardTitle>
          <CardDescription>Autonomous agents managing the skill matrix</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {agents.map(agent => (
              <Card 
                key={agent.id} 
                className={`cursor-pointer transition-all ${selectedAgent === agent.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getAgentIcon(agent.id)}
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Skills:</span>
                    <span className="font-bold">{agent.skillCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active:</span>
                    <span className="font-bold text-green-600">{agent.activeSkills}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Decisions:</span>
                    <span className="font-bold">{agent.decisions}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Health:</span>
                      <span>{agent.health}%</span>
                    </div>
                    <Progress value={agent.health} className="h-2" />
                  </div>
                  <Badge variant={agent.status === 'busy' ? 'default' : 'secondary'}>
                    {agent.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="executions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="skills">Skill Distribution</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Skill Executions</CardTitle>
              <CardDescription>Real-time skill execution monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentExecutions.slice(0, 10).map((execution, index) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {execution.status === 'running' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {execution.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {execution.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      <div>
                        <div className="font-medium">{execution.skillName}</div>
                        <div className="text-sm text-muted-foreground">Agent: {execution.agent}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                        {execution.status}
                      </Badge>
                      {execution.executionTime && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {execution.executionTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skill Distribution</CardTitle>
              <CardDescription>310 skills across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">By Agent</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Finance Agent</span>
                      <span className="font-bold">30 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operations Agent</span>
                      <span className="font-bold">80 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Agent</span>
                      <span className="font-bold">40 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infrastructure Agent</span>
                      <span className="font-bold">60 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Specialized Skills</span>
                      <span className="font-bold">100 skills</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">By Category</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Communication</span>
                      <span className="font-bold">15 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Processing</span>
                      <span className="font-bold">20 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI & Analytics</span>
                      <span className="font-bold">40 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Automation</span>
                      <span className="font-bold">35 skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business</span>
                      <span className="font-bold">50 skills</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Multi-skill orchestrated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Customer Onboarding</h4>
                      <p className="text-sm text-muted-foreground">5 skills • 3 agents</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Financial Report Generation</h4>
                      <p className="text-sm text-muted-foreground">8 skills • 2 agents</p>
                    </div>
                    <Badge>Scheduled</Badge>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Security Audit</h4>
                      <p className="text-sm text-muted-foreground">12 skills • 2 agents</p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Throughput</span>
                  </div>
                  <div className="text-2xl font-bold">523 skills/hour</div>
                  <div className="text-sm text-muted-foreground">+12% from last hour</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Efficiency</span>
                  </div>
                  <div className="text-2xl font-bold">94.3%</div>
                  <div className="text-sm text-muted-foreground">Resource utilization</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Cross-Agent</span>
                  </div>
                  <div className="text-2xl font-bold">67 collab/hour</div>
                  <div className="text-sm text-muted-foreground">Agent collaborations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}