'use client';

import { useEffect, useState } from 'react';
import { 
  Shield, 
  Package, 
  LogOut, 
  Users, 
  Activity, 
  DollarSign,
  CheckCircle,
  Settings,
  BarChart3,
  Zap,
  Home,
  FileText,
  CreditCard
} from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    // Try secure auth first
    fetch('/api/auth/secure')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          // Fallback to simple auth
          return fetch('/api/auth/simple').then(res => res.json());
        }
      })
      .then(fallbackData => {
        if (fallbackData && !user) {
          setIsAuthenticated(fallbackData.authenticated);
          if (!fallbackData.authenticated) {
            window.location.href = '/login';
          }
          // Try to get user from sessionStorage
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  const handleLogout = async () => {
    // Call logout endpoint
    await fetch('/api/auth/secure', { method: 'DELETE' });
    // Clear cookies
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    sessionStorage.removeItem('user');
    window.location.href = '/login';
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

  const stats = [
    { label: 'Total Revenue', value: '$45,231', change: '+20.1%', icon: DollarSign },
    { label: 'Active Users', value: '2,350', change: '+180', icon: Users },
    { label: 'API Calls', value: '12.5M', change: '+12%', icon: Activity },
    { label: 'Products', value: '4', change: 'Active', icon: Package }
  ];

  const products = [
    { name: 'Chatbot', status: 'Active', icon: Zap },
    { name: 'Sales Agent', status: 'Active', icon: Users },
    { name: 'Data Enrichment', status: 'Active', icon: BarChart3 },
    { name: 'Setup Agent', status: 'Active', icon: Settings }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Sidebar Navigation */}
      <aside className="w-64 min-h-screen" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(169, 189, 203)' }}>
              <Shield className="h-6 w-6" style={{ color: 'rgb(48, 54, 54)' }} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Intelagent
              </h2>
              <p className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                Pro Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: activeNav === item.id ? 'rgba(169, 189, 203, 0.2)' : 'transparent',
                    color: activeNav === item.id ? 'rgb(229, 227, 220)' : 'rgb(169, 189, 203)'
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-64 p-4 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                {user?.name || 'Harry'}
              </p>
              <p className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                {user?.email || 'harry@intelagentstudios.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition hover:opacity-80"
            style={{ 
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              border: '1px solid rgba(169, 189, 203, 0.3)',
              color: 'rgb(229, 227, 220)'
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-transparent px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgb(169, 189, 203)' }}>
                Welcome back, {user?.name || 'Harry'}. Here's your overview.
              </p>
            </div>
            <div className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
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
            style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgba(169, 189, 203, 0.3)' }}
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
                  backgroundColor: 'rgba(73, 90, 88, 0.3)',
                  borderColor: 'rgba(169, 189, 203, 0.2)'
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
                backgroundColor: 'rgba(73, 90, 88, 0.3)',
                borderColor: 'rgba(169, 189, 203, 0.2)'
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
                      className="px-3 py-1 rounded text-sm transition hover:opacity-80"
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
                backgroundColor: 'rgba(73, 90, 88, 0.3)',
                borderColor: 'rgba(169, 189, 203, 0.2)'
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
                    {user?.license_type === 'pro_platform' ? 'Pro Platform' : 'Pro Platform'}
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
      </main>
    </div>
  );
}