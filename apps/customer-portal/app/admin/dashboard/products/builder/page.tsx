'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Plus, Save, X, Search, Check, 
  DollarSign, Sparkles, AlertCircle, ArrowRight,
  Layers, Zap, TrendingUp, Users, Mail, Database,
  Cpu, MessageSquare, ChevronRight
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  isPremium?: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  basePrice: number;
  selectedSkills: string[];
  features: string[];
}

const PRODUCT_CATEGORIES = [
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'sales', name: 'Sales & CRM', icon: Users },
  { id: 'marketing', name: 'Marketing', icon: Mail },
  { id: 'data', name: 'Data & Analytics', icon: Database },
  { id: 'automation', name: 'Automation', icon: Cpu },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp }
];

export default function ProductBuilder() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    basePrice: 99,
    selectedSkills: [],
    features: []
  });
  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (formData.selectedSkills.length > 0) {
      calculatePrice();
    }
  }, [formData.selectedSkills]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/admin/skills?includeStats=false');
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculatePrice',
          basePrice: formData.basePrice,
          skillIds: formData.selectedSkills
        })
      });
      const data = await response.json();
      setPriceCalculation(data);
    } catch (error) {
      console.error('Failed to calculate price:', error);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter(id => id !== skillId)
        : [...prev.selectedSkills, skillId]
    }));
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.description || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createProduct',
          ...formData,
          skillIds: formData.selectedSkills
        })
      });
      
      if (response.ok) {
        alert('Product created successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          basePrice: 99,
          selectedSkills: [],
          features: []
        });
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Builder</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create custom products by combining skills
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Product Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Smart Analytics Suite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Describe what this product does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Price Calculation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Price Calculation
            </h2>
            
            {priceCalculation ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                  <span className="font-medium">${priceCalculation.basePrice}</span>
                </div>
                
                {priceCalculation.premiumSkillCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Premium Skills ({priceCalculation.premiumSkillCount}):
                    </span>
                    <span className="font-medium">${priceCalculation.premiumSkillCost}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Price:</span>
                    <span className="text-xl font-bold text-purple-600">
                      ${priceCalculation.totalPrice}/mo
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select skills to calculate price</p>
            )}
          </div>

          {/* Selected Skills Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">
              Selected Skills ({formData.selectedSkills.length})
            </h2>
            
            {formData.selectedSkills.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.selectedSkills.map(skillId => {
                  const skill = skills.find(s => s.id === skillId);
                  if (!skill) return null;
                  
                  return (
                    <div
                      key={skillId}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="text-sm truncate">{skill.name}</span>
                      <button
                        onClick={() => handleSkillToggle(skillId)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No skills selected</p>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProduct}
            disabled={saving || !formData.name || !formData.category}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Create Product
              </>
            )}
          </button>
        </div>

        {/* Right: Skills Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Select Skills</h2>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="communication">Communication</option>
                  <option value="data_processing">Data Processing</option>
                  <option value="integration">Integration</option>
                  <option value="ai_ml">AI & ML</option>
                  <option value="automation">Automation</option>
                  <option value="utility">Utility</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>

            {/* Skills List */}
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {category.replace(/_/g, ' ')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categorySkills.map(skill => (
                          <div
                            key={skill.id}
                            className={`
                              p-4 border rounded-lg cursor-pointer transition-all
                              ${formData.selectedSkills.includes(skill.id)
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }
                            `}
                            onClick={() => handleSkillToggle(skill.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                    {skill.name}
                                  </h4>
                                  {skill.isPremium && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                                      Premium
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {skill.description}
                                </p>
                              </div>
                              
                              <div className="ml-3">
                                {formData.selectedSkills.includes(skill.id) ? (
                                  <div className="h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}