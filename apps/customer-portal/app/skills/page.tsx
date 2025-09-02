'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Zap, Search, Filter, Play, Clock, DollarSign, 
  TrendingUp, Package, Sparkles, CheckCircle,
  AlertCircle, Loader2, ChevronRight, Grid, List
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  isPremium?: boolean;
  status: string;
  stats?: {
    totalExecutions: number;
    successRate: number;
    averageTime: number;
  };
  price?: number;
}

interface SkillCategory {
  name: string;
  icon: any;
  color: string;
  count: number;
}

export default function SkillsMarketplace() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          loadSkills();
        }
      });
  }, []);

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills/list', { 
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (data.skills) {
        setSkills(data.skills);
        
        // Extract categories
        const categoryMap = new Map<string, number>();
        data.skills.forEach((skill: Skill) => {
          const count = categoryMap.get(skill.category) || 0;
          categoryMap.set(skill.category, count + 1);
        });
        
        const categoryList: SkillCategory[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
          name,
          count,
          icon: getCategoryIcon(name),
          color: getCategoryColor(name)
        }));
        
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSkill = async (skillId: string, params?: any) => {
    setExecuting(skillId);
    
    try {
      const response = await fetch('/api/skills/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skillId,
          params: params || {},
          licenseKey: user?.license_key
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success notification
        showNotification('success', `Skill executed successfully!`);
        
        // Refresh skill stats
        loadSkills();
      } else {
        showNotification('error', result.error || 'Execution failed');
      }
    } catch (error) {
      showNotification('error', 'Failed to execute skill');
    } finally {
      setExecuting(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'communication': Zap,
      'data_processing': Package,
      'ai_powered': Sparkles,
      'automation': TrendingUp,
      'integration': Package,
      'analytics': TrendingUp,
      'utility': Zap
    };
    return icons[category.toLowerCase()] || Package;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'communication': 'bg-blue-500',
      'data_processing': 'bg-green-500',
      'ai_powered': 'bg-purple-500',
      'automation': 'bg-orange-500',
      'integration': 'bg-indigo-500',
      'analytics': 'bg-pink-500',
      'utility': 'bg-gray-500'
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    // You can implement a toast notification here
    console.log(`${type}: ${message}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Skills Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Execute powerful automations and integrations with one click
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full transition ${
              selectedCategory === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Skills ({skills.length})
          </button>
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition ${
                  selectedCategory === cat.name
                    ? `${cat.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Skills Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                viewMode={viewMode}
                onExecute={() => executeSkill(skill.id)}
                isExecuting={executing === skill.id}
              />
            ))}
          </div>
        )}

        {filteredSkills.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No skills found matching your criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Skill Card Component
function SkillCard({ 
  skill, 
  viewMode, 
  onExecute, 
  isExecuting 
}: { 
  skill: Skill; 
  viewMode: 'grid' | 'list';
  onExecute: () => void;
  isExecuting: boolean;
}) {
  const categoryColor = {
    'communication': 'border-blue-200 bg-blue-50',
    'data_processing': 'border-green-200 bg-green-50',
    'ai_powered': 'border-purple-200 bg-purple-50',
    'automation': 'border-orange-200 bg-orange-50',
    'integration': 'border-indigo-200 bg-indigo-50',
    'analytics': 'border-pink-200 bg-pink-50',
    'utility': 'border-gray-200 bg-gray-50'
  }[skill.category.toLowerCase()] || 'border-gray-200 bg-gray-50';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${categoryColor} hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{skill.name}</h3>
              {skill.isPremium && (
                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full">
                  Premium
                </span>
              )}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {skill.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {skill.stats && (
              <div className="text-right text-sm">
                <div className="text-gray-500">Success Rate</div>
                <div className="font-semibold">{skill.stats.successRate}%</div>
              </div>
            )}
            
            <button
              onClick={onExecute}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Execute
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-lg border ${categoryColor} hover:shadow-lg transition-all cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gray-600" />
          {skill.isPremium && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full">
              Premium
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
          {skill.category}
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{skill.name}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{skill.description}</p>
      
      {skill.stats && (
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <span className="text-gray-500">Executions:</span>
            <span className="ml-1 font-semibold">{skill.stats.totalExecutions}</span>
          </div>
          <div>
            <span className="text-gray-500">Success:</span>
            <span className="ml-1 font-semibold">{skill.stats.successRate}%</span>
          </div>
        </div>
      )}
      
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Execute
          </>
        )}
      </button>
    </motion.div>
  );
}