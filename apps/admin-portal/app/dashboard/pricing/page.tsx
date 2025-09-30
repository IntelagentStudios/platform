'use client';

import { useState, useEffect } from 'react';
import {
  CurrencyPoundIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BoltIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface SkillTier {
  tier: string;
  basePrice: number;
  usageIncluded: number;
  overageRate: number;
  description: string;
}

interface PlatformStats {
  totalUsers: number;
  averageSkillsPerUser: number;
  mostPopularTier: string;
  totalMonthlyRevenue: number;
  usageBasedRevenue: number;
}

interface UserUsage {
  userId: string;
  month: string;
  usage: Array<{ skillId: string; executions: number }>;
  totalExecutions: number;
}

export default function PricingManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [skillTiers, setSkillTiers] = useState<Record<string, SkillTier>>({});
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricingData();
    fetchPlatformStats();
  }, []);

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/admin/pricing?action=pricing-tiers', {
        headers: { 'authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const data = await response.json();
        setSkillTiers(data.skillTiers);
      }
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch('/api/admin/pricing?action=platform-analytics', {
        headers: { 'authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const stats = await response.json();
        setPlatformStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    }
  };

  const fetchUserUsage = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pricing?action=user-usage&userId=${userId}`, {
        headers: { 'authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const usage = await response.json();
        setUserUsage(usage);
      }
    } catch (error) {
      console.error('Failed to fetch user usage:', error);
    }
    setLoading(false);
  };

  const updateSkillTier = async (skillId: string, newTier: string) => {
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          action: 'update-skill-tier',
          data: { skillId, tier: newTier }
        })
      });

      if (response.ok) {
        fetchPricingData();
      }
    } catch (error) {
      console.error('Failed to update skill tier:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'basic': return 'rgb(156, 163, 175)';
      case 'standard': return 'rgb(59, 130, 246)';
      case 'advanced': return 'rgb(168, 85, 247)';
      case 'premium': return 'rgb(236, 72, 153)';
      case 'enterprise': return 'rgb(251, 146, 60)';
      default: return 'rgb(169, 189, 203)';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(38, 44, 44)', color: 'rgb(229, 227, 220)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CurrencyPoundIcon className="h-7 w-7" style={{ color: 'rgb(169, 189, 203)' }} />
            Pricing Management
          </h1>
          <div className="flex gap-2">
            {['overview', 'tiers', 'usage', 'billing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg transition capitalize"
                style={{
                  backgroundColor: activeTab === tab ? 'rgba(169, 189, 203, 0.2)' : 'transparent',
                  border: activeTab === tab ? '1px solid rgb(169, 189, 203)' : '1px solid rgba(169, 189, 203, 0.3)',
                  color: activeTab === tab ? 'rgb(229, 227, 220)' : 'rgba(229, 227, 220, 0.7)'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && platformStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Revenue Card */}
            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                <CurrencyPoundIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                £{platformStats.totalMonthlyRevenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowTrendingUpIcon className="h-4 w-4" style={{ color: 'rgb(34, 197, 94)' }} />
                <span style={{ color: 'rgb(34, 197, 94)' }}>+12.5% from last month</span>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Users</h3>
                <UserGroupIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                {platformStats.totalUsers}
              </div>
              <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                Avg {platformStats.averageSkillsPerUser.toFixed(1)} skills per user
              </div>
            </div>

            {/* Popular Tier Card */}
            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Most Popular Tier</h3>
                <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              </div>
              <div className="text-2xl font-bold mb-2 capitalize" style={{ color: getTierColor(platformStats.mostPopularTier) }}>
                {platformStats.mostPopularTier}
              </div>
              <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                £{skillTiers[platformStats.mostPopularTier]?.basePrice}/skill
              </div>
            </div>

            {/* Usage Revenue Card */}
            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Usage-Based Revenue</h3>
                <BoltIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                £{platformStats.usageBasedRevenue.toLocaleString()}
              </div>
              <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                From execution overages
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/30 rounded-xl p-6 lg:col-span-2" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Base Platform Fees</span>
                  <span className="font-semibold">£{(platformStats.totalUsers * 299).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Skill Subscriptions</span>
                  <span className="font-semibold">
                    £{(platformStats.totalMonthlyRevenue - platformStats.totalUsers * 299 - platformStats.usageBasedRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Usage Overages</span>
                  <span className="font-semibold">£{platformStats.usageBasedRevenue.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
                  <span className="font-semibold" style={{ color: 'rgb(169, 189, 203)' }}>Total MRR</span>
                  <span className="text-xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                    £{platformStats.totalMonthlyRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(skillTiers).map(([tierName, tier]) => (
              <div
                key={tierName}
                className="bg-gray-800/30 rounded-xl p-6"
                style={{ border: `2px solid ${getTierColor(tierName)}30` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold capitalize" style={{ color: getTierColor(tierName) }}>
                    {tierName}
                  </h3>
                  <span className="text-2xl font-bold">£{tier.basePrice}</span>
                </div>

                <p className="text-sm mb-4" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                  {tier.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Included Executions</span>
                    <span>{tier.usageIncluded.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Overage Rate</span>
                    <span>£{tier.overageRate}/execution</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Max Monthly Cost</span>
                    <span>£{(tier.basePrice + tier.usageIncluded * tier.overageRate).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="w-full mt-4 px-4 py-2 rounded-lg transition hover:opacity-80"
                  style={{
                    backgroundColor: `${getTierColor(tierName)}20`,
                    border: `1px solid ${getTierColor(tierName)}50`,
                    color: getTierColor(tierName)
                  }}
                >
                  Edit Tier
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/30 rounded-xl p-6 mb-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h3 className="text-lg font-semibold mb-4">User Usage Lookup</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter user ID or email"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(48, 54, 54, 0.5)',
                    border: '1px solid rgba(169, 189, 203, 0.3)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
                <button
                  onClick={() => fetchUserUsage(selectedUser)}
                  disabled={!selectedUser || loading}
                  className="px-6 py-2 rounded-lg transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(38, 44, 44)'
                  }}
                >
                  {loading ? 'Loading...' : 'Fetch Usage'}
                </button>
              </div>
            </div>

            {userUsage && (
              <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                <h3 className="text-lg font-semibold mb-4">
                  Usage Report for {userUsage.userId}
                </h3>
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.3)' }}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                        {userUsage.totalExecutions.toLocaleString()}
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                        Total Executions
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                        {userUsage.usage.length}
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                        Active Skills
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                        {userUsage.month}
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                        Period
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium mb-2">Skills Usage</h4>
                  {userUsage.usage.map(skill => (
                    <div
                      key={skill.skillId}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(58, 64, 64, 0.2)' }}
                    >
                      <span className="font-medium">{skill.skillId.replace(/_/g, ' ')}</span>
                      <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {skill.executions.toLocaleString()} executions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 rounded-lg text-left transition hover:opacity-80" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  border: '1px solid rgba(169, 189, 203, 0.3)'
                }}>
                  <div className="font-medium">Apply Discount</div>
                  <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    Apply percentage discount to user subscription
                  </div>
                </button>
                <button className="w-full px-4 py-3 rounded-lg text-left transition hover:opacity-80" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  border: '1px solid rgba(169, 189, 203, 0.3)'
                }}>
                  <div className="font-medium">Set Usage Limits</div>
                  <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    Configure monthly execution limits
                  </div>
                </button>
                <button className="w-full px-4 py-3 rounded-lg text-left transition hover:opacity-80" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  border: '1px solid rgba(169, 189, 203, 0.3)'
                }}>
                  <div className="font-medium">Generate Invoice</div>
                  <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    Create manual invoice for user
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
              <h3 className="text-lg font-semibold mb-4">Billing Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                    Base Platform Fee
                  </label>
                  <div className="flex items-center gap-2">
                    <span>£</span>
                    <input
                      type="number"
                      defaultValue="299"
                      className="flex-1 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'rgba(48, 54, 54, 0.5)',
                        border: '1px solid rgba(169, 189, 203, 0.3)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                    <span>/month</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                    Billing Cycle
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      border: '1px solid rgba(169, 189, 203, 0.3)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  >
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annually</option>
                  </select>
                </div>

                <button
                  className="w-full px-4 py-2 rounded-lg transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(38, 44, 44)'
                  }}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}