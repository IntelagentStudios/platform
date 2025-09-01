'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, AlertCircle, CheckCircle, Clock, 
  Cpu, Layers, Play, RefreshCw, Search, 
  Settings, TrendingUp, Zap, Grid, List
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  active: boolean;
  executionCount: number;
  successRate: number;
  avgDuration: number;
  lastExecuted?: Date;
}

interface ExecutionHistory {
  id: string;
  skillId: string;
  skillName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  userId: string;
}

export default function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [executions, setExecutions] = useState<ExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'registry' | 'monitor' | 'history' | 'workflow'>('registry');

  useEffect(() => {
    fetchSkills();
    fetchExecutionHistory();
  }, []);

  const fetchSkills = async () => {
    try {
      // Mock data for now
      const mockSkills: Skill[] = [
        {
          id: 'calculator',
          name: 'Calculator',
          description: 'Performs mathematical calculations',
          category: 'utility',
          version: '1.0.0',
          author: 'Intelagent',
          active: true,
          executionCount: 1247,
          successRate: 99.8,
          avgDuration: 45,
          lastExecuted: new Date()
        },
        {
          id: 'weather',
          name: 'Weather Information',
          description: 'Get current weather and forecasts',
          category: 'utility',
          version: '1.0.0',
          author: 'Intelagent',
          active: true,
          executionCount: 892,
          successRate: 95.2,
          avgDuration: 320,
          lastExecuted: new Date()
        },
        {
          id: 'datetime',
          name: 'Date & Time',
          description: 'Date and time utilities and conversions',
          category: 'utility',
          version: '1.0.0',
          author: 'Intelagent',
          active: true,
          executionCount: 556,
          successRate: 100,
          avgDuration: 12,
          lastExecuted: new Date()
        }
      ];
      setSkills(mockSkills);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionHistory = async () => {
    // Mock execution history
    const mockHistory: ExecutionHistory[] = [
      {
        id: '1',
        skillId: 'calculator',
        skillName: 'Calculator',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 45,
        userId: 'user123'
      }
    ];
    setExecutions(mockHistory);
  };

  const categories = ['all', 'utility', 'communication', 'data_processing', 'integration', 'ai_powered'];

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExecutions = skills.reduce((sum, skill) => sum + skill.executionCount, 0);
  const avgSuccessRate = skills.reduce((sum, skill) => sum + skill.successRate, 0) / skills.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Skills Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and monitor all skills in the orchestrator
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{skills.length}</p>
            </div>
            <Layers className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalExecutions.toLocaleString()}
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgSuccessRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Skills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {skills.filter(s => s.active).length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'registry', label: 'Skills Registry', icon: Layers },
            { id: 'monitor', label: 'Health Monitor', icon: Activity },
            { id: 'history', label: 'Execution History', icon: Clock },
            { id: 'workflow', label: 'Workflow Designer', icon: Cpu }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Skills Grid/List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      skill.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {skill.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{skill.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Executions:</span>
                      <span className="font-medium">{skill.executionCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="font-medium">{skill.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Duration:</span>
                      <span className="font-medium">{skill.avgDuration}ms</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs">
                    <span className="text-gray-500">v{skill.version}</span>
                    <button className="text-blue-600 hover:text-blue-700">Configure</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Executions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSkills.map(skill => (
                    <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {skill.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {skill.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {skill.executionCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${
                          skill.successRate >= 95 ? 'text-green-600' : 
                          skill.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {skill.successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          skill.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {skill.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700">
                          <Play className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Health Monitor</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of skill performance and health metrics
          </p>
          {/* Add health monitoring components here */}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Execution History</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View detailed execution logs and history
          </p>
          {/* Add execution history table here */}
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workflow Designer</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage skill workflows with drag-and-drop interface
          </p>
          {/* Add workflow designer here */}
        </div>
      )}
    </div>
  );
}