'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard,
  Download,
  CheckCircle,
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
  Receipt
} from 'lucide-react';

export default function BillingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    // Check authentication
        fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
    
    // Get user data
    fetch('/api/auth/secure')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      });
  }, []);

  // Mock subscriptions data - in production this would come from Stripe
  useEffect(() => {
    // Simulate fetching subscription data
    const mockSubscriptions = [
      {
        id: 'sub_chatbot_1',
        product: 'AI Chatbot',
        price: '£349/month',
        status: 'active',
        startDate: '2025-01-01',
        nextBilling: '2025-02-01',
        features: ['24/7 Support', 'Custom Training', 'Analytics Dashboard']
      },
      {
        id: 'sub_platform_1',
        product: 'Platform License',
        price: '£599/year',
        status: 'active',
        startDate: '2024-12-15',
        nextBilling: '2025-12-15',
        features: ['All Core Features', 'Priority Support', 'API Access']
      },
      {
        id: 'sub_analytics_1',
        product: 'Advanced Analytics',
        price: '£199/month',
        status: 'active',
        startDate: '2025-01-15',
        nextBilling: '2025-02-15',
        features: ['Custom Reports', 'Predictive Analytics', 'Data Export']
      }
    ];
    setSubscriptions(mockSubscriptions);
  }, []);

  const invoices: any[] = [];
  const paymentMethods: any[] = [];

  // Calculate total monthly cost
  const calculateTotalMonthly = () => {
    let total = 0;
    subscriptions.forEach(sub => {
      if (sub.price.includes('/month')) {
        const amount = parseInt(sub.price.replace('£', '').replace('/month', ''));
        total += amount;
      } else if (sub.price.includes('/year')) {
        const amount = parseInt(sub.price.replace('£', '').replace('/year', ''));
        total += Math.round(amount / 12);
      }
    });
    return total;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            Billing
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Manage your subscription and payment methods
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Subscription Overview */}
        <div
          className="rounded-lg p-6 border mb-8"
          style={{
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Subscription Overview
              </h2>
              <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                You have {subscriptions.length} active subscriptions
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Total Monthly</p>
              <p className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                £{calculateTotalMonthly()}
              </p>
            </div>
          </div>

          {/* Active Subscriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {sub.product}
                  </h3>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      color: '#4CAF50'
                    }}
                  >
                    Active
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Price</span>
                    <span className="font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                      {sub.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Next billing</span>
                    <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                      {new Date(sub.nextBilling).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <p className="text-xs mb-2" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Includes:</p>
                  {sub.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" style={{ color: 'rgba(76, 175, 80, 0.6)' }} />
                      <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full mt-3 px-3 py-1.5 rounded text-xs transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(169, 189, 203)'
                  }}
                >
                  Manage
                </button>
              </div>
            ))}
          </div>

          {/* Unified Billing Notice */}
          <div
            className="mt-4 p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 193, 7, 0.05)',
              borderLeft: '3px solid #FFC107'
            }}
          >
            <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              <strong>Pro Tip:</strong> Consider upgrading to our unified billing plan to save 20% on multiple products.
              All your subscriptions would be consolidated into a single monthly payment.
            </p>
            <button
              className="mt-2 text-sm font-medium hover:underline"
              style={{ color: '#FFC107' }}
            >
              Learn about unified billing →
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex space-x-8">
            {['overview', 'invoices', 'payment-methods'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 transition-all ${
                  activeTab === tab ? 'border-current' : 'border-transparent'
                }`}
                style={{ 
                  color: activeTab === tab ? 'rgb(169, 189, 203)' : 'rgba(229, 227, 220, 0.6)'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Overview */}
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Usage This Month
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>API Calls</span>
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>- / Unlimited</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: '0%', backgroundColor: 'rgb(169, 189, 203)' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Active Users</span>
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>- / Unlimited</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: '30%', backgroundColor: 'rgb(169, 189, 203)' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Storage</span>
                    <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>- / 1TB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: '0%', backgroundColor: 'rgb(169, 189, 203)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Summary */}
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Billing Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Current Period</span>
                  <span style={{ color: 'rgb(229, 227, 220)' }}>Jan 1 - Dec 31, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Next Payment</span>
                  <span style={{ color: 'rgb(229, 227, 220)' }}>Jan 1, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Amount</span>
                  <span className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>$599.00</span>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" style={{ color: '#4CAF50' }} />
                    <span style={{ color: '#4CAF50' }}>Auto-renewal enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                No invoices yet
              </div>
            ) : invoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="rounded-lg p-4 border flex items-center justify-between"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <div className="flex items-center space-x-4">
                  <Receipt className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                  <div>
                    <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      {invoice.description}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                      {invoice.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                    {invoice.amount}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                       style={{ 
                         backgroundColor: 'rgba(76, 175, 80, 0.2)',
                         color: '#4CAF50'
                       }}>
                    {invoice.status}
                  </span>
                  <button
                    className="p-2 rounded-lg transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.1)',
                      color: 'rgb(169, 189, 203)'
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'payment-methods' && (
          <div className="space-y-4">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                No payment methods configured
              </div>
            ) : (
              <>
                {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className="rounded-lg p-4 border flex items-center justify-between"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: method.isDefault ? 'rgba(169, 189, 203, 0.3)' : 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                  <div>
                    <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      {method.type} •••• {method.last4}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                      Expires {method.expires}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {method.isDefault && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                         style={{ 
                           backgroundColor: 'rgba(169, 189, 203, 0.2)',
                           color: 'rgb(169, 189, 203)'
                         }}>
                      Default
                    </span>
                  )}
                  <button
                    className="px-3 py-1 rounded text-sm transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      color: 'rgba(229, 227, 220, 0.8)'
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
                ))}
                <button
                  className="w-full py-3 rounded-lg border-2 border-dashed transition hover:opacity-80"
                  style={{ 
                    borderColor: 'rgba(169, 189, 203, 0.2)',
                    color: 'rgba(229, 227, 220, 0.6)'
                  }}
                >
                  + Add Payment Method
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}