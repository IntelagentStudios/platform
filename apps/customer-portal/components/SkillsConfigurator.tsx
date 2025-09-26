'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CubeIcon,
  SparklesIcon,
  ChartBarIcon,
  EnvelopeIcon,
  CogIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentTextIcon,
  CurrencyPoundIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  dependencies?: string[];
  tags: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  tokensPerMonth?: number;
}

interface SkillsConfiguratorProps {
  recommendedSkills: string[];
  onSkillsChange: (skills: Skill[], totalCost: number) => void;
  budget?: string;
}

// Skill categories with icons
const CATEGORIES = [
  { id: 'communication', name: 'Communication', icon: EnvelopeIcon, color: 'blue' },
  { id: 'sales', name: 'Sales & CRM', icon: ChartBarIcon, color: 'green' },
  { id: 'analytics', name: 'Analytics & Insights', icon: ChartBarIcon, color: 'purple' },
  { id: 'automation', name: 'Automation', icon: CogIcon, color: 'orange' },
  { id: 'security', name: 'Security & Compliance', icon: ShieldCheckIcon, color: 'red' },
  { id: 'integration', name: 'Integrations', icon: CloudIcon, color: 'indigo' },
  { id: 'content', name: 'Content & Marketing', icon: DocumentTextIcon, color: 'pink' },
  { id: 'data', name: 'Data Processing', icon: CubeIcon, color: 'yellow' }
];

// Mock skills database (in production, this would come from the skills orchestrator)
const AVAILABLE_SKILLS: Skill[] = [
  // Communication Skills
  { id: 'email_composer', name: 'Email Composer', description: 'AI-powered email composition', category: 'communication', price: 20, complexity: 'simple', tags: ['email', 'ai'] },
  { id: 'email_sender', name: 'Email Sender', description: 'Automated email delivery', category: 'communication', price: 15, complexity: 'simple', tags: ['email'] },
  { id: 'email_validator', name: 'Email Validator', description: 'Verify email addresses', category: 'communication', price: 10, complexity: 'simple', tags: ['email', 'validation'] },
  { id: 'chat_integration', name: 'Chat Integration', description: 'Slack/Teams connector', category: 'communication', price: 25, dependencies: ['notification_sender'], complexity: 'moderate', tags: ['chat', 'integration'] },

  // Sales Skills
  { id: 'lead_finder', name: 'Lead Finder', description: 'Discover potential customers', category: 'sales', price: 30, complexity: 'moderate', tags: ['leads', 'prospecting'] },
  { id: 'lead_enrichment', name: 'Lead Enrichment', description: 'Enhance lead data', category: 'sales', price: 25, dependencies: ['lead_finder'], complexity: 'moderate', tags: ['leads', 'data'] },
  { id: 'lead_scorer', name: 'Lead Scorer', description: 'Score and prioritize leads', category: 'sales', price: 20, dependencies: ['lead_enrichment'], complexity: 'complex', tags: ['leads', 'ai'] },
  { id: 'salesforce_sync', name: 'Salesforce Sync', description: 'CRM synchronization', category: 'sales', price: 35, complexity: 'moderate', tags: ['crm', 'integration'] },
  { id: 'crm_updater', name: 'CRM Updater', description: 'Automatic CRM updates', category: 'sales', price: 20, dependencies: ['salesforce_sync'], complexity: 'simple', tags: ['crm'] },

  // Analytics Skills
  { id: 'data_analyzer', name: 'Data Analyzer', description: 'Advanced data analysis', category: 'analytics', price: 40, complexity: 'complex', tags: ['analytics', 'ai'] },
  { id: 'report_generator', name: 'Report Generator', description: 'Automated reporting', category: 'analytics', price: 25, dependencies: ['data_analyzer'], complexity: 'moderate', tags: ['reports'] },
  { id: 'dashboard_builder', name: 'Dashboard Builder', description: 'Visual dashboards', category: 'analytics', price: 30, complexity: 'moderate', tags: ['visualization'] },
  { id: 'metric_tracker', name: 'Metric Tracker', description: 'KPI monitoring', category: 'analytics', price: 20, complexity: 'simple', tags: ['kpi', 'monitoring'] },

  // Automation Skills
  { id: 'workflow_orchestrator', name: 'Workflow Orchestrator', description: 'Complex workflow automation', category: 'automation', price: 45, complexity: 'complex', tags: ['workflow', 'automation'] },
  { id: 'task_scheduler', name: 'Task Scheduler', description: 'Schedule automated tasks', category: 'automation', price: 15, complexity: 'simple', tags: ['scheduling'] },
  { id: 'notification_sender', name: 'Notification Sender', description: 'Multi-channel notifications', category: 'automation', price: 20, complexity: 'simple', tags: ['notifications'] },

  // Content Skills
  { id: 'content_generator', name: 'Content Generator', description: 'AI content creation', category: 'content', price: 35, complexity: 'moderate', tags: ['content', 'ai'] },
  { id: 'seo_optimizer', name: 'SEO Optimizer', description: 'Search optimization', category: 'content', price: 25, complexity: 'moderate', tags: ['seo'] },
  { id: 'social_media_poster', name: 'Social Media Poster', description: 'Auto-post to social', category: 'content', price: 20, complexity: 'simple', tags: ['social'] },

  // Integration Skills
  { id: 'api_connector', name: 'API Connector', description: 'Connect any API', category: 'integration', price: 30, complexity: 'moderate', tags: ['api'] },
  { id: 'webhook_handler', name: 'Webhook Handler', description: 'Process webhooks', category: 'integration', price: 20, complexity: 'simple', tags: ['webhook'] },
  { id: 'database_sync', name: 'Database Sync', description: 'Database synchronization', category: 'integration', price: 35, complexity: 'complex', tags: ['database'] }
];

// Predefined templates
const TEMPLATES = [
  {
    id: 'sales_outreach',
    name: 'Sales Outreach Pro',
    description: 'Complete sales automation suite',
    skills: ['lead_finder', 'lead_enrichment', 'lead_scorer', 'email_composer', 'email_sender', 'salesforce_sync', 'crm_updater'],
    price: 175
  },
  {
    id: 'customer_support',
    name: 'Support Assistant',
    description: 'Automated customer support',
    skills: ['chat_integration', 'notification_sender', 'workflow_orchestrator', 'dashboard_builder'],
    price: 110
  },
  {
    id: 'content_marketing',
    name: 'Content Marketer',
    description: 'Content creation and distribution',
    skills: ['content_generator', 'seo_optimizer', 'social_media_poster', 'report_generator'],
    price: 105
  }
];

export const SkillsConfigurator: React.FC<SkillsConfiguratorProps> = ({
  recommendedSkills,
  onSkillsChange,
  budget
}) => {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set(recommendedSkills));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return Array.from(selectedSkills).reduce((sum, skillId) => {
      const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
      return sum + (skill?.price || 0);
    }, 0);
  }, [selectedSkills]);

  // Filter skills based on search and category
  const filteredSkills = useMemo(() => {
    return AVAILABLE_SKILLS.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Group skills by category
  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    filteredSkills.forEach(skill => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }
      groups[skill.category].push(skill);
    });
    return groups;
  }, [filteredSkills]);

  // Handle skill selection
  const toggleSkill = (skillId: string) => {
    const newSelection = new Set(selectedSkills);
    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);

    if (selectedSkills.has(skillId)) {
      // Remove skill and any skills that depend on it
      newSelection.delete(skillId);
      AVAILABLE_SKILLS.forEach(s => {
        if (s.dependencies?.includes(skillId)) {
          newSelection.delete(s.id);
        }
      });
    } else {
      // Add skill and its dependencies
      newSelection.add(skillId);
      if (showDependencies && skill?.dependencies) {
        skill.dependencies.forEach(dep => newSelection.add(dep));
      }
    }

    setSelectedSkills(newSelection);
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedSkills(new Set(template.skills));
      setSelectedTemplate(templateId);
    }
  };

  // Notify parent of changes
  useEffect(() => {
    const skills = Array.from(selectedSkills).map(id =>
      AVAILABLE_SKILLS.find(s => s.id === id)!
    ).filter(Boolean);
    onSkillsChange(skills, totalCost);
  }, [selectedSkills, totalCost, onSkillsChange]);

  // Check if budget is exceeded
  const isBudgetExceeded = budget && totalCost > parseInt(budget.replace(/[^0-9]/g, ''));

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Skills Configurator</h3>
            <p className="text-sm opacity-90">Select skills to power your agent</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">£{totalCost}/mo</div>
            <div className={`text-xs ${isBudgetExceeded ? 'text-red-200' : 'opacity-75'}`}>
              {budget && `Budget: ${budget}`}
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Quick Start Templates</h4>
          {selectedTemplate && (
            <button
              onClick={() => {
                setSelectedSkills(new Set(recommendedSkills));
                setSelectedTemplate(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear Template
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className={`p-3 rounded-lg border text-left transition ${
                selectedTemplate === template.id
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              <div className="text-xs font-medium text-purple-600 mt-2">£{template.price}/mo</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowDependencies(!showDependencies)}
            className={`px-4 py-2 rounded-lg border transition ${
              showDependencies
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            Auto-dependencies
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              !selectedCategory
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? `bg-${cat.color}-100 text-${cat.color}-700`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {Object.entries(groupedSkills).map(([category, skills]) => {
          const categoryInfo = CATEGORIES.find(c => c.id === category);
          const CategoryIcon = categoryInfo?.icon || CubeIcon;

          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CategoryIcon className="w-5 h-5 text-gray-500" />
                <h4 className="font-medium text-gray-900">{categoryInfo?.name || category}</h4>
                <span className="text-xs text-gray-500">({skills.length})</span>
              </div>

              <div className="space-y-2">
                {skills.map(skill => {
                  const isSelected = selectedSkills.has(skill.id);
                  const hasDependencies = skill.dependencies && skill.dependencies.length > 0;
                  const dependenciesMet = !skill.dependencies ||
                    skill.dependencies.every(dep => selectedSkills.has(dep));

                  return (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-lg border transition ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900">{skill.name}</h5>
                            {skill.complexity === 'complex' && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Complex</span>
                            )}
                            {skill.complexity === 'moderate' && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Moderate</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{skill.description}</p>

                          {/* Dependencies */}
                          {hasDependencies && (
                            <div className="flex items-center gap-2 mt-2">
                              <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Requires: {skill.dependencies?.map(dep =>
                                  AVAILABLE_SKILLS.find(s => s.id === dep)?.name
                                ).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Tags */}
                          <div className="flex gap-1 mt-2">
                            {skill.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">£{skill.price}</div>
                            <div className="text-xs text-gray-500">/month</div>
                          </div>
                          <button
                            onClick={() => toggleSkill(skill.id)}
                            disabled={!dependenciesMet && !isSelected}
                            className={`p-2 rounded-lg transition ${
                              isSelected
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : dependenciesMet
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isSelected ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">
              {selectedSkills.size} skills selected
            </span>
            {isBudgetExceeded && (
              <span className="ml-3 text-sm text-red-600">
                ⚠️ Over budget by £{totalCost - parseInt(budget?.replace(/[^0-9]/g, '') || '0')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Estimated tokens: ~{Math.round(selectedSkills.size * 50)}k/mo
            </div>
            <div className={`text-2xl font-bold ${isBudgetExceeded ? 'text-red-600' : 'text-gray-900'}`}>
              £{totalCost}/mo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsConfigurator;