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

  const invoices: any[] = [];

  const paymentMethods: any[] = [];

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
        {/* Current Plan */}
        <div 
          className="rounded-lg p-6 border mb-8"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Current Plan
              </h2>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                  {user?.license_type === 'pro_platform' ? 'Pro Platform' : 'Platform'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs"
                     style={{ 
                       backgroundColor: 'rgba(76, 175, 80, 0.2)',
                       color: '#4CAF50'
                     }}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                    All 4 products included
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                    License expires: {user?.license_expires ? new Date(user.license_expires).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                    $599/year
                  </span>
                </div>
              </div>
            </div>
            <button
              className="px-4 py-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                border: '1px solid rgba(169, 189, 203, 0.2)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              Manage Subscription
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