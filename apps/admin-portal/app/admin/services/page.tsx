'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Server,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Download,
  Upload,
  Trash2,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'deploying';
  version: string;
  port: number;
  pid?: number;
  memory: number;
  cpu: number;
  uptime: number;
  restarts: number;
  logs: string[];
  env: Record<string, string>;
  lastDeploy: string;
}

export default function ServiceManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [editingEnv, setEditingEnv] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (serviceId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/${action}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
    }
  };

  const fetchLogs = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setShowLogs(true);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleScaleService = async (serviceId: string, instances: number) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances }),
      });
      
      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to scale service:', error);
    }
  };

  const handleUpdateEnv = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/env`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envVars }),
      });
      
      if (response.ok) {
        setEditingEnv(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to update environment:', error);
    }
  };

  const handleDeploy = async (serviceId: string, version: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      
      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to deploy service:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'deploying':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'stopped':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'deploying':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
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
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Service Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and monitor all platform services
        </p>
      </header>

      {/* Service Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">v{service.version}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Port</span>
                <span className="font-medium">{service.port}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CPU</span>
                <span className="font-medium">{service.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Memory</span>
                <span className="font-medium">{Math.round(service.memory / 1024 / 1024)}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Uptime</span>
                <span className="font-medium">{Math.floor(service.uptime / 3600)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Restarts</span>
                <span className="font-medium">{service.restarts}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {service.status === 'running' ? (
                <>
                  <button
                    onClick={() => handleServiceAction(service.id, 'stop')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Pause className="w-3 h-3" />
                    Stop
                  </button>
                  <button
                    onClick={() => handleServiceAction(service.id, 'restart')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restart
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleServiceAction(service.id, 'start')}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <Play className="w-3 h-3" />
                  Start
                </button>
              )}
              
              <button
                onClick={() => fetchLogs(service.id)}
                className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                title="View Logs"
              >
                <Terminal className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setSelectedService(service);
                  setEnvVars(service.env);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Service Logs</h2>
              <button
                onClick={() => setShowLogs(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto max-h-[60vh]">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Clear Logs
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {selectedService.name} Settings
              </h2>
              <button
                onClick={() => {
                  setSelectedService(null);
                  setEditingEnv(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Deployment */}
              <div>
                <h3 className="font-semibold mb-2">Deployment</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current Version</span>
                    <span className="font-medium">{selectedService.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Deploy</span>
                    <span className="font-medium">
                      {new Date(selectedService.lastDeploy).toLocaleString()}
                    </span>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Deploy New Version
                  </button>
                </div>
              </div>

              {/* Scaling */}
              <div>
                <h3 className="font-semibold mb-2">Scaling</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleScaleService(selectedService.id, 1)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Scale Down
                  </button>
                  <span className="px-4 py-2 bg-gray-100 rounded">1 instance</span>
                  <button
                    onClick={() => handleScaleService(selectedService.id, 2)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Scale Up
                  </button>
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Environment Variables</h3>
                  {!editingEnv ? (
                    <button
                      onClick={() => setEditingEnv(true)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateEnv(selectedService.id)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingEnv(false);
                          setEnvVars(selectedService.env);
                        }}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {Object.entries(envVars).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={key}
                        disabled
                        className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                        disabled={!editingEnv}
                        className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm"
                      />
                      {editingEnv && (
                        <button
                          onClick={() => {
                            const newVars = { ...envVars };
                            delete newVars[key];
                            setEnvVars(newVars);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}