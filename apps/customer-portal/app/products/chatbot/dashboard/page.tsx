'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  formatConversationTitle, 
  extractTopic, 
  getConversationDuration,
  getConversationSentiment,
  groupConversationsByDate,
  getUniqueTopics,
  parseMessageContent
} from './utils';
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
  Bot,
  ArrowLeft,
  X,
  ChevronDown,
  BookOpen,
  Save,
  Loader2,
  ExternalLink,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface Conversation {
  id: string;
  session_id: string;
  domain: string;
  product_key?: string;
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

function ChatbotDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [productKey, setProductKey] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [availableProductKeys, setAvailableProductKeys] = useState<{key: string, domain?: string}[]>([]);
  const [selectedProductKey, setSelectedProductKey] = useState<string>('all');
  const [groupBy, setGroupBy] = useState('time');
  const [customKnowledge, setCustomKnowledge] = useState('');
  const [uniqueTopics, setUniqueTopics] = useState<string[]>([]);
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [knowledgeSaved, setKnowledgeSaved] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedWebsiteType, setSelectedWebsiteType] = useState('general');
  const [showIntegrationHelp, setShowIntegrationHelp] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    welcomeMessage: "Hello! How can I help you today?",
    primaryColor: "#0070f3",
    headerColor: "#0070f3",
    backgroundColor: "#ffffff",
    position: "bottom-right",
    playNotificationSound: true,
    showWelcomeMessage: true,
    collectEmail: false,
    responseStyle: "professional"
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Check for specific tab or conversation in URL params
    const tab = searchParams.get('tab');
    const conversationId = searchParams.get('id');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        setActiveTab('conversations');
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery, dateFilter, selectedDate, topicFilter, selectedProductKey]);

  useEffect(() => {
    // Extract unique topics when conversations change
    if (conversations.length > 0) {
      const topics = getUniqueTopics(conversations);
      setUniqueTopics(topics);
    }
  }, [conversations]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setSiteKey(data.user.site_key);
        
        // Check for product configuration
        const configRes = await fetch('/api/products/configuration', { credentials: 'include' });
        const configData = await configRes.json();
        
        if (configData.chatbot?.configured) {
          setProductKey(configData.chatbot.product_key);
          setSiteKey(configData.chatbot.site_key || configData.chatbot.product_key);
          await fetchConversations();
          await loadCustomKnowledge();
        } else if (data.user.site_key) {
          await fetchConversations();
          await loadCustomKnowledge();
        } else {
          setLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/products/chatbot/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Save settings function
  const saveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaved(false);
    
    try {
      const response = await fetch('/api/widget/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productKey: productKey || siteKey,
          settings: settings
        }),
      });
      
      if (response.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchConversations = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/products/chatbot/conversations');
      const data = await res.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
        setFilteredConversations(data.conversations);
        calculateStats(data.conversations);
        
        // Extract unique topics for filtering
        const topics = getUniqueTopics(data.conversations);
        setUniqueTopics(topics);
        
        // Extract unique product keys if user has multiple
        const uniqueKeys = new Map<string, string>();
        data.conversations.forEach((conv: Conversation) => {
          if (conv.product_key) {
            uniqueKeys.set(conv.product_key, conv.domain || '');
          }
        });
        
        const keysArray = Array.from(uniqueKeys.entries()).map(([key, domain]) => ({
          key,
          domain
        }));
        
        if (keysArray.length > 1) {
          setAvailableProductKeys(keysArray);
        } else {
          setAvailableProductKeys([]); // Clear if only one key
        }
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
      
      if (data.stats) {
        setStats(data.stats);
      }
      
      if (data.product_key) {
        setProductKey(data.product_key);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
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
      
      switch (dateFilter) {
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

    // Custom date filter
    if (dateFilter === 'custom' && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      filtered = filtered.filter(conv => {
        const convDate = new Date(conv.first_message_at);
        return convDate.toDateString() === selectedDateObj.toDateString();
      });
    }

    // Topic filter
    if (topicFilter !== 'all') {
      filtered = filtered.filter(conv => {
        const topic = extractTopic(conv.messages || []);
        return topic === topicFilter;
      });
    }
    
    // Product key filter (for accounts with multiple keys)
    if (selectedProductKey !== 'all' && availableProductKeys.length > 1) {
      filtered = filtered.filter(conv => conv.product_key === selectedProductKey);
    }

    setFilteredConversations(filtered);
  };

  const copyToClipboard = () => {
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
      }
    } catch (error) {
      console.error('Error saving custom knowledge:', error);
    } finally {
      setSavingKnowledge(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Always show both date and time for clarity
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr} at ${timeStr}`;
  };
  
  const getDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const convDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (convDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (convDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (isAuthenticated === null || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgb(169, 189, 203)' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
            Chatbot Dashboard
          </h1>
          <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Manage your AI chatbot, view conversations, and configure settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition hover:opacity-80"
              style={{
                borderColor: activeTab === 'overview' ? 'rgb(169, 189, 203)' : 'transparent',
                color: activeTab === 'overview' ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition hover:opacity-80"
              style={{
                borderColor: activeTab === 'conversations' ? 'rgb(169, 189, 203)' : 'transparent',
                color: activeTab === 'conversations' ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversations
                {conversations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)', color: 'rgb(169, 189, 203)' }}>
                    {conversations.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition hover:opacity-80"
              style={{
                borderColor: activeTab === 'knowledge' ? 'rgb(169, 189, 203)' : 'transparent',
                color: activeTab === 'knowledge' ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge Base
              </div>
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition hover:opacity-80"
              style={{
                borderColor: activeTab === 'integration' ? 'rgb(169, 189, 203)' : 'transparent',
                color: activeTab === 'integration' ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Integration
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="py-2 px-1 border-b-2 font-medium text-sm transition hover:opacity-80"
              style={{
                borderColor: activeTab === 'settings' ? 'rgb(169, 189, 203)' : 'transparent',
                color: activeTab === 'settings' ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Total Conversations</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.totalConversations || 0}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>
              
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Today</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.todayConversations || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>
              
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>This Week</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.weekConversations || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>
              
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Avg Messages</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.avgMessagesPerConversation || 0}
                    </p>
                  </div>
                  <Activity className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    Recent Conversations
                  </h3>
                  <button
                    onClick={() => setActiveTab('conversations')}
                    className="text-sm hover:opacity-80 transition"
                    style={{ color: 'rgb(169, 189, 203)' }}
                  >
                    View all →
                  </button>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                {conversations.slice(0, 5).map((conversation) => {
                  const convInfo = formatConversationTitle(conversation);
                  return (
                    <div
                      key={conversation.id}
                      className="p-4 cursor-pointer transition hover:opacity-80"
                      style={{ backgroundColor: 'transparent' }}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setActiveTab('conversations');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                              {convInfo.title}
                            </span>
                            {conversation.domain && (
                              <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                • {conversation.domain}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                            {convInfo.subtitle}
                          </p>
                        </div>
                        <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                          {convInfo.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                  {/* Search and Filters */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: 'rgba(169, 189, 203, 0.3)', 
                          backgroundColor: 'rgba(48, 54, 54, 0.5)', 
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition hover:opacity-80"
                        style={{ borderColor: 'rgba(169, 189, 203, 0.3)', color: 'rgba(169, 189, 203, 0.8)' }}
                      >
                        <Filter className="w-4 h-4" />
                        Filters
                        {(dateFilter !== 'all' || topicFilter !== 'all' || selectedProductKey !== 'all') && (
                          <span className="ml-1 rounded-full w-2 h-2" style={{ backgroundColor: 'rgb(169, 189, 203)' }} />
                        )}
                      </button>
                      <button
                        onClick={() => fetchConversations()}
                        disabled={refreshing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition hover:opacity-80"
                        style={{ borderColor: 'rgba(169, 189, 203, 0.3)', color: 'rgba(169, 189, 203, 0.8)' }}
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                    
                    {showFilters && (
                      <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                        <div className="flex gap-2">
                          <select
                            value={dateFilter}
                            onChange={(e) => {
                              setDateFilter(e.target.value);
                              if (e.target.value !== 'custom') {
                                setSelectedDate('');
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
                            style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                          >
                            <option value="all">All time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 days</option>
                            <option value="month">Last 30 days</option>
                            <option value="custom">Custom date</option>
                          </select>
                          {dateFilter === 'custom' && (
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="px-3 py-1.5 text-sm border rounded-lg"
                              style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                            />
                          )}
                        </div>
                        
                        {uniqueTopics.length > 0 && (
                          <select
                            value={topicFilter}
                            onChange={(e) => setTopicFilter(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg"
                            style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                          >
                            <option value="all">All topics</option>
                            {uniqueTopics.map((topic) => (
                              <option key={topic} value={topic}>{topic}</option>
                            ))}
                          </select>
                        )}
                        
                        {availableProductKeys.length > 1 && (
                          <select
                            value={selectedProductKey}
                            onChange={(e) => setSelectedProductKey(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg"
                            style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                          >
                            <option value="all">All chatbots</option>
                            {availableProductKeys.map((pk) => (
                              <option key={pk.key} value={pk.key}>
                                {pk.domain || pk.key.substring(0, 20) + '...'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Conversation List */}
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                      {(() => {
                        let lastDateSeparator = '';
                        return filteredConversations.map((conversation) => {
                          const convInfo = formatConversationTitle(conversation);
                          const isSelected = selectedConversation?.id === conversation.id;
                          const dateSeparator = getDateSeparator(conversation.first_message_at);
                          const showSeparator = dateSeparator !== lastDateSeparator;
                          lastDateSeparator = dateSeparator;
                          
                          return (
                            <div key={conversation.id}>
                              {showSeparator && (
                                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" 
                                     style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgba(169, 189, 203, 0.8)' }}>
                                  {dateSeparator}
                                </div>
                              )}
                              <div
                                onClick={() => setSelectedConversation(conversation)}
                                className="p-4 cursor-pointer transition"
                                style={{
                                  backgroundColor: isSelected ? 'rgba(169, 189, 203, 0.1)' : 'transparent',
                                  borderLeft: isSelected ? '4px solid rgb(169, 189, 203)' : 'none',
                                  paddingLeft: isSelected ? '12px' : '16px'
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium truncate" style={{ color: 'rgb(229, 227, 220)' }}>
                                        {convInfo.title}
                                      </span>
                                      {conversation.domain && (
                                        <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                          {conversation.domain}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                      {convInfo.subtitle}
                                    </p>
                                    {conversation.messages[0] && (
                                      <p className="text-xs mt-1 truncate" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                                        {conversation.messages[0].content}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-xs ml-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                    {convInfo.time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Detail */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                  <div className="p-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                          Conversation Details
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                          <span>Session: {selectedConversation.session_id?.substring(0, 12)}...</span>
                          {selectedConversation.domain && (
                            <span>Domain: {selectedConversation.domain}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="hover:opacity-80 transition"
                        style={{ color: 'rgba(169, 189, 203, 0.6)' }}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
                    {selectedConversation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className="max-w-[70%] rounded-lg p-4"
                          style={{
                            backgroundColor: message.role === 'assistant' 
                              ? 'rgba(48, 54, 54, 0.7)' 
                              : 'rgba(169, 189, 203, 0.2)',
                            color: message.role === 'assistant'
                              ? 'rgb(229, 227, 220)'
                              : 'rgb(229, 227, 220)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {message.role === 'assistant' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium">
                              {message.role === 'assistant' ? 'Chatbot' : 'Customer'}
                            </span>
                            <span className="text-xs opacity-75">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {parseMessageContent(message.content).map((part, i) => 
                              part.isLink ? (
                                <a
                                  key={i}
                                  href={part.text}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:opacity-80 transition"
                                  style={{ color: 'inherit' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {part.text}
                                </a>
                              ) : (
                                <span key={i}>{part.text}</span>
                              )
                            )}
                          </div>
                          {message.intent && (
                            <p className="text-xs mt-2 opacity-75">
                              Intent: {message.intent}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-8" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                  <div className="text-center" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                    <p>Select a conversation to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg shadow-sm border p-6" 
                 style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  Custom Knowledge Base
                </h2>
                <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  Add custom information that your chatbot should know about your business, products, or services.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* PDF Upload Section */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    Upload Documents
                  </label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center"
                       style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('productKey', productKey || siteKey || '');
                          
                          try {
                            const res = await fetch('/api/products/chatbot/upload-document', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (res.ok) {
                              alert(`Document "${file.name}" uploaded successfully!`);
                              // Don't add to text box, just refresh to show in knowledge base
                            } else {
                              alert('Failed to upload document. Please try again.');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            alert('Error uploading document.');
                          }
                        }
                      }}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 mb-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm mb-1" style={{ color: 'rgb(229, 227, 220)' }}>Click to upload documents</p>
                        <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>PDF, Word, Excel, PowerPoint, Text, CSV</p>
                      </div>
                    </label>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Upload documents containing product info, FAQs, manuals, or company data
                  </p>
                </div>
                
                {/* Text Input Section */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    Knowledge Content
                  </label>
                  <textarea
                    value={customKnowledge}
                    onChange={(e) => setCustomKnowledge(e.target.value)}
                    placeholder="Enter custom information for your chatbot..."
                    rows={10}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  />
                  <p className="mt-2 text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Examples: Business hours, pricing information, FAQs, product details, contact information
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    {knowledgeSaved && (
                      <div className="flex items-center gap-2" style={{ color: 'rgb(144, 238, 144)' }}>
                        <CheckCircle className="w-5 h-5" />
                        <span>Knowledge saved successfully!</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={saveCustomKnowledge}
                    disabled={savingKnowledge}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    style={{
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    {savingKnowledge ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingKnowledge ? 'Saving...' : 'Save Knowledge'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-lg shadow-sm border p-6" 
                 style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  Widget Integration
                </h2>
                <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  Copy and paste this code into your website to add the chatbot widget
                </p>
              </div>
              
              {productKey ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Your Product Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={productKey}
                        readOnly
                        className="flex-1 px-4 py-2 rounded-lg font-mono text-sm"
                        style={{
                          backgroundColor: 'rgba(48, 54, 54, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 rounded-lg hover:opacity-80 transition flex items-center"
                        style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Integration Code
                    </label>
                    <pre className="p-4 rounded-lg overflow-x-auto text-sm font-mono" 
                         style={{ 
                           backgroundColor: 'rgba(48, 54, 54, 0.7)', 
                           color: 'rgb(229, 227, 220)',
                           border: '1px solid rgba(169, 189, 203, 0.2)'
                         }}>
{`<!-- Intelagent Chatbot Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.intelagent.ai/chatbot.js';
    script.setAttribute('data-site-key', '${productKey}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`}
                    </pre>
                  </div>
                  
                  {/* Integration Help Section */}
                  <div>
                    <button
                      onClick={() => setShowIntegrationHelp(!showIntegrationHelp)}
                      className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
                      style={{ color: 'rgb(169, 189, 203)' }}
                    >
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${showIntegrationHelp ? 'rotate-180' : ''}`} 
                      />
                      Integration Help & Platform-Specific Tips
                    </button>
                    
                    {showIntegrationHelp && (
                      <div className="mt-4 space-y-4">
                        {/* Website Type Selector */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                            Select Your Website Type
                          </label>
                          <select
                            value={selectedWebsiteType}
                            onChange={(e) => setSelectedWebsiteType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: 'rgba(48, 54, 54, 0.5)',
                              border: '1px solid rgba(169, 189, 203, 0.2)',
                              color: 'rgb(229, 227, 220)'
                            }}
                          >
                            <option value="general">General Website</option>
                            <option value="wordpress">WordPress</option>
                            <option value="shopify">Shopify</option>
                            <option value="wix">Wix</option>
                            <option value="squarespace">Squarespace</option>
                            <option value="react">React App</option>
                            <option value="nextjs">Next.js</option>
                            <option value="vue">Vue.js</option>
                            <option value="angular">Angular</option>
                          </select>
                        </div>
                        
                        {/* Platform-specific instructions */}
                        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgba(169, 189, 203, 0.2)' }}>
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(169, 189, 203)' }} />
                            <div className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                              <p className="font-medium mb-2">Instructions for {selectedWebsiteType === 'general' ? 'General Websites' : selectedWebsiteType.charAt(0).toUpperCase() + selectedWebsiteType.slice(1)}:</p>
                              {selectedWebsiteType === 'wordpress' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Go to Appearance → Theme Editor</li>
                                  <li>Select footer.php from the file list</li>
                                  <li>Paste the code just before &lt;/body&gt;</li>
                                  <li>Click "Update File" to save</li>
                                  <li>Alternative: Use a plugin like "Insert Headers and Footers"</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'shopify' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Go to Online Store → Themes</li>
                                  <li>Click "Actions" → "Edit code"</li>
                                  <li>Find theme.liquid in Layout folder</li>
                                  <li>Paste code before &lt;/body&gt; tag</li>
                                  <li>Save the file</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'wix' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Go to Settings → Custom Code</li>
                                  <li>Click "+ Add Custom Code"</li>
                                  <li>Paste the integration code</li>
                                  <li>Set "Add Code to Pages" to "All pages"</li>
                                  <li>Set "Place Code in" to "Body - end"</li>
                                  <li>Click "Apply"</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'squarespace' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Go to Settings → Advanced → Code Injection</li>
                                  <li>Paste code in the "Footer" section</li>
                                  <li>Click "Save"</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'react' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Open your public/index.html file</li>
                                  <li>Paste code before &lt;/body&gt; tag</li>
                                  <li>Or add to App.js using useEffect hook</li>
                                  <li>Rebuild and deploy your app</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'nextjs' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Open pages/_document.js (or app/layout.js for App Router)</li>
                                  <li>Import Script from 'next/script'</li>
                                  <li>Add Script component with strategy="lazyOnload"</li>
                                  <li>Deploy your application</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'vue' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Open public/index.html</li>
                                  <li>Paste code before &lt;/body&gt; tag</li>
                                  <li>Or add to App.vue mounted() hook</li>
                                  <li>Build and deploy</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'angular' && (
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Open src/index.html</li>
                                  <li>Paste code before &lt;/body&gt; tag</li>
                                  <li>Or add to app.component.ts ngOnInit()</li>
                                  <li>Build with ng build</li>
                                </ol>
                              )}
                              {selectedWebsiteType === 'general' && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Add the code just before the closing &lt;/body&gt; tag</li>
                                  <li>The widget will automatically appear on all pages</li>
                                  <li>Customize appearance in the Settings tab</li>
                                  <li>Test the integration in a staging environment first</li>
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No product key configured yet
                  </p>
                  <button
                    onClick={() => router.push('/products/chatbot/setup')}
                    className="px-4 py-2 rounded-lg hover:opacity-80"
                    style={{
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'rgb(48, 54, 54)'
                    }}
                  >
                    Configure Chatbot
                  </button>
                </div>
              )}
            </div>
            
            {/* API Access */}
            <div className="rounded-lg shadow-sm border p-6" 
                 style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                API Access
              </h3>
              <p className="mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Access chatbot data programmatically via our REST API
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      GET /api/chatbot/{productKey}/conversations
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      Retrieve conversation history
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      POST /api/chatbot/{productKey}/knowledge
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Update custom knowledge base
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              {/* API Help Section */}
              <div className="mt-4">
                <button
                  onClick={() => setShowApiHelp(!showApiHelp)}
                  className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
                  style={{ color: 'rgb(169, 189, 203)' }}
                >
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showApiHelp ? 'rotate-180' : ''}`} 
                  />
                  API Documentation & Examples
                </button>
                
                {showApiHelp && (
                  <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgba(169, 189, 203, 0.2)' }}>
                    <div className="space-y-4 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                      <div>
                        <p className="font-medium mb-2">Authentication:</p>
                        <p className="mb-2">Include your product key in the Authorization header:</p>
                        <code className="block p-2 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                          Authorization: Bearer {productKey || 'YOUR_PRODUCT_KEY'}
                        </code>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Example GET Request (cURL):</p>
                        <pre className="p-2 rounded overflow-x-auto" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
{`curl -X GET \\
  https://api.intelagent.ai/chatbot/${productKey || 'YOUR_PRODUCT_KEY'}/conversations \\
  -H "Authorization: Bearer ${productKey || 'YOUR_PRODUCT_KEY'}"`}
                        </pre>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Example POST Request (cURL):</p>
                        <pre className="p-2 rounded overflow-x-auto" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
{`curl -X POST \\
  https://api.intelagent.ai/chatbot/${productKey || 'YOUR_PRODUCT_KEY'}/knowledge \\
  -H "Authorization: Bearer ${productKey || 'YOUR_PRODUCT_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Your custom knowledge here"}'`}
                        </pre>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">Rate Limits:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>100 requests per minute for GET endpoints</li>
                          <li>10 requests per minute for POST endpoints</li>
                          <li>Responses include X-RateLimit headers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h2 className="text-xl font-semibold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Settings
              </h2>
              
              <div className="space-y-6">
                {/* Widget Appearance */}
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                    Widget Appearance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Widget Button Color
                      </label>
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full h-10 rounded"
                        style={{ border: '1px solid rgba(169, 189, 203, 0.3)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Chat Window Header Color
                      </label>
                      <input
                        type="color"
                        value={settings.headerColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, headerColor: e.target.value }))}
                        className="w-full h-10 rounded"
                        style={{ border: '1px solid rgba(169, 189, 203, 0.3)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Chat Window Background
                      </label>
                      <input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-full h-10 rounded"
                        style={{ border: '1px solid rgba(169, 189, 203, 0.3)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Widget Position
                      </label>
                      <select 
                        value={settings.position}
                        onChange={(e) => setSettings(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg" 
                        style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', border: '1px solid rgba(169, 189, 203, 0.2)', color: 'rgb(229, 227, 220)' }}
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Behavior Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                    Behavior
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.showWelcomeMessage}
                        onChange={(e) => setSettings(prev => ({ ...prev, showWelcomeMessage: e.target.checked }))}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'rgb(169, 189, 203)' }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        Show welcome message on first visit
                      </span>
                    </label>
                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.playNotificationSound}
                          onChange={(e) => setSettings(prev => ({ ...prev, playNotificationSound: e.target.checked }))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'rgb(169, 189, 203)' }}
                        />
                        <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                          Play notification sound for customers when they receive a message
                        </span>
                        <AlertCircle className="w-4 h-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                      </label>
                    </div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.collectEmail}
                        onChange={(e) => setSettings(prev => ({ ...prev, collectEmail: e.target.checked }))}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'rgb(169, 189, 203)' }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        Collect visitor email before starting chat
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                    Business Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Welcome Message
                      </label>
                      <textarea
                        rows={3}
                        value={settings.welcomeMessage}
                        onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        placeholder="Enter the first message visitors will see"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(48, 54, 54, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        This message appears when a visitor opens the chat for the first time
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        AI Response Style
                      </label>
                      <select
                        value={settings.responseStyle || 'professional'}
                        onChange={(e) => setSettings(prev => ({ ...prev, responseStyle: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(48, 54, 54, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                      </select>
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        <Activity className="w-3 h-3" />
                        AI chatbot is available 24/7 to assist your customers instantly
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={saveSettings}
                      disabled={isSavingSettings}
                      className="px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2 disabled:opacity-50" 
                      style={{ backgroundColor: 'rgb(169, 189, 203)', color: 'rgb(48, 54, 54)' }}
                    >
                      {isSavingSettings ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save Settings</>
                      )}
                    </button>
                    {settingsSaved && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                        <CheckCircle className="w-4 h-4" /> Settings saved successfully!
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Changes will be applied to your chatbot widget immediately via the n8n workflow
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ChatbotDashboard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      </DashboardLayout>
    }>
      <ChatbotDashboardContent />
    </Suspense>
  );
}