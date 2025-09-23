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
  BarChart3,
  File,
  FileText,
  Maximize2,
  TrendingDown,
  MessageCircle
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
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedWebsiteType, setSelectedWebsiteType] = useState('general');
  const [showIntegrationHelp, setShowIntegrationHelp] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [expandedChart, setExpandedChart] = useState<'trends' | 'topics' | 'topDomains' | null>(null);
  const [trendsDateRange, setTrendsDateRange] = useState<'7d' | '14d' | '30d' | '90d'>('7d');
  const [topicsDateRange, setTopicsDateRange] = useState<'7d' | '14d' | '30d' | '90d'>('7d');
  const [chartViewMode, setChartViewMode] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [compareBy, setCompareBy] = useState<'count' | 'percentage' | 'trend'>('count');
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['all']);
  const [showDomainSelector, setShowDomainSelector] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  const [tabOrder, setTabOrder] = useState<string[]>(['overview', 'conversations', 'analytics', 'knowledge', 'settings']);
  
  // Settings state - simplified
  const [settings, setSettings] = useState({
    welcomeMessage: "Hello! How can I help you today?",
    themeColor: "#0070f3",
    widgetTitle: "Chat Assistant",
    titleColor: "#ffffff",
    showWelcomeMessage: true,
    collectEmail: false,
    responseStyle: "professional",
    autoReopenOnResponse: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [statusBulletin, setStatusBulletin] = useState<{
    priority: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  } | null>(null);
  const [bulletinLoading, setBulletinLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    // Load saved tab order from localStorage
    const savedOrder = localStorage.getItem('chatbot-tab-order');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        if (Array.isArray(order) && order.length === 5) {
          setTabOrder(order);
        }
      } catch (e) {
        console.error('Failed to parse saved tab order');
      }
    }
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
  }, [conversations, searchQuery, dateFilter, selectedDate, topicFilter, selectedProductKey, selectedDomains]);

  useEffect(() => {
    // Recalculate stats when domain filter changes
    if (conversations.length > 0) {
      calculateStats(conversations);
    }
  }, [selectedDomains, conversations]);

  useEffect(() => {
    // Fetch status bulletin when conversations are loaded
    if (conversations.length > 0 && !bulletinLoading && !statusBulletin) {
      fetchStatusBulletin();
    }
  }, [conversations]);

  useEffect(() => {
    // Extract unique topics when conversations change
    if (conversations.length > 0) {
      const topics = getUniqueTopics(conversations);
      setUniqueTopics(topics);
    }
  }, [conversations]);

  useEffect(() => {
    // Close domain selector when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.domain-selector-container')) {
        setShowDomainSelector(false);
      }
    };

    if (showDomainSelector) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDomainSelector]);

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
          console.log('[Dashboard] Product key from config:', configData.chatbot.product_key);
          console.log('[Dashboard] Site key from config:', configData.chatbot.site_key);
          setProductKey(configData.chatbot.product_key);
          setSiteKey(configData.chatbot.site_key || configData.chatbot.product_key);
          await fetchConversations();
          await loadCustomKnowledge();
        } else if (data.user.site_key) {
          console.log('[Dashboard] Using site key from user:', data.user.site_key);
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

  // Save settings function - simplified
  const saveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaved(false);
    
    try {
      // Map to simplified settings format
      const simplifiedSettings = {
        themeColor: settings.themeColor,
        widgetTitle: settings.widgetTitle,
        titleColor: settings.titleColor,
        welcomeMessage: settings.welcomeMessage,
        responseStyle: settings.responseStyle,
        showWelcomeMessage: settings.showWelcomeMessage,
        collectEmail: settings.collectEmail,
        autoReopenOnResponse: settings.autoReopenOnResponse
      };
      
      const key = productKey || siteKey;
      
      if (!key) {
        console.error('[Settings] No product key or site key available!');
        alert('Unable to save settings: No product key found. Please refresh the page.');
        return;
      }
      
      console.log('[Settings] Saving with key:', key);
      console.log('[Settings] Settings to save:', simplifiedSettings);
      
      // Use the correct endpoint that matches where we fetch from
      const response = await fetch('/api/products/chatbot/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simplifiedSettings),
      });
      
      const result = await response.json();
      console.log('[Settings] Save response:', result);
      
      if (response.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
        
        // Verify settings were saved by fetching them back
        const verifyResponse = await fetch(`/api/widget/config?key=${key}`);
        const verifyData = await verifyResponse.json();
        console.log('[Settings] Verification - saved settings:', verifyData.config);
      } else {
        console.error('Failed to save settings:', result);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchAIInsights = async () => {
    if (loadingInsights || !conversations.length) return;

    setLoadingInsights(true);
    try {
      const res = await fetch('/api/chatbot/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversations: conversations.slice(0, 100),
          productKey: productKey || siteKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Fetch AI insights when conversations change and analytics tab is active
  useEffect(() => {
    if (conversations.length > 0 && activeTab === 'analytics' && !aiInsights) {
      fetchAIInsights();
    }
  }, [conversations, activeTab]);

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
      
      // Don't use data.stats from API as it has different property names
      // The calculateStats function already set the correct stats from conversations
      
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

  const fetchStatusBulletin = async () => {
    setBulletinLoading(true);
    try {
      const response = await fetch('/api/chatbot/status-bulletin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productKey: selectedProductKey || productKey,
          conversations: filteredConversations.length > 0 ? filteredConversations : conversations,
          stats,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatusBulletin(data.bulletin);
      }
    } catch (error) {
      console.error('Failed to fetch status bulletin:', error);
    } finally {
      setBulletinLoading(false);
    }
  };

  const calculateStats = (convs: Conversation[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Apply domain filter to conversations for stats calculation
    let statsConvs = convs;
    if (!selectedDomains.includes('all') && selectedDomains.length > 0) {
      statsConvs = convs.filter(conv => selectedDomains.includes(conv.domain));
    }

    const uniqueSessions = new Set(statsConvs.map(c => c.session_id));
    const domains = [...new Set(convs.map(c => c.domain).filter(Boolean))]; // Keep all domains for the selector

    let totalMessages = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    // Use calendar week for week count (Monday to Sunday)
    const weekStart = new Date(todayEnd);
    weekStart.setDate(todayEnd.getDate() - todayEnd.getDay() + (todayEnd.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    // Use calendar month for month count
    const monthStart = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    statsConvs.forEach(conv => {
      totalMessages += conv.messages.length;
      const convDate = new Date(conv.first_message_at || new Date());

      // Check if conversation is from today (between todayStart and todayEnd)
      if (convDate >= todayStart && convDate < todayEnd) todayCount++;
      // Check if conversation is from this calendar week
      if (convDate >= weekStart && convDate < todayEnd) weekCount++;
      // Check if conversation is from this calendar month
      if (convDate >= monthStart && convDate < todayEnd) monthCount++;
    });

    const statsData = {
      totalConversations: statsConvs.length,
      uniqueSessions: uniqueSessions.size,
      totalMessages,
      avgMessagesPerConversation: statsConvs.length > 0 ? Math.round(totalMessages / statsConvs.length) : 0,
      domains,
      todayConversations: todayCount,
      weekConversations: weekCount,
      monthConversations: monthCount
    };

    console.log('[Chatbot Dashboard] Calculated stats:', statsData);
    console.log('[Chatbot Dashboard] Sample conversation date:', convs[0]?.first_message_at);

    setStats(statsData);
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

    // Domain filter
    if (!selectedDomains.includes('all') && selectedDomains.length > 0) {
      filtered = filtered.filter(conv =>
        selectedDomains.includes(conv.domain)
      );
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
      // Load knowledge files
      const filesRes = await fetch('/api/products/chatbot/knowledge-files', {
        credentials: 'include'
      });
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setKnowledgeFiles(filesData.files || []);
      }
      
      // Load custom knowledge entries
      const res = await fetch('/api/products/chatbot/custom-knowledge', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.knowledge && data.knowledge.length > 0) {
          // Show all active knowledge entries
          setKnowledgeEntries(data.knowledge);
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
      // First save the knowledge
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
        const knowledgeData = await res.json();
        
        // Then generate embeddings for RAG
        if (productKey && customKnowledge.length > 50) { // Only for substantial content
          const embeddingRes = await fetch('/api/embeddings/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licenseKey: productKey, // Using productKey as license identifier
              content: customKnowledge,
              knowledgeId: knowledgeData.id || 'general',
              forceRegenerate: true // Always regenerate when saving
            })
          });
          
          if (embeddingRes.ok) {
            const embedData = await embeddingRes.json();
            console.log(`Generated ${embedData.chunksProcessed} embeddings for knowledge`);
          }
        }
        
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
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(48, 54, 54, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(169, 189, 203, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(169, 189, 203, 0.5);
        }
      `}</style>
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
          <nav className="-mb-px flex items-center">
            <div className="flex space-x-4">
              {tabOrder.map((tabId, index) => {
                const tabConfig: Record<string, { icon: any; label: string; badge?: number }> = {
                  overview: { icon: BarChart3, label: 'Overview' },
                  conversations: { icon: MessageSquare, label: 'Conversations', badge: conversations.length },
                  analytics: { icon: BarChart3, label: 'Analytics' },
                  knowledge: { icon: BookOpen, label: 'Knowledge Base' },
                  settings: { icon: Settings, label: 'Customize' }
                };

                const tab = tabConfig[tabId];
                if (!tab) return null;

                const Icon = tab.icon;

                return (
                  <button
                    key={tabId}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTab(index);
                      e.dataTransfer.effectAllowed = 'move';
                      // Add visual feedback
                      (e.target as HTMLElement).style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      (e.target as HTMLElement).style.opacity = '1';
                      setDraggedTab(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedTab === null) return;

                      const newOrder = [...tabOrder];
                      const draggedItem = newOrder[draggedTab];
                      newOrder.splice(draggedTab, 1);
                      newOrder.splice(index, 0, draggedItem);
                      setTabOrder(newOrder);

                      // Save to localStorage
                      localStorage.setItem('chatbot-tab-order', JSON.stringify(newOrder));
                      setDraggedTab(null);
                    }}
                    onClick={() => setActiveTab(tabId)}
                    className="py-2 px-3 border-b-2 font-medium text-sm transition hover:opacity-80 cursor-pointer select-none"
                    style={{
                      borderColor: activeTab === tabId ? 'rgb(169, 189, 203)' : 'transparent',
                      color: activeTab === tabId ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.8)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Drag to reorder tabs"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.badge && tab.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)', color: 'rgb(169, 189, 203)' }}>
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto mr-4 flex items-center text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
              <span>Drag tabs to reorder</span>
            </div>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Bulletin and Today's Count */}
            <div className="rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Today</span>
                      <span className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                        {stats?.todayConversations || 0}
                      </span>
                      <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>conversations</span>
                    </div>
                  </div>
                  <button
                    onClick={fetchStatusBulletin}
                    disabled={bulletinLoading}
                    className="p-2 rounded-lg hover:opacity-80 transition"
                    style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', color: 'rgb(169, 189, 203)' }}
                  >
                    {bulletinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>

                {/* Conversational Update */}
                {bulletinLoading && !statusBulletin ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgb(169, 189, 203)' }} />
                    <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Checking what's happening...</span>
                  </div>
                ) : statusBulletin ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {statusBulletin.priority === 'critical' ? (
                        <AlertCircle className="w-4 h-4" style={{ color: 'rgb(244, 67, 54)' }} />
                      ) : statusBulletin.priority === 'warning' ? (
                        <AlertCircle className="w-4 h-4" style={{ color: 'rgb(255, 193, 7)' }} />
                      ) : (
                        <MessageCircle className="w-4 h-4" style={{ color: 'rgb(76, 175, 80)' }} />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed flex-1"
                       style={{
                         color: statusBulletin.priority === 'critical' ? 'rgb(244, 67, 54)' :
                                statusBulletin.priority === 'warning' ? 'rgb(255, 193, 7)' :
                                'rgb(229, 227, 220)'
                       }}>
                      {statusBulletin.message}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      Click refresh to see what's happening with your chatbot.
                    </p>
                  </div>
                )}
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

            {/* Embed Your Chatbot Section */}
            <div className="rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    Embed Your Chatbot
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
                      <div className="relative">
                        <pre className="p-4 pr-12 rounded-lg text-xs font-mono custom-scrollbar"
                             style={{
                               backgroundColor: 'rgba(48, 54, 54, 0.7)',
                               color: 'rgb(229, 227, 220)',
                               border: '1px solid rgba(169, 189, 203, 0.2)',
                               whiteSpace: 'nowrap',
                               overflowX: 'auto'
                             }}>
{`<script src="https://embed.intelagentstudios.com/v1/chatbot.js" data-product-key="${productKey}"></script>`}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`<script src="https://embed.intelagentstudios.com/v1/chatbot.js" data-product-key="${productKey}"></script>`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-2 rounded hover:opacity-80 transition"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.2)',
                            color: 'rgb(229, 227, 220)'
                          }}
                          title="Copy to clipboard"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
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
                    {/* Domain Filter - Only show if multiple domains */}
                    {stats?.domains && stats.domains.length > 1 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDomainSelector(!showDomainSelector)}
                          className="w-full px-3 py-2 text-sm border rounded-lg flex items-center justify-between"
                          style={{
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            backgroundColor: 'rgba(48, 54, 54, 0.5)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {selectedDomains.includes('all') ? 'All Domains' : `${selectedDomains.length} Domain${selectedDomains.length !== 1 ? 's' : ''}`}
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showDomainSelector && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border shadow-lg"
                               style={{ backgroundColor: 'rgb(48, 54, 54)', borderColor: 'rgba(169, 189, 203, 0.3)' }}>
                            <div className="p-2">
                              <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDomains.includes('all')}
                                  onChange={(e) => {
                                    setSelectedDomains(e.target.checked ? ['all'] : []);
                                    calculateStats(conversations);
                                  }}
                                />
                                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>All Domains</span>
                              </label>
                              {stats.domains.map((domain: string) => (
                                <label key={domain} className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedDomains.includes(domain)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDomains(prev =>
                                          prev.includes('all') ? [domain] : [...prev.filter(d => d !== 'all'), domain]
                                        );
                                      } else {
                                        setSelectedDomains(prev => prev.filter(d => d !== domain));
                                      }
                                      calculateStats(conversations);
                                    }}
                                    disabled={selectedDomains.includes('all')}
                                  />
                                  <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>{domain}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
                        {(dateFilter !== 'all' || topicFilter !== 'all' || selectedProductKey !== 'all' || !selectedDomains.includes('all')) && (
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

                        {/* Domain Multi-Selector */}
                        {stats?.domains && stats.domains.length > 0 && (
                          <div className="relative domain-selector-container">
                            <button
                              onClick={() => setShowDomainSelector(!showDomainSelector)}
                              className="w-full px-3 py-1.5 text-sm border rounded-lg text-left flex items-center justify-between"
                              style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                            >
                              <span className="truncate">
                                {selectedDomains.includes('all')
                                  ? 'All domains'
                                  : selectedDomains.length === 0
                                  ? 'Select domains'
                                  : selectedDomains.length === 1
                                  ? selectedDomains[0]
                                  : `${selectedDomains.length} domains selected`}
                              </span>
                              <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            </button>

                            {showDomainSelector && (
                              <div
                                className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto"
                                style={{ backgroundColor: 'rgb(48, 54, 54)', borderColor: 'rgba(169, 189, 203, 0.3)' }}
                              >
                                <div className="p-2 space-y-1">
                                  <label className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedDomains.includes('all')}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedDomains(['all']);
                                        } else {
                                          setSelectedDomains([]);
                                        }
                                      }}
                                      className="mr-2"
                                    />
                                    <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>All domains</span>
                                  </label>

                                  <div className="border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }} />

                                  {stats.domains.map(domain => (
                                    <label key={domain} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedDomains.includes('all') || selectedDomains.includes(domain)}
                                        onChange={(e) => {
                                          if (selectedDomains.includes('all')) {
                                            setSelectedDomains([domain]);
                                          } else if (e.target.checked) {
                                            setSelectedDomains([...selectedDomains, domain]);
                                          } else {
                                            setSelectedDomains(selectedDomains.filter(d => d !== domain));
                                          }
                                        }}
                                        className="mr-2"
                                      />
                                      <span className="text-sm truncate" style={{ color: 'rgb(229, 227, 220)' }}>{domain}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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
          <div className="max-w-6xl mx-auto">
            {/* Domain Filter - Only show if multiple domains */}
            {stats?.domains && stats.domains.length > 1 && (
              <div className="mb-6">
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowDomainSelector(!showDomainSelector)}
                    className="px-4 py-2 text-sm border rounded-lg flex items-center gap-2"
                    style={{
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  >
                    <Globe className="w-4 h-4" />
                    {selectedDomains.includes('all') ? 'All Domains' : `${selectedDomains.length} Domain${selectedDomains.length !== 1 ? 's' : ''}`}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showDomainSelector && (
                    <div className="absolute z-10 mt-1 min-w-[200px] rounded-lg border shadow-lg"
                         style={{ backgroundColor: 'rgb(48, 54, 54)', borderColor: 'rgba(169, 189, 203, 0.3)' }}>
                      <div className="p-2">
                        <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDomains.includes('all')}
                            onChange={(e) => {
                              setSelectedDomains(e.target.checked ? ['all'] : []);
                            }}
                          />
                          <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>All Domains</span>
                        </label>
                        {stats.domains.map((domain: string) => (
                          <label key={domain} className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDomains.includes(domain)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDomains(prev =>
                                    prev.includes('all') ? [domain] : [...prev.filter(d => d !== 'all'), domain]
                                  );
                                } else {
                                  setSelectedDomains(prev => prev.filter(d => d !== domain));
                                }
                              }}
                              disabled={selectedDomains.includes('all')}
                            />
                            <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>{domain}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="rounded-lg shadow-sm border p-6" 
                   style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    Upload Knowledge Files
                  </h2>
                  <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Upload documents with information about your business
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center"
                       style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                    <input
                      type="file"
                      accept=".txt,.md,.json,.pdf,.doc,.docx,.csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingFile(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('productKey', productKey || siteKey || '');
                          
                          try {
                            const res = await fetch('/api/products/chatbot/knowledge-files', {
                              method: 'POST',
                              body: formData,
                              credentials: 'include'
                            });
                            
                            if (res.ok) {
                              await loadCustomKnowledge();
                              e.target.value = '';
                            } else {
                              alert('Failed to upload file');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            alert('Error uploading file');
                          } finally {
                            setUploadingFile(false);
                          }
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingFile}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        {uploadingFile ? (
                          <Loader2 className="w-12 h-12 mb-3 animate-spin" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                        ) : (
                          <svg className="w-12 h-12 mb-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                        <p className="text-sm mb-1" style={{ color: 'rgb(229, 227, 220)' }}>
                          {uploadingFile ? 'Uploading...' : 'Click to upload files'}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                          Text, Markdown, JSON (PDF support coming soon)
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Uploaded Files List */}
                  {knowledgeFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        Uploaded Files ({knowledgeFiles.length})
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {knowledgeFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded"
                            style={{ 
                              backgroundColor: 'rgba(48, 54, 54, 0.3)',
                              border: '1px solid rgba(169, 189, 203, 0.1)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {file.filename?.endsWith('.pdf') ? (
                                <File className="w-4 h-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              ) : (
                                <FileText className="w-4 h-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              )}
                              <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                                {file.filename.length > 25 ? `${file.filename.substring(0, 25)}...` : file.filename}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${file.filename}"?`)) {
                                  try {
                                    const res = await fetch(`/api/products/chatbot/knowledge-files?id=${file.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include'
                                    });
                                    if (res.ok) {
                                      await loadCustomKnowledge();
                                    }
                                  } catch (error) {
                                    console.error('Delete error:', error);
                                  }
                                }
                              }}
                              className="p-1 rounded hover:opacity-80"
                              style={{ color: 'rgba(169, 189, 203, 0.4)' }}
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Add Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      Quick Add (Optional)
                    </label>
                    <textarea
                      value={customKnowledge}
                      onChange={(e) => setCustomKnowledge(e.target.value)}
                      placeholder="Paste or type quick info here..."
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'rgba(48, 54, 54, 0.5)',
                        border: '1px solid rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        For quick updates without uploading files
                      </p>
                      <button
                        onClick={saveCustomKnowledge}
                        disabled={savingKnowledge || !customKnowledge}
                        className="text-sm px-3 py-1.5 rounded hover:opacity-80 disabled:opacity-50"
                        style={{
                          backgroundColor: 'rgb(169, 189, 203)',
                          color: 'rgb(48, 54, 54)'
                        }}
                      >
                        {savingKnowledge ? 'Saving...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            {/* Knowledge Base Section */}
            <div className="rounded-lg shadow-sm border p-6" 
                 style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  Knowledge Base
                </h2>
                <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  {knowledgeEntries.length} knowledge entr{knowledgeEntries.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
              
              <div className="space-y-3">
                {knowledgeEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                    <p style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      No custom knowledge entries yet
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                      Add quick information using the form above
                    </p>
                  </div>
                ) : (
                  knowledgeEntries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="p-4 rounded-lg"
                      style={{ 
                        backgroundColor: 'rgba(48, 54, 54, 0.3)',
                        border: '1px solid rgba(169, 189, 203, 0.1)'
                      }}
                    >
                      {editingEntry === entry.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: 'rgba(48, 54, 54, 0.5)',
                              border: '1px solid rgba(169, 189, 203, 0.2)',
                              color: 'rgb(229, 227, 220)'
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingEntry(null);
                                setEditingContent('');
                              }}
                              className="px-3 py-1.5 rounded text-sm hover:opacity-80"
                              style={{
                                backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                color: 'rgb(229, 227, 220)'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/products/chatbot/custom-knowledge', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: entry.id,
                                      content: editingContent,
                                      productKey: productKey || siteKey
                                    }),
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    await loadCustomKnowledge();
                                    setEditingEntry(null);
                                    setEditingContent('');
                                  }
                                } catch (error) {
                                  console.error('Update error:', error);
                                }
                              }}
                              className="px-3 py-1.5 rounded text-sm hover:opacity-80"
                              style={{
                                backgroundColor: 'rgb(169, 189, 203)',
                                color: 'rgb(48, 54, 54)'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                   style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                                <FileText className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                                    {(() => {
                                      // Check various document patterns
                                      if (entry.content?.startsWith('Document upload:')) {
                                        return entry.content.split('Document upload:')[1]?.split('\n')[0]?.trim() || 'Document';
                                      } else if (entry.content?.includes('.pdf')) {
                                        // Extract filename if it contains .pdf
                                        const match = entry.content.match(/([^\s\/\\]+\.pdf)/i);
                                        return match ? match[1] : 'PDF Document';
                                      } else if (entry.created_by?.includes('.pdf')) {
                                        // Check if created_by contains a filename
                                        return entry.created_by;
                                      } else if (entry.knowledge_type && entry.knowledge_type !== 'general' && entry.knowledge_type !== 'custom') {
                                        // Use knowledge_type if it's something specific
                                        return entry.knowledge_type;
                                      } else {
                                        return 'Custom Knowledge';
                                      }
                                    })()}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded"
                                        style={{ 
                                          backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                          color: 'rgba(169, 189, 203, 0.8)'
                                        }}>
                                    {entry.content?.includes('.pdf') || entry.created_by?.includes('.pdf') ? 'PDF' : 
                                     entry.content?.includes('.doc') || entry.created_by?.includes('.doc') ? 'Word' :
                                     entry.content?.includes('.txt') || entry.created_by?.includes('.txt') ? 'TXT' :
                                     'Text Entry'}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                                  {entry.content.length > 150 ? `${entry.content.substring(0, 150)}...` : entry.content}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                                  Added {new Date(entry.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingEntry(entry.id);
                                  setEditingContent(entry.content);
                                }}
                                className="p-1.5 rounded hover:opacity-80"
                                style={{ color: 'rgba(169, 189, 203, 0.6)' }}
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this knowledge entry?')) {
                                    try {
                                      const res = await fetch('/api/products/chatbot/custom-knowledge', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          id: entry.id,
                                          productKey: productKey || siteKey
                                        }),
                                        credentials: 'include'
                                      });
                                      if (res.ok) {
                                        await loadCustomKnowledge();
                                      }
                                    } catch (error) {
                                      console.error('Delete error:', error);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded hover:opacity-80"
                                style={{ color: 'rgba(169, 189, 203, 0.6)' }}
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className={`mx-auto space-y-6 transition-all duration-300 ${expandedChart ? 'max-w-7xl' : 'max-w-6xl'}`}>
            {/* Analytics Summary Cards - Hide when chart is expanded */}
            {!expandedChart && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Total Messages</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.totalMessages || 0}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>

              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Unique Sessions</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.uniqueSessions || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
              </div>

              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>This Month</p>
                    <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {stats?.monthConversations || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
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
            </div>
            )}

            {/* Key Insights and Recommendations - Always visible at top */}
            {!expandedChart && (
            <div>
              {/* AI Insights - Full Width */}
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  <Activity className="w-5 h-5" />
                  AI Behavior Insights
                </h3>
                {loadingInsights ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-2 bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-700 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : aiInsights?.takeaways ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiInsights.takeaways.slice(0, 3).map((takeaway: any, idx: number) => {
                      const insight = typeof takeaway === 'string' ? { title: takeaway, explanation: '' } : takeaway;
                      return (
                        <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                          <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                            {insight.title || insight}
                          </p>
                          {insight.explanation && (
                            <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                              {insight.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>Quick Resolution Pattern</p>
                      <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        Most conversations end within 3 messages, indicating users find answers quickly
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>Common Drop-off Point</p>
                      <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        Users often leave after asking about pricing - consider adding a pricing FAQ section
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.3)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>Knowledge Gap: Product Details</p>
                      <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        23% of questions about product features go unanswered - add detailed product documentation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Charts Grid - Hide when chart is expanded */}
            {!expandedChart && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversation Trends Chart */}
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    Conversation Trends
                  </h3>
                  <button
                    onClick={() => setExpandedChart('trends')}
                    className="p-1 rounded hover:bg-gray-700 transition"
                    title="Expand view"
                  >
                    <Maximize2 className="w-4 h-4" style={{ color: 'rgb(169, 189, 203)' }} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 h-48">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const dayConversations = conversations.filter(conv => {
                    const convDate = new Date(conv.first_message_at);
                    return convDate.toDateString() === date.toDateString();
                  }).length;
                  const maxHeight = Math.max(...Array.from({ length: 7 }, (_, j) => {
                    const checkDate = new Date();
                    checkDate.setDate(checkDate.getDate() - (6 - j));
                    return conversations.filter(conv => {
                      const convDate = new Date(conv.first_message_at);
                      return convDate.toDateString() === checkDate.toDateString();
                    }).length;
                  })) || 1;
                  const height = Math.max((dayConversations / maxHeight) * 100, 5);

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="flex-1 flex items-end w-full">
                        <div
                          className="w-full rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${height}%`,
                            backgroundColor: 'rgb(169, 189, 203)',
                            minHeight: '8px'
                          }}
                          title={`${date.toLocaleDateString()}: ${dayConversations} conversations`}
                        />
                      </div>
                      <div className="text-xs mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(58, 64, 64, 0.5)' }}>
                        {dayConversations}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Conversation Topics Chart */}
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    Conversation Topics
                  </h3>
                  <button
                    onClick={() => setExpandedChart('topics')}
                    className="p-1 rounded hover:bg-gray-700 transition"
                    title="Expand view"
                  >
                    <Maximize2 className="w-4 h-4" style={{ color: 'rgb(169, 189, 203)' }} />
                  </button>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const topics: Record<string, number> = {};
                    conversations.forEach(conv => {
                      const topic = extractTopic(conv.messages);
                      if (topic && topic !== 'undefined') {
                        topics[topic] = (topics[topic] || 0) + 1;
                      }
                    });
                    const sortedTopics = Object.entries(topics)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    const maxCount = sortedTopics[0]?.[1] || 1;

                    return sortedTopics.map(([topic, count], index) => (
                      <div key={topic} className="flex items-center gap-2">
                        <span className="text-sm w-24 truncate" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>
                          {topic}
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
                          <div
                            className="h-6 rounded-full transition-all flex items-center justify-end pr-2"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                              backgroundColor: 'rgb(169, 189, 203)'
                            }}
                          >
                            <span className="text-xs font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                  {conversations.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      No conversation topics yet
                    </p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Expanded Chart View - Shows when a chart is expanded */}
            {expandedChart && (
              <div className="rounded-lg border p-6 transition-all duration-300" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {expandedChart === 'trends' ? 'Conversation Trends' : expandedChart === 'topics' ? 'Conversation Topics Analysis' : expandedChart === 'topDomains' ? 'Domain Performance Analysis' : 'Analytics'}
                  </h2>
                  <div className="flex items-center gap-4">
                    {/* Date range selector for trends and topics */}
                    {(expandedChart === 'trends' || expandedChart === 'topics') && (
                      <select
                        value={expandedChart === 'trends' ? trendsDateRange : topicsDateRange}
                        onChange={(e) => {
                          const value = e.target.value as '7d' | '14d' | '30d' | '90d';
                          if (expandedChart === 'trends') {
                            setTrendsDateRange(value);
                          } else {
                            setTopicsDateRange(value);
                          }
                        }}
                        className="px-3 py-1.5 text-sm border rounded-lg"
                        style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                      >
                        <option value="7d">Last 7 Days</option>
                        <option value="14d">Last 14 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                      </select>
                    )}

                    {/* Time period selector */}
                    <select
                      value={compareBy}
                      onChange={(e) => setCompareBy(e.target.value as 'count' | 'percentage' | 'trend')}
                      className="px-3 py-1.5 text-sm border rounded-lg"
                      style={{ borderColor: 'rgba(169, 189, 203, 0.3)', backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}
                    >
                      <option value="count">Last 7 Days</option>
                      <option value="percentage">Last 30 Days</option>
                      <option value="trend">All Time</option>
                    </select>

                    <button
                      onClick={() => setExpandedChart(null)}
                      className="p-2 rounded hover:bg-gray-700 transition"
                      title="Collapse view"
                    >
                      <X className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                    </button>
                  </div>
                </div>

                {/* Expanded Trends View */}
                {expandedChart === 'trends' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 md:grid-cols-14 lg:grid-cols-30 gap-1 h-64">
                      {(() => {
                        const days = trendsDateRange === '7d' ? 7 : trendsDateRange === '14d' ? 14 : trendsDateRange === '30d' ? 30 : 90;
                        return Array.from({ length: Math.min(days, 30) }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (days - 1 - i));
                          const dayConversations = conversations.filter(conv => {
                            const convDate = new Date(conv.first_message_at);
                            return convDate.toDateString() === date.toDateString();
                          }).length;
                          const maxHeight = Math.max(...Array.from({ length: days }, (_, j) => {
                            const checkDate = new Date();
                            checkDate.setDate(checkDate.getDate() - (days - 1 - j));
                            return conversations.filter(conv => {
                              const convDate = new Date(conv.first_message_at);
                              return convDate.toDateString() === checkDate.toDateString();
                            }).length;
                          })) || 1;
                          const height = Math.max((dayConversations / maxHeight) * 100, 5);

                          return (
                            <div key={i} className="flex flex-col items-center">
                              <div className="flex-1 flex items-end w-full">
                                <div
                                  className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                                  style={{
                                    height: `${height}%`,
                                    backgroundColor: 'rgb(169, 189, 203)',
                                    minHeight: '8px'
                                  }}
                                  title={`${date.toLocaleDateString()}: ${dayConversations} conversations`}
                                />
                              </div>
                              {(days <= 14 || i % Math.floor(days / 14) === 0) && (
                                <>
                                  <div className="text-xs mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
                                    {days <= 14 ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                  <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                    {dayConversations}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Expanded Topics View */}
                {expandedChart === 'topics' && (
                  <div className="space-y-4">
                    {(() => {
                      const topics: Record<string, number> = {};
                      const days = topicsDateRange === '7d' ? 7 : topicsDateRange === '14d' ? 14 : topicsDateRange === '30d' ? 30 : 90;
                      const cutoffDate = new Date();
                      cutoffDate.setDate(cutoffDate.getDate() - days);

                      conversations.filter(conv => {
                        const convDate = new Date(conv.first_message_at);
                        return convDate >= cutoffDate;
                      }).forEach(conv => {
                        const topic = extractTopic(conv.messages);
                        if (topic && topic !== 'undefined') {
                          topics[topic] = (topics[topic] || 0) + 1;
                        }
                      });

                      const sortedTopics = Object.entries(topics)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 15);
                      const maxCount = sortedTopics[0]?.[1] || 1;

                      return sortedTopics.map(([topic, count], index) => (
                        <div key={topic} className="flex items-center gap-4">
                          <span className="text-sm w-32 text-right" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>
                            {topic}
                          </span>
                          <div className="flex-1 bg-gray-700 rounded-full h-8 relative">
                            <div
                              className="h-8 rounded-full transition-all flex items-center justify-end pr-3"
                              style={{
                                width: `${(count / maxCount) * 100}%`,
                                backgroundColor: `hsl(${200 - (index * 15)}, 60%, 50%)`
                              }}
                            >
                              <span className="text-sm font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                                {count} ({Math.round((count / conversations.filter(c => new Date(c.first_message_at) >= cutoffDate).length) * 100)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                    {conversations.length === 0 && (
                      <p className="text-center py-8" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        No conversation topics in the selected date range
                      </p>
                    )}
                  </div>
                )}

                {/* Removed dead insights code block */}
                {false && (
                  <div className="space-y-6">
                    {chartViewMode === 'hourly' && ( // Performance View
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Performance Metrics */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Performance Metrics</h3>

                          {/* Resolution Rate Breakdown */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <p className="text-sm font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>Resolution Rate by Category</p>
                            {[
                              { category: 'Product Questions', rate: 82, color: 'rgb(76, 175, 80)' },
                              { category: 'Pricing', rate: 45, color: 'rgb(255, 193, 7)' },
                              { category: 'Technical Support', rate: 71, color: 'rgb(33, 150, 243)' },
                              { category: 'General Inquiries', rate: 93, color: 'rgb(156, 39, 176)' }
                            ].map(item => (
                              <div key={item.category} className="mb-3">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>{item.category}</span>
                                  <span className="text-xs font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{item.rate}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${item.rate}%`, backgroundColor: item.color }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Response Quality Score */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>Response Quality Score</p>
                            <div className="text-3xl font-bold" style={{ color: 'rgb(76, 175, 80)' }}>8.2/10</div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Based on conversation length, resolution rate, and customer re-engagement</p>
                          </div>
                        </div>

                        {/* Engagement Insights */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Engagement Insights</h3>

                          {/* Peak Performance Times */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <p className="text-sm font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>Peak Performance Times</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>Weekday Afternoons (2-5 PM)</span>
                                <span className="text-xs font-medium" style={{ color: 'rgb(76, 175, 80)' }}>Best</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>Weekday Mornings (9-11 AM)</span>
                                <span className="text-xs font-medium" style={{ color: 'rgb(255, 193, 7)' }}>Good</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>Weekends</span>
                                <span className="text-xs font-medium" style={{ color: 'rgb(244, 67, 54)' }}>Low</span>
                              </div>
                            </div>
                          </div>

                          {/* Drop-off Analysis */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <p className="text-sm font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>Common Drop-off Points</p>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>After pricing questions</span>
                                  <span className="text-xs" style={{ color: 'rgb(244, 67, 54)' }}>28% drop</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>Complex technical queries</span>
                                  <span className="text-xs" style={{ color: 'rgb(255, 193, 7)' }}>18% drop</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>After initial greeting</span>
                                  <span className="text-xs" style={{ color: 'rgb(76, 175, 80)' }}>5% drop</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {chartViewMode === 'daily' && ( // Topics View
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Most Common Topics */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <h3 className="text-sm font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>Most Common Topics</h3>
                            <div className="space-y-3">
                              {[
                                { topic: 'Product Features', count: 234, trend: 'up' },
                                { topic: 'Pricing & Plans', count: 189, trend: 'up' },
                                { topic: 'Getting Started', count: 156, trend: 'stable' },
                                { topic: 'Integration Help', count: 123, trend: 'down' },
                                { topic: 'Account Issues', count: 89, trend: 'down' }
                              ].map(item => (
                                <div key={item.topic} className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: 'rgb(229, 227, 220)' }}>{item.topic}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>{item.count}</span>
                                    {item.trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: 'rgb(76, 175, 80)' }} />}
                                    {item.trend === 'down' && <TrendingDown className="w-3 h-3" style={{ color: 'rgb(244, 67, 54)' }} />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Knowledge Gaps */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                            <h3 className="text-sm font-medium mb-3" style={{ color: 'rgb(229, 227, 220)' }}>Knowledge Gaps Identified</h3>
                            <div className="space-y-2">
                              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderLeft: '3px solid rgb(244, 67, 54)' }}>
                                <p className="text-xs font-medium" style={{ color: 'rgb(229, 227, 220)' }}>API Documentation</p>
                                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>43 unresolved queries this week</p>
                              </div>
                              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', borderLeft: '3px solid rgb(255, 193, 7)' }}>
                                <p className="text-xs font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Refund Policy</p>
                                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>31 unresolved queries this week</p>
                              </div>
                              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', borderLeft: '3px solid rgb(255, 193, 7)' }}>
                                <p className="text-xs font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Enterprise Features</p>
                                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>27 unresolved queries this week</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {chartViewMode === 'weekly' && ( // Recommendations View
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {/* Priority Recommendations */}
                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'rgb(244, 67, 54)' }} />
                              <div>
                                <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(229, 227, 220)' }}>High Priority: Improve Pricing Information</h3>
                                <p className="text-xs mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                  55% of pricing-related conversations are unresolved. Customers frequently ask about enterprise pricing, discounts, and billing cycles.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Impact: High</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Effort: Low</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Est. Resolution Rate: +23%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                            <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 mt-0.5" style={{ color: 'rgb(255, 193, 7)' }} />
                              <div>
                                <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(229, 227, 220)' }}>Medium Priority: Add API Examples</h3>
                                <p className="text-xs mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                  Technical users are struggling with API integration. Adding code examples and common use cases could reduce support load.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Impact: Medium</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Effort: Medium</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Est. Resolution Rate: +15%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: 'rgb(76, 175, 80)' }} />
                              <div>
                                <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(229, 227, 220)' }}>Optimization: Enhance Welcome Flow</h3>
                                <p className="text-xs mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                  Your welcome message has a 95% engagement rate. Consider adding quick action buttons for common queries.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Impact: Low</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Effort: Low</span>
                                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)', color: 'rgb(229, 227, 220)' }}>Est. Time Saved: 1.5s/conv</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Top Domains Chart - Only for multi-domain accounts */}
                {expandedChart === 'topDomains' && stats?.domains && stats.domains.length > 1 && (
                  <div className="space-y-4">
                    {stats?.domains?.map((domain, index) => {
                      const domainConversations = conversations.filter(conv => conv.domain === domain).length;
                      const domainMessages = conversations.filter(conv => conv.domain === domain)
                        .reduce((sum, conv) => sum + conv.messages.length, 0);
                      const percentage = stats.totalConversations > 0 ?
                        Math.round((domainConversations / stats.totalConversations) * 100) : 0;

                      return (
                        <div key={domain} className="group hover:bg-gray-700 p-3 rounded transition-colors">
                          <div className="flex items-center mb-2">
                            <div className="flex-1">
                              <span className="text-base font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                                {domain || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                                {domainConversations} conversations
                              </span>
                              <span className="text-xs ml-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-4 rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: `hsl(${(index * 40) % 360}, 60%, 60%)`
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                            <span>{domainMessages} total messages</span>
                            <span>Avg: {domainConversations > 0 ? Math.round(domainMessages / domainConversations) : 0} msgs/conv</span>
                          </div>
                        </div>
                      );
                    }) || []}
                  </div>
                )}
              </div>
            )}

            {/* Top Domains - Only show for multi-domain accounts */}
            {!expandedChart && stats?.domains && stats.domains.length > 1 && (
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    Top Domains by Conversations
                  </h3>
                  <button
                    onClick={() => setExpandedChart('topDomains')}
                    className="p-1 rounded hover:bg-gray-700 transition"
                    title="Expand view"
                  >
                    <Maximize2 className="w-4 h-4" style={{ color: 'rgb(169, 189, 203)' }} />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Show only top 3 domains */}
                  {stats.domains.slice(0, 3).map((domain, index) => {
                    const domainConversations = conversations.filter(conv => conv.domain === domain).length;
                    const percentage = stats.totalConversations > 0 ?
                      Math.round((domainConversations / stats.totalConversations) * 100) : 0;

                    return (
                      <div key={domain} className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
                              {domain || 'Unknown'}
                            </span>
                            <span className="text-sm ml-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: `hsl(${(index * 40) % 360}, 60%, 60%)`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.domains.length > 3 && (
                    <div className="pt-1 text-sm text-center" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      +{stats.domains.length - 3} more domains
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* Customize Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)', border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h2 className="text-xl font-semibold mb-6" style={{ color: 'rgb(229, 227, 220)' }}>
                Customize Your Chatbot
              </h2>
              
              <div className="space-y-6">
                {/* Widget Appearance */}
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                    Widget Appearance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                        Widget Title
                      </label>
                      <input
                        type="text"
                        value={settings.widgetTitle}
                        onChange={(e) => setSettings(prev => ({ ...prev, widgetTitle: e.target.value }))}
                        placeholder="e.g., Chat Assistant, Support, Help"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(48, 54, 54, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                          Theme Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.themeColor}
                            onChange={(e) => setSettings(prev => ({ ...prev, themeColor: e.target.value }))}
                            className="h-12 w-24 rounded cursor-pointer"
                            style={{ border: '2px solid rgba(169, 189, 203, 0.3)' }}
                          />
                          <span style={{ color: 'rgba(229, 227, 220, 0.6)', fontSize: '12px' }}>
                            Header & buttons
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                          Title Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.titleColor}
                            onChange={(e) => setSettings(prev => ({ ...prev, titleColor: e.target.value }))}
                            className="h-12 w-24 rounded cursor-pointer"
                            style={{ border: '2px solid rgba(169, 189, 203, 0.3)' }}
                          />
                          <span style={{ color: 'rgba(229, 227, 220, 0.6)', fontSize: '12px' }}>
                            Title text
                          </span>
                        </div>
                      </div>
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
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.autoReopenOnResponse}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoReopenOnResponse: e.target.checked }))}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'rgb(169, 189, 203)' }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        Auto-reopen widget when AI responds
                      </span>
                    </label>
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

                {/* API Integration Section */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                    API Integration
                  </h3>

                  {/* Integration Help Section */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowIntegrationHelp(!showIntegrationHelp)}
                      className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
                      style={{ color: 'rgb(169, 189, 203)' }}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showIntegrationHelp ? 'rotate-180' : ''}`}
                      />
                      Platform-Specific Integration Instructions
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

                  {/* API Access */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                        Get Conversations
                      </label>
                      <p className="text-xs mb-3" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        Retrieve all chat history and conversations
                      </p>
                      <div className="relative">
                        <pre className="p-4 pr-12 rounded-lg overflow-x-auto text-xs font-mono"
                             style={{
                               backgroundColor: 'rgba(48, 54, 54, 0.7)',
                               color: 'rgb(229, 227, 220)',
                               border: '1px solid rgba(169, 189, 203, 0.2)'
                             }}>
{`GET https://dashboard.intelagentstudios.com/api/chatbot/${productKey}/conversations`}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://dashboard.intelagentstudios.com/api/chatbot/${productKey}/conversations`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-2 rounded hover:opacity-80 transition"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.2)',
                            color: 'rgb(229, 227, 220)'
                          }}
                          title="Copy to clipboard"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                        Update Knowledge Base
                      </label>
                      <p className="text-xs mb-3" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        Add or update custom knowledge programmatically
                      </p>
                      <div className="relative">
                        <pre className="p-4 pr-12 rounded-lg overflow-x-auto text-xs font-mono"
                             style={{
                               backgroundColor: 'rgba(48, 54, 54, 0.7)',
                               color: 'rgb(229, 227, 220)',
                               border: '1px solid rgba(169, 189, 203, 0.2)'
                             }}>
{`POST https://dashboard.intelagentstudios.com/api/chatbot/${productKey}/knowledge
Content-Type: application/json

{
  "content": "Your custom knowledge here",
  "knowledge_type": "general"
}`}
                        </pre>
                        <button
                          onClick={() => {
                            const apiCall = `POST https://dashboard.intelagentstudios.com/api/chatbot/${productKey}/knowledge\nContent-Type: application/json\n\n{\n  "content": "Your custom knowledge here",\n  "knowledge_type": "general"\n}`;
                            navigator.clipboard.writeText(apiCall);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-2 rounded hover:opacity-80 transition"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.2)',
                            color: 'rgb(229, 227, 220)'
                          }}
                          title="Copy to clipboard"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
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
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </>
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