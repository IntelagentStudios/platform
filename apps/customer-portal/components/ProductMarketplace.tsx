'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CubeIcon,
  SparklesIcon,
  UserGroupIcon,
  UserPlusIcon,
  HeartIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  CurrencyPoundIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  basePrice: number;
  minTier: string;
  coreSkills: string[];
  availableSkills: string[];
  isActive?: boolean;
  productKey?: string;
  customName?: string;
}

interface ProductMarketplaceProps {
  onProductActivated?: (product: any) => void;
}

const iconMap: Record<string, any> = {
  MessageSquare: ChatBubbleLeftRightIcon,
  Users: UserGroupIcon,
  UserPlus: UserPlusIcon,
  HeartHandshake: HeartIcon,
  ChartBar: ChartBarIcon,
  Cube: CubeIcon
};

const categoryColors: Record<string, string> = {
  communication: 'blue',
  sales: 'purple',
  automation: 'green',
  analytics: 'yellow',
  custom: 'gray'
};

export default function ProductMarketplace({ onProductActivated }: ProductMarketplaceProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [userTier, setUserTier] = useState('starter');
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        setUserTier(data.userTier);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProduct = async () => {
    if (!selectedTemplate) return;

    setActivating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          customName: customName || selectedTemplate.name,
          selectedSkills: selectedSkills,
          customSettings: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (onProductActivated) {
          onProductActivated(data.product);
        }

        // Navigate to the product dashboard
        router.push(data.dashboardUrl);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to activate product');
      }
    } catch (error) {
      console.error('Error activating product:', error);
      alert('Failed to activate product');
    } finally {
      setActivating(false);
    }
  };

  const calculatePrice = () => {
    if (!selectedTemplate) return 0;
    const additionalSkillsPrice = selectedSkills.length * 20;
    return selectedTemplate.basePrice + additionalSkillsPrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Product Marketplace</h2>
        <p className="text-blue-100">
          Activate powerful AI products to streamline your business operations
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-lg px-3 py-1">
            <span className="text-sm">Your Tier: </span>
            <span className="font-semibold capitalize">{userTier}</span>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1">
            <span className="text-sm">Active Products: </span>
            <span className="font-semibold">{templates.filter(t => t.isActive).length}</span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => {
          const Icon = iconMap[template.icon] || CubeIcon;
          const isLocked = userTier === 'starter' && template.minTier !== 'starter';
          const color = categoryColors[template.category] || 'gray';

          return (
            <div
              key={template.id}
              className={`bg-gray-800 rounded-lg overflow-hidden border-2 transition-all ${
                template.isActive
                  ? 'border-green-500'
                  : isLocked
                  ? 'border-gray-700 opacity-60'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Product Header */}
              <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 p-4`}>
                <div className="flex items-start justify-between">
                  <Icon className="w-8 h-8 text-white" />
                  {template.isActive && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                  {isLocked && (
                    <LockClosedIcon className="w-5 h-5 text-white/60" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mt-2">
                  {template.customName || template.name}
                </h3>
                <p className="text-sm text-white/80 mt-1">
                  {template.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Starting from</span>
                  <span className="text-xl font-bold text-white">
                    £{template.basePrice}/mo
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Core Features</p>
                  <div className="flex flex-wrap gap-1">
                    {template.coreSkills.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                      >
                        {skill.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {template.coreSkills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{template.coreSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {template.isActive ? (
                  <button
                    onClick={() => router.push(`/dashboard/${template.id.replace('-', '_')}`)}
                    className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center"
                  >
                    Open Dashboard
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                ) : isLocked ? (
                  <div className="text-center text-sm text-gray-500">
                    Requires {template.minTier} tier
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setCustomizing(true);
                      setCustomName(template.name);
                      setSelectedSkills([]);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <RocketLaunchIcon className="w-4 h-4 mr-2" />
                    Activate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customization Modal */}
      {customizing && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Activate {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Customize your product before activation
                  </p>
                </div>
                <button
                  onClick={() => setCustomizing(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Custom Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Custom Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedTemplate.name}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Additional Skills */}
                {selectedTemplate.availableSkills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Additional Skills (£20/mo each)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTemplate.availableSkills.map(skill => (
                        <label
                          key={skill}
                          className="flex items-center p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills([...selectedSkills, skill]);
                              } else {
                                setSelectedSkills(selectedSkills.filter(s => s !== skill));
                              }
                            }}
                            className="mr-3"
                          />
                          <span className="text-white text-sm">
                            {skill.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Pricing Summary</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Base Price</span>
                      <span className="text-white">£{selectedTemplate.basePrice}/mo</span>
                    </div>
                    {selectedSkills.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Additional Skills ({selectedSkills.length})
                        </span>
                        <span className="text-white">£{selectedSkills.length * 20}/mo</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-600">
                      <div className="flex justify-between">
                        <span className="font-semibold text-white">Total</span>
                        <span className="text-xl font-bold text-white">
                          £{calculatePrice()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setCustomizing(false)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActivateProduct}
                    disabled={activating}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {activating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <RocketLaunchIcon className="w-4 h-4 mr-2" />
                        Activate Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}