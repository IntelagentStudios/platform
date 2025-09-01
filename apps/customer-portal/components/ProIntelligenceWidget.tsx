'use client';

import { useState, useEffect } from 'react';
import { Brain, X, ChevronUp, Sparkles, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  relevance: number;
  action?: {
    label: string;
    href: string;
  };
}

interface ProIntelligenceWidgetProps {
  userId?: string;
  tenantId?: string;
}

export function ProIntelligenceWidget({ userId, tenantId }: ProIntelligenceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const pathname = usePathname();

  // Fetch context-aware insights based on current page
  useEffect(() => {
    fetchPageInsights();
  }, [pathname]);

  const fetchPageInsights = async () => {
    setLoading(true);
    try {
      // Mock insights for now - will connect to real API
      const mockInsights: Insight[] = [];
      
      // Context-aware insights based on current page
      if (pathname.includes('chatbot')) {
        mockInsights.push({
          id: '1',
          type: 'success',
          title: 'Chatbot Performance',
          message: 'Your chatbot prevented 45 support tickets this week, saving approximately $1,350',
          relevance: 0.95
        });
        mockInsights.push({
          id: '2',
          type: 'tip',
          title: 'Optimization Available',
          message: 'Enable sentiment analysis to improve response accuracy by 23%',
          relevance: 0.85,
          action: {
            label: 'Enable Now',
            href: '/dashboard/products/chatbot/settings'
          }
        });
      } else if (pathname.includes('sales')) {
        mockInsights.push({
          id: '3',
          type: 'info',
          title: 'Lead Quality Insight',
          message: 'Enriched leads show 3x higher conversion rate than standard leads',
          relevance: 0.9
        });
      } else if (pathname.includes('analytics')) {
        mockInsights.push({
          id: '4',
          type: 'warning',
          title: 'Usage Spike Detected',
          message: 'API usage up 67% this week. You may exceed your limit in 5 days.',
          relevance: 0.98,
          action: {
            label: 'Upgrade Plan',
            href: '/dashboard/settings/billing'
          }
        });
      }
      
      // General insights always available
      mockInsights.push({
        id: '5',
        type: 'info',
        title: 'Pro Tip',
        message: 'Ask me anything about this page or your data using natural language',
        relevance: 0.7
      });
      
      setInsights(mockInsights.sort((a, b) => b.relevance - a.relevance));
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    // TODO: Send question to Pro Intelligence API
    console.log('Question asked:', question, 'on page:', pathname);
    
    // Mock response
    const response: Insight = {
      id: Date.now().toString(),
      type: 'info',
      title: 'Answer',
      message: `Based on your current page context, here's what I found about "${question}"...`,
      relevance: 1
    };
    
    setInsights([response, ...insights]);
    setQuestion('');
  };

  const getIconForType = (type: Insight['type']) => {
    switch (type) {
      case 'tip':
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'info':
      default:
        return <Brain className="h-4 w-4 text-blue-500" />;
    }
  };

  // Don't render for non-Pro users (will check subscription later)
  // For now, always render for development
  
  return (
    <>
      {/* Floating Button - Always Visible */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            aria-label="Open Pro Intelligence"
          >
            <Brain className="h-6 w-6" />
            {insights.length > 0 && !isMinimized && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {insights.length}
              </span>
            )}
            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Pro Intelligence Assistant
            </span>
          </button>
        )}
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6 md:bottom-10 md:right-10'} z-50 transition-all duration-300`}>
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
            isMinimized ? 'w-64' : 'w-96 max-h-[600px]'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span className="font-semibold">Pro Intelligence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="hover:bg-white/20 rounded p-1 transition-colors"
                    aria-label={isMinimized ? "Expand" : "Minimize"}
                  >
                    <ChevronUp className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="hover:bg-white/20 rounded p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {!isMinimized && (
                <div className="mt-2 text-sm opacity-90">
                  Context: {pathname}
                </div>
              )}
            </div>

            {!isMinimized && (
              <>
                {/* Ask Question Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                      placeholder="Ask about this page..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      onClick={handleAskQuestion}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Insights List */}
                <div className="overflow-y-auto max-h-[350px] p-4 space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Analyzing your data...</p>
                    </div>
                  ) : insights.length > 0 ? (
                    insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">{getIconForType(insight.type)}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {insight.message}
                            </p>
                            {insight.action && (
                              <a
                                href={insight.action.href}
                                className="inline-block mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
                              >
                                {insight.action.label} →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No insights available for this page yet.</p>
                      <p className="text-xs mt-1">Try asking a question above!</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href="/dashboard/pro-intelligence"
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Open Full Pro Intelligence Dashboard →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}