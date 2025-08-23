'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Zap,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
  Pause
} from 'lucide-react';

export default function ProductsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/simple')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (!data.authenticated) {
          window.location.href = '/login';
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

  const products = [
    {
      id: 'chatbot',
      name: 'Chatbot',
      description: 'AI-powered customer support chatbot for your website',
      status: 'Active',
      icon: Zap,
      features: ['24/7 Support', 'Multi-language', 'Custom Training', 'Analytics'],
      config: {
        apiKey: 'chat_key_xxxxx',
        widgetColor: '#a9bdcb',
        position: 'bottom-right'
      }
    },
    {
      id: 'sales-agent',
      name: 'Sales Agent',
      description: 'Intelligent sales assistant that converts leads',
      status: 'Active',
      icon: Users,
      features: ['Lead Scoring', 'Email Automation', 'CRM Integration', 'Performance Tracking'],
      config: {
        apiKey: 'sales_key_xxxxx',
        agentName: 'Alex',
        responseTime: '< 1 minute'
      }
    },
    {
      id: 'data-enrichment',
      name: 'Data Enrichment',
      description: 'Enhance your customer data with AI insights',
      status: 'Active',
      icon: BarChart3,
      features: ['Contact Enrichment', 'Company Data', 'Social Profiles', 'Intent Signals'],
      config: {
        apiKey: 'data_key_xxxxx',
        enrichmentLevel: 'comprehensive',
        autoUpdate: true
      }
    },
    {
      id: 'setup-agent',
      name: 'Setup Agent',
      description: 'Automated setup and configuration assistant',
      status: 'Active',
      icon: SettingsIcon,
      features: ['Auto Configuration', 'Integration Setup', 'Workflow Builder', 'Custom Scripts'],
      config: {
        apiKey: 'setup_key_xxxxx',
        automationLevel: 'high',
        notifications: true
      }
    }
  ];

  const handleConfigure = (productId: string) => {
    // Navigate to specific product setup pages
    if (productId === 'chatbot') {
      router.push('/products/chatbot/setup');
    } else if (productId === 'sales-agent') {
      router.push('/products/sales-agent/setup');
    } else if (productId === 'setup-agent') {
      router.push('/products/setup-agent');
    } else {
      // For other products, navigate to generic setup
      router.push(`/products/${productId}/setup`);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            Products
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Manage and configure your active products
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((product) => (
            <div 
              key={product.id}
              className="rounded-lg border overflow-hidden transition-all"
              style={{ 
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}
            >
              {/* Product Header */}
              <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                      <product.icon className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                        {product.name}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                        {product.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                       style={{ 
                         backgroundColor: 'rgba(76, 175, 80, 0.2)',
                         color: '#4CAF50'
                       }}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{product.status}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                  Features
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                      <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>


              {/* Actions */}
              <div className="p-6 flex space-x-3">
                <button
                  onClick={() => handleConfigure(product.id)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                  style={{ 
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(48, 54, 54)'
                  }}
                >
                  Configure
                </button>
                <button
                  className="px-4 py-2 rounded-lg transition hover:opacity-80"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgba(229, 227, 220, 0.8)'
                  }}
                >
                  {product.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  className="px-4 py-2 rounded-lg transition hover:opacity-80"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgba(229, 227, 220, 0.8)'
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div 
          className="mt-8 rounded-lg p-6 border"
          style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}
        >
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: 'rgb(169, 189, 203)' }} />
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'rgb(229, 227, 220)' }}>
                Need help with configuration?
              </h3>
              <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                Check our documentation or contact support for assistance with product setup and configuration.
              </p>
              <div className="flex space-x-4 mt-3">
                <button className="text-sm font-medium hover:underline" style={{ color: 'rgb(169, 189, 203)' }}>
                  View Documentation →
                </button>
                <button className="text-sm font-medium hover:underline" style={{ color: 'rgb(169, 189, 203)' }}>
                  Contact Support →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}