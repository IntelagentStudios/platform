'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, Package, Calendar, AlertCircle, CheckCircle2,
  Download, ChevronRight, Zap, Shield, TrendingUp, 
  Clock, DollarSign, Users, BarChart3, Receipt, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  products: string[];
  limits: {
    chatbotConversations: number;
    salesAgentLeads: number;
    enrichmentCredits: number;
    teamMembers: number;
    apiCalls: number;
  };
  usage: {
    chatbotConversations: number;
    salesAgentLeads: number;
    enrichmentCredits: number;
    teamMembers: number;
    apiCalls: number;
  };
  billing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    nextPaymentDate: string;
    paymentMethod?: {
      type: string;
      last4: string;
      brand: string;
    };
  };
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

const plans = [
  {
    name: 'Starter',
    id: 'starter',
    price: { monthly: 49, yearly: 470 },
    description: 'Perfect for small businesses',
    features: [
      '1,000 chatbot conversations/mo',
      '500 sales leads/mo',
      '100 enrichment credits/mo',
      '2 team members',
      '10,000 API calls/mo',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Growth',
    id: 'growth',
    price: { monthly: 149, yearly: 1430 },
    description: 'For growing companies',
    features: [
      '10,000 chatbot conversations/mo',
      '2,500 sales leads/mo',
      '1,000 enrichment credits/mo',
      '5 team members',
      '100,000 API calls/mo',
      'Priority support',
      'Advanced analytics',
      'Custom integrations'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { monthly: 499, yearly: 4790 },
    description: 'For large organizations',
    features: [
      'Unlimited chatbot conversations',
      'Unlimited sales leads',
      '10,000 enrichment credits/mo',
      'Unlimited team members',
      'Unlimited API calls',
      'Dedicated support',
      'Custom AI training',
      'SLA guarantee',
      'White-label options'
    ],
    popular: false
  }
];

export default function BillingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [subRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/invoices')
      ]);

      if (subRes.ok && invoicesRes.ok) {
        const subData = await subRes.json();
        const invoicesData = await invoicesRes.json();
        
        setSubscription(subData.subscription);
        setInvoices(invoicesData.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: billingPeriod
        })
      });

      if (response.ok) {
        toast({
          title: 'Plan Upgraded',
          description: 'Your subscription has been upgraded successfully',
        });
        setShowUpgradeDialog(false);
        await fetchBillingData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upgrade plan',
        variant: 'destructive'
      });
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription will end at the end of the current billing period',
        });
        await fetchBillingData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        a.click();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      });
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription, billing, and usage
        </p>
      </div>

      {/* Current Plan Overview */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
                <p className="text-sm text-gray-500">
                  ${subscription.billing.amount}/{subscription.billing.interval}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Period</p>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Next payment: {new Date(subscription.billing.nextPaymentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                {subscription.billing.paymentMethod ? (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">
                      {subscription.billing.paymentMethod.brand} •••• {subscription.billing.paymentMethod.last4}
                    </span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Add Payment Method
                  </Button>
                )}
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your resource consumption</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Chatbot Conversations</span>
                  <span className="text-sm text-gray-600">
                    {subscription.usage.chatbotConversations} / {subscription.limits.chatbotConversations === -1 ? '∞' : subscription.limits.chatbotConversations}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscription.usage.chatbotConversations, subscription.limits.chatbotConversations)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Sales Leads</span>
                  <span className="text-sm text-gray-600">
                    {subscription.usage.salesAgentLeads} / {subscription.limits.salesAgentLeads === -1 ? '∞' : subscription.limits.salesAgentLeads}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscription.usage.salesAgentLeads, subscription.limits.salesAgentLeads)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Enrichment Credits</span>
                  <span className="text-sm text-gray-600">
                    {subscription.usage.enrichmentCredits} / {subscription.limits.enrichmentCredits}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscription.usage.enrichmentCredits, subscription.limits.enrichmentCredits)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">API Calls</span>
                  <span className="text-sm text-gray-600">
                    {subscription.usage.apiCalls} / {subscription.limits.apiCalls === -1 ? '∞' : subscription.limits.apiCalls}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(subscription.usage.apiCalls, subscription.limits.apiCalls)}
                  className="h-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans & Pricing */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border p-1">
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${plan.price[billingPeriod]}
                    </span>
                    <span className="text-gray-600">/{billingPeriod}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={subscription?.plan === plan.id ? 'outline' : 'default'}
                    disabled={subscription?.plan === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {subscription?.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {invoices.map(invoice => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">Invoice #{invoice.number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.date).toLocaleDateString()} • ${invoice.amount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(invoice.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {invoices.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Invoices Yet</h3>
                <p className="text-gray-600">
                  Your invoices will appear here after your first payment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription?.billing.paymentMethod ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {subscription.billing.paymentMethod.brand} ending in {subscription.billing.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-gray-600">Default payment method</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Payment Method</h3>
                  <p className="text-gray-600 mb-4">
                    Add a payment method to enable automatic billing
                  </p>
                  <Button onClick={() => setShowPaymentDialog(true)}>
                    Add Payment Method
                  </Button>
                </div>
              )}

              {subscription && !subscription.cancelAtPeriodEnd && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Danger Zone</h4>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={cancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              You're upgrading to the {selectedPlan} plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Your new plan will be activated immediately and you'll be charged a prorated amount.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Immediate access to new features and limits</li>
                <li>• Prorated charge for the remainder of the billing period</li>
                <li>• Your next bill will reflect the new plan price</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade}>
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}