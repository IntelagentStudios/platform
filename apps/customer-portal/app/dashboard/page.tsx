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
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/simple')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (!data.authenticated) {
          window.location.href = '/login';
        }
      });
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(169, 189, 203)' }}>
                <Shield className="h-6 w-6" style={{ color: 'rgb(48, 54, 54)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Intelagent Dashboard
                </h1>
                <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                  Welcome back, Harry
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'transparent',
                border: '1px solid rgb(169, 189, 203)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Alert */}
        <div 
          className="rounded-lg p-4 mb-6 flex items-center space-x-3"
          style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgb(169, 189, 203)' }}
        >
          <CheckCircle className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          <span style={{ color: 'rgb(229, 227, 220)' }}>
            You are successfully logged in to your Pro Platform dashboard
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="rounded-lg p-6"
              style={{ backgroundColor: 'rgb(73, 90, 88)' }}
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

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products List */}
          <div className="rounded-lg p-6" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Your Products
            </h2>
            <div className="space-y-3">
              {products.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: 'rgb(48, 54, 54)' }}
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
          <div className="rounded-lg p-6" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Email</div>
                <div style={{ color: 'rgb(229, 227, 220)' }}>harry@intelagentstudios.com</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>License Key</div>
                <div className="font-mono" style={{ color: 'rgb(229, 227, 220)' }}>INTL-AGNT-BOSS-MODE</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgb(169, 189, 203)' }}>Plan</div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                     style={{ 
                       backgroundColor: 'rgba(169, 189, 203, 0.2)',
                       color: 'rgb(169, 189, 203)'
                     }}>
                  Pro Platform
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
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg p-6" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg text-center transition hover:opacity-80"
                    style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
              <Settings className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
              <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Settings</span>
            </button>
            <button className="p-4 rounded-lg text-center transition hover:opacity-80"
                    style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
              <BarChart3 className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
              <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Analytics</span>
            </button>
            <button className="p-4 rounded-lg text-center transition hover:opacity-80"
                    style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
              <Users className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
              <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Team</span>
            </button>
            <button className="p-4 rounded-lg text-center transition hover:opacity-80"
                    style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
              <Package className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgb(169, 189, 203)' }} />
              <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Products</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}