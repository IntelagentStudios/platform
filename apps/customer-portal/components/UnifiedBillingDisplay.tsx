'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  ChartBarIcon,
  CubeIcon,
  LinkIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import {
  calculateUnifiedBilling,
  getSkillOverlap,
  recommendComplementaryProducts,
  calculateUsageBasedPricing,
  type ProductWithSkills,
  type UnifiedBillingResult
} from '../utils/unifiedBilling';

interface UnifiedBillingDisplayProps {
  products: ProductWithSkills[];
  platformIntelligence?: boolean;
  onAddProduct?: (productId: string) => void;
  availableProducts?: ProductWithSkills[];
}

export default function UnifiedBillingDisplay({
  products,
  platformIntelligence = false,
  onAddProduct,
  availableProducts = []
}: UnifiedBillingDisplayProps) {
  const [billingResult, setBillingResult] = useState<UnifiedBillingResult | null>(null);
  const [skillOverlap, setSkillOverlap] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [usagePricing, setUsagePricing] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      // Calculate unified billing
      const result = calculateUnifiedBilling(products);
      setBillingResult(result);

      // Calculate skill overlap
      const overlap = getSkillOverlap(products);
      setSkillOverlap(overlap);

      // Get recommendations
      if (availableProducts.length > 0) {
        const recs = recommendComplementaryProducts(products, availableProducts);
        setRecommendations(recs);
      }

      // Calculate usage-based pricing
      const usage = calculateUsageBasedPricing(products, platformIntelligence);
      setUsagePricing(usage);
    }
  }, [products, platformIntelligence, availableProducts]);

  if (!billingResult) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Unified Billing</h2>
            <p className="text-sm text-gray-400">
              Pay once for shared skills across all products
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Main Pricing Display */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Total Cost */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Monthly Total</span>
            {billingResult.savings > 0 && (
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                Save £{Math.round(billingResult.savings)}/mo
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white">
            £{Math.round(billingResult.totalMonthlyPrice)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} • {billingResult.uniqueSkills.size} unique skills
          </p>
        </div>

        {/* Skill Deduplication Savings */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Skill Sharing Benefit</span>
            <SparklesIcon className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {billingResult.sharedSkills.size} shared
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Skills used across multiple products
          </p>
        </div>
      </div>

      {/* Product Breakdown */}
      {showDetails && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">Product Breakdown</h3>
          {billingResult.breakdown.map((item, idx) => (
            <div key={idx} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{item.productName}</h4>
                <span className="text-lg font-bold text-white">
                  £{Math.round(item.effectivePrice)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base Price</span>
                  <p className="text-white">£{item.basePrice}</p>
                </div>
                <div>
                  <span className="text-gray-500">Unique Skills</span>
                  <p className="text-white">{item.uniqueSkillsCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Shared Skills</span>
                  <p className="text-green-400">{item.sharedSkillsCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Allocation */}
      {usagePricing && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Included Usage</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">
                  {formatNumber(usagePricing.monthlyTokenAllocation)} tokens/month
                </p>
                <p className="text-xs text-gray-400">
                  £{usagePricing.pricePerMillionTokens}/million after allocation
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">
                  {formatNumber(usagePricing.includedAPIcalls)} API calls/month
                </p>
                <p className="text-xs text-gray-400">
                  £{usagePricing.pricePerThousandAPICalls}/1000 after included
                </p>
              </div>
            </div>
          </div>
          {platformIntelligence && (
            <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
              <LightBulbIcon className="h-4 w-4" />
              <span>+50% bonus allocation with Platform Intelligence</span>
            </div>
          )}
        </div>
      )}

      {/* Skill Overlap Visualization */}
      {skillOverlap && skillOverlap.totalOverlap > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Skill Efficiency Matrix</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              Total overlapping skills: {skillOverlap.totalOverlap}
            </span>
            <span className="text-sm text-green-400">
              Efficiency Score: {Math.round((skillOverlap.totalOverlap / billingResult.uniqueSkills.size) * 100)}%
            </span>
          </div>
          <div className="relative">
            <div className="grid grid-cols-3 gap-2">
              {products.map((product, idx) => (
                <div
                  key={idx}
                  className="text-center p-2 bg-gray-700/50 rounded text-xs text-white"
                >
                  {product.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Smart Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-4 border border-green-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{rec.product.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {rec.sharedSkillsCount} shared skills • Save £{rec.potentialSavings}/mo
                    </p>
                  </div>
                  {onAddProduct && (
                    <button
                      onClick={() => onAddProduct(rec.product.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                    >
                      Add Product
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Intelligence Upsell */}
      {!platformIntelligence && products.length >= 2 && (
        <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="h-6 w-6 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-white">Unlock Platform Intelligence</h4>
              <p className="text-sm text-gray-300 mt-1">
                Connect your {products.length} products with unified intelligence for 10x efficiency.
                Get 50% more tokens and API calls included.
              </p>
              <button className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}