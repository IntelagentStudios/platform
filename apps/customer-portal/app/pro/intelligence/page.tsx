'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Lightbulb,
  Zap, DollarSign, Shield, Clock, RefreshCw,
  ChevronRight, Activity, CheckCircle, XCircle,
  Info, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'prediction' | 'recommendation' | 'anomaly' | 'optimization';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number;
  data?: any;
  actions?: Array<{
    id: string;
    label: string;
    type: string;
    params?: any;
  }>;
}

export default function ProIntelligenceDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState('general');
  const [timeRange, setTimeRange] = useState('24h');
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    fetchInsights();
  }, [context, timeRange]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/intelligence/insights?context=${context}&timeRange=${timeRange}&recommendations=true&predictions=true`
      );
      const data = await response.json();
      setInsights(data.insights || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (insightId: string, actionId: string) => {
    setExecutingAction(actionId);
    try {
      const response = await fetch('/api/intelligence/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, actionId })
      });
      const result = await response.json();
      
      if (result.success) {
        // Refresh insights after action
        await fetchInsights();
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecutingAction(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'anomaly':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'optimization':
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pro Intelligence
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered insights and recommendations
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchInsights}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Context:
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
            >
              <option value="general">General</option>
              <option value="performance">Performance</option>
              <option value="cost">Cost</option>
              <option value="errors">Errors</option>
              <option value="security">Security</option>
              <option value="usage">Usage</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-4 ml-auto">
            {summary.critical > 0 && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{summary.critical} Critical</span>
              </div>
            )}
            {summary.warnings > 0 && (
              <div className="flex items-center text-yellow-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{summary.warnings} Warnings</span>
              </div>
            )}
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{summary.recommendations || 0} Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      {getTypeIcon(insight.type)}
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {insight.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          {getSeverityIcon(insight.severity)}
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Confidence Indicator */}
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {insight.description}
                  </p>

                  {/* Data Display */}
                  {insight.data && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(insight.data).slice(0, 4).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <span className="text-gray-500 dark:text-gray-400">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {typeof value === 'number' && key.includes('cost') 
                                ? `$${value.toFixed(2)}`
                                : typeof value === 'number' 
                                  ? value.toFixed(2)
                                  : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {insight.actions && insight.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => executeAction(insight.id, action.id)}
                          disabled={executingAction === action.id}
                          className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                            executingAction === action.id
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {executingAction === action.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              {action.label}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No insights available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI Intelligence will provide insights as more data becomes available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}