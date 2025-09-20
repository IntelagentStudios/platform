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
  Package,
  ShoppingCart,
  Cpu,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [productConfigs, setProductConfigs] = useState<any>({});
  const [userTier, setUserTier] = useState<string>('starter');

  useEffect(() => {
    console.log('[dashboard] Checking authentication...');
    // Check authentication using JWT endpoint
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          console.log(`[dashboard] Authenticated: ${data.user.email}, License: ${data.user.license_key}`);
          console.log(`[dashboard] User products from API:`, data.user.products);
          setIsAuthenticated(true);
          setUser(data.user);
          
          // Check user tier
          if (data.user.license_key) {
            fetch('/api/licenses/check', {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
              .then(res => res.json())
              .then(licenseData => {
                if (licenseData.tier) {
                  setUserTier(licenseData.tier);
                }
              })
              .catch(err => console.error('Failed to fetch license tier:', err));
          }
          
          // Fetch product configurations
          console.log('[dashboard] Fetching product configurations...');
          fetch('/api/products/check-keys', { credentials: 'include' })
            .then(res => res.json())
            .then(configData => {
              console.log('[dashboard] Raw config data:', configData);
              if (configData.success) {
                console.log('[dashboard] Product configurations:', configData.configurations);
                setProductConfigs(configData.configurations || {});
              } else {
                console.log('[dashboard] No configurations found');
                setProductConfigs({});
              }
            })
            .catch(err => {
              console.error('[dashboard] Failed to fetch product configurations:', err);
              setProductConfigs({});
            });
        } else {
          console.log('[dashboard] Not authenticated, redirecting to login');
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('[dashboard] Auth check failed:', err);
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
  // If products contains 'all', replace with actual product list
  let userProducts = (user?.products && Array.isArray(user.products)) ? user.products : ['chatbot', 'sales-outreach'];
  if (userProducts.includes('all')) {
    userProducts = ['chatbot', 'sales-outreach']; // Chatbot and Sales Outreach are implemented
  }
  console.log('[dashboard] Final userProducts:', userProducts);
  
  // Show real data where available, otherwise show no data
  const stats = [
    { label: 'Total Revenue', value: '-', change: 'No data', icon: DollarSign },
    { label: 'Active Users', value: '-', change: 'No data', icon: Users },
    { label: 'API Calls', value: '-', change: 'No data', icon: Activity },
    { label: 'Products', value: userProducts.length.toString(), change: 'Active', icon: Package }
  ];

  // Define only existing products
  const allProductsMap = {
    'chatbot': { name: 'Chatbot', status: 'Active', icon: Zap },
    'sales-outreach': { name: 'Sales Outreach', status: 'Active', icon: Users }
  };
  
  // Filter to only show user's products that actually exist
  const products = userProducts && Array.isArray(userProducts)
    ? userProducts
        .filter(productId => productId in allProductsMap) // Only include products that exist
        .map(productId => allProductsMap[productId])
    : [];

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
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/marketplace')}
                className="p-4 rounded-lg border hover:border-blue-500 transition-all group"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <ShoppingCart className="h-8 w-8 mb-2 group-hover:text-blue-400 transition" style={{ color: 'rgb(169, 189, 203)' }} />
                <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Marketplace</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Browse AI products</div>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/products/customize')}
                className="p-4 rounded-lg border hover:border-green-500 transition-all group"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <Settings className="h-8 w-8 mb-2 group-hover:text-green-400 transition" style={{ color: 'rgb(169, 189, 203)' }} />
                <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Customize Products</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Configure skills & features</div>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/platform/upgrade')}
                className="p-4 rounded-lg border hover:border-purple-500 transition-all group"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <Sparkles className="h-8 w-8 mb-2 group-hover:text-purple-400 transition" style={{ color: 'rgb(169, 189, 203)' }} />
                <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Platform Intelligence</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Connect all products</div>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/agent-builder')}
                className="p-4 rounded-lg border hover:border-orange-500 transition-all group relative"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                <Cpu className="h-8 w-8 mb-2 group-hover:text-orange-400 transition" style={{ color: 'rgb(169, 189, 203)' }} />
                <div className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>Agent Builder</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Build custom agents</div>
              </button>
            </div>
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
                {products.map((product, index) => {
                  const productKey = product.name.toLowerCase().replace(' ', '-');
                  const config = productConfigs[productKey];
                  const hasKey = config?.hasProductKey;
                  
                  console.log(`[dashboard] Product: ${product.name}, productKey: ${productKey}, config:`, config, 'hasKey:', hasKey);
                  
                  // Logic based on product ownership and status
                  const isOwned = userProducts.includes(product.name.toLowerCase().replace(/\s+/g, '-'));
                  const isPurchaseRequired = product.status === 'Purchase Required';
                  const isComingSoon = product.status === 'Coming Soon';
                  
                  const statusText = hasKey ? 'Active' : 
                                    isComingSoon ? 'Coming Soon' :
                                    isPurchaseRequired && !isOwned ? 'Purchase Required' :
                                    'Ready to configure';
                  const statusColor = hasKey ? '#4CAF50' : 
                                     isComingSoon ? '#FF9800' :
                                     isPurchaseRequired && !isOwned ? '#2196F3' :
                                     'rgb(169, 189, 203)';
                  const buttonText = hasKey ? 'Manage' : 
                                    isComingSoon ? 'Coming Soon' :
                                    isPurchaseRequired && !isOwned ? 'Purchase' :
                                    'Configure';
                  const buttonColor = hasKey ? '#4CAF50' : 
                                     isComingSoon ? '#999' :
                                     isPurchaseRequired && !isOwned ? '#2196F3' :
                                     'rgb(169, 189, 203)';
                  
                  return (
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
                          <div className="text-sm" style={{ color: statusColor }}>
                            {statusText}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (isComingSoon) {
                            return; // Do nothing for coming soon
                          }
                          
                          if (isPurchaseRequired && !isOwned) {
                            // Route to pricing page for purchase
                            window.location.href = '/pricing';
                            return;
                          }
                          
                          // Route to setup page for configuration or management page if configured
                          if (hasKey) {
                            // Route to manage pages for configured products
                            if (product.name === 'Chatbot') {
                              window.location.href = '/products/chatbot/dashboard';
                            } else if (product.name === 'Sales Outreach') {
                              window.location.href = '/dashboard/sales';
                            } else if (product.name === 'Onboarding Agent') {
                              window.location.href = '/products/onboarding-agent/manage';
                            }
                          } else {
                            // Route to setup pages
                            if (product.name === 'Chatbot') {
                              window.location.href = '/products/chatbot/configure';
                            } else if (product.name === 'Sales Outreach') {
                              window.location.href = '/dashboard/sales/onboarding';
                            } else if (product.name === 'Onboarding Agent') {
                              window.location.href = '/products/onboarding-agent/setup';
                            }
                          }
                        }}
                        disabled={isComingSoon}
                        className="px-3 py-1 rounded text-sm transition hover:opacity-80 cursor-pointer"
                        style={{ 
                          backgroundColor: buttonColor,
                          color: buttonColor === '#4CAF50' ? 'white' : 'rgb(48, 54, 54)'
                        }}
                      >
                        {buttonText}
                      </button>
                    </div>
                  );
                })}
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