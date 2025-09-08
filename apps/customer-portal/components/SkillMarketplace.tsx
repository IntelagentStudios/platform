'use client';

import { useState, useEffect } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  InformationCircleIcon,
  CurrencyPoundIcon,
  ChartBarIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  priceImpact: number;
  tokenEstimate: number;
  tier: 'core' | 'standard' | 'premium' | 'enterprise';
  dependencies?: string[];
  isCore?: boolean;
  isLocked?: boolean;
  unavailableReason?: string;
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  skills: Skill[];
}

interface SkillMarketplaceProps {
  selectedSkills: Set<string>;
  onSkillToggle: (skillId: string) => void;
  baseProduct?: 'chatbot' | 'sales_outreach' | 'onboarding' | 'custom';
  userTier?: 'starter' | 'pro' | 'enterprise';
  showPricing?: boolean;
  maxSkills?: number;
  onPriceChange?: (totalPrice: number, complexity: number) => void;
}

export default function SkillMarketplace({
  selectedSkills,
  onSkillToggle,
  baseProduct = 'custom',
  userTier = 'starter',
  showPricing = true,
  maxSkills,
  onPriceChange
}: SkillMarketplaceProps) {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [complexityScore, setComplexityScore] = useState(0);

  useEffect(() => {
    loadSkills();
  }, [baseProduct]);

  useEffect(() => {
    calculatePricing();
  }, [selectedSkills]);

  const loadSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skills?product=${baseProduct}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        organizeSkillsByCategory(data.skills || []);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeSkillsByCategory = (skills: any[]) => {
    const categoryMap: Record<string, SkillCategory> = {
      communication: {
        id: 'communication',
        name: 'Communication & NLP',
        description: 'Natural language processing and conversation',
        icon: SparklesIcon,
        color: 'blue',
        skills: []
      },
      automation: {
        id: 'automation',
        name: 'Automation & Workflows',
        description: 'Process automation and task management',
        icon: ChartBarIcon,
        color: 'purple',
        skills: []
      },
      integration: {
        id: 'integration',
        name: 'Integrations',
        description: 'Connect with external services',
        icon: ChartBarIcon,
        color: 'green',
        skills: []
      },
      analytics: {
        id: 'analytics',
        name: 'Analytics & Reporting',
        description: 'Data analysis and insights',
        icon: ChartBarIcon,
        color: 'yellow',
        skills: []
      },
      security: {
        id: 'security',
        name: 'Security & Compliance',
        description: 'Data protection and regulatory compliance',
        icon: LockClosedIcon,
        color: 'red',
        skills: []
      }
    };

    // Categorize skills
    skills.forEach(skill => {
      const category = determineCategoryForSkill(skill);
      if (categoryMap[category]) {
        categoryMap[category].skills.push({
          ...skill,
          isLocked: !canUseSkill(skill, userTier),
          unavailableReason: getUnavailableReason(skill, userTier)
        });
      }
    });

    setCategories(Object.values(categoryMap).filter(cat => cat.skills.length > 0));
  };

  const determineCategoryForSkill = (skill: any): string => {
    // Map skills to categories based on keywords
    const name = skill.name.toLowerCase();
    const desc = skill.description?.toLowerCase() || '';
    
    if (name.includes('email') || name.includes('chat') || name.includes('message') || name.includes('conversation')) {
      return 'communication';
    }
    if (name.includes('workflow') || name.includes('automation') || name.includes('process') || name.includes('task')) {
      return 'automation';
    }
    if (name.includes('api') || name.includes('integration') || name.includes('connector') || name.includes('webhook')) {
      return 'integration';
    }
    if (name.includes('analytics') || name.includes('report') || name.includes('metric') || name.includes('insight')) {
      return 'analytics';
    }
    if (name.includes('security') || name.includes('compliance') || name.includes('encryption') || name.includes('audit')) {
      return 'security';
    }
    
    return 'automation'; // Default category
  };

  const canUseSkill = (skill: any, tier: string): boolean => {
    if (skill.isCore) return true;
    if (skill.tier === 'core' || skill.tier === 'standard') return true;
    if (skill.tier === 'premium' && (tier === 'pro' || tier === 'enterprise')) return true;
    if (skill.tier === 'enterprise' && tier === 'enterprise') return true;
    return false;
  };

  const getUnavailableReason = (skill: any, tier: string): string | undefined => {
    if (canUseSkill(skill, tier)) return undefined;
    if (skill.tier === 'premium') return 'Requires Pro tier or higher';
    if (skill.tier === 'enterprise') return 'Requires Enterprise tier';
    return 'Not available in your current plan';
  };

  const calculatePricing = () => {
    let price = 0;
    let complexity = 0;

    selectedSkills.forEach(skillId => {
      const skill = findSkillById(skillId);
      if (skill) {
        price += skill.priceImpact || 0;
        complexity += skill.complexity || 1;
      }
    });

    // Base prices
    const basePrices = {
      chatbot: 299,
      sales_outreach: 499,
      onboarding: 399,
      custom: 299
    };

    const basePrice = basePrices[baseProduct];
    const totalPrice = basePrice + price;
    
    setTotalPrice(totalPrice);
    setComplexityScore(Math.min(10, Math.round(complexity / selectedSkills.size)));

    if (onPriceChange) {
      onPriceChange(totalPrice, complexityScore);
    }
  };

  const findSkillById = (skillId: string): Skill | undefined => {
    for (const category of categories) {
      const skill = category.skills.find(s => s.id === skillId);
      if (skill) return skill;
    }
    return undefined;
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSkillToggle = (skill: Skill) => {
    if (skill.isCore || skill.isLocked) return;
    
    if (maxSkills && !selectedSkills.has(skill.id) && selectedSkills.size >= maxSkills) {
      alert(`Maximum ${maxSkills} skills allowed`);
      return;
    }

    onSkillToggle(skill.id);
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    skills: category.skills.filter(skill => {
      const matchesSearch = !searchQuery || 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || category.id === selectedCategory;
      const matchesAvailability = !showOnlyAvailable || !skill.isLocked;
      
      return matchesSearch && matchesCategory && matchesAvailability;
    })
  })).filter(category => category.skills.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={`px-4 py-2 rounded-lg border transition ${
                showOnlyAvailable
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white'
              }`}
            >
              <FunnelIcon className="w-5 h-5 inline mr-2" />
              Available Only
            </button>
          </div>
        </div>

        {/* Selected Skills Summary */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedSkills.size} skills selected
            {maxSkills && ` (max ${maxSkills})`}
          </div>
          
          {showPricing && (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-400">Complexity:</span>
                <span className="ml-2 font-semibold text-white">{complexityScore}/10</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Monthly:</span>
                <span className="ml-2 font-semibold text-white">£{totalPrice}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skill Categories */}
      <div className="space-y-4">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition"
            >
              <div className="flex items-center">
                <category.icon className={`w-6 h-6 text-${category.color}-500 mr-3`} />
                <div className="text-left">
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-400 mr-3">
                  {category.skills.filter(s => selectedSkills.has(s.id)).length}/{category.skills.length}
                </span>
                {expandedCategories.has(category.id) ? (
                  <MinusIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <PlusIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedCategories.has(category.id) && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.skills.map(skill => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillToggle(skill)}
                      className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                        skill.isCore
                          ? 'bg-green-900/20 border-green-600'
                          : skill.isLocked
                          ? 'bg-gray-900/50 border-gray-700 cursor-not-allowed opacity-50'
                          : selectedSkills.has(skill.id)
                          ? 'bg-blue-900/30 border-blue-500'
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {skill.isCore ? (
                              <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                            ) : skill.isLocked ? (
                              <LockClosedIcon className="w-5 h-5 text-gray-500 mr-2" />
                            ) : selectedSkills.has(skill.id) ? (
                              <CheckIcon className="w-5 h-5 text-blue-500 mr-2" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-500 rounded mr-2" />
                            )}
                            <h4 className="font-medium text-white">{skill.name}</h4>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{skill.description}</p>
                          
                          {skill.isCore && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                              Core Skill
                            </span>
                          )}
                          
                          {skill.unavailableReason && (
                            <p className="text-xs text-red-400 mt-2">{skill.unavailableReason}</p>
                          )}
                          
                          {!skill.isCore && !skill.isLocked && showPricing && skill.priceImpact > 0 && (
                            <p className="text-xs text-blue-400 mt-2">
                              +£{skill.priceImpact}/month
                            </p>
                          )}
                        </div>
                        
                        {skill.complexity && (
                          <div className="ml-2 text-right">
                            <p className="text-xs text-gray-500">Complexity</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-3 mx-0.5 rounded ${
                                    i < skill.complexity
                                      ? 'bg-yellow-500'
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      {showPricing && selectedSkills.size > 0 && (
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Estimated Monthly Cost</h3>
              <p className="text-sm text-gray-300">
                Base product + {selectedSkills.size} selected skills
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">£{totalPrice}</p>
              <p className="text-sm text-gray-300">per month</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}