'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BoltIcon,
  CheckIcon,
  ChartBarIcon,
  LinkIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  LockClosedIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';

export default function PlatformIntelligenceUpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'standard' | 'premium' | 'enterprise'>('standard');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/platform/intelligence', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setEligibility(data);
      
      if (data.hasSubscription) {
        // Already has Platform Intelligence
        router.push('/dashboard/platform');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // First activate Platform Intelligence
      const activateResponse = await fetch('/api/platform/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: selectedTier })
      });

      if (!activateResponse.ok) {
        throw new Error('Failed to activate Platform Intelligence');
      }

      // Then create Stripe checkout for payment
      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productType: 'platform_intelligence',
          productName: `Platform Intelligence - ${selectedTier}`,
          customPrice: getTierPrice(selectedTier) * 100, // Convert to pence
          billing: 'monthly'
        })
      });

      const checkoutData = await checkoutResponse.json();
      
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to process upgrade. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case 'standard': return 999;
      case 'premium': return 1499;
      case 'enterprise': return 2999;
      default: return 999;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <BoltIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Platform Intelligence Not Available Yet
            </h1>
            <p className="text-gray-400 mb-6">
              {eligibility?.eligibilityReason || 'You need at least 2 active products to enable Platform Intelligence.'}
            </p>
            <button
              onClick={() => router.push('/marketplace')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Browse Products
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tiers = [
    {
      id: 'standard',
      name: 'Standard',
      price: 999,
      features: [
        'Unified Analytics Dashboard',
        'Cross-Product Insights',
        'Workflow Orchestration',
        'Intelligent Task Routing',
        'Up to 10 products',
        '100 workflows/month',
        'Email support'
      ],
      notIncluded: ['Predictive Analytics', 'Custom Reporting', 'API Access']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 1499,
      popular: true,
      features: [
        'Everything in Standard',
        'Predictive Analytics',
        'Custom Report Builder',
        'Advanced ML Insights',
        'Up to 25 products',
        '500 workflows/month',
        'Priority support'
      ],
      notIncluded: ['API Access', 'Dedicated Success Manager']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 2999,
      features: [
        'Everything in Premium',
        'Full API Access',
        'Dedicated Success Manager',
        'Custom Integrations',
        'Unlimited products',
        'Unlimited workflows',
        'White-glove support',
        'SLA guarantees'
      ],
      notIncluded: []
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-4">
            <BoltIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Unlock Platform Intelligence
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Connect your {eligibility?.preview?.productsToConnect || '2+'} products into one intelligent system.
            Unlock insights and automation that transform your business.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {eligibility?.preview?.potentialSynergies?.map((synergy: any, idx: number) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-6">
              <LinkIcon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {synergy.type}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {synergy.description}
              </p>
              <p className="text-sm font-semibold text-green-400">
                {synergy.efficiency}
              </p>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        {eligibility?.preview?.estimatedROI && (
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 mb-12 border border-green-500/30">
            <h3 className="text-xl font-bold text-white mb-4">
              Your Estimated ROI
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Time Savings</p>
                <p className="text-2xl font-bold text-white">
                  {eligibility.preview.estimatedROI.timeSavings} hrs/week
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Efficiency Gain</p>
                <p className="text-2xl font-bold text-white">
                  +{eligibility.preview.estimatedROI.efficiencyGain}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Cost Reduction</p>
                <p className="text-2xl font-bold text-white">
                  £{eligibility.preview.estimatedROI.costReduction}/mo
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Year 1 ROI</p>
                <p className="text-2xl font-bold text-green-400">
                  {eligibility.preview.estimatedROI.yearOneROI}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id as any)}
              className={`relative rounded-lg p-6 cursor-pointer transition-all ${
                selectedTier === tier.id
                  ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-blue-500'
                  : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">£{tier.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature, idx) => (
                  <li key={idx} className="flex items-start opacity-50">
                    <LockClosedIcon className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {selectedTier === tier.id && (
                <div className="absolute inset-x-6 bottom-6">
                  <div className="bg-blue-600 text-white text-center py-2 rounded-lg">
                    Selected
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="bg-gray-800 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">
            What You'll Get
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(eligibility?.preview?.features || {}).map(([key, feature]: [string, any]) => (
              <div key={key} className="flex items-start">
                <SparklesIcon className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                  <p className="text-sm text-gray-400 mb-2">{feature.description}</p>
                  <p className="text-sm text-blue-400">{feature.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg transition disabled:opacity-50 inline-flex items-center"
          >
            {processing ? 'Processing...' : `Upgrade to ${tiers.find(t => t.id === selectedTier)?.name}`}
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
          <p className="text-sm text-gray-400 mt-4">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}