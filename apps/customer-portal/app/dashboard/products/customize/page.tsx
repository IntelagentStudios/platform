'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CubeIcon, 
  RocketLaunchIcon, 
  BeakerIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  CurrencyPoundIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

function CustomizeProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productType = searchParams.get('type') || 'chatbot';
  const productKey = searchParams.get('key'); // For editing existing

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [customization, setCustomization] = useState({
    name: '',
    description: '',
    type: ''
  });
  const [pricing, setPricing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'customize' | 'skills' | 'pricing'>('customize');

  useEffect(() => {
    fetchSkillsAvailability();
  }, [productType, productKey]);

  useEffect(() => {
    if (selectedSkills.size > 0) {
      calculatePricing();
    }
  }, [selectedSkills]);

  const fetchSkillsAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ productType });
      if (productKey) params.append('productKey', productKey);

      const response = await fetch(`/api/products/skills-availability?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setSkillsData(data);

      // Set initial selected skills (core + currently enabled)
      const initialSkills = new Set<string>();
      data.skills.core.forEach((s: any) => initialSkills.add(s.id));
      data.skills.included.forEach((s: any) => initialSkills.add(s.id));
      setSelectedSkills(initialSkills);

      // Set customization details if editing
      if (data.currentConfiguration) {
        setCustomization({
          name: data.currentConfiguration.customName || '',
          description: data.currentConfiguration.description || '',
          type: data.currentConfiguration.customizationType || ''
        });
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async () => {
    try {
      const response = await fetch('/api/products/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseProduct: productType,
          selectedSkills: Array.from(selectedSkills),
          billingCycle: 'monthly'
        })
      });

      const data = await response.json();
      setPricing(data);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const toggleSkill = (skillId: string, canToggle: boolean) => {
    if (!canToggle) return;

    const newSelection = new Set(selectedSkills);
    if (newSelection.has(skillId)) {
      newSelection.delete(skillId);
    } else {
      newSelection.add(skillId);
    }
    setSelectedSkills(newSelection);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productKey: productKey || `${productType}_${Date.now()}`,
          baseProduct: productType,
          customizationType: customization.type || getDefaultType(),
          customName: customization.name || getProductName(),
          description: customization.description,
          selectedSkills: Array.from(selectedSkills)
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Go to checkout if new product
        if (!productKey) {
          router.push(`/dashboard/checkout?product=${data.configuration.productKey}`);
        } else {
          router.push('/dashboard/products');
        }
      }
    } catch (error) {
      console.error('Error saving customization:', error);
    } finally {
      setSaving(false);
    }
  };

  const getProductIcon = () => {
    switch (productType) {
      case 'chatbot': return <CubeIcon className="w-8 h-8" />;
      case 'sales_outreach': return <RocketLaunchIcon className="w-8 h-8" />;
      case 'onboarding': return <BeakerIcon className="w-8 h-8" />;
      default: return <CubeIcon className="w-8 h-8" />;
    }
  };

  const getProductName = () => {
    switch (productType) {
      case 'chatbot': return 'AI Chatbot';
      case 'sales_outreach': return 'Sales Outreach Agent';
      case 'onboarding': return 'Onboarding Agent';
      default: return 'Custom Product';
    }
  };

  const getDefaultType = () => {
    switch (productType) {
      case 'chatbot': return 'support_bot';
      case 'sales_outreach': return 'lead_generator';
      case 'onboarding': return 'employee_onboarding';
      default: return 'custom';
    }
  };

  const customizationTypes = {
    chatbot: [
      { id: 'support_bot', name: 'Customer Support', description: 'Handle customer inquiries and issues' },
      { id: 'knowledge_base', name: 'Internal Knowledge', description: 'Company wiki and documentation' },
      { id: 'sales_assistant', name: 'Sales Assistant', description: 'Qualify leads and book meetings' },
      { id: 'training_bot', name: 'Training Bot', description: 'Employee training and onboarding' }
    ],
    sales_outreach: [
      { id: 'lead_generator', name: 'Lead Generation', description: 'Find and qualify new prospects' },
      { id: 'email_campaigns', name: 'Email Campaigns', description: 'Automated email sequences' },
      { id: 'crm_automation', name: 'CRM Automation', description: 'Sync and update CRM records' },
      { id: 'pipeline_manager', name: 'Pipeline Manager', description: 'Manage sales pipeline stages' }
    ],
    onboarding: [
      { id: 'employee_onboarding', name: 'Employee Onboarding', description: 'New hire setup and training' },
      { id: 'customer_onboarding', name: 'Customer Onboarding', description: 'Client setup and activation' },
      { id: 'vendor_onboarding', name: 'Vendor Management', description: 'Supplier onboarding process' },
      { id: 'compliance_onboarding', name: 'Compliance', description: 'Regulatory compliance checks' }
    ]
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mr-4">
                {getProductIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Customize {getProductName()}
                </h1>
                <p className="text-gray-400">
                  Select skills and configure your product
                </p>
              </div>
            </div>
            
            {pricing && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Monthly Price</p>
                <p className="text-3xl font-bold text-white">
                  £{(pricing.pricing.total / 100).toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">
                  {pricing.metrics.selectedSkillsCount} skills selected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('customize')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'customize'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 inline mr-2" />
            Customize
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'skills'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SparklesIcon className="w-5 h-5 inline mr-2" />
            Skills ({selectedSkills.size})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'pricing'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CurrencyPoundIcon className="w-5 h-5 inline mr-2" />
            Pricing
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Customize Tab */}
          {activeTab === 'customize' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={customization.name}
                  onChange={(e) => setCustomization({ ...customization, name: e.target.value })}
                  placeholder={getProductName()}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={customization.description}
                  onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                  placeholder="Describe how you'll use this product..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Configuration Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customizationTypes[productType as keyof typeof customizationTypes]?.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setCustomization({ ...customization, type: type.id })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        customization.type === type.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{type.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                        </div>
                        {customization.type === type.id && (
                          <CheckIcon className="w-5 h-5 text-blue-500 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && skillsData && (
            <div className="space-y-6">
              {/* Core Skills */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Core Skills ({skillsData.skills.core.length})
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  These skills are essential and cannot be removed
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillsData.skills.core.map((skill: any) => (
                    <div
                      key={skill.id}
                      className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{skill.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Skills */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Available Skills ({skillsData.skills.available.length})
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add these skills to enhance your product
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...skillsData.skills.included, ...skillsData.skills.available].map((skill: any) => (
                    <div
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id, skill.canToggle)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        selectedSkills.has(skill.id)
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      } ${!skill.canToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {selectedSkills.has(skill.id) ? (
                            <CheckIcon className="w-5 h-5 text-blue-400" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-500 rounded" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{skill.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                          {skill.priceImpact > 0 && (
                            <p className="text-xs text-blue-400 mt-1">
                              +£{(skill.priceImpact / 100).toFixed(0)}/month
                            </p>
                          )}
                          {skill.unavailableReason && (
                            <p className="text-xs text-red-400 mt-1">{skill.unavailableReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium/Locked Skills */}
              {(skillsData.skills.premium.length > 0 || skillsData.skills.locked.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Premium Skills
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Upgrade your plan to access these advanced skills
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                    {[...skillsData.skills.premium, ...skillsData.skills.locked].map((skill: any) => (
                      <div
                        key={skill.id}
                        className="p-3 bg-gray-700 rounded-lg border border-gray-600 relative"
                      >
                        <div className="absolute top-2 right-2">
                          <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                            {skill.tier}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <XMarkIcon className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-300 text-sm">{skill.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{skill.unavailableReason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && pricing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Base Price</p>
                  <p className="text-2xl font-bold text-white">
                    £{(pricing.pricing.basePrice / 100).toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Skills Add-on</p>
                  <p className="text-2xl font-bold text-white">
                    +£{(pricing.pricing.skillsAddon / 100).toFixed(0)}
                  </p>
                </div>
                <div className="bg-blue-600 rounded-lg p-4">
                  <p className="text-sm text-white/80 mb-1">Total Monthly</p>
                  <p className="text-2xl font-bold text-white">
                    £{(pricing.pricing.total / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Pricing Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Base {getProductName()}</span>
                    <span className="text-white">£{(pricing.pricing.basePrice / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      Additional Skills ({selectedSkills.size - skillsData.skills.core.length})
                    </span>
                    <span className="text-white">£{(pricing.pricing.skillsAddon / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Token Usage Estimate</span>
                    <span className="text-white">£{(pricing.pricing.tokenCost / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Complexity Score</span>
                    <span className="text-white">{pricing.metrics.complexityScore}/10</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">Total Monthly</span>
                      <span className="font-semibold text-white">
                        £{(pricing.pricing.total / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      Save 20% with annual billing. Your estimated annual cost would be{' '}
                      <span className="font-semibold text-white">
                        £{((pricing.pricing.total * 12 * 0.8) / 100).toFixed(0)}
                      </span>{' '}
                      (saving £{((pricing.pricing.total * 12 * 0.2) / 100).toFixed(0)})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : productKey ? 'Save Changes' : 'Continue to Checkout'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CustomizeProductPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <CustomizeProductContent />
    </Suspense>
  );
}