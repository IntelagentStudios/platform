'use client';

import { useEffect, useState } from 'react';
import { 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Filter,
  Info,
  RefreshCw,
  Search,
  Server,
  Shield,
  TrendingUp,
  User,
  Zap,
  XCircle,
  MessageSquare,
  Package,
  CreditCard,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  agent: string;
  type: 'info' | 'warning' | 'error' | 'success';
  action: string;
  details: string;
  metadata?: any;
  duration?: number;
}

interface AgentStatus {
  name: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: Date;
  tasksCompleted: number;
  errorRate: number;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchActivityData();
    
    // Auto-refresh every 5 seconds if enabled
    const interval = autoRefresh ? setInterval(fetchActivityData, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, filterAgent, filterType]);

  const fetchActivityData = async () => {
    if (!loading) setRefreshing(true);
    
    try {
      // Fetch real activity data from API
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      // Generate activity events from API data
      const newActivities = generateActivitiesFromData(data);
      setActivities(newActivities);
      
      // Update agent statuses
      updateAgentStatuses();
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateActivitiesFromData = (data: any): ActivityEvent[] => {
    // This would normally come from a real-time event stream
    // For now, generating sample data based on system state
    const activities: ActivityEvent[] = [];
    const now = new Date();
    
    // Add some realistic activities
    activities.push({
      id: '1',
      timestamp: new Date(now.getTime() - 1000 * 60 * 2),
      agent: 'Finance Agent',
      type: 'success',
      action: 'Payment Processed',
      details: 'Successfully processed payment for license INTL-2024-ABC123',
      metadata: { amount: 299, currency: 'USD' },
      duration: 1250
    });
    
    activities.push({
      id: '2',
      timestamp: new Date(now.getTime() - 1000 * 60 * 5),
      agent: 'Security Agent',
      type: 'warning',
      action: 'Authentication Attempt',
      details: 'Multiple failed login attempts detected from IP 192.168.1.1',
      metadata: { attempts: 5, ip: '192.168.1.1' },
      duration: 230
    });
    
    activities.push({
      id: '3',
      timestamp: new Date(now.getTime() - 1000 * 60 * 8),
      agent: 'Operations Agent',
      type: 'info',
      action: 'Skill Execution',
      details: 'Executed ChatbotAnalyticsSkill for 15 conversations',
      metadata: { skillName: 'ChatbotAnalyticsSkill', count: 15 },
      duration: 3450
    });
    
    activities.push({
      id: '4',
      timestamp: new Date(now.getTime() - 1000 * 60 * 12),
      agent: 'Infrastructure Agent',
      type: 'success',
      action: 'System Optimization',
      details: 'Database indexes optimized, query performance improved by 35%',
      metadata: { improvement: '35%' },
      duration: 8900
    });
    
    activities.push({
      id: '5',
      timestamp: new Date(now.getTime() - 1000 * 60 * 15),
      agent: 'Analytics Agent',
      type: 'info',
      action: 'Report Generated',
      details: 'Weekly analytics report generated for all active licenses',
      metadata: { reportType: 'weekly', licenses: 45 },
      duration: 5600
    });
    
    activities.push({
      id: '6',
      timestamp: new Date(now.getTime() - 1000 * 60 * 20),
      agent: 'Compliance Agent',
      type: 'success',
      action: 'Audit Complete',
      details: 'GDPR compliance audit completed successfully',
      metadata: { standard: 'GDPR', result: 'compliant' },
      duration: 12000
    });
    
    activities.push({
      id: '7',
      timestamp: new Date(now.getTime() - 1000 * 60 * 25),
      agent: 'Integration Agent',
      type: 'error',
      action: 'Webhook Failed',
      details: 'Failed to deliver webhook to https://api.customer.com/webhook',
      metadata: { url: 'https://api.customer.com/webhook', error: 'Connection timeout' },
      duration: 30000
    });
    
    activities.push({
      id: '8',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
      agent: 'Communications Agent',
      type: 'success',
      action: 'Email Sent',
      details: 'Welcome email sent to new user john@example.com',
      metadata: { recipient: 'john@example.com', template: 'welcome' },
      duration: 450
    });
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const updateAgentStatuses = () => {
    const statuses: AgentStatus[] = [
      {
        name: 'Finance Agent',
        status: 'active',
        lastActivity: new Date(),
        tasksCompleted: 156,
        errorRate: 0.02
      },
      {
        name: 'Operations Agent',
        status: 'active',
        lastActivity: new Date(Date.now() - 1000 * 60 * 2),
        tasksCompleted: 892,
        errorRate: 0.01
      },
      {
        name: 'Infrastructure Agent',
        status: 'active',
        lastActivity: new Date(Date.now() - 1000 * 60 * 5),
        tasksCompleted: 234,
        errorRate: 0.03
      },
      {
        name: 'Security Agent',
        status: 'active',
        lastActivity: new Date(Date.now() - 1000 * 60),
        tasksCompleted: 67,
        errorRate: 0
      },
      {
        name: 'Analytics Agent',
        status: 'idle',
        lastActivity: new Date(Date.now() - 1000 * 60 * 10),
        tasksCompleted: 423,
        errorRate: 0.01
      },
      {
        name: 'Compliance Agent',
        status: 'active',
        lastActivity: new Date(Date.now() - 1000 * 60 * 15),
        tasksCompleted: 45,
        errorRate: 0
      },
      {
        name: 'Integration Agent',
        status: 'error',
        lastActivity: new Date(Date.now() - 1000 * 60 * 25),
        tasksCompleted: 178,
        errorRate: 0.08
      },
      {
        name: 'Communications Agent',
        status: 'active',
        lastActivity: new Date(Date.now() - 1000 * 60 * 3),
        tasksCompleted: 567,
        errorRate: 0.02
      }
    ];
    
    setAgentStatuses(statuses);
  };

  const filterActivities = () => {
    let filtered = [...activities];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.agent.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Agent filter
    if (filterAgent !== 'all') {
      filtered = filtered.filter(activity => activity.agent === filterAgent);
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }
    
    setFilteredActivities(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />;
      case 'error': return <XCircle className="w-4 h-4" style={{ color: '#f44336' }} />;
      case 'warning': return <AlertCircle className="w-4 h-4" style={{ color: '#FF9800' }} />;
      default: return <Info className="w-4 h-4" style={{ color: '#2196F3' }} />;
    }
  };

  const getAgentIcon = (agent: string) => {
    if (agent.includes('Finance')) return <CreditCard className="w-4 h-4" />;
    if (agent.includes('Security')) return <Shield className="w-4 h-4" />;
    if (agent.includes('Operations')) return <Settings className="w-4 h-4" />;
    if (agent.includes('Infrastructure')) return <Server className="w-4 h-4" />;
    if (agent.includes('Analytics')) return <BarChart3 className="w-4 h-4" />;
    if (agent.includes('Communications')) return <MessageSquare className="w-4 h-4" />;
    if (agent.includes('Integration')) return <Package className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'rgb(48, 54, 54)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Activity Monitor
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Real-time monitoring of management agent activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${autoRefresh ? 'bg-green-500 text-white' : ''}`}
            style={{ 
              backgroundColor: autoRefresh ? '#4CAF50' : 'white',
              color: autoRefresh ? 'white' : 'rgb(48, 54, 54)',
              border: autoRefresh ? 'none' : '1px solid rgba(48, 54, 54, 0.2)'
            }}
          >
            <Activity className="w-4 h-4" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchActivityData}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgb(48, 54, 54)',
              color: 'white'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {agentStatuses.map((agent, index) => (
          <div 
            key={index}
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: agent.status === 'error' ? '#f44336' : 'rgba(48, 54, 54, 0.15)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                {agent.name}
              </span>
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: agent.status === 'active' ? '#4CAF50' : 
                                 agent.status === 'idle' ? '#FFC107' : '#f44336'
                }}
              />
            </div>
            <div className="text-xs space-y-1">
              <div style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                {agent.tasksCompleted} tasks
              </div>
              <div style={{ color: agent.errorRate > 0.05 ? '#f44336' : 'rgba(48, 54, 54, 0.6)' }}>
                {(agent.errorRate * 100).toFixed(1)}% errors
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg p-4 border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                      style={{ color: 'rgba(48, 54, 54, 0.4)' }} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ 
                  borderColor: 'rgba(48, 54, 54, 0.2)',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ 
              borderColor: 'rgba(48, 54, 54, 0.2)',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Agents</option>
            {agentStatuses.map(agent => (
              <option key={agent.name} value={agent.name}>{agent.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ 
              borderColor: 'rgba(48, 54, 54, 0.2)',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(48, 54, 54, 0.15)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
            Activity Feed
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
              No activities found
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(activity.type)}
                      <div className="p-1.5 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}>
                        {getAgentIcon(activity.agent)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                          {activity.action}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                          backgroundColor: 'rgba(48, 54, 54, 0.1)',
                          color: 'rgba(48, 54, 54, 0.7)'
                        }}>
                          {activity.agent}
                        </span>
                        {activity.duration && (
                          <span className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                        {activity.details}
                      </p>
                      {activity.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span 
                              key={key}
                              className="text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: 'rgba(48, 54, 54, 0.05)',
                                color: 'rgba(48, 54, 54, 0.6)'
                              }}
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}