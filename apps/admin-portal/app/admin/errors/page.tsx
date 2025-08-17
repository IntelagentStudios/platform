'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bug,
  Globe,
  Database,
  Server,
  Zap,
  Clock,
  User,
  Hash,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ErrorEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  service: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  resolved: boolean;
  assignedTo?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

interface ErrorStats {
  total: number;
  critical: number;
  warnings: number;
  resolved: number;
  trend: 'up' | 'down' | 'stable';
  byService: Record<string, number>;
  byType: Record<string, number>;
  recentErrors: ErrorEntry[];
}

export default function ErrorManagementPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({
    level: 'all',
    service: 'all',
    resolved: 'unresolved',
    timeRange: '24h',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchErrors();
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchErrors();
        fetchStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [filter, autoRefresh]);

  const fetchErrors = async () => {
    try {
      const params = new URLSearchParams(filter as any);
      const response = await fetch(`/api/admin/errors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/errors/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
    }
  };

  const handleResolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/admin/errors/${errorId}/resolve`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchErrors();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  const handleAssignError = async (errorId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/errors/${errorId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        fetchErrors();
      }
    } catch (error) {
      console.error('Failed to assign error:', error);
    }
  };

  const toggleErrorExpanded = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (service: string) => {
    const icons: Record<string, JSX.Element> = {
      'admin-portal': <Server className="w-4 h-4" />,
      'customer-portal': <Globe className="w-4 h-4" />,
      'database': <Database className="w-4 h-4" />,
      'queue': <Zap className="w-4 h-4" />,
      'api': <Globe className="w-4 h-4" />,
    };
    return icons[service] || <Server className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Error & Fault Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track, analyze, and resolve system errors
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Auto-refresh
            </label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={() => {
              fetchErrors();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* Error Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total || 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {stats?.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : stats?.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            </div>
            <Bug className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.critical || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Immediate attention</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.warnings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Need review</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.resolved || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">This period</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search errors..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <select
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filter.service}
            onChange={(e) => setFilter({ ...filter, service: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Services</option>
            <option value="admin-portal">Admin Portal</option>
            <option value="customer-portal">Customer Portal</option>
            <option value="chatbot">Chatbot</option>
            <option value="sales-agent">Sales Agent</option>
            <option value="enrichment">Enrichment</option>
          </select>

          <select
            value={filter.resolved}
            onChange={(e) => setFilter({ ...filter, resolved: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filter.timeRange}
            onChange={(e) => setFilter({ ...filter, timeRange: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </Card>

      {/* Error List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Error Log</h2>
        
        <div className="space-y-3">
          {errors.map((error) => (
            <div
              key={error.id}
              className={`border rounded-lg p-4 ${
                error.resolved 
                  ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                  : 'border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleErrorExpanded(error.id)}
                    className="mt-1"
                  >
                    {expandedErrors.has(error.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {getLevelIcon(error.level)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getLevelColor(error.level)}`}>
                        {error.level}
                      </span>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getServiceIcon(error.service)}
                        <span>{error.service}</span>
                      </div>
                      
                      {error.count > 1 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {error.count}x
                        </span>
                      )}
                      
                      {error.resolved && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Resolved
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {error.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(error.timestamp).toLocaleString()}
                      </div>
                      
                      {error.userId && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {error.userId}
                        </div>
                      )}
                      
                      {error.url && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {error.method} {error.url}
                        </div>
                      )}
                    </div>
                    
                    {expandedErrors.has(error.id) && (
                      <div className="mt-4 space-y-3">
                        {error.stack && (
                          <div>
                            <label className="text-xs text-gray-500">Stack Trace</label>
                            <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        
                        {error.metadata && (
                          <div>
                            <label className="text-xs text-gray-500">Metadata</label>
                            <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                              {JSON.stringify(error.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">First seen:</span>
                            <span className="ml-1">{new Date(error.firstOccurrence).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Last seen:</span>
                            <span className="ml-1">{new Date(error.lastOccurrence).toLocaleString()}</span>
                          </div>
                          {error.ip && (
                            <div>
                              <span className="text-gray-500">IP:</span>
                              <span className="ml-1">{error.ip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!error.resolved && (
                    <button
                      onClick={() => handleResolveError(error.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedError(error)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Error by Service Chart */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Errors by Service</h3>
            <div className="space-y-3">
              {Object.entries(stats.byService).map(([service, count]) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(service)}
                    <span className="text-sm">{service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Error Types</h3>
            <div className="space-y-3">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}