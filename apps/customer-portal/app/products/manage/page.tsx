'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft,
  BarChart3,
  Settings,
  Copy,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProductManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [configurations, setConfigurations] = useState<any>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/simple')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (!data.authenticated) {
          window.location.href = '/login';
        } else {
          // Fetch configurations
          fetch('/api/products/configuration')
            .then(res => res.json())
            .then(configs => setConfigurations(configs))
            .catch(err => console.error('Failed to fetch configurations:', err));
        }
      });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const toggleKeyVisibility = (productId: string) => {
    setShowKeys(prev => ({ ...prev, [productId]: !prev[productId] }));
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Product Management
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                View and manage your configured products
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        <div className="grid gap-6">
          {/* Chatbot Configuration */}
          {configurations.chatbot?.configured && (
            <div 
              className="rounded-lg border p-6"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Configuration
              </h2>
              
              <div className="grid gap-4">
                <div>
                  <label className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Site Key
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type={showKeys.chatbot ? 'text' : 'password'}
                      value={configurations.chatbot.site_key || ''}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                      style={{ 
                        backgroundColor: 'rgba(48, 54, 54, 0.5)',
                        border: '1px solid rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                    <button
                      onClick={() => toggleKeyVisibility('chatbot')}
                      className="p-2 rounded-lg transition hover:opacity-80"
                      style={{ 
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgb(169, 189, 203)'
                      }}
                    >
                      {showKeys.chatbot ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(configurations.chatbot.site_key)}
                      className="p-2 rounded-lg transition hover:opacity-80"
                      style={{ 
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgb(169, 189, 203)'
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Domain
                  </label>
                  <div className="mt-1 px-3 py-2 rounded-lg text-sm"
                       style={{ 
                         backgroundColor: 'rgba(48, 54, 54, 0.5)',
                         border: '1px solid rgba(169, 189, 203, 0.2)',
                         color: 'rgb(229, 227, 220)'
                       }}>
                    {configurations.chatbot.domain || 'Not set'}
                  </div>
                </div>

                <div>
                  <label className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    Embed Code
                  </label>
                  <div className="mt-1">
                    <pre className="p-3 rounded-lg text-xs overflow-x-auto"
                         style={{ 
                           backgroundColor: 'rgba(48, 54, 54, 0.5)',
                           border: '1px solid rgba(169, 189, 203, 0.2)',
                           color: 'rgb(169, 189, 203)'
                         }}>
{configurations.chatbot.embed_code || `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" 
  data-site-key="${configurations.chatbot.site_key}"></script>`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(configurations.chatbot.embed_code || '')}
                      className="mt-2 px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
                      style={{ 
                        backgroundColor: 'rgb(169, 189, 203)',
                        color: 'rgb(48, 54, 54)'
                      }}
                    >
                      Copy Embed Code
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => router.push('/products/chatbot/setup-agent')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reconfigure</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Configurations Message */}
          {!configurations.chatbot?.configured && (
            <div 
              className="rounded-lg border p-8 text-center"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              <Settings className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                No Products Configured
              </h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                Configure your products to start managing them here.
              </p>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-2 rounded-lg text-sm transition hover:opacity-80"
                style={{ 
                  backgroundColor: 'rgb(169, 189, 203)',
                  color: 'rgb(48, 54, 54)'
                }}
              >
                Go to Products
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}