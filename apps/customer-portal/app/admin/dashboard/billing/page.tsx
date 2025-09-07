'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Calendar,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface BillingData {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    mrr: number;
    arr: number;
    growth: {
      monthly: number;
      quarterly: number;
      yearly: number;
    };
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    cancelled: number;
    paused: number;
    distribution: Array<{
      plan: string;
      count: number;
      revenue: number;
    }>;
  };
  transactions: Array<{
    id: string;
    date: Date;
    customer: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    type: 'subscription' | 'one-time' | 'refund';
    description: string;
  }>;
  metrics: {
    arpu: number; // Average Revenue Per User
    ltv: number; // Lifetime Value
    cac: number; // Customer Acquisition Cost
    churnRate: number;
    retentionRate: number;
    paymentFailureRate: number;
  };
  upcoming: {
    renewals: number;
    expirations: number;
    trials: number;
    amount: number;
  };
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showTransactions, setShowTransactions] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [timeRange]);

  const fetchBillingData = async () => {
    setRefreshing(true);
    try {
      // Fetch billing data from Finance Agent
      const response = await fetch('/api/admin/stats/financial');
      const data = await response.json();
      
      // Transform and enrich the data
      const enrichedData = transformBillingData(data);
      setBillingData(enrichedData);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const transformBillingData = (data: any): BillingData => {
    // This would normally come from the Finance Agent
    return {
      revenue: {
        total: data.totalRevenue || 45780,
        recurring: data.recurringRevenue || 38500,
        oneTime: data.oneTimeRevenue || 7280,
        mrr: data.mrr || 3850,
        arr: data.arr || 46200,
        growth: {
          monthly: data.monthlyGrowth || 12.5,
          quarterly: data.quarterlyGrowth || 35.2,
          yearly: data.yearlyGrowth || 145.8
        }
      },
      subscriptions: {
        total: data.totalSubscriptions || 156,
        active: data.activeSubscriptions || 142,
        trial: data.trialSubscriptions || 8,
        cancelled: data.cancelledSubscriptions || 4,
        paused: data.pausedSubscriptions || 2,
        distribution: [
          { plan: 'Pro Platform', count: 45, revenue: 13455 },
          { plan: 'Platform', count: 67, revenue: 10050 },
          { plan: 'Starter', count: 30, revenue: 2250 },
          { plan: 'Enterprise', count: 14, revenue: 12745 }
        ]
      },
      transactions: [
        {
          id: 'TXN-001',
          date: new Date(Date.now() - 1000 * 60 * 30),
          customer: 'Acme Corp',
          amount: 299,
          status: 'completed',
          type: 'subscription',
          description: 'Pro Platform - Monthly'
        },
        {
          id: 'TXN-002',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2),
          customer: 'Tech Solutions Inc',
          amount: 599,
          status: 'completed',
          type: 'one-time',
          description: 'Setup & Onboarding'
        },
        {
          id: 'TXN-003',
          date: new Date(Date.now() - 1000 * 60 * 60 * 5),
          customer: 'StartupXYZ',
          amount: 149,
          status: 'pending',
          type: 'subscription',
          description: 'Platform - Monthly'
        },
        {
          id: 'TXN-004',
          date: new Date(Date.now() - 1000 * 60 * 60 * 8),
          customer: 'Enterprise Co',
          amount: 999,
          status: 'completed',
          type: 'subscription',
          description: 'Enterprise - Monthly'
        },
        {
          id: 'TXN-005',
          date: new Date(Date.now() - 1000 * 60 * 60 * 12),
          customer: 'Small Business LLC',
          amount: -75,
          status: 'completed',
          type: 'refund',
          description: 'Partial refund - Service credit'
        }
      ],
      metrics: {
        arpu: data.arpu || 247.18,
        ltv: data.ltv || 2965,
        cac: data.cac || 185,
        churnRate: data.churnRate || 2.8,
        retentionRate: data.retentionRate || 97.2,
        paymentFailureRate: data.paymentFailureRate || 1.2
      },
      upcoming: {
        renewals: 23,
        expirations: 5,
        trials: 8,
        amount: 8450
      }
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'failed': return '#f44336';
      case 'refunded': return '#9C27B0';
      default: return 'rgba(48, 54, 54, 0.6)';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'rgb(48, 54, 54)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Billing & Revenue
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Financial overview managed by Finance Agent
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ 
              backgroundColor: 'white',
              borderColor: 'rgba(48, 54, 54, 0.2)',
              color: 'rgb(48, 54, 54)'
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="365d">Last Year</option>
          </select>
          <button
            onClick={fetchBillingData}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgb(48, 54, 54)',
              color: 'white'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
              Total Revenue
            </span>
            <DollarSign className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {formatCurrency(billingData?.revenue.total || 0)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-4 h-4" style={{ color: '#4CAF50' }} />
            <span className="text-sm" style={{ color: '#4CAF50' }}>
              +{billingData?.revenue.growth.monthly || 0}% this month
            </span>
          </div>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
              MRR
            </span>
            <TrendingUp className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {formatCurrency(billingData?.revenue.mrr || 0)}
          </div>
          <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            ARR: {formatCurrency(billingData?.revenue.arr || 0)}
          </div>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
              Active Subscriptions
            </span>
            <Users className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {billingData?.subscriptions.active || 0}
          </div>
          <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            {billingData?.subscriptions.trial || 0} trials, {billingData?.subscriptions.cancelled || 0} cancelled
          </div>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
              ARPU
            </span>
            <BarChart3 className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            {formatCurrency(billingData?.metrics.arpu || 0)}
          </div>
          <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
            LTV: {formatCurrency(billingData?.metrics.ltv || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Subscription Distribution
          </h3>
          <div className="space-y-4">
            {billingData?.subscriptions.distribution.map((plan, index) => {
              const percentage = (plan.revenue / (billingData?.revenue.recurring || 1)) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                      {plan.plan}
                    </span>
                    <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                      {plan.count} users • {formatCurrency(plan.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0'][index]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Churn Rate
              </div>
              <div className="text-xl font-bold flex items-center gap-1" style={{ 
                color: (billingData?.metrics.churnRate || 0) > 5 ? '#f44336' : 'rgb(48, 54, 54)' 
              }}>
                {billingData?.metrics.churnRate || 0}%
                {(billingData?.metrics.churnRate || 0) <= 3 && 
                  <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
                }
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Retention Rate
              </div>
              <div className="text-xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {billingData?.metrics.retentionRate || 0}%
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                CAC
              </div>
              <div className="text-xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                {formatCurrency(billingData?.metrics.cac || 0)}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}>
              <div className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                Payment Failures
              </div>
              <div className="text-xl font-bold flex items-center gap-1" style={{ 
                color: (billingData?.metrics.paymentFailureRate || 0) > 2 ? '#FF9800' : 'rgb(48, 54, 54)' 
              }}>
                {billingData?.metrics.paymentFailureRate || 0}%
                {(billingData?.metrics.paymentFailureRate || 0) > 2 && 
                  <AlertCircle className="w-4 h-4" style={{ color: '#FF9800' }} />
                }
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
            Upcoming (Next 30 Days)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" 
                 style={{ backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" style={{ color: '#4CAF50' }} />
                <span className="text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                  Renewals
                </span>
              </div>
              <div>
                <span className="font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {billingData?.upcoming.renewals || 0}
                </span>
                <span className="text-sm ml-2" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  subscriptions
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" 
                 style={{ backgroundColor: 'rgba(255, 152, 0, 0.05)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#FF9800' }} />
                <span className="text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                  Trial Endings
                </span>
              </div>
              <div>
                <span className="font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {billingData?.upcoming.trials || 0}
                </span>
                <span className="text-sm ml-2" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  trials
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" 
                 style={{ backgroundColor: 'rgba(244, 67, 54, 0.05)' }}>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4" style={{ color: '#f44336' }} />
                <span className="text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                  Expirations
                </span>
              </div>
              <div>
                <span className="font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
                  {billingData?.upcoming.expirations || 0}
                </span>
                <span className="text-sm ml-2" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  licenses
                </span>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t" style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
              <div className="flex justify-between">
                <span className="text-sm font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                  Expected Revenue
                </span>
                <span className="font-bold" style={{ color: '#4CAF50' }}>
                  {formatCurrency(billingData?.upcoming.amount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="p-4 border-b flex items-center justify-between" 
               style={{ borderColor: 'rgba(48, 54, 54, 0.15)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
              Recent Transactions
            </h3>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="text-sm"
              style={{ color: 'rgba(48, 54, 54, 0.6)' }}
            >
              {showTransactions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          {showTransactions && (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="divide-y" style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
                {billingData?.transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                            {transaction.customer}
                          </span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: `${getStatusColor(transaction.status)}20`,
                              color: getStatusColor(transaction.status)
                            }}
                          >
                            {transaction.status}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                          {transaction.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ 
                          color: transaction.amount < 0 ? '#f44336' : '#4CAF50' 
                        }}>
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}