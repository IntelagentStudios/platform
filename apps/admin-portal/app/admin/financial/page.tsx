'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FinancialMetrics {
  revenue: {
    total: number;
    currency: string;
    period: string;
    transactions: number;
  };
  subscriptions: {
    active: number;
    mrr: number;
    arr: number;
  };
  customers: {
    total: number;
    new: number;
  };
  growth: {
    revenue: number;
    customers: number;
    mrr: number;
  };
}

interface MRRData {
  total: number;
  new: number;
  expansion: number;
  contraction: number;
  churn: number;
  net: number;
  byTier: Record<string, number>;
  trend: Array<{ month: string; value: number }>;
}

export default function FinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [mrrData, setMrrData] = useState<MRRData | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchFinancialData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      // Fetch main metrics
      const metricsResponse = await fetch(`/api/admin/finance?action=get_metrics&period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (metricsResponse.ok) {
        const result = await metricsResponse.json();
        if (result.success) {
          setMetrics(result.data);
        }
      }

      // Fetch MRR data
      const mrrResponse = await fetch('/api/admin/finance?action=get_mrr', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (mrrResponse.ok) {
        const result = await mrrResponse.json();
        if (result.success) {
          setMrrData(result.data);
        }
      }

      // Fetch revenue analytics
      const revenueResponse = await fetch(`/api/admin/finance?action=get_revenue&period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (revenueResponse.ok) {
        const result = await revenueResponse.json();
        if (result.success) {
          setRevenueData(result.data);
        }
      }

      // Fetch churn metrics
      const churnResponse = await fetch(`/api/admin/finance?action=get_churn&period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (churnResponse.ok) {
        const result = await churnResponse.json();
        if (result.success) {
          setChurnData(result.data);
        }
      }

      // Fetch recent transactions
      const transResponse = await fetch('/api/admin/finance?action=get_transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (transResponse.ok) {
        const result = await transResponse.json();
        if (result.success) {
          setTransactions(result.data.transactions || []);
        }
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (growth < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const COLORS = ['#A9BDCB', '#86efac', '#fbbf24', '#f87171', '#a78bfa'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-gray-500">Real-time financial metrics from Stripe</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchFinancialData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</p>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(metrics.growth.revenue)}`}>
                  {getGrowthIcon(metrics.growth.revenue)}
                  <span>{Math.abs(metrics.growth.revenue)}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.subscriptions.mrr)}</p>
                <p className="text-sm text-gray-500">ARR: {formatCurrency(metrics.subscriptions.arr)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{metrics.subscriptions.active}</p>
                <p className="text-sm text-gray-500">+{metrics.customers.new} new</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold">{metrics.revenue.transactions}</p>
                <p className="text-sm text-gray-500">This {period}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* MRR Breakdown & Trend */}
      {mrrData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">MRR Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total MRR</span>
                <span className="font-bold text-xl">{formatCurrency(mrrData.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">New MRR</span>
                <span className="text-green-500">+{formatCurrency(mrrData.new)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Expansion</span>
                <span className="text-blue-500">+{formatCurrency(mrrData.expansion)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Contraction</span>
                <span className="text-yellow-500">-{formatCurrency(mrrData.contraction)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Churn</span>
                <span className="text-red-500">-{formatCurrency(mrrData.churn)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Net MRR</span>
                  <span className={`font-bold text-xl ${mrrData.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {mrrData.net >= 0 ? '+' : ''}{formatCurrency(mrrData.net)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">MRR Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mrrData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line type="monotone" dataKey="value" stroke="#A9BDCB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Revenue by Tier & Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mrrData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Tier</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(mrrData.byTier).map(([tier, value]) => ({
                    name: tier.charAt(0).toUpperCase() + tier.slice(1),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(mrrData.byTier).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {churnData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Churn Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Churn Rate</span>
                <span className={`font-bold ${churnData.rate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {churnData.rate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Churned Customers</span>
                <span className="font-semibold">{churnData.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Lost Revenue</span>
                <span className="text-red-500">{formatCurrency(churnData.revenue)}</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500 mb-2">Churn by Tier</p>
                {Object.entries(churnData.byTier).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between items-center mb-1">
                    <span className="text-sm capitalize">{tier}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Customer</th>
                <th className="text-left py-2 px-4">Description</th>
                <th className="text-left py-2 px-4">Amount</th>
                <th className="text-left py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-2 px-4 text-sm">
                    {new Date(transaction.created).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 text-sm">{transaction.customer}</td>
                  <td className="py-2 px-4 text-sm">{transaction.description || 'Subscription'}</td>
                  <td className="py-2 px-4 text-sm font-semibold">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-2 px-4">
                    {transaction.status === 'succeeded' ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : transaction.status === 'pending' ? (
                      <Badge className="bg-yellow-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}