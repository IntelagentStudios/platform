'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, AlertCircle, TrendingUp, Database,
  Zap, Clock, Server, ArrowRight, RefreshCw,
  Shield, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

interface Execution {
  id: string;
  execution_type: string;
  execution_name: string;
  status: string;
  started_at: string;
  duration_ms?: number;
  tokens_used?: number;
  execution_events?: any[];
}

interface DataFlow {
  id: string;
  source_service: string;
  target_service: string;
  data_type: string;
  data_size_bytes?: number;
  contains_pii: boolean;
  transferred_at: string;
}

export default function MonitoringDashboard() {
  const [runningExecutions, setRunningExecutions] = useState<Execution[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [stats, setStats] = useState<any>({});
  const [errorRates, setErrorRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRealtimeData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchRealtimeData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/monitoring/realtime');
      const data = await response.json();
      
      setRunningExecutions(data.running_executions || []);
      setDataFlows(data.recent_data_flows || []);
      setStats(data.hourly_stats || {});
      setErrorRates(data.error_rates || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case 'user_input':
        return 'bg-blue-100 text-blue-800';
      case 'llm_prompt':
      case 'llm_response':
        return 'bg-purple-100 text-purple-800';
      case 'api_response':
        return 'bg-green-100 text-green-800';
      case 'db_query':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Execution Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time tracking of all executions and data flows
          </p>
        </div>
        
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-lg flex items-center ${
            autoRefresh 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
          {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Executions</p>
              <p className="text-2xl font-bold mt-1">{runningExecutions.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Flows (5m)</p>
              <p className="text-2xl font-bold mt-1">{dataFlows.length}</p>
            </div>
            <Database className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Error Rate</p>
              <p className="text-2xl font-bold mt-1">
                {errorRates.length > 0 
                  ? `${(errorRates.reduce((acc, r) => acc + parseFloat(r.error_rate), 0) / errorRates.length).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Processed</p>
              <p className="text-2xl font-bold mt-1">
                {formatBytes(dataFlows.reduce((acc, f) => acc + (f.data_size_bytes || 0), 0))}
              </p>
            </div>
            <Server className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Running Executions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Running Executions
            </h2>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {runningExecutions.length > 0 ? (
              <div className="space-y-3">
                {runningExecutions.map(execution => (
                  <div
                    key={execution.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {getStatusIcon(execution.status)}
                        <span className="ml-2 font-medium text-sm">
                          {execution.execution_name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDuration(Date.now() - new Date(execution.started_at).getTime())}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {execution.execution_type}
                      </span>
                      {execution.tokens_used && (
                        <span className="ml-2">
                          {execution.tokens_used} tokens
                        </span>
                      )}
                    </div>

                    {execution.execution_events && execution.execution_events.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Latest: {execution.execution_events[0].event_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No running executions</p>
            )}
          </div>
        </div>

        {/* Data Flows */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-500" />
              Recent Data Flows
            </h2>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {dataFlows.length > 0 ? (
              <div className="space-y-2">
                {dataFlows.slice(0, 10).map(flow => (
                  <div
                    key={flow.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-xs font-medium">
                        {flow.source_service}
                      </span>
                      <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                      <span className="text-xs font-medium">
                        {flow.target_service}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getDataTypeColor(flow.data_type)}`}>
                        {flow.data_type}
                      </span>
                      
                      {flow.contains_pii && (
                        <span title="Contains PII">
                          <Shield className="h-3 w-3 text-orange-500" />
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        {formatBytes(flow.data_size_bytes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent data flows</p>
            )}
          </div>
        </div>

        {/* Error Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Error Rates by Type
            </h2>
          </div>
          
          <div className="p-6">
            {errorRates.length > 0 ? (
              <div className="space-y-3">
                {errorRates.map(rate => (
                  <div key={rate.execution_type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{rate.execution_type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(rate.error_rate) > 10 ? 'bg-red-500' :
                            parseFloat(rate.error_rate) > 5 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${100 - parseFloat(rate.error_rate)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rate.error_rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No execution data available</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              System Performance
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-xl font-bold mt-1">
                  {stats[0]?.avg_duration ? formatDuration(stats[0].avg_duration) : '0ms'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total API Calls</p>
                <p className="text-xl font-bold mt-1">
                  {stats[0]?.total_api_calls || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Tokens Used</p>
                <p className="text-xl font-bold mt-1">
                  {stats[0]?.total_tokens || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-xl font-bold mt-1">
                  {errorRates.length > 0 
                    ? `${(100 - errorRates.reduce((acc, r) => acc + parseFloat(r.error_rate), 0) / errorRates.length).toFixed(1)}%`
                    : '100%'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}