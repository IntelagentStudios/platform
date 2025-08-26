'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Activity, 
  DollarSign,
  CheckCircle,
  Settings,
  BarChart3,
  Zap,
  FileText,
  Package
} from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication using JWT endpoint
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
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

  // Get user's products from their profile
  const userProducts = user?.products || ['chatbot'];
  
  const stats = [
    { label: 'Total Revenue', value: '-', change: '-', icon: DollarSign },
    { label: 'Active Users', value: '-', change: '-', icon: Users },
    { label: 'API Calls', value: '-', change: '-', icon: Activity },
    { label: 'Products', value: userProducts.length.toString(), change: 'Active', icon: Package }
  ];

  // Define all possible products
  const allProductsMap = {
    'chatbot': { name: 'Chatbot', status: 'Ready', icon: Zap },
    'sales-agent': { name: 'Sales Agent', status: 'Ready', icon: Users },
    'data-enrichment': { name: 'Data Enrichment', status: 'Ready', icon: BarChart3 },
    'setup-agent': { name: 'Setup Agent', status: 'Ready', icon: Settings }
  };
  
  // Filter to only show user's products
  const products = userProducts.map(productId => 
    allProductsMap[productId] || { name: productId, status: 'Ready', icon: Package }
  ).filter(Boolean);

  return (
    <DashboardLayout>
      {/* Top Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Overview
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Welcome back, {user?.name || 'Harry'}. Here's your overview.
            </p>
          </div>
          <div className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Success Alert */}
        <div 
          className="rounded-lg p-4 mb-6 flex items-center space-x-3"
          style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgba(169, 189, 203, 0.2)' }}
        >
          <CheckCircle className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          <span style={{ color: 'rgb(229, 227, 220)' }}>
            You are successfully logged in to your Pro Platform dashboard
          </span>
        </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="rounded-lg p-6 border"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                    {stat.label}
                  </span>
                  <stat.icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: 'rgb(229, 227, 220)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products List */}
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Your Products
              </h2>
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      borderColor: 'rgba(169, 189, 203, 0.2)'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}>
                        <product.icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                          {product.name}
                        </div>
                        <div className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                          {product.status}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (product.name === 'Chatbot') {
                          window.location.href = '/products/chatbot/setup-agent';
                        } else {
                          window.location.href = '/products';
                        }
                      }}
                      className="px-3 py-1 rounded text-sm transition hover:opacity-80 cursor-pointer"
                      style={{ 
                        backgroundColor: 'rgb(169, 189, 203)',
                        color: 'rgb(48, 54, 54)'
                      }}
                    >
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Email</div>
                  <div style={{ color: 'rgb(229, 227, 220)' }}>{user?.email || 'harry@intelagentstudios.com'}</div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>License Key</div>
                  <div className="font-mono text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
                    {user?.license_key || 'INTL-AGNT-BOSS-MODE'}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Plan</div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                       style={{ 
                         backgroundColor: 'rgba(169, 189, 203, 0.2)',
                         color: 'rgb(169, 189, 203)'
                       }}>
                    {user?.license_type === 'pro_platform' ? 'Pro Platform' : 'Platform'}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Status</div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                       style={{ 
                         backgroundColor: 'rgba(76, 175, 80, 0.2)',
                         color: '#4CAF50'
                       }}>
                    Active
                  </div>
                </div>
                {user?.license_expires && (
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Expires</div>
                    <div style={{ color: 'rgb(229, 227, 220)' }}>
                      {new Date(user.license_expires).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="mt-8 rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'rgba(73, 90, 88, 0.3)',
              borderColor: 'rgba(169, 189, 203, 0.2)'
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                className="p-4 rounded-lg text-center transition hover:opacity-80 border"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
                }}
              >
                <FileText className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Documentation</span>
              </button>
              <button 
                className="p-4 rounded-lg text-center transition hover:opacity-80 border"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
                }}
              >
                <BarChart3 className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>View Analytics</span>
              </button>
              <button 
                className="p-4 rounded-lg text-center transition hover:opacity-80 border"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
                }}
              >
                <Users className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Manage Team</span>
              </button>
              <button 
                className="p-4 rounded-lg text-center transition hover:opacity-80 border"
                style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
                }}
              >
                <Package className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Add Product</span>
              </button>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}