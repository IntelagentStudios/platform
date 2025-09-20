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
  Send,
  Search,
  Filter,
  Eye,
  Edit,
  UserCog,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlatformStats {
  licenses: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    growth: number;
  };
  users: {
    total: number;
    verified: number;
    unverified: number;
    growth: number;
  };
  productKeys: {
    total: number;
    active: number;
    distribution: Array<{ product: string; _count: number }>;
  };
  revenue: {
    monthly: number;
    total: number;
    currency: string;
    growth: number;
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
}

interface Customer {
  license_key: string;
  email: string;
  customer_name: string | null;
  status: string;
  plan: string | null;
  created_at: Date;
  last_payment_date: Date | null;
  total_pence: number;
  products: string[];
  user_count: number;
  api_calls_24h: number;
}

export default function AdminDashboardPage() {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');
  const [currentView, setCurrentView] = useState<'overview' | 'customers'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchPlatformData();
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

  const fetchPlatformData = async () => {
    setIsRefreshing(true);
    try {
      const [statsResponse, customersResponse] = await Promise.all([
        fetch('/api/admin/platform-stats'),
        fetch('/api/admin/customers')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setPlatformStats(statsData.stats);
      }

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.customers);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAiSubmit = async (messageOverride?: string) => {
    const message = messageOverride || aiMessage;
    if (!message.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      console.log('Sending AI request...');
      // Use our proxy endpoint to avoid CORS issues
      const response = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          customKnowledge: `You are an AI assistant for the Intelagent Platform master admin dashboard.
            Current platform statistics:
            - Total licenses: ${platformStats?.licenses.total || 0}
            - Active licenses: ${platformStats?.licenses.active || 0}
            - Total users: ${platformStats?.users.total || 0}
            - Total customers: ${customers.length || 0}
            - Monthly revenue: £${platformStats?.revenue.monthly || 0}
            - System uptime: ${platformStats?.systemHealth.uptime || 0}%

            You are helping the platform administrator manage and monitor the entire system.
            Provide insights, analytics, and helpful suggestions for platform management.`,
          stats: {
            totalLicenses: platformStats?.licenses.total || 0,
            activeLicenses: platformStats?.licenses.active || 0,
            totalUsers: platformStats?.users.total || 0,
            totalCustomers: customers.length || 0
          }
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`Webhook returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('AI response data:', data);
      
      // Try different possible response fields
      const aiText = data.response || data.message || data.output || data.text || 
                     (typeof data === 'string' ? data : 'I can help you manage your platform. What would you like to know?');
      setAiResponse(aiText);
    } catch (error) {
      console.error('AI request failed:', error);
      // More informative error message
      if (error instanceof Error) {
        setAiResponse(`Connection error: ${error.message}. The AI service might be temporarily unavailable.`);
      } else {
        setAiResponse('I\'m having trouble connecting to the AI service. Please check the console for details.');
      }
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

  if (!platformStats) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
        <div style={{ color: 'rgb(48, 54, 54)' }}>Loading dashboard...</div>
      </div>
    );
  }

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(customerFilter.toLowerCase()) ||
    customer.customer_name?.toLowerCase().includes(customerFilter.toLowerCase()) ||
    customer.license_key.toLowerCase().includes(customerFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Master Admin Dashboard
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Comprehensive platform management and customer oversight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchPlatformData}
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

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setCurrentView('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="inline h-4 w-4 mr-2" />
          Platform Overview
        </button>
        <button
          onClick={() => setCurrentView('customers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'customers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Customer Management
        </button>
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
                onClick={() => handleAiSubmit()}
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
                  const msg = 'What are the key metrics for this month?';
                  setAiMessage(msg);
                  handleAiSubmit(msg);
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
                  const msg = 'Which users need attention?';
                  setAiMessage(msg);
                  handleAiSubmit(msg);
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
                  const msg = 'What are the growth opportunities?';
                  setAiMessage(msg);
                  handleAiSubmit(msg);
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

      {/* Main Content */}
      {currentView === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(48, 54, 54, 0.15)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Monthly Revenue</span>
                <PoundSterling className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {platformStats.revenue.monthly === 0 ? (
                  <span style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No revenue yet</span>
                ) : (
                  `£${platformStats.revenue.monthly.toLocaleString()}`
                )}
              </div>
              <div className="flex items-center mt-1">
                {platformStats.revenue.growth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  {platformStats.revenue.growth >= 0 ? '+' : ''}{platformStats.revenue.growth}% vs last month
                </p>
              </div>
            </div>

            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(48, 54, 54, 0.15)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Total Customers</span>
                <Users className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {customers.length}
              </div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  {customers.filter(c => c.status === 'active').length} active accounts
                </p>
              </div>
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
                {platformStats.licenses.total}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                <span style={{ color: '#4CAF50' }}>{platformStats.licenses.active} active</span>,{' '}
                <span style={{ color: '#2196F3' }}>{platformStats.licenses.trial} trial</span>,{' '}
                <span style={{ color: 'rgba(48, 54, 54, 0.4)' }}>{platformStats.licenses.expired} expired</span>
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
                {platformStats.users.total}
              </div>
              <div className="flex items-center mt-1">
                {platformStats.users.growth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  {platformStats.users.verified} verified, {platformStats.users.unverified} pending
                </p>
              </div>
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
                {platformStats.systemHealth.uptime}% uptime • {platformStats.systemHealth.responseTime}ms avg
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
                Last {platformStats.recentActivity?.length || 0} platform events
              </p>
              <div className="space-y-3">
                {platformStats.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
                      <MessageSquare className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                        Chatbot Interaction
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                        Conversation: {activity.conversationId?.slice(0, 8) || 'N/A'}...
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(48, 54, 54, 0.4)' }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!platformStats.recentActivity || platformStats.recentActivity.length === 0) && (
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
                Active products across {platformStats.productKeys.total} keys
              </p>
              <div className="space-y-3">
                {platformStats.productKeys?.distribution?.map((product, index) => {
                  const percentage = platformStats.productKeys.total > 0
                    ? (product._count / platformStats.productKeys.total) * 100
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
                {(!platformStats.productKeys?.distribution || platformStats.productKeys.distribution.length === 0) && (
                  <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                    No product keys issued yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Management View */}
      {currentView === 'customers' && (
        <>
          {/* Customer Search and Filters */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(48, 54, 54, 0.15)'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
                Customer Management
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(48, 54, 54, 0.5)' }} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm"
                    style={{
                      borderColor: 'rgba(48, 54, 54, 0.3)',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Customer Stats Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {customers.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {customers.filter(c => c.status === 'trial').length}
                </div>
                <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>Trial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  £{customers.reduce((sum, c) => sum + (c.total_pence || 0), 0) / 100}
                </div>
                <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {customers.reduce((sum, c) => sum + (c.api_calls_24h || 0), 0)}
                </div>
                <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>API Calls (24h)</div>
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-3">
              {filteredCustomers.slice(0, 10).map((customer, index) => (
                <div
                  key={customer.license_key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                          {customer.customer_name || customer.email}
                        </p>
                        <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                          {customer.email} • {customer.license_key}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                        £{(customer.total_pence || 0) / 100}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                        {customer.plan || 'No Plan'}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: customer.status === 'active' ? '#4CAF5020' :
                                       customer.status === 'trial' ? '#2196F320' :
                                       '#FF980020',
                        color: customer.status === 'active' ? '#4CAF50' :
                              customer.status === 'trial' ? '#2196F3' :
                              '#FF9800'
                      }}
                    >
                      {customer.status}
                    </span>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                      }}
                    >
                      <Eye className="h-4 w-4" style={{ color: 'rgba(48, 54, 54, 0.6)' }} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                    No customers found matching your search.
                  </p>
                </div>
              )}

              {filteredCustomers.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    Showing 10 of {filteredCustomers.length} customers. Use search to find specific customers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
                Customer Details
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Customer Name
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>
                    {selectedCustomer.customer_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Email
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    License Key
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.license_key}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Status
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Plan
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.plan || 'No Plan'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Total Revenue
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>£{(selectedCustomer.total_pence || 0) / 100}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    User Count
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.user_count || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    API Calls (24h)
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>{selectedCustomer.api_calls_24h || 0}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                  Products
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCustomer.products?.map((product, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                      style={{ color: 'rgb(48, 54, 54)' }}
                    >
                      {product}
                    </span>
                  )) || <span style={{ color: 'rgba(48, 54, 54, 0.5)' }}>No products</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Created At
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>
                    {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    Last Payment
                  </label>
                  <p style={{ color: 'rgb(48, 54, 54)' }}>
                    {selectedCustomer.last_payment_date
                      ? new Date(selectedCustomer.last_payment_date).toLocaleDateString()
                      : 'No payments'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}