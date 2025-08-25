'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  Calendar,
  Globe,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react';

export default function ChatbotConversationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [domainFilter, setDomainFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/simple')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (!data.authenticated) {
          window.location.href = '/login';
        } else {
          fetchConversations();
        }
      });
  }, []);

  // Auto-refresh conversations
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchConversations(false); // Don't show loading spinner for auto-refresh
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/products/chatbot/conversations');
      const data = await response.json();
      
      // Check if there are new conversations
      const hasNewConversations = data.conversations && 
        data.conversations.length > conversations.length;
      
      setConversations(data.conversations || []);
      setStats(data.stats);
      setLastRefresh(new Date());
      
      // If a conversation is selected, update it with fresh data
      if (selectedConversation) {
        const updated = data.conversations?.find((c: any) => c.id === selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
        }
      } else if (data.conversations && data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
      
      // Show notification for new conversations
      if (hasNewConversations && !showLoading) {
        // Could add a toast notification here
        console.log('New conversation received!');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = conv.messages?.some((msg: any) => 
        msg.content?.toLowerCase().includes(query)
      ) || 
      conv.domain?.toLowerCase().includes(query) ||
      conv.session_id?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Date filter
    if (dateFilter !== 'all' && conv.first_message_at) {
      const convDate = new Date(conv.first_message_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (convDate < today) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (convDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (convDate < monthAgo) return false;
          break;
      }
    }
    
    // Domain filter
    if (domainFilter !== 'all' && conv.domain !== domainFilter) {
      return false;
    }
    
    // Intent filter
    if (intentFilter !== 'all') {
      const hasIntent = conv.messages?.some((msg: any) => 
        msg.intent === intentFilter
      );
      if (!hasIntent) return false;
    }
    
    return true;
  });
  
  // Get unique domains and intents for filter dropdowns
  const uniqueDomains = [...new Set(conversations.map(c => c.domain).filter(Boolean))];
  const uniqueIntents = [...new Set(
    conversations.flatMap(c => 
      c.messages?.map((m: any) => m.intent).filter(Boolean) || []
    )
  )];

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/products/manage')}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Conversations
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                View and analyze customer interactions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: 'rgb(169, 189, 203)' }}
                />
                <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                  Auto-refresh
                </span>
              </label>
              {autoRefresh && (
                <span className="text-xs px-2 py-1 rounded" 
                      style={{ 
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        color: 'rgb(76, 175, 80)'
                      }}>
                  Live
                </span>
              )}
            </div>
            <button
              onClick={() => fetchConversations()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.2)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="px-8 py-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <span style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                {stats.total_conversations} Conversations
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <span style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                {stats.unique_sessions} Unique Sessions
              </span>
            </div>
            {stats.domains && stats.domains.length > 0 && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                <span style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                  {stats.domains.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="w-1/3 border-r" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          {/* Search and Filters */}
          <div className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                        style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                <input
                  type="text"
                  placeholder="Search by message, session ID, or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  </button>
                )}
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 mt-3 text-sm transition hover:opacity-80"
                style={{ color: 'rgb(169, 189, 203)' }}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                {(dateFilter !== 'all' || domainFilter !== 'all' || intentFilter !== 'all') && (
                  <span className="px-2 py-0.5 rounded text-xs" 
                        style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}>
                    Active
                  </span>
                )}
              </button>
              
              {/* Filter Options */}
              {showFilters && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded text-sm"
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
                  </div>
                  
                  {uniqueDomains.length > 0 && (
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        Domain
                      </label>
                      <select
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                        className="w-full px-3 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: 'rgba(58, 64, 64, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <option value="all">All Domains</option>
                        {uniqueDomains.map(domain => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {uniqueIntents.length > 0 && (
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        Intent
                      </label>
                      <select
                        value={intentFilter}
                        onChange={(e) => setIntentFilter(e.target.value)}
                        className="w-full px-3 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: 'rgba(58, 64, 64, 0.5)',
                          border: '1px solid rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <option value="all">All Intents</option>
                        {uniqueIntents.map(intent => (
                          <option key={intent} value={intent}>{intent}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {(dateFilter !== 'all' || domainFilter !== 'all' || intentFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setDateFilter('all');
                        setDomainFilter('all');
                        setIntentFilter('all');
                      }}
                      className="text-xs transition hover:opacity-80"
                      style={{ color: 'rgb(169, 189, 203)' }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conversations */}
          <div className="overflow-y-auto" style={{ height: showFilters ? 'calc(100% - 280px)' : 'calc(100% - 120px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2" 
                     style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" 
                               style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  {searchQuery || dateFilter !== 'all' || domainFilter !== 'all' || intentFilter !== 'all' 
                    ? 'No conversations match your filters' 
                    : 'No conversations found'}
                </p>
                {(searchQuery || dateFilter !== 'all' || domainFilter !== 'all' || intentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDateFilter('all');
                      setDomainFilter('all');
                      setIntentFilter('all');
                    }}
                    className="mt-2 text-xs transition hover:opacity-80"
                    style={{ color: 'rgb(169, 189, 203)' }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredConversations.length < conversations.length && (
                  <div className="px-4 py-2 text-xs border-b" 
                       style={{ 
                         backgroundColor: 'rgba(169, 189, 203, 0.05)',
                         borderColor: 'rgba(169, 189, 203, 0.1)',
                         color: 'rgba(169, 189, 203, 0.8)'
                       }}>
                    Showing {filteredConversations.length} of {conversations.length} conversations
                  </div>
                )}
                {
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className="p-4 border-b cursor-pointer transition-colors hover:bg-opacity-50"
                  style={{ 
                    borderColor: 'rgba(169, 189, 203, 0.1)',
                    backgroundColor: selectedConversation?.id === conv.id ? 
                      'rgba(169, 189, 203, 0.05)' : 'transparent'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                      {conv.session_id?.slice(0, 8) || 'Unknown'}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  {conv.messages && conv.messages.length > 0 && (
                    <p className="text-sm truncate" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      {conv.messages[0].content}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                      {conv.messages?.length || 0} messages
                    </span>
                    {conv.domain && (
                      <>
                        <span style={{ color: 'rgba(169, 189, 203, 0.3)' }}>•</span>
                        <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                          {conv.domain}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>

        {/* Conversation Details */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      Session: {selectedConversation.session_id?.slice(0, 12) || 'Unknown'}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1 text-xs" 
                         style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(selectedConversation.first_message_at)}</span>
                      </span>
                      {selectedConversation.domain && (
                        <span className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{selectedConversation.domain}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((message: any, idx: number) => (
                    <div key={idx} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-2xl ${message.role === 'assistant' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-start space-x-2">
                          {message.role === 'assistant' && (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                              <Bot className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                            </div>
                          )}
                          <div>
                            <div 
                              className="p-3 rounded-lg"
                              style={{ 
                                backgroundColor: message.role === 'assistant' ? 
                                  'rgba(58, 64, 64, 0.5)' : 'rgba(169, 189, 203, 0.1)',
                                border: '1px solid rgba(169, 189, 203, 0.15)'
                              }}
                            >
                              <p className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
                                {message.content}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                                {formatTime(message.timestamp)}
                              </span>
                              {message.intent && (
                                <span className="text-xs px-2 py-0.5 rounded" 
                                      style={{ 
                                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                        color: 'rgba(169, 189, 203, 0.8)'
                                      }}>
                                  Intent: {message.intent}
                                </span>
                              )}
                            </div>
                          </div>
                          {message.role !== 'assistant' && (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                              <User className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      No messages in this conversation
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3" 
                               style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  Select a conversation to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}