'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Activity,
  BarChart3,
  Brain,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';

interface SkillUsage {
  skill_id: string;
  skill_name: string;
  count: number;
  success: number;
  error: number;
  successRate: string;
  domains: string[];
}

interface Analytics {
  summary: {
    totalSkillExecutions: number;
    totalChatbotConversations: number;
    uniqueSkillSessions: number;
    uniqueChatbotSessions: number;
    skillTypes: number;
  };
  skillUsage: SkillUsage[];
  topSkills: SkillUsage[];
  timeSeries: any[];
  recentExecutions: any[];
  performance: {
    averageResponseTime: string;
    successRate: string;
    errorRate: string;
  };
}

export default function SkillsDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/skills/analytics?dateRange=${dateRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSkillCategoryColor = (skillName: string): string => {
    if (skillName.includes('email') || skillName.includes('sms')) return '#4CAF50';
    if (skillName.includes('data') || skillName.includes('csv')) return '#2196F3';
    if (skillName.includes('ai') || skillName.includes('nlp')) return '#9C27B0';
    if (skillName.includes('workflow') || skillName.includes('automation')) return '#FF9800';
    if (skillName.includes('chatbot')) return '#00BCD4';
    return '#607D8B';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3" style={{ color: 'rgb(229, 227, 220)' }}>
              <Brain className="h-8 w-8" style={{ color: 'rgb(169, 189, 203)' }} />
              <span>Skills Intelligence Dashboard</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Monitor and analyze all 310+ skills performance across your platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.2)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="p-2 rounded-lg transition"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.2)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Total Executions
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {analytics?.summary.totalSkillExecutions.toLocaleString() || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  All skills combined
                </p>
              </div>
              <Zap className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>

          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Chatbot Conversations
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {analytics?.summary.totalChatbotConversations.toLocaleString() || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Intelligent responses
                </p>
              </div>
              <MessageSquare className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>

          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Active Skills
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {analytics?.summary.skillTypes || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Of 310+ available
                </p>
              </div>
              <Activity className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>

          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Success Rate
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#4CAF50' }}>
                  {analytics?.performance.successRate || '0%'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  {analytics?.performance.averageResponseTime}
                </p>
              </div>
              <CheckCircle className="h-8 w-8" style={{ color: 'rgba(76, 175, 80, 0.3)' }} />
            </div>
          </div>

          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Unique Sessions
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {analytics?.summary.uniqueSkillSessions || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Active users
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Skills */}
        <div 
          className="lg:col-span-2 rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'rgb(229, 227, 220)' }}>
            <BarChart3 className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <span>Top Performing Skills</span>
          </h3>
          
          <div className="space-y-3">
            {analytics?.topSkills.map((skill, index) => (
              <div 
                key={skill.skill_id}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition hover:opacity-80"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.1)'
                }}
                onClick={() => setSelectedSkill(skill.skill_id)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ 
                      backgroundColor: getSkillCategoryColor(skill.skill_name),
                      color: 'white'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      {skill.skill_name}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      {skill.count} executions • {skill.successRate}% success
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" style={{ color: '#4CAF50' }} />
                    <span style={{ color: '#4CAF50' }}>{skill.success}</span>
                  </span>
                  {skill.error > 0 && (
                    <span className="flex items-center space-x-1">
                      <XCircle className="h-4 w-4" style={{ color: '#f44336' }} />
                      <span style={{ color: '#f44336' }}>{skill.error}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Executions */}
        <div 
          className="rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'rgb(229, 227, 220)' }}>
            <Clock className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <span>Recent Activity</span>
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics?.recentExecutions.map((execution) => (
              <div 
                key={execution.id}
                className="p-2 rounded text-sm"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.3)',
                  borderLeft: `3px solid ${execution.type === 'error' ? '#f44336' : '#4CAF50'}`
                }}
              >
                <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                  {execution.skill}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  {execution.domain || 'No domain'} • {new Date(execution.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Chart Area */}
      <div className="px-8 pb-8">
        <div 
          className="rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2" style={{ color: 'rgb(229, 227, 220)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <span>Skills vs Chatbot Activity</span>
          </h3>
          
          <div className="text-center py-12" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
            <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            <p>Activity visualization coming soon</p>
            <p className="text-xs mt-2">
              Time series data available via API: {analytics?.timeSeries.length} data points
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}