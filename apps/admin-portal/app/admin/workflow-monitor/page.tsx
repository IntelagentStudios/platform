'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Cpu,
  Database,
  DollarSign,
  Loader2,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
  XCircle,
  PlayCircle,
  PauseCircle,
  SkipForward
} from 'lucide-react';

interface WorkflowStep {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration: number | null;
}

interface ActiveWorkflow {
  workflowId: string;
  licenseKey: string;
  name: string;
  status: string;
  progress: number;
  startTime: Date;
  estimatedCompletion: Date;
  steps: WorkflowStep[];
}

interface SkillHealth {
  skillId: string;
  health: number;
  executions: number;
  avgTime: number;
  successRate: number;
}

export default function WorkflowMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'skills' | 'decisions'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/skills/monitor?type=overview');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeDecision = async (decisionId: string) => {
    try {
      const response = await fetch('/api/skills/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute_decision', params: { decisionId } })
      });
      const result = await response.json();
      if (result.success) {
        fetchMonitoringData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to execute decision:', error);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400';
    if (health >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'active': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgb(169, 189, 203)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            Skills Workflow Monitor
          </h1>
          <p className="mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
            Real-time monitoring and control of all skill workflows
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-white">Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'workflows', 'skills', 'decisions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-lg capitalize transition ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Queue Metrics */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <div className="flex items-center justify-between mb-2">
                <Database className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">Active</span>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                Queue Status
              </h3>
              <div className="mt-2 space-y-1 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                <div>Waiting: {data.queue?.counts?.waiting || 0}</div>
                <div>Active: {data.queue?.counts?.active || 0}</div>
                <div>Completed: {data.queue?.counts?.completed || 0}</div>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                Financial
              </h3>
              <div className="mt-2 space-y-1 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                <div>MRR: ${data.business?.metrics?.financial?.mrr?.toLocaleString() || 0}</div>
                <div>Profit: ${data.business?.metrics?.financial?.profit?.toLocaleString() || 0}</div>
                <div>CAC: ${data.business?.metrics?.financial?.cac || 0}</div>
              </div>
            </div>

            {/* Operational Metrics */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-xs">{(data.business?.metrics?.operational?.successRate * 100 || 0).toFixed(1)}%</span>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                Operations
              </h3>
              <div className="mt-2 space-y-1 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                <div>Active Users: {data.business?.metrics?.operational?.activeUsers || 0}</div>
                <div>Skill Executions: {data.business?.metrics?.operational?.skillExecutions || 0}</div>
                <div>Avg Response: {data.business?.metrics?.operational?.avgResponseTime || 0}ms</div>
              </div>
            </div>

            {/* Infrastructure Metrics */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className={`text-xs px-2 py-1 rounded ${
                  data.business?.metrics?.infrastructure?.systemHealth === 'healthy' 
                    ? 'bg-green-600' 
                    : data.business?.metrics?.infrastructure?.systemHealth === 'degraded'
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                } text-white`}>
                  {data.business?.metrics?.infrastructure?.systemHealth || 'Unknown'}
                </span>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                Infrastructure
              </h3>
              <div className="mt-2 space-y-1 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                <div>CPU: {data.business?.metrics?.infrastructure?.cpuUsage || 0}%</div>
                <div>Memory: {data.business?.metrics?.infrastructure?.memoryUsage || 0}%</div>
                <div>Services: {data.business?.metrics?.infrastructure?.activeServices || 0}</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {data.business?.recommendations && data.business.recommendations.length > 0 && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                AI Recommendations
              </h3>
              <div className="space-y-2">
                {data.business.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 text-yellow-400" />
                    <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Active Workflows
          </h2>
          
          {/* Mock Active Workflows */}
          <div className="space-y-4">
            {[
              {
                workflowId: 'wf_001',
                licenseKey: 'INTL-XXXX-XXXX-2024',
                name: 'Email Campaign',
                status: 'running',
                progress: 65,
                steps: [
                  { name: 'Load Recipients', status: 'completed' },
                  { name: 'Generate Content', status: 'completed' },
                  { name: 'Send Emails', status: 'active' },
                  { name: 'Track Opens', status: 'pending' }
                ]
              },
              {
                workflowId: 'wf_002',
                licenseKey: 'INTL-YYYY-YYYY-2024',
                name: 'Data Enrichment',
                status: 'running',
                progress: 30,
                steps: [
                  { name: 'Fetch Data', status: 'completed' },
                  { name: 'Clean Data', status: 'active' },
                  { name: 'Enrich Data', status: 'pending' },
                  { name: 'Export Results', status: 'pending' }
                ]
              }
            ].map(workflow => (
              <div key={workflow.workflowId} className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {workflow.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                      License: {workflow.licenseKey}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 rounded hover:bg-gray-600 transition">
                      <PauseCircle className="w-5 h-5 text-yellow-400" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-600 transition">
                      <XCircle className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'rgb(169, 189, 203)' }}>
                    <span>Progress</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Steps */}
                <div className="space-y-1">
                  {workflow.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(step.status)}
                      <span style={{ color: 'rgb(169, 189, 203)' }}>{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Skills Health Monitor
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { skillId: 'email_sender', health: 100, executions: 1234, avgTime: 245, successRate: 99.8 },
              { skillId: 'pdf_generator', health: 95, executions: 567, avgTime: 1200, successRate: 97.2 },
              { skillId: 'web_scraper', health: 88, executions: 890, avgTime: 3400, successRate: 92.1 },
              { skillId: 'data_cleaner', health: 100, executions: 2345, avgTime: 120, successRate: 100 }
            ].map(skill => (
              <div key={skill.skillId} className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {skill.skillId}
                  </h3>
                  <span className={`text-2xl font-bold ${getHealthColor(skill.health)}`}>
                    {skill.health}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span style={{ color: 'rgb(169, 189, 203)' }}>Executions</span>
                    <div style={{ color: 'rgb(229, 227, 220)' }}>{skill.executions}</div>
                  </div>
                  <div>
                    <span style={{ color: 'rgb(169, 189, 203)' }}>Avg Time</span>
                    <div style={{ color: 'rgb(229, 227, 220)' }}>{skill.avgTime}ms</div>
                  </div>
                  <div>
                    <span style={{ color: 'rgb(169, 189, 203)' }}>Success</span>
                    <div style={{ color: 'rgb(229, 227, 220)' }}>{skill.successRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions Tab */}
      {activeTab === 'decisions' && data?.business?.decisions && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Management Decisions
          </h2>
          
          {data.business.decisions.map((decision: any) => (
            <div key={decision.id} className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {decision.recommendation}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      decision.priority === 'critical' ? 'bg-red-600' :
                      decision.priority === 'high' ? 'bg-orange-600' :
                      decision.priority === 'medium' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    } text-white`}>
                      {decision.priority}
                    </span>
                    <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                      Agent: {decision.agent}
                    </span>
                  </div>
                </div>
                {decision.requiredApproval && (
                  <button
                    onClick={() => executeDecision(decision.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition"
                  >
                    Execute
                  </button>
                )}
              </div>
              <p className="text-sm mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
                {decision.reasoning}
              </p>
              <p className="text-sm mt-1" style={{ color: 'rgb(169, 189, 203)' }}>
                Impact: {decision.impact}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}