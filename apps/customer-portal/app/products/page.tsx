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
  Pause,
  ShoppingCart,
  Package,
  Sparkles,
  Lock,
  MessageSquare,
  TrendingUp,
  Shield,
  Brain
} from 'lucide-react';

export default function ProductsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [configurations, setConfigurations] = useState<any>({});
  const [userProducts, setUserProducts] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication using JWT endpoint
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          // Get user's products from their license
          setUserProducts(data.user.products || ['chatbot']);
          
          // Fetch product configurations
          fetch('/api/products/configuration')
            .then(res => res.json())
            .then(configs => setConfigurations(configs))
            .catch(err => console.error('Failed to fetch configurations:', err));
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

  // Define all products
  const allProducts = [
    {
      id: 'chatbot',
      name: 'Chatbot',
      description: 'AI-powered customer support chatbot for your website',
      icon: Zap,
      features: ['24/7 Support', 'Multi-language', 'Custom Training', 'Analytics'],
      status: 'available',
      price: 'Included'
    },
    {
      id: 'sales-agent',
      name: 'Sales Agent',
      description: 'Intelligent sales assistant that converts leads',
      icon: Users,
      features: ['Lead Scoring', 'Email Automation', 'CRM Integration', 'Performance Tracking'],
      status: 'available',
      price: 'Included'
    },
    {
      id: 'data-enrichment',
      name: 'Data Enrichment',
      description: 'Enhance your customer data with AI insights',
      icon: BarChart3,
      features: ['Contact Enrichment', 'Company Data', 'Social Profiles', 'Intent Signals'],
      status: 'coming_soon',
      price: 'Coming Soon'
    },
    {
      id: 'setup-agent',
      name: 'Setup Agent',
      description: 'Automated setup and configuration assistant',
      icon: SettingsIcon,
      features: ['Auto Configuration', 'Integration Setup', 'Workflow Builder', 'Custom Scripts'],
      status: 'available',
      price: 'Included'
    }
  ];

  // Marketplace products (future upgrades)
  const marketplaceProducts = [
    {
      id: 'voice-agent',
      name: 'Voice Agent',
      description: 'AI voice assistant for phone support',
      icon: MessageSquare,
      features: ['Natural Voice', 'Call Routing', 'Transcription', 'Sentiment Analysis'],
      price: '$299/month',
      badge: 'New'
    },
    {
      id: 'analytics-pro',
      name: 'Analytics Pro',
      description: 'Advanced analytics and business intelligence',
      icon: TrendingUp,
      features: ['Custom Dashboards', 'Predictive Analytics', 'Export Reports', 'API Access'],
      price: '$199/month',
      badge: 'Popular'
    },
    {
      id: 'security-suite',
      name: 'Security Suite',
      description: 'Enterprise-grade security and compliance tools',
      icon: Shield,
      features: ['SOC2 Compliance', 'Data Encryption', 'Audit Logs', 'GDPR Tools'],
      price: '$499/month',
      badge: 'Enterprise'
    },
    {
      id: 'ai-trainer',
      name: 'AI Trainer',
      description: 'Advanced AI model training and customization',
      icon: Brain,
      features: ['Custom Models', 'Fine-tuning', 'A/B Testing', 'Version Control'],
      price: '$599/month',
      badge: 'Pro'
    }
  ];

  // Filter products based on user's license
  const userAllProducts = allProducts.filter(p => userProducts.includes(p.id));
  
  // Separate products by configuration status (only from user's products)
  const configuredProducts = userAllProducts.filter(p => configurations[p.id]?.configured);
  const availableProducts = userAllProducts.filter(p => !configurations[p.id]?.configured && p.status === 'available');
  const comingSoonProducts = []; // Don't show coming soon for now

  const handleConfigure = (productId: string) => {
    if (productId === 'chatbot') {
      router.push('/products/chatbot/setup-agent');
    } else if (productId === 'sales-agent') {
      router.push('/products/sales-agent/setup');
    } else if (productId === 'setup-agent') {
      router.push('/products/setup-agent');
    } else {
      router.push(`/products/${productId}/setup`);
    }
  };

  const handleManage = (productId: string) => {
    if (productId === 'chatbot') {
      router.push('/products/chatbot/manage');
    } else {
      router.push('/products/manage');
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Products
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Manage your AI agents and services
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Configured Products Section */}
        {configuredProducts.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Active Products
              </h2>
              <span className="text-xs px-2 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      color: '#4CAF50'
                    }}>
                {configuredProducts.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {configuredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="rounded-lg border overflow-hidden transition-all hover:shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    borderColor: 'rgba(76, 175, 80, 0.3)'
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                          <product.icon className="h-6 w-6" style={{ color: '#4CAF50' }} />
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
                      <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleManage(product.id)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgb(169, 189, 203)',
                          color: 'rgb(48, 54, 54)'
                        }}
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => router.push('/products/analytics?product=' + product.id)}
                        className="px-4 py-2 rounded-lg transition hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(169, 189, 203)'
                        }}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Products Section */}
        {availableProducts.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Available to Configure
              </h2>
              <span className="text-xs px-2 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}>
                Ready to Setup
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availableProducts.map((product) => (
                <div 
                  key={product.id}
                  className="rounded-lg border overflow-hidden transition-all hover:shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    borderColor: 'rgba(169, 189, 203, 0.15)'
                  }}
                >
                  <div className="p-6">
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
                      <span className="text-xs px-2 py-1 rounded-full" 
                            style={{ 
                              backgroundColor: 'rgba(169, 189, 203, 0.2)',
                              color: 'rgb(169, 189, 203)'
                            }}>
                        {product.price}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {product.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 flex-shrink-0" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                          <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleConfigure(product.id)}
                      className="w-full mt-4 px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                      style={{ 
                        backgroundColor: 'rgb(169, 189, 203)',
                        color: 'rgb(48, 54, 54)'
                      }}
                    >
                      Configure Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon Section */}
        {comingSoonProducts.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Coming Soon
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comingSoonProducts.map((product) => (
                <div 
                  key={product.id}
                  className="rounded-lg border overflow-hidden opacity-60"
                  style={{ 
                    backgroundColor: 'rgba(58, 64, 64, 0.3)',
                    borderColor: 'rgba(169, 189, 203, 0.1)'
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.05)' }}>
                          <product.icon className="h-6 w-6" style={{ color: 'rgba(169, 189, 203, 0.4)' }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>
                            {product.name}
                          </h3>
                          <p className="text-sm mt-1" style={{ color: 'rgba(229, 227, 220, 0.4)' }}>
                            {product.description}
                          </p>
                        </div>
                      </div>
                      <Lock className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                    </div>
                    <div className="mt-4">
                      <button
                        disabled
                        className="w-full px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                        style={{ 
                          backgroundColor: 'rgba(169, 189, 203, 0.1)',
                          color: 'rgba(169, 189, 203, 0.4)'
                        }}
                      >
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Marketplace Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Marketplace - Upgrades & Add-ons
              </h2>
              <span className="text-xs px-2 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}>
                Premium
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {marketplaceProducts.map((product) => (
              <div 
                key={product.id}
                className="rounded-lg border overflow-hidden transition-all hover:shadow-lg relative"
                style={{ 
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
              >
                {product.badge && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ 
                            backgroundColor: product.badge === 'New' ? 'rgba(76, 175, 80, 0.2)' :
                                           product.badge === 'Popular' ? 'rgba(255, 193, 7, 0.2)' :
                                           'rgba(169, 189, 203, 0.2)',
                            color: product.badge === 'New' ? '#4CAF50' :
                                  product.badge === 'Popular' ? '#FFC107' :
                                  'rgb(169, 189, 203)'
                          }}>
                      {product.badge}
                    </span>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                      <product.icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                    </div>
                    <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {product.name}
                    </h3>
                  </div>
                  
                  <p className="text-xs mb-3" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    {product.description}
                  </p>
                  
                  <div className="space-y-1 mb-3">
                    {product.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 flex-shrink-0" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                        <span className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                      {product.price}
                    </span>
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition hover:opacity-80"
                      style={{ 
                        backgroundColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(169, 189, 203)'
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
                Need help getting started?
              </h3>
              <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                Our setup agents will guide you through the configuration process for each product.
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