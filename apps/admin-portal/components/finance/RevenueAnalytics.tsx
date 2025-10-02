'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface RevenueAnalyticsProps {
  period?: string;
  customerId?: string;
}

export function RevenueAnalytics({ period = '30d', customerId }: RevenueAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any>(null);
  const [customerLTV, setCustomerLTV] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period, customerId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch revenue breakdown
      const breakdownRes = await fetch(
        `/api/admin/finance/metrics?metric=revenue_breakdown&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (breakdownRes.ok) {
        const result = await breakdownRes.json();
        if (result.success) {
          setRevenueBreakdown(result.data);
        }
      }

      // Fetch customer LTV
      const ltvRes = await fetch(
        `/api/admin/finance/metrics?metric=customer_ltv&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (ltvRes.ok) {
        const result = await ltvRes.json();
        if (result.success) {
          setCustomerLTV(result.data);
        }
      }

      // Fetch payment methods
      const methodsRes = await fetch(
        `/api/admin/finance/metrics?metric=payment_methods`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (methodsRes.ok) {
        const result = await methodsRes.json();
        if (result.success) {
          setPaymentMethods(result.data);
        }
      }

      // Fetch failed payments
      const failedRes = await fetch(
        `/api/admin/finance/metrics?metric=failed_payments&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (failedRes.ok) {
        const result = await failedRes.json();
        if (result.success) {
          setFailedPayments(result.data.payments || []);
        }
      }

      // Fetch forecast
      const forecastRes = await fetch(
        `/api/admin/finance/metrics?metric=forecasting&months=3`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (forecastRes.ok) {
        const result = await forecastRes.json();
        if (result.success) {
          setForecast(result.data);
        }
      }

      // Fetch cohort analysis
      const cohortRes = await fetch(
        `/api/admin/finance/metrics?metric=cohort_analysis`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (cohortRes.ok) {
        const result = await cohortRes.json();
        if (result.success) {
          setCohortData(result.data);
        }
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const COLORS = ['#A9BDCB', '#86efac', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa'];

  const exportReport = async (format: string) => {
    try {
      const response = await fetch('/api/admin/finance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          action: 'export_report',
          params: { format, period }
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Handle download
        if (result.data?.url) {
          window.open(result.data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="breakdown">Revenue</TabsTrigger>
          <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
          <TabsTrigger value="methods">Payments</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="cohort">Cohort</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          {revenueBreakdown && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Gross Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(revenueBreakdown.gross)}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Net Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(revenueBreakdown.net)}
                      </p>
                      <p className="text-xs text-gray-500">
                        After fees: {formatCurrency(revenueBreakdown.fees)}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Refunds</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(revenueBreakdown.refunds)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {revenueBreakdown.refundCount} transactions
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue by Product</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBreakdown.byProduct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#A9BDCB" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="ltv" className="space-y-4">
          {customerLTV && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Average LTV</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(customerLTV.average)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Median LTV</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(customerLTV.median)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Top 10% LTV</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(customerLTV.top10Percent)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">CAC Payback</p>
                  <p className="text-2xl font-bold">
                    {customerLTV.cacPaybackMonths} months
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">LTV by Tier</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerLTV.byTier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="ltv" fill="#86efac" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">LTV:CAC Ratio Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerLTV.ltvCacTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ratio" stroke="#A9BDCB" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#fbbf24" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          {paymentMethods && (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Methods Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods.distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethods.distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Success Rates</h4>
                    {paymentMethods.successRates.map((method: any) => (
                      <div key={method.name} className="flex justify-between items-center">
                        <span className="text-sm">{method.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={method.rate > 0.95 ? 'default' : 'secondary'}>
                            {formatPercentage(method.rate)}
                          </Badge>
                          {method.trend > 0 ? (
                            <ChevronUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Processing Fees</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={paymentMethods.feesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="fees" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Failed Payments</h3>
              <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
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
                    <th className="text-left py-2 px-4">Amount</th>
                    <th className="text-left py-2 px-4">Reason</th>
                    <th className="text-left py-2 px-4">Retry</th>
                  </tr>
                </thead>
                <tbody>
                  {failedPayments.map((payment: any) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-4 text-sm">
                        {new Date(payment.created).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 text-sm">{payment.customer}</td>
                      <td className="py-2 px-4 text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant="destructive">
                          {payment.reason}
                        </Badge>
                      </td>
                      <td className="py-2 px-4">
                        <Button size="sm" variant="outline">
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          {forecast && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500">3-Month Forecast</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(forecast.threeMonth)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {formatPercentage(forecast.confidence)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Growth Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(forecast.growthRate / 100)}
                  </p>
                  <p className="text-xs text-gray-500">Monthly average</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Year-End Projection</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(forecast.yearEnd)}
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={forecast.projection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area 
                      type="monotone" 
                      dataKey="historical" 
                      stroke="#A9BDCB" 
                      fill="#A9BDCB" 
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="#86efac" 
                      fill="#86efac" 
                      fillOpacity={0.3}
                      strokeDasharray="5 5" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4">
          {cohortData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cohort Retention Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4">Cohort</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="text-center py-2 px-2">
                          M{i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.cohorts?.map((cohort: any) => (
                      <tr key={cohort.month} className="border-b">
                        <td className="py-2 px-4 font-medium">{cohort.month}</td>
                        {cohort.retention.map((value: number, index: number) => (
                          <td 
                            key={index} 
                            className="text-center py-2 px-2"
                            style={{
                              backgroundColor: `rgba(169, 189, 203, ${value / 100})`,
                              color: value > 50 ? 'white' : 'inherit'
                            }}
                          >
                            {value}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}