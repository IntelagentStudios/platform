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
  Brain,
  ChevronRight
} from 'lucide-react';

export default function ProductsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [configurations, setConfigurations] = useState<any>({});
  const [userProducts, setUserProducts] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationReasons, setRecommendationReasons] = useState<string[]>([]);
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
          const initialProducts = data.user.products || ['chatbot'];
          setUserProducts(initialProducts);
          
          // Fetch product configurations
          fetch('/api/products/check-keys', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              console.log('[Products Page] Configurations received:', data);
              if (data.success) {
                setConfigurations(data.configurations);
                // Update user products from check-keys response as well
                if (data.userProducts && data.userProducts.length > 0) {
                  setUserProducts(data.userProducts);
                }
              }
            })
            .catch(err => console.error('Failed to fetch product configurations:', err));

          // Fetch intelligent recommendations
          fetch('/api/products/recommendations', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.recommendations) {
                setRecommendations(data.recommendations);
                setRecommendationReasons(data.reasoning || []);
              }
            })
            .catch(err => console.error('Failed to fetch recommendations:', err));
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
      name: 'AI Chatbot',
      description: 'Intelligent customer support chatbot for your website',
      icon: MessageSquare,
      features: ['24/7 Support', 'Multi-language', 'Custom Training', 'Analytics'],
      status: 'available',
      price: '£349/month',
      category: 'core'
    },
    {
      id: 'sales-outreach',
      name: 'Sales Outreach Agent',
      description: 'AI-powered sales campaigns with automated email sequences and lead management',
      icon: TrendingUp,
      features: ['Email Campaigns', 'Lead Management', 'AI Email Generation', 'Analytics'],
      status: 'available',
      price: '£499/month',
      category: 'core'
    },
    {
      id: 'ops-agent',
      name: 'Ops Agent (Workflow Assistant)',
      description: 'Turn plain-language processes into executable workflows that do the steps, not just track them',
      icon: Zap,
      features: ['Visual Workflow Builder', 'Automated Execution', 'SLA Tracking', 'Approval Chains'],
      status: 'available',
      price: '£399/month',
      category: 'core'
    },
    {
      id: 'data-insights',
      name: 'Data/Insights Agent (AI Analyst)',
      description: 'Ingest, clean, and explain business data with AI-powered anomaly detection and insights',
      icon: BarChart3,
      features: ['Auto Data Import', 'AI Analysis', 'Anomaly Detection', 'Custom Dashboards'],
      status: 'available',
      price: '£449/month',
      category: 'core'
    }
  ];

  // Get recommended product IDs from API recommendations
  const recommendedIds = recommendations.map(r => r.id);

  // Real marketplace products and modular upgrades
  const marketplaceProducts = [
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Deep insights and custom reporting',
      icon: BarChart3,
      features: ['Custom Dashboards', 'Predictive Analytics', 'Export Reports', 'API Access'],
      price: '£199/month',
      badge: 'Popular',
      type: 'upgrade'
    },
    {
      id: 'voice-module',
      name: 'Voice Module',
      description: 'Add voice capabilities to your chatbot',
      icon: MessageSquare,
      features: ['Natural Voice', 'Voice Commands', 'Multi-language', 'Call Integration'],
      price: '£299/month',
      badge: 'New',
      type: 'module'
    },
    {
      id: 'workflow-automation',
      name: 'Workflow Automation',
      description: 'Advanced automation and orchestration',
      icon: Zap,
      features: ['Visual Builder', 'Conditional Logic', 'API Triggers', 'Schedule Tasks'],
      price: '£399/month',
      badge: 'Pro',
      type: 'upgrade'
    },
    {
      id: 'custom-integrations',
      name: 'Custom Integrations',
      description: 'Connect to any system or API',
      icon: Package,
      features: ['REST APIs', 'Webhooks', 'Custom Connectors', 'Data Sync'],
      price: '£149/month',
      badge: 'Essential',
      type: 'module'
    },
    {
      id: 'white-label',
      name: 'White Label',
      description: 'Full branding customization',
      icon: Sparkles,
      features: ['Custom Branding', 'Domain Setup', 'Theme Editor', 'CSS Override'],
      price: '£599/month',
      badge: 'Enterprise',
      type: 'upgrade'
    },
    {
      id: 'priority-support',
      name: 'Priority Support',
      description: '24/7 dedicated support team',
      icon: Shield,
      features: ['24/7 Support', 'Dedicated Manager', 'SLA Guarantee', 'Phone Support'],
      price: '£999/month',
      badge: 'Premium',
      type: 'service'
    },
    {
      id: 'ai-training-credits',
      name: 'AI Training Credits',
      description: 'Additional model training capacity',
      icon: Brain,
      features: ['10,000 Credits', 'Custom Models', 'Fine-tuning', 'Priority Queue'],
      price: '£499/pack',
      badge: 'Scalable',
      type: 'credits'
    },
    {
      id: 'compliance-pack',
      name: 'Compliance Pack',
      description: 'GDPR, SOC2, and ISO compliance',
      icon: Lock,
      features: ['Audit Reports', 'Data Encryption', 'Access Controls', 'Compliance Tools'],
      price: '£799/month',
      badge: 'Enterprise',
      type: 'upgrade'
    }
  ];

  // Separate products by status
  // Products ready to configure should be shown prominently at the top
  const readyToConfigureProducts = allProducts.filter(p =>
    userProducts.includes(p.id) && !configurations[p.id]?.configured
  );
  const configuredProducts = allProducts.filter(p =>
    userProducts.includes(p.id) && configurations[p.id]?.configured
  );
  const availableProducts = allProducts.filter(p =>
    !userProducts.includes(p.id) && p.status === 'available'
  );

  console.log('[Products Page] Product filtering:', {
    userProducts,
    configurations,
    readyToConfigureProducts: readyToConfigureProducts.map(p => p.id),
    configuredProducts: configuredProducts.map(p => p.id),
    availableProducts: availableProducts.map(p => p.id)
  });

  const handleConfigure = (productId: string) => {
    if (productId === 'chatbot') {
      router.push('/products/chatbot/configure');
    } else if (productId === 'sales-outreach') {
      router.push('/dashboard/sales/onboarding');
    } else if (productId === 'data-enrichment') {
      router.push('/platform/data-enrichment');
    } else if (productId === 'setup-agent') {
      router.push('/platform/setup-agent');
    } else {
      router.push(`/products/${productId}/setup`);
    }
  };

  const handleManage = (productId: string) => {
    if (productId === 'chatbot') {
      router.push('/chatbot');  // Go to main chatbot page
    } else if (productId === 'sales-outreach') {
      router.push('/dashboard/sales');
    } else if (productId === 'data-enrichment') {
      router.push('/platform/data-enrichment');
    } else if (productId === 'setup-agent') {
      router.push('/platform/setup-agent');
    } else {
      // For unknown products, stay on products page
      router.push('/products');
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
        {/* Ready to Configure Section - Shown prominently at top */}
        {readyToConfigureProducts.length > 0 && (
          <section className="mb-8">
            <div className="rounded-lg p-6" style={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(169, 189, 203, 0.1) 100%)',
              border: '2px solid rgba(76, 175, 80, 0.3)'
            }}>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5" style={{ color: '#4CAF50' }} />
                <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Ready to Configure
                </h2>
                <span className="text-xs px-2 py-1 rounded-full animate-pulse" 
                      style={{ 
                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                        color: '#4CAF50'
                      }}>
                  Action Required
                </span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                These products are included in your license and ready to set up:
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {readyToConfigureProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="rounded-lg border overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                    style={{ 
                      backgroundColor: 'rgba(58, 64, 64, 0.7)',
                      borderColor: 'rgba(76, 175, 80, 0.4)'
                    }}
                    onClick={() => handleConfigure(product.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                            <product.icon className="h-5 w-5" style={{ color: '#4CAF50' }} />
                          </div>
                          <div>
                            <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                              {product.name}
                            </h3>
                            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                              {product.description}
                            </p>
                          </div>
                        </div>
                        <button
                          className="px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80 flex items-center space-x-1"
                          style={{ 
                            backgroundColor: '#4CAF50',
                            color: 'white'
                          }}
                        >
                          <span>Configure</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
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

        {/* Additional Products Section */}
        {availableProducts.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Additional Products
              </h2>
              <span className="text-xs px-2 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}>
                Available to Add
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
                      {product.features?.slice(0, 4).map((feature, idx) => (
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

        {/* Recommended for You Section - Intelligent Suggestions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" style={{ color: 'rgb(255, 193, 7)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Recommended for You
              </h2>
              <span className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(255, 193, 7, 0.2)',
                      color: '#FFC107'
                    }}>
                Based on Your Usage
              </span>
            </div>
          </div>

          {/* Intelligent recommendations message */}
          <div className="mb-4 p-4 rounded-lg" style={{
            backgroundColor: 'rgba(255, 193, 7, 0.05)',
            borderLeft: '3px solid #FFC107'
          }}>
            <p className="text-sm mb-2" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              {recommendations.length > 0
                ? `We've analyzed your usage and identified ${recommendations.length} upgrades that would benefit your business:`
                : 'Based on your usage patterns, we recommend these upgrades to enhance your platform:'}
            </p>
            {recommendations.length > 0 && recommendations[0].reason && (
              <ul className="text-xs space-y-1" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                {recommendations.slice(0, 2).map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-1">
                    <span style={{ color: '#FFC107' }}>•</span>
                    <span>{rec.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {marketplaceProducts
              .filter(p => recommendedIds.includes(p.id))
              .slice(0, 4)
              .map((product) => (
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
                                           product.badge === 'Essential' ? 'rgba(33, 150, 243, 0.2)' :
                                           product.badge === 'Scalable' ? 'rgba(156, 39, 176, 0.2)' :
                                           'rgba(169, 189, 203, 0.2)',
                            color: product.badge === 'New' ? '#4CAF50' :
                                  product.badge === 'Popular' ? '#FFC107' :
                                  product.badge === 'Essential' ? '#2196F3' :
                                  product.badge === 'Scalable' ? '#9C27B0' :
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
                    {product.features?.slice(0, 2).map((feature, idx) => (
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