'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, SparklesIcon, CubeIcon, RocketLaunchIcon, BeakerIcon, ArrowRightIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { StarIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function MarketplacePage() {
  const router = useRouter();
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchMarketplaceContext();
  }, []);

  const fetchMarketplaceContext = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/marketplace/context', { headers });
      const data = await response.json();
      setContext(data);
    } catch (error) {
      console.error('Error fetching context:', error);
      // Set default guest context
      setContext({ isAuthenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (productType: string) => {
    if (!context?.isAuthenticated) {
      // Guest - go to signup/checkout
      router.push(`/signup?product=${productType}`);
    } else {
      // Authenticated - go to customization
      router.push(`/dashboard/products/customize?type=${productType}`);
    }
  };

  const handlePlatformUpgrade = () => {
    if (!context?.isAuthenticated) {
      router.push('/signup');
    } else {
      router.push('/dashboard/platform/upgrade');
    }
  };

  const handleCustomAgent = () => {
    if (!context?.isAuthenticated) {
      router.push('/signup?product=custom');
    } else {
      router.push('/dashboard/agent-builder');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading marketplace...</div>
      </div>
    );
  }

  const baseProducts = [
    {
      id: 'chatbot',
      name: 'AI Chatbot',
      icon: <CubeIcon className="w-8 h-8" />,
      basePrice: 299,
      description: 'Intelligent conversational AI that adapts to your needs',
      coreSkills: 30,
      customizations: ['Customer Support', 'Internal Knowledge', 'Sales Assistant', 'Training Bot'],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'sales_outreach',
      name: 'Sales Outreach Agent',
      icon: <RocketLaunchIcon className="w-8 h-8" />,
      basePrice: 499,
      description: 'Automated sales engine for growth',
      coreSkills: 60,
      customizations: ['Lead Generation', 'Email Campaigns', 'CRM Automation', 'Pipeline Management'],
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'onboarding',
      name: 'Onboarding Agent',
      icon: <BeakerIcon className="w-8 h-8" />,
      basePrice: 399,
      description: 'Streamline any onboarding process',
      coreSkills: 40,
      customizations: ['Employee Onboarding', 'Customer Onboarding', 'Vendor Management', 'Compliance'],
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  // Filter products based on what user already has
  const availableProducts = context?.isAuthenticated 
    ? baseProducts.filter(p => !context.currentProducts?.some((cp: any) => cp.productType === p.id))
    : baseProducts;

  const ownedProducts = context?.isAuthenticated
    ? baseProducts.filter(p => context.currentProducts?.some((cp: any) => cp.productType === p.id))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {context?.isAuthenticated ? 'Your Marketplace' : 'AI Products Marketplace'}
              </h1>
              <p className="mt-2 text-gray-400">
                {context?.isAuthenticated 
                  ? `Welcome back! You have ${context.currentProducts?.length || 0} active products.`
                  : 'Build your perfect AI workforce with modular, customizable products'}
              </p>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-4 py-2 rounded-md transition ${
                  selectedBilling === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling('annual')}
                className={`px-4 py-2 rounded-md transition ${
                  selectedBilling === 'annual' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className="ml-1 text-xs text-green-400">Save 20%</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recommendations for authenticated users */}
        {context?.isAuthenticated && context.recommendedUpgrades?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Recommended for You</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {context.recommendedUpgrades.slice(0, 3).map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30"
                >
                  <div className="flex items-start justify-between mb-4">
                    <SparklesIcon className="w-8 h-8 text-yellow-400" />
                    {rec.priority === 'high' && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">High Priority</span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{rec.title}</h3>
                  <p className="text-gray-300 mb-4">{rec.description}</p>
                  {rec.monthlyPrice && (
                    <p className="text-2xl font-bold text-white mb-4">
                      £{rec.monthlyPrice}
                      <span className="text-sm text-gray-400">/month</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (rec.type === 'platform_intelligence') handlePlatformUpgrade();
                      else if (rec.type === 'new_product') handleProductClick(rec.productType);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center"
                  >
                    {rec.cta}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Products */}
        {availableProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {context?.isAuthenticated ? 'Available Products' : 'Choose Your AI Products'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-800 rounded-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-500"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${product.gradient} mb-4`}>
                    {product.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-gray-400 mb-4">{product.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Includes:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                        {product.coreSkills} core skills
                      </li>
                      {product.customizations.slice(0, 2).map((custom, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-300">
                          <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                          {custom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-white">
                      £{selectedBilling === 'annual' ? Math.round(product.basePrice * 0.8) : product.basePrice}
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>

                  <button
                    onClick={() => handleProductClick(product.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition font-semibold"
                  >
                    Customize & Deploy
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Owned Products - Show upgrade options */}
        {ownedProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Your Products</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ownedProducts.map((product) => {
                const config = context.currentProducts.find((cp: any) => cp.productType === product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-gray-800 rounded-xl p-6 border border-green-500/30 relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${product.gradient} mb-4`}>
                      {product.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {config?.customization?.name || product.name}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {config?.customization?.skillsCount || product.coreSkills} skills active
                    </p>
                    
                    <button
                      onClick={() => router.push(`/dashboard/products/${config?.productKey}/customize`)}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
                    >
                      Manage & Customize
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Platform Intelligence Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center mb-4">
                  <BoltIcon className="w-10 h-10 text-yellow-400 mr-3" />
                  <h2 className="text-3xl font-bold text-white">Platform Intelligence</h2>
                </div>
                <p className="text-gray-300 mb-4">
                  Connect all your products into one intelligent system. 
                  Unlock cross-product insights, workflow automation, and 10x efficiency.
                </p>
                
                {context?.platformIntelligence?.eligible ? (
                  <div className="space-y-2">
                    <p className="text-green-400 font-semibold">✓ You're eligible!</p>
                    <p className="text-sm text-gray-400">
                      Connect your {context.platformIntelligence.currentProductCount} products for unified intelligence
                    </p>
                  </div>
                ) : (
                  <p className="text-yellow-400">
                    {context?.isAuthenticated 
                      ? `Add ${2 - (context?.currentProducts?.length || 0)} more product(s) to unlock`
                      : 'Available with 2+ products'}
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">
                  £{selectedBilling === 'annual' ? '799' : '999'}
                  <span className="text-lg text-gray-400">/month</span>
                </p>
                <button
                  onClick={handlePlatformUpgrade}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    context?.platformIntelligence?.eligible
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!context?.platformIntelligence?.eligible && context?.isAuthenticated}
                >
                  {context?.platformIntelligence?.eligible ? 'Upgrade Now' : 'Learn More'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Agent Builder */}
        <section>
          <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-2xl p-8 border border-orange-500/30">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center mb-4">
                  <StarIcon className="w-10 h-10 text-orange-400 mr-3" />
                  <h2 className="text-3xl font-bold text-white">Custom Agent Builder</h2>
                </div>
                <p className="text-gray-300 mb-4">
                  Build completely custom AI agents using our library of {context?.customAgentBuilder?.skillsAvailable || '300+'} skills.
                  Perfect for unique business processes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                    Choose from use-case templates or build from scratch
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                    Pay only for the skills you use
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                    Full customization and control
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">
                  From £{selectedBilling === 'annual' ? '639' : '799'}
                  <span className="text-lg text-gray-400">/month</span>
                </p>
                <button
                  onClick={handleCustomAgent}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
                >
                  Start Building
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Potential Savings for authenticated users */}
        {context?.isAuthenticated && context.pricing?.potentialSavings && (
          <section className="mt-12">
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 Potential Savings</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {context.pricing.potentialSavings.annual && (
                  <div>
                    <p className="text-gray-300">Switch to annual billing</p>
                    <p className="text-2xl font-bold text-green-400">
                      Save £{context.pricing.potentialSavings.annual.amount.toFixed(0)}/year
                    </p>
                  </div>
                )}
                {context.pricing.potentialSavings.bundle && (
                  <div>
                    <p className="text-gray-300">Bundle your products</p>
                    <p className="text-2xl font-bold text-green-400">
                      Save £{context.pricing.potentialSavings.bundle.amount.toFixed(0)}/month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}