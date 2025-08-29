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
  RefreshCw,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';

interface Conversation {
  id: string;
  session_id: string;
  domain: string;
  messages: any[];
  first_message_at: string;
  last_message_at: string;
}

interface Stats {
  totalConversations: number;
  uniqueSessions: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  domains: string[];
  todayConversations: number;
  weekConversations: number;
  monthConversations: number;
}

export default function ChatbotManagePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [productKey, setProductKey] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('time'); // time, domain, session
  const [customKnowledge, setCustomKnowledge] = useState('');
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [knowledgeSaved, setKnowledgeSaved] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery, dateFilter, domainFilter]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setSiteKey(data.user.site_key); // Keep for legacy support
        
        // Check for product configuration
        const configRes = await fetch('/api/products/configuration', { credentials: 'include' });
        const configData = await configRes.json();
        
        if (configData.chatbot?.configured) {
          setProductKey(configData.chatbot.product_key);
          setSiteKey(configData.chatbot.site_key || configData.chatbot.product_key);
          await fetchConversations();
        } else if (data.user.site_key) {
          // Fallback to site_key if no product key
          await fetchConversations();
        } else {
          setLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  const fetchConversations = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/products/chatbot/conversations');
      const data = await res.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
        calculateStats(data.conversations);
      }
      
      // Also load custom knowledge
      loadCustomKnowledge();
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const uniqueSessions = new Set(convs.map(c => c.session_id));
    const domains = [...new Set(convs.map(c => c.domain).filter(Boolean))];
    
    let totalMessages = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    convs.forEach(conv => {
      totalMessages += conv.messages.length;
      const convDate = new Date(conv.first_message_at);
      
      if (convDate >= today) todayCount++;
      if (convDate >= weekAgo) weekCount++;
      if (convDate >= monthAgo) monthCount++;
    });

    setStats({
      totalConversations: convs.length,
      uniqueSessions: uniqueSessions.size,
      totalMessages,
      avgMessagesPerConversation: convs.length > 0 ? Math.round(totalMessages / convs.length) : 0,
      domains,
      todayConversations: todayCount,
      weekConversations: weekCount,
      monthConversations: monthCount
    });
  };

  const filterConversations = () => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.messages.some(msg => 
          msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        conv.session_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.domain?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch(dateFilter) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(conv => 
        new Date(conv.first_message_at) >= cutoffDate
      );
    }

    // Domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(conv => conv.domain === domainFilter);
    }

    setFilteredConversations(filtered);
  };

  const copySiteKey = () => {
    // Prefer product key over site key
    const keyToCopy = productKey || siteKey;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadCustomKnowledge = async () => {
    try {
      const res = await fetch('/api/products/chatbot/custom-knowledge', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.knowledge && data.knowledge.length > 0) {
          // Get the general knowledge entry
          const general = data.knowledge.find(k => k.knowledge_type === 'general');
          if (general) {
            setCustomKnowledge(general.content);
          }
        }
      }
    } catch (error) {
      console.error('Error loading custom knowledge:', error);
    }
  };

  const saveCustomKnowledge = async () => {
    setSavingKnowledge(true);
    setKnowledgeSaved(false);
    
    try {
      const res = await fetch('/api/products/chatbot/custom-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: customKnowledge,
          knowledge_type: 'general'
        })
      });
      
      if (res.ok) {
        setKnowledgeSaved(true);
        setTimeout(() => setKnowledgeSaved(false), 3000);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save custom knowledge');
      }
    } catch (error) {
      console.error('Error saving custom knowledge:', error);
      alert('Failed to save custom knowledge');
    } finally {
      setSavingKnowledge(false);
    }
  };

  const getEmbedCode = () => {
    const key = productKey || siteKey;
    if (!key) return '';
    
    return `<!-- Intelagent Chatbot -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.intelagentstudios.com/widget.js';
    script.setAttribute('data-product-key', '${key}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!siteKey && !productKey) {
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
              Chatbot Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Monitor conversations and manage your AI chatbot
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="p-2 rounded-lg transition"
            style={{ 
              backgroundColor: 'black',
              border: '1px solid black',
              color: 'white'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = 'black';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'black';
              e.currentTarget.style.color = 'white';
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-8 pt-6">
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
                  Today
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.todayConversations || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  conversations
                </p>
              </div>
              <Calendar className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
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
                  This Week
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.weekConversations || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  conversations
                </p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
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
                  Total Messages
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.totalMessages || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  all time
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
                  Unique Users
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stats?.uniqueSessions || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  sessions
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-6">
        <div className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex space-x-8">
            {['conversations', 'custom instructions', 'settings'].map((tab) => (
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
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6">
        {activeTab === 'conversations' && (
          <div>
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                          style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'rgba(58, 64, 64, 0.5)',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      color: 'rgb(229, 227, 220)',
                      minWidth: '250px'
                    }}
                  />
                </div>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>

                {stats?.domains && stats.domains.length > 1 && (
                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'rgba(58, 64, 64, 0.5)',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  >
                    <option value="all">All Domains</option>
                    {stats.domains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                Showing {filteredConversations.length} of {conversations.length} conversations
              </div>
            </div>

            {/* Conversations List */}
            <div className="space-y-4">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" 
                                 style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                  <p style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    No conversations found
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="rounded-lg p-4 border cursor-pointer hover:opacity-80 transition"
                    style={{ 
                      backgroundColor: 'rgba(58, 64, 64, 0.5)',
                      borderColor: 'rgba(169, 189, 203, 0.15)'
                    }}
                    onClick={() => router.push(`/products/chatbot/conversations?id=${conversation.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                            Session: {conversation.session_id}
                          </span>
                          {conversation.domain && (
                            <>
                              <span style={{ color: 'rgba(229, 227, 220, 0.3)' }}>•</span>
                              <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                                {conversation.domain}
                              </span>
                            </>
                          )}
                          <span style={{ color: 'rgba(229, 227, 220, 0.3)' }}>•</span>
                          <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>
                            {formatTimeAgo(conversation.last_message_at)}
                          </span>
                        </div>
                        
                        {conversation.messages.length > 0 && (
                          <div className="space-y-2">
                            {conversation.messages.slice(0, 2).map((msg, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                {msg.role === 'user' ? (
                                  <User className="h-4 w-4 mt-0.5" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                                ) : (
                                  <Bot className="h-4 w-4 mt-0.5" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                                )}
                                <p className="text-sm line-clamp-1" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                                  {msg.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>
                            {conversation.messages.length} messages
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'custom instructions' && (
          <div className="max-w-4xl">
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Custom Instructions
              </h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                Provide custom instructions, information, or context to personalize your chatbot's behavior.
                These instructions are used by the AI to enhance responses with your specific requirements.
              </p>
              <textarea
                value={customKnowledge}
                onChange={(e) => setCustomKnowledge(e.target.value)}
                placeholder="Enter custom instructions for your chatbot...

Examples:
• Business hours: Monday-Friday 9am-5pm EST, closed weekends
• Current promotion: 20% off all products with code SAVE20
• Always mention our free consultation offer
• Prioritize upselling our premium support package
• Use a friendly but professional tone
• Direct technical questions to support@example.com"
                className="w-full h-64 p-4 rounded-lg resize-none"
                style={{
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.2)',
                  color: 'rgb(229, 227, 220)',
                  fontSize: '14px'
                }}
                maxLength={50000}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>
                  {customKnowledge.length}/50,000 characters
                </span>
                <div className="flex items-center space-x-2">
                  {knowledgeSaved && (
                    <span className="text-sm" style={{ color: '#4CAF50' }}>
                      ✓ Saved successfully
                    </span>
                  )}
                  <button
                    onClick={saveCustomKnowledge}
                    disabled={savingKnowledge || !customKnowledge.trim()}
                    className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: customKnowledge.trim() ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    {savingKnowledge ? 'Saving...' : 'Save Instructions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Key className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                <h3 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Site Configuration
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                    Product Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productKey || siteKey || ''}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                      style={{ 
                        backgroundColor: 'rgba(48, 54, 54, 0.8)',
                        color: 'rgb(169, 189, 203)',
                        border: '1px solid rgba(169, 189, 203, 0.2)'
                      }}
                    />
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                    Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" style={{ color: '#4CAF50' }} />
                    <span style={{ color: '#4CAF50' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

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
                  Embed Code
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                Add this code to your website to enable the chatbot.
              </p>
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
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getEmbedCode());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-4 px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: 'rgb(169, 189, 203)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>

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
                  Data Management
                </h3>
              </div>
              <div className="space-y-4">
                <button
                  className="w-full px-4 py-2 rounded-lg text-left"
                  style={{ 
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}
                >
                  Export Conversations (CSV)
                </button>
                <button
                  className="w-full px-4 py-2 rounded-lg text-left"
                  style={{ 
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}
                >
                  Download Analytics Report
                </button>
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'embed' && (
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
      </div>
    </DashboardLayout>
  );
}