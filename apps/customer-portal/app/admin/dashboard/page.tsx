'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp, 
  PoundSterling, 
  Activity, 
  Shield, 
  Server,
  AlertCircle,
  CheckCircle,
  Brain,
  BarChart3,
  FileText,
  Zap,
  Database,
  Globe,
  CreditCard,
  Lock,
  Settings,
  MessageSquare,
  RefreshCw,
  Key,
  UserCheck,
  Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OverviewData {
  licenses: {
    total: number;
    active: number;
    trial: number;
    expired: number;
  };
  users: {
    total: number;
    verified: number;
    unverified: number;
  };
  productKeys: {
    total: number;
    active: number;
    distribution: Array<{ product: string; _count: number }>;
  };
  revenue: {
    monthly: number;
    currency: string;
  };
  systemHealth: {
    activeInLast24h: number;
    totalApiCalls: number;
    uptime: number;
    responseTime: number;
  };
  recentActivity: Array<{
    timestamp: Date;
    productKey: string;
    conversationId: string;
    type: string;
  }>;
  recentUsers: Array<{
    email: string;
    created_at: Date;
    email_verified: boolean;
    license_key: string | null;
  }>;
}

export default function AdminDashboardPage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchOverviewData();
    }
  }, [isAuthorized]);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/check');
      if (!response.ok) {
        router.push('/admin/login');
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchOverviewData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/overview');
      const data = await response.json();
      setOverviewData(data.overview);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiMessage.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      // Send to n8n webhook for admin AI assistant
      const response = await fetch('https://intelagentchatbotn8n.up.railway.app/webhook/admin-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: aiMessage,
          context: 'admin_dashboard',
          customKnowledge: `You are an AI assistant for the Intelagent Platform admin dashboard. 
            Current platform statistics:
            - Total licenses: ${overviewData?.licenses.total || 0}
            - Active licenses: ${overviewData?.licenses.active || 0}
            - Total users: ${overviewData?.users.total || 0}
            - System uptime: ${overviewData?.systemHealth.uptime || 0}%
            Help the admin with platform management, analytics, and insights.`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiResponse(data.response || 'I can help you manage your platform. What would you like to know?');
    } catch (error) {
      console.error('AI request failed:', error);
      setAiResponse('I\'m having trouble connecting right now. Please try again later.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(48, 54, 54)' }}></div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
        <div style={{ color: 'rgb(48, 54, 54)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Platform Overview
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Monitor and manage your entire platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchOverviewData}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-lg border transition-colors hover:bg-white"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: 'rgb(48, 54, 54)',
              color: 'rgb(48, 54, 54)'
            }}
          >
            {isRefreshing ? (
              <><RefreshCw className="inline h-4 w-4 mr-2 animate-spin" /> Refreshing...</>
            ) : (
              <><RefreshCw className="inline h-4 w-4 mr-2" /> Refresh</>
            )}
          </button>
          <button 
            onClick={() => setShowAI(!showAI)}
            className="px-4 py-2 rounded-lg transition-colors hover:opacity-90"
            style={{ 
              backgroundColor: 'rgb(48, 54, 54)',
              color: 'rgb(229, 227, 220)'
            }}
          >
            <Brain className="inline h-4 w-4 mr-2" />
            AI Assistant
          </button>
        </div>
      </div>

      {/* AI Assistant Interface */}
      {showAI && (
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.2)'
        }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5" style={{ color: 'rgb(48, 54, 54)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
              AI Platform Assistant
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask about your platform, users, or get insights..."
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiSubmit()}
                disabled={isAiLoading}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'white',
                  borderColor: 'rgba(48, 54, 54, 0.3)',
                  color: 'rgb(48, 54, 54)'
                }}
              />
              <button 
                onClick={handleAiSubmit}
                disabled={isAiLoading}
                className="px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                style={{ 
                  backgroundColor: 'rgb(48, 54, 54)',
                  color: 'rgb(229, 227, 220)'
                }}
              >
                {isAiLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  setAiMessage('What are the key metrics for this month?');
                  handleAiSubmit();
                }}
                className="px-3 py-1 text-sm rounded-lg border transition-colors hover:bg-gray-50"
                style={{ 
                  borderColor: 'rgba(48, 54, 54, 0.3)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                Monthly metrics
              </button>
              <button 
                onClick={() => {
                  setAiMessage('Which users need attention?');
                  handleAiSubmit();
                }}
                className="px-3 py-1 text-sm rounded-lg border transition-colors hover:bg-gray-50"
                style={{ 
                  borderColor: 'rgba(48, 54, 54, 0.3)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                User insights
              </button>
              <button 
                onClick={() => {
                  setAiMessage('What are the growth opportunities?');
                  handleAiSubmit();
                }}
                className="px-3 py-1 text-sm rounded-lg border transition-colors hover:bg-gray-50"
                style={{ 
                  borderColor: 'rgba(48, 54, 54, 0.3)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                Growth opportunities
              </button>
            </div>
            
            {/* AI Response */}
            {aiResponse && (
              <div className="p-4 rounded-lg" style={{ 
                backgroundColor: 'rgba(48, 54, 54, 0.05)',
                color: 'rgb(48, 54, 54)'
              }}>
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Monthly Revenue</span>
            <PoundSterling className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {overviewData.revenue.monthly === 0 ? (
              <span style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No revenue yet</span>
            ) : (
              `£${overviewData.revenue.monthly.toLocaleString()}`
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            {overviewData.licenses.active > 0 
              ? `${overviewData.licenses.active} active licenses`
              : 'Start with your first license'}
          </p>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Total Licenses</span>
            <Key className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {overviewData.licenses.total}
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            <span style={{ color: '#4CAF50' }}>{overviewData.licenses.active} active</span>,{' '}
            <span style={{ color: '#2196F3' }}>{overviewData.licenses.trial} trial</span>,{' '}
            <span style={{ color: 'rgba(48, 54, 54, 0.4)' }}>{overviewData.licenses.expired} expired</span>
          </div>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Total Users</span>
            <UserCheck className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {overviewData.users.total}
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            {overviewData.users.verified} verified, {overviewData.users.unverified} pending
          </p>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>System Health</span>
            <Server className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold flex items-center gap-2" style={{ color: 'rgb(48, 54, 54)' }}>
            <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
            Operational
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            {overviewData.systemHealth.uptime}% uptime • {overviewData.systemHealth.responseTime}ms avg
          </p>
        </div>
      </div>

      {/* Activity and Product Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
            Recent Activity
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            Last {overviewData.recentActivity.length} platform events
          </p>
          <div className="space-y-3">
            {overviewData.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
                  <MessageSquare className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                    Chatbot Interaction
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    Conversation: {activity.conversationId.slice(0, 8)}...
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.4)' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {overviewData.recentActivity.length === 0 && (
              <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No recent activity</p>
            )}
          </div>
        </div>

        {/* Product Distribution */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
            Product Distribution
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            Active products across {overviewData.productKeys.total} keys
          </p>
          <div className="space-y-3">
            {overviewData.productKeys.distribution.map((product, index) => {
              const percentage = overviewData.productKeys.total > 0 
                ? (product._count / overviewData.productKeys.total) * 100 
                : 0;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize" style={{ color: 'rgb(48, 54, 54)' }}>
                      {product.product}
                    </span>
                    <span style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                      {product._count} keys
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
                    <div 
                      className="h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: 'rgb(48, 54, 54)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {overviewData.productKeys.distribution.length === 0 && (
              <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                No product keys issued yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="rounded-lg p-6 border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
          Recent User Signups
        </h3>
        <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
          Latest users joining the platform
        </p>
        <div className="space-y-2">
          {overviewData.recentUsers.map((user, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0" 
                 style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                  {user.email}
                </p>
                <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                  {new Date(user.created_at).toLocaleDateString()} • 
                  {user.license_key ? ' Has license' : ' No license'}
                </p>
              </div>
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: user.email_verified ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                  color: user.email_verified ? '#4CAF50' : '#FF9800'
                }}
              >
                {user.email_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          ))}
          {overviewData.recentUsers.length === 0 && (
            <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No recent signups</p>
          )}
        </div>
      </div>
    </div>
  );
}