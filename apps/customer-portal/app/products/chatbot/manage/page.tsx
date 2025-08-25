'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  Globe,
  Key,
  Copy,
  CheckCircle,
  Settings,
  Code,
  Activity,
  RefreshCw
} from 'lucide-react';

export default function ChatbotManagePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
          fetchConfig(data.user.license_key);
          fetchStats(data.user.license_key);
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
  }, []);

  const fetchConfig = async (licenseKey: string) => {
    try {
      const res = await fetch('/api/products/configuration');
      const data = await res.json();
      if (data.chatbot && data.chatbot.configured) {
        setConfig(data.chatbot);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setLoading(false);
    }
  };

  const fetchStats = async (licenseKey: string) => {
    try {
      // Site key should be in user data now
      const siteKey = user?.site_key;
      
      if (siteKey) {
        // Fetch conversations stats
        const convRes = await fetch('/api/products/chatbot/conversations');
        const convData = await convRes.json();
        
        setStats({
          totalConversations: convData.conversations?.length || 0,
          uniqueSessions: new Set(convData.conversations?.map((c: any) => c.session_id)).size || 0,
          domains: [...new Set(convData.conversations?.map((c: any) => c.domain))].filter(Boolean),
          avgResponseTime: '< 1s',
          site_key: siteKey
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const copySiteKey = () => {
    if (stats?.site_key) {
      navigator.clipboard.writeText(stats.site_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEmbedCode = () => {
    if (!stats?.site_key) return '';
    
    return `<!-- Intelagent Chatbot -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.intelagentstudios.com/widget.js';
    script.setAttribute('data-site-key', '${stats.site_key}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!config) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
              Chatbot Not Configured
            </h2>
            <p style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
              Please configure your chatbot first
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(48, 54, 54)'
              }}
            >
              Go to Products
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Chatbot Management
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Manage your AI chatbot configuration and view analytics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/products/chatbot/conversations')}
              className="px-4 py-2 rounded-lg flex items-center space-x-2"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                border: '1px solid rgba(169, 189, 203, 0.2)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <MessageSquare className="h-4 w-4" />
              <span>View Conversations</span>
            </button>
            <button
              onClick={() => fetchStats(user.license_key)}
              className="p-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                border: '1px solid rgba(169, 189, 203, 0.2)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Site Key Display */}
      <div className="px-8 pt-6">
        <div 
          className="rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Key className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Site Key
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <code 
                  className="px-3 py-2 rounded text-sm font-mono"
                  style={{ 
                    backgroundColor: 'rgba(48, 54, 54, 0.8)',
                    color: 'rgb(169, 189, 203)',
                    border: '1px solid rgba(169, 189, 203, 0.2)'
                  }}
                >
                  {stats?.site_key || 'Loading...'}
                </code>
                <button
                  onClick={copySiteKey}
                  className="p-2 rounded-lg transition hover:opacity-80"
                  style={{ 
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    border: '1px solid rgba(169, 189, 203, 0.2)'
                  }}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" style={{ color: '#4CAF50' }} />
                  ) : (
                    <Copy className="h-4 w-4" style={{ color: 'rgb(229, 227, 220)' }} />
                  )}
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                Use this key to integrate the chatbot on your website
              </p>
            </div>
            {config?.domain && (
              <div className="ml-6">
                <div className="flex items-center space-x-2 mb-1">
                  <Globe className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                    Configured for:
                  </span>
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                  {config.domain}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Total Conversations
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.totalConversations || 0}
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
                  Unique Sessions
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.uniqueSessions || 0}
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
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
                  Active Domains
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.domains?.length || 0}
                </p>
              </div>
              <Globe className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
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
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.avgResponseTime || '< 1s'}
                </p>
              </div>
              <Clock className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex space-x-8">
            {['overview', 'embed', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 transition-all capitalize ${
                  activeTab === tab ? 'border-current' : 'border-transparent'
                }`}
                style={{ 
                  color: activeTab === tab ? 'rgb(169, 189, 203)' : 'rgba(229, 227, 220, 0.6)'
                }}
              >
                {tab === 'embed' ? 'Embed Code' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs"
                       style={{ 
                         backgroundColor: 'rgba(76, 175, 80, 0.2)',
                         color: '#4CAF50'
                       }}>
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Configuration</span>
                  <span style={{ color: 'rgb(169, 189, 203)' }}>Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Last Activity</span>
                  <span style={{ color: 'rgb(169, 189, 203)' }}>Recently</span>
                </div>
              </div>
            </div>

            {stats?.domains && stats.domains.length > 0 && (
              <div 
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  Active Domains
                </h3>
                <div className="space-y-2">
                  {stats.domains.map((domain: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.8)' }}>{domain}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'embed' && (
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Code className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              <h3 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Installation Code
              </h3>
            </div>
            <pre 
              className="p-4 rounded overflow-x-auto text-sm"
              style={{ 
                backgroundColor: 'rgba(48, 54, 54, 0.8)',
                color: 'rgb(169, 189, 203)',
                border: '1px solid rgba(169, 189, 203, 0.2)'
              }}
            >
              {getEmbedCode()}
            </pre>
            <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
              <h4 className="font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Installation Instructions:
              </h4>
              <ol className="list-decimal list-inside space-y-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                <li>Copy the code above</li>
                <li>Paste it into your website's HTML, just before the closing &lt;/body&gt; tag</li>
                <li>The chatbot will appear automatically on your website</li>
                <li>For Squarespace: Use Code Injection in Settings → Advanced → Code Injection</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              <h3 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Settings
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                  Welcome Message
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg"
                  rows={3}
                  placeholder="Hi! How can I help you today?"
                  style={{ 
                    backgroundColor: 'rgba(48, 54, 54, 0.8)',
                    color: 'rgb(229, 227, 220)',
                    border: '1px solid rgba(169, 189, 203, 0.2)'
                  }}
                  defaultValue="Hi! How can I help you today?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                  Position
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(48, 54, 54, 0.8)',
                    color: 'rgb(229, 227, 220)',
                    border: '1px solid rgba(169, 189, 203, 0.2)'
                  }}
                >
                  <option>Bottom Right</option>
                  <option>Bottom Left</option>
                  <option>Top Right</option>
                  <option>Top Left</option>
                </select>
              </div>
              <div className="pt-4">
                <button
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(48, 54, 54)'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}