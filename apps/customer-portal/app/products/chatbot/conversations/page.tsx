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
  RefreshCw
} from 'lucide-react';

export default function ChatbotConversationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/chatbot/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
      setStats(data.stats);
      if (data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
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
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.messages.some((msg: any) => 
      msg.content.toLowerCase().includes(query)
    ) || conv.domain?.toLowerCase().includes(query);
  });

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
          <button
            onClick={fetchConversations}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
            style={{ 
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              color: 'rgb(169, 189, 203)'
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
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
          {/* Search */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                      style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.2)',
                  color: 'rgb(229, 227, 220)'
                }}
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
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
                  No conversations found
                </p>
              </div>
            ) : (
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
              ))
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