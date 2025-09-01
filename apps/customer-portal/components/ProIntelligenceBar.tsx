'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, TrendingUp, AlertCircle, 
  LightbulbIcon, ArrowRight, X, ChevronDown,
  Activity, DollarSign, Shield, Database
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info' | 'metric';
  title: string;
  message: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  relevance: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ProIntelligenceBar() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    generateContextualInsights();
  }, [pathname]);

  const generateContextualInsights = () => {
    const contextInsights: Insight[] = [];
    
    // Always show key metrics
    contextInsights.push({
      id: 'metric-1',
      type: 'metric',
      title: 'Platform Health',
      message: 'All systems operational',
      value: '99.9%',
      trend: 'stable',
      relevance: 0.9
    });

    // Context-specific insights
    if (pathname.includes('chatbot')) {
      contextInsights.push({
        id: 'chatbot-1',
        type: 'success',
        title: 'Ticket Deflection',
        message: '45 support tickets prevented this week',
        value: '$1,350',
        trend: 'up',
        relevance: 0.95
      });
      contextInsights.push({
        id: 'chatbot-2',
        type: 'tip',
        title: 'Response Time',
        message: 'Average response time can be improved by 23% with caching',
        relevance: 0.8,
        action: {
          label: 'Optimize',
          onClick: () => console.log('Optimize chatbot')
        }
      });
    }

    if (pathname.includes('sales')) {
      contextInsights.push({
        id: 'sales-1',
        type: 'metric',
        title: 'Lead Quality',
        message: 'Enriched leads converting 3x better',
        value: '68%',
        trend: 'up',
        relevance: 0.9
      });
    }

    if (pathname.includes('admin')) {
      contextInsights.push({
        id: 'admin-1',
        type: 'info',
        title: 'Skills Performance',
        message: '125 skills running smoothly',
        value: '2.3M',
        relevance: 0.7
      });
      contextInsights.push({
        id: 'admin-2',
        type: 'warning',
        title: 'Resource Usage',
        message: 'Database storage approaching 80% capacity',
        relevance: 0.85,
        action: {
          label: 'View Details',
          onClick: () => console.log('View storage')
        }
      });
    }

    setInsights(contextInsights);
  };

  const getIconForType = (type: Insight['type']) => {
    switch (type) {
      case 'tip':
        return <LightbulbIcon className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'metric':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'info':
      default:
        return <Sparkles className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return <Activity className="h-3 w-3 text-gray-400" />;
  };

  return (
    <>
      {/* Slim Intelligence Bar - Always visible at top of content area */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b border-purple-100 dark:border-gray-700">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Pro Intelligence Badge */}
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Pro Intelligence
                </span>
              </div>

              {/* Inline Insights */}
              <div className="flex items-center space-x-4">
                {insights.slice(0, 3).map((insight) => (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedInsight(insight)}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 hover:shadow-md transition-all group"
                  >
                    {getIconForType(insight.type)}
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {insight.title}
                    </span>
                    {insight.value && (
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {insight.value}
                      </span>
                    )}
                    {getTrendIcon(insight.trend)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {insights.length > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center space-x-1"
                >
                  <span>{isExpanded ? 'Hide' : 'Show'} All ({insights.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
              <a
                href="/dashboard/pro-intelligence"
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center space-x-1"
              >
                <span>Full Dashboard</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Expanded View */}
          {isExpanded && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {insights.slice(3).map((insight) => (
                <button
                  key={insight.id}
                  onClick={() => setSelectedInsight(insight)}
                  className="flex items-start space-x-2 p-3 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-all text-left"
                >
                  <div className="mt-0.5">{getIconForType(insight.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {insight.message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getIconForType(selectedInsight.type)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedInsight.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedInsight.message}
            </p>
            
            {selectedInsight.value && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Value Impact</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedInsight.value}
                  </span>
                  {getTrendIcon(selectedInsight.trend)}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInsight(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
              >
                Dismiss
              </button>
              {selectedInsight.action && (
                <button
                  onClick={() => {
                    selectedInsight.action?.onClick();
                    setSelectedInsight(null);
                  }}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {selectedInsight.action.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}