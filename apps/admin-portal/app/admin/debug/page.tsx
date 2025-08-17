'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Terminal,
  Database,
  Globe,
  Play,
  Copy,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Code,
  FileJson,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Eye,
  Settings,
  Save,
  Trash2
} from 'lucide-react';

interface SQLQuery {
  id: string;
  name: string;
  query: string;
  description?: string;
  saved: boolean;
}

interface APIRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  saved: boolean;
  name?: string;
}

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  status: 'success' | 'error' | 'running';
}

interface EventLog {
  id: string;
  type: string;
  source: string;
  message: string;
  data?: any;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
}

export default function DebugToolsPage() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'database' | 'api' | 'events' | 'cache'>('terminal');
  
  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Database state
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [savedQueries, setSavedQueries] = useState<SQLQuery[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tables, setTables] = useState<string[]>([]);
  
  // API state
  const [apiRequest, setApiRequest] = useState<APIRequest>({
    id: '1',
    method: 'GET',
    url: '/api/health',
    headers: { 'Content-Type': 'application/json' },
    saved: false
  });
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [savedRequests, setSavedRequests] = useState<APIRequest[]>([]);
  
  // Events state
  const [events, setEvents] = useState<EventLog[]>([]);
  const [eventFilter, setEventFilter] = useState({ type: 'all', level: 'all' });
  const [wsConnected, setWsConnected] = useState(false);
  
  // Cache state
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [selectedCacheKey, setSelectedCacheKey] = useState('');
  const [cacheValue, setCacheValue] = useState<any>(null);

  useEffect(() => {
    fetchTables();
    fetchCacheKeys();
    connectWebSocket();
    loadSavedItems();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/admin/debug/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const fetchCacheKeys = async () => {
    try {
      const response = await fetch('/api/admin/debug/cache/keys');
      if (response.ok) {
        const data = await response.json();
        setCacheKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache keys:', error);
    }
  };

  const connectWebSocket = () => {
    // Connect to WebSocket for real-time events
    // Implementation depends on your WebSocket setup
    setWsConnected(true);
  };

  const loadSavedItems = () => {
    // Load saved queries and requests from localStorage
    const queries = localStorage.getItem('savedQueries');
    const requests = localStorage.getItem('savedRequests');
    
    if (queries) setSavedQueries(JSON.parse(queries));
    if (requests) setSavedRequests(JSON.parse(requests));
  };

  const executeCommand = async () => {
    if (!currentCommand.trim()) return;

    const command: TerminalCommand = {
      id: Date.now().toString(),
      command: currentCommand,
      output: '',
      timestamp: new Date().toISOString(),
      status: 'running'
    };

    setTerminalHistory(prev => [...prev, command]);
    setCurrentCommand('');

    try {
      const response = await fetch('/api/admin/debug/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: currentCommand })
      });

      const data = await response.json();
      
      setTerminalHistory(prev => 
        prev.map(cmd => 
          cmd.id === command.id 
            ? { ...cmd, output: data.output, status: response.ok ? 'success' : 'error' }
            : cmd
        )
      );
    } catch (error) {
      setTerminalHistory(prev => 
        prev.map(cmd => 
          cmd.id === command.id 
            ? { ...cmd, output: error instanceof Error ? error.message : 'An error occurred', status: 'error' }
            : cmd
        )
      );
    }

    // Scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;

    try {
      const response = await fetch('/api/admin/debug/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });

      if (response.ok) {
        const data = await response.json();
        setQueryResults(data);
      } else {
        setQueryResults({ error: 'Query failed' });
      }
    } catch (error) {
      setQueryResults({ error: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  const executeApiRequest = async () => {
    try {
      const response = await fetch('/api/admin/debug/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequest)
      });

      const data = await response.json();
      setApiResponse({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setApiResponse({
        error: error instanceof Error ? error.message : 'An error occurred',
        timestamp: new Date().toISOString()
      });
    }
  };

  const getCacheValue = async (key: string) => {
    try {
      const response = await fetch(`/api/admin/debug/cache/${encodeURIComponent(key)}`);
      if (response.ok) {
        const data = await response.json();
        setCacheValue(data);
        setSelectedCacheKey(key);
      }
    } catch (error) {
      console.error('Failed to fetch cache value:', error);
    }
  };

  const clearCache = async (key?: string) => {
    try {
      const url = key 
        ? `/api/admin/debug/cache/${encodeURIComponent(key)}`
        : '/api/admin/debug/cache';
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (response.ok) {
        fetchCacheKeys();
        if (key === selectedCacheKey) {
          setCacheValue(null);
          setSelectedCacheKey('');
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Debug Tools
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Advanced debugging and development tools
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'terminal', label: 'Terminal', icon: Terminal },
          { id: 'database', label: 'Database', icon: Database },
          { id: 'api', label: 'API Playground', icon: Globe },
          { id: 'events', label: 'Event Stream', icon: Zap },
          { id: 'cache', label: 'Cache Inspector', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Terminal Tab */}
      {activeTab === 'terminal' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Terminal</h2>
            <button
              onClick={() => setTerminalHistory([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          
          <div
            ref={terminalRef}
            className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto"
          >
            {terminalHistory.map(cmd => (
              <div key={cmd.id} className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">$</span>
                  <span className="text-white">{cmd.command}</span>
                  {cmd.status === 'running' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-green-400"></div>
                  )}
                </div>
                {cmd.output && (
                  <div className={`mt-1 ml-4 ${cmd.status === 'error' ? 'text-red-400' : ''}`}>
                    <pre className="whitespace-pre-wrap">{cmd.output}</pre>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex items-center gap-2">
              <span className="text-blue-400">$</span>
              <input
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                className="flex-1 bg-transparent text-white outline-none"
                placeholder="Enter command..."
                autoFocus
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>Available commands: help, status, logs, restart, clear</span>
          </div>
        </Card>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Tables</h3>
            <div className="space-y-1">
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => {
                    setSelectedTable(table);
                    setSqlQuery(`SELECT * FROM ${table} LIMIT 10`);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedTable === table ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
          </Card>
          
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">SQL Query</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={executeQuery}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Play className="w-3 h-3" />
                    Execute
                  </button>
                  <button
                    onClick={() => {
                      const query: SQLQuery = {
                        id: Date.now().toString(),
                        name: `Query ${savedQueries.length + 1}`,
                        query: sqlQuery,
                        saved: true
                      };
                      setSavedQueries([...savedQueries, query]);
                      localStorage.setItem('savedQueries', JSON.stringify([...savedQueries, query]));
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Enter SQL query..."
              />
              
              {savedQueries.length > 0 && (
                <div className="mt-3">
                  <label className="text-sm text-gray-500">Saved Queries:</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {savedQueries.map(q => (
                      <button
                        key={q.id}
                        onClick={() => setSqlQuery(q.query)}
                        className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            
            {queryResults && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Results</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Export CSV
                  </button>
                </div>
                
                {queryResults.error ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200">
                    {queryResults.error}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {queryResults.columns?.map((col: string) => (
                            <th key={col} className="text-left py-2 px-3">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.rows?.map((row: any, i: number) => (
                          <tr key={i} className="border-b">
                            {queryResults.columns?.map((col: string) => (
                              <td key={col} className="py-2 px-3">
                                {JSON.stringify(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* API Playground Tab */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Request</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <select
                  value={apiRequest.method}
                  onChange={(e) => setApiRequest({ ...apiRequest, method: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                
                <input
                  type="text"
                  value={apiRequest.url}
                  onChange={(e) => setApiRequest({ ...apiRequest, url: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter URL..."
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Headers</label>
                <textarea
                  value={JSON.stringify(apiRequest.headers, null, 2)}
                  onChange={(e) => {
                    try {
                      setApiRequest({ ...apiRequest, headers: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full h-24 mt-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              
              {['POST', 'PUT', 'PATCH'].includes(apiRequest.method) && (
                <div>
                  <label className="text-sm text-gray-600">Body</label>
                  <textarea
                    value={JSON.stringify(apiRequest.body, null, 2)}
                    onChange={(e) => {
                      try {
                        setApiRequest({ ...apiRequest, body: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    className="w-full h-32 mt-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={executeApiRequest}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Send Request
                </button>
                
                <button
                  onClick={() => {
                    const request = { ...apiRequest, id: Date.now().toString(), saved: true };
                    setSavedRequests([...savedRequests, request]);
                    localStorage.setItem('savedRequests', JSON.stringify([...savedRequests, request]));
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Save
                </button>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Response</h3>
            
            {apiResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-sm rounded ${
                    apiResponse.status >= 200 && apiResponse.status < 300
                      ? 'bg-green-100 text-green-700'
                      : apiResponse.status >= 400
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apiResponse.status || 'Error'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {apiResponse.timestamp}
                  </span>
                </div>
                
                {apiResponse.headers && (
                  <div>
                    <label className="text-sm text-gray-600">Headers</label>
                    <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {JSON.stringify(apiResponse.headers, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-600">Body</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(apiResponse.body || apiResponse.error, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Send a request to see the response
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Event Stream Tab */}
      {activeTab === 'events' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Real-time Events</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <select
                value={eventFilter.level}
                onChange={(e) => setEventFilter({ ...eventFilter, level: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              
              <button
                onClick={() => setEvents([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Waiting for events...
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {event.level === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      ) : event.level === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.type}</span>
                          <span className="text-xs text-gray-500">{event.source}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.message}
                        </p>
                        {event.data && (
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Cache Inspector Tab */}
      {activeTab === 'cache' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Cache Keys</h3>
              <button
                onClick={fetchCacheKeys}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search keys..."
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {cacheKeys.map(key => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
                    selectedCacheKey === key ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  onClick={() => getCacheValue(key)}
                >
                  <span className="truncate">{key}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCache(key);
                    }}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => clearCache()}
              className="w-full mt-3 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear All Cache
            </button>
          </Card>
          
          <div className="lg:col-span-2">
            {selectedCacheKey && cacheValue ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedCacheKey}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(cacheValue, null, 2))}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => clearCache(selectedCacheKey)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-x-auto">
                  {JSON.stringify(cacheValue, null, 2)}
                </pre>
              </Card>
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  Select a cache key to view its value
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}