'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Zap,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  MoreVertical
} from 'lucide-react';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  throughput: number;
  errorRate: number;
}

interface Job {
  id: string;
  name: string;
  queue: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  data: any;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  progress: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedReason?: string;
}

export default function QueueMonitorPage() {
  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchQueues();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchQueues();
        if (selectedQueue) {
          fetchJobs(selectedQueue);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedQueue, autoRefresh]);

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/admin/queues');
      if (response.ok) {
        const data = await response.json();
        setQueues(data);
      }
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (queueName: string) => {
    try {
      const response = await fetch(`/api/admin/queues/${queueName}/jobs?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleQueueAction = async (queueName: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/queues/${queueName}/${action}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchQueues();
      }
    } catch (error) {
      console.error(`Failed to ${action} queue:`, error);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/queues/${selectedQueue}/jobs/${jobId}/${action}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchJobs(selectedQueue!);
      }
    } catch (error) {
      console.error(`Failed to ${action} job:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'waiting':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'delayed':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Queue Monitor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage background job queues
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
            onClick={fetchQueues}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* Queue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {queues.map((queue) => (
          <Card 
            key={queue.name} 
            className={`p-4 cursor-pointer transition-all ${
              selectedQueue === queue.name ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedQueue(queue.name);
              fetchJobs(queue.name);
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {queue.name}
                </h3>
              </div>
              {queue.paused && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Paused
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Waiting</span>
                <p className="font-semibold">{queue.waiting}</p>
              </div>
              <div>
                <span className="text-gray-500">Active</span>
                <p className="font-semibold text-blue-600">{queue.active}</p>
              </div>
              <div>
                <span className="text-gray-500">Completed</span>
                <p className="font-semibold text-green-600">{queue.completed}</p>
              </div>
              <div>
                <span className="text-gray-500">Failed</span>
                <p className="font-semibold text-red-600">{queue.failed}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{queue.throughput} jobs/min</span>
              <span>{queue.errorRate.toFixed(1)}% errors</span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {queue.paused ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueueAction(queue.name, 'resume');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <Play className="w-3 h-3" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueueAction(queue.name, 'pause');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQueueAction(queue.name, 'clean');
                }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Trash2 className="w-3 h-3" />
                Clean
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Jobs Table */}
      {selectedQueue && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedQueue} Jobs
            </h2>
            
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  fetchJobs(selectedQueue);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Jobs</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="delayed">Delayed</option>
              </select>
              
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <Filter className="w-4 h-4" />
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Attempts</th>
                  <th className="text-left py-3 px-4">Progress</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-mono">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {job.name}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleJobAction(job.id, 'retry')}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Retry"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="View Details"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleJobAction(job.id, 'remove')}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Job ID</label>
                <p className="font-mono text-sm">{selectedJob.id}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedJob.status)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Data</label>
                <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </pre>
              </div>

              {selectedJob.result && (
                <div>
                  <label className="text-sm text-gray-500">Result</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.failedReason && (
                <div>
                  <label className="text-sm text-gray-500">Error</label>
                  <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                    {selectedJob.failedReason}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Created At</label>
                  <p className="text-sm">{new Date(selectedJob.createdAt).toLocaleString()}</p>
                </div>
                
                {selectedJob.processedAt && (
                  <div>
                    <label className="text-sm text-gray-500">Processed At</label>
                    <p className="text-sm">{new Date(selectedJob.processedAt).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedJob.completedAt && (
                  <div>
                    <label className="text-sm text-gray-500">Completed At</label>
                    <p className="text-sm">{new Date(selectedJob.completedAt).toLocaleString()}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-500">Attempts</label>
                  <p className="text-sm">{selectedJob.attempts} / {selectedJob.maxAttempts}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {selectedJob.status === 'failed' && (
                <button
                  onClick={() => {
                    handleJobAction(selectedJob.id, 'retry');
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry Job
                </button>
              )}
              
              <button
                onClick={() => {
                  handleJobAction(selectedJob.id, 'remove');
                  setSelectedJob(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove Job
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}