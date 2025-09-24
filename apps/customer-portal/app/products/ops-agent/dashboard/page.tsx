'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Zap,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  GitBranch,
  MoreVertical,
  Plus,
  FileText,
  Send,
  Calendar,
  Bell,
  RefreshCw,
  TrendingUp,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';

export default function OpsAgentDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('runs');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadDashboardData();
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
  }, []);

  const loadDashboardData = () => {
    // Mock data for workflows and runs
    setWorkflows([
      {
        id: 'wf_onboarding',
        name: 'New Employee Onboarding',
        description: 'Complete onboarding process for new hires',
        steps: 12,
        avgDuration: '2.5 hours',
        lastRun: '2 hours ago',
        status: 'active',
        runs: 45,
        successRate: 96
      },
      {
        id: 'wf_invoice',
        name: 'Invoice Processing',
        description: 'Automated invoice approval and payment',
        steps: 8,
        avgDuration: '45 mins',
        lastRun: '30 mins ago',
        status: 'active',
        runs: 128,
        successRate: 98
      },
      {
        id: 'wf_support',
        name: 'Customer Support Escalation',
        description: 'Handle support ticket escalations',
        steps: 6,
        avgDuration: '1.5 hours',
        lastRun: '1 day ago',
        status: 'active',
        runs: 67,
        successRate: 94
      }
    ]);

    setRuns([
      {
        id: 'run_001',
        workflow: 'New Employee Onboarding',
        owner: 'Sarah Johnson',
        started: '10:30 AM',
        status: 'in_progress',
        currentStep: 'Collecting Documents',
        progress: 60,
        eta: '12:30 PM'
      },
      {
        id: 'run_002',
        workflow: 'Invoice Processing',
        owner: 'Mike Chen',
        started: '9:45 AM',
        status: 'completed',
        currentStep: 'Complete',
        progress: 100,
        eta: 'Completed'
      },
      {
        id: 'run_003',
        workflow: 'Invoice Processing',
        owner: 'Emma Wilson',
        started: '11:15 AM',
        status: 'waiting_approval',
        currentStep: 'Manager Approval',
        progress: 75,
        eta: 'Waiting'
      }
    ]);
  };

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
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
              <Zap className="h-6 w-6" style={{ color: '#4CAF50' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Ops Agent Dashboard
              </h1>
              <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Workflow automation and orchestration
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg flex items-center space-x-2 transition hover:opacity-80"
            style={{
              backgroundColor: '#4CAF50',
              color: 'white'
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-8 py-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Active Runs</p>
            <Play className="h-4 w-4" style={{ color: '#4CAF50' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>12</p>
          <p className="text-xs" style={{ color: 'rgba(76, 175, 80, 0.8)' }}>↑ 3 from yesterday</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Success Rate</p>
            <CheckCircle className="h-4 w-4" style={{ color: '#4CAF50' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>96%</p>
          <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Last 30 days</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Avg Duration</p>
            <Clock className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>1.8h</p>
          <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Per workflow</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Exceptions</p>
            <AlertCircle className="h-4 w-4" style={{ color: '#FFC107' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>3</p>
          <p className="text-xs" style={{ color: 'rgba(255, 193, 7, 0.8)' }}>Need attention</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex space-x-8">
            {['runs', 'workflows', 'builder', 'sla', 'exceptions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 transition ${
                  activeTab === tab ? 'border-current' : 'border-transparent hover:border-gray-600'
                }`}
                style={{
                  color: activeTab === tab ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.7)'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'runs' && (
          <div>
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  <input
                    type="text"
                    placeholder="Search runs..."
                    className="pl-10 pr-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(58, 64, 64, 0.5)',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  />
                </div>
                <button
                  className="px-3 py-2 rounded-lg flex items-center space-x-2"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgb(169, 189, 203)'
                  }}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>
              <button
                className="px-3 py-2 rounded-lg flex items-center space-x-2"
                style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(169, 189, 203)'
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Runs Table */}
            <div className="rounded-lg overflow-hidden" style={{
              backgroundColor: 'rgba(58, 64, 64, 0.3)',
              border: '1px solid rgba(169, 189, 203, 0.1)'
            }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(169, 189, 203, 0.1)' }}>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Workflow</th>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Owner</th>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Started</th>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Status</th>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Progress</th>
                    <th className="text-left p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>ETA</th>
                    <th className="text-right p-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} style={{ borderBottom: '1px solid rgba(169, 189, 203, 0.05)' }}>
                      <td className="p-4">
                        <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                          {run.workflow}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                          {run.currentStep}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                               style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)', color: 'rgb(229, 227, 220)' }}>
                            {run.owner.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span style={{ color: 'rgba(229, 227, 220, 0.8)' }}>{run.owner}</span>
                        </div>
                      </td>
                      <td className="p-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {run.started}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: run.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' :
                                               run.status === 'in_progress' ? 'rgba(33, 150, 243, 0.2)' :
                                               'rgba(255, 193, 7, 0.2)',
                                color: run.status === 'completed' ? '#4CAF50' :
                                      run.status === 'in_progress' ? '#2196F3' :
                                      '#FFC107'
                              }}>
                          {run.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden"
                               style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                            <div className="h-full rounded-full transition-all"
                                 style={{
                                   width: `${run.progress}%`,
                                   backgroundColor: run.progress === 100 ? '#4CAF50' : '#2196F3'
                                 }} />
                          </div>
                          <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                            {run.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {run.eta}
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 rounded hover:bg-opacity-10 hover:bg-gray-400 transition">
                          <MoreVertical className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.7)' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-lg p-6 cursor-pointer transition hover:shadow-lg"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {workflow.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                      {workflow.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    workflow.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {workflow.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Steps</p>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{workflow.steps}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Avg Duration</p>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{workflow.avgDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Total Runs</p>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{workflow.runs}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Success Rate</p>
                    <p className="font-medium" style={{ color: '#4CAF50' }}>{workflow.successRate}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Last run: {workflow.lastRun}
                  </span>
                  <button className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <GitBranch className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Visual Workflow Builder
              </h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Create workflows from templates or describe them in plain language
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgb(169, 189, 203)'
                  }}
                >
                  Browse Templates
                </button>
                <button
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white'
                  }}
                >
                  Create from Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}