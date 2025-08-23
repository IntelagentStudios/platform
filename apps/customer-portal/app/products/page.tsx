'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Bot, 
  TrendingUp, 
  Database, 
  Wand2, 
  Settings, 
  PlayCircle, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'not_purchased' | 'pending_setup' | 'setting_up' | 'active' | 'disabled';
  setupProgress?: number;
  features?: string[];
  usage?: {
    current: number;
    limit: number;
    unit: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [license, setLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLicenseAndProducts();
  }, []);

  const fetchLicenseAndProducts = async () => {
    try {
      // Fetch user's license info
      const licenseResponse = await fetch('/api/auth/me');
      if (licenseResponse.ok) {
        const licenseData = await licenseResponse.json();
        setLicense(licenseData);

        // Fetch product setup status
        const setupResponse = await fetch('/api/products/status');
        if (setupResponse.ok) {
          const setupData = await setupResponse.json();
          
          // Map products with their setup status
          const productList = mapProductsWithStatus(licenseData.products || [], setupData);
          setProducts(productList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapProductsWithStatus = (purchasedProducts: string[], setupStatus: any): Product[] => {
    const allProducts = [
      {
        id: 'chatbot',
        name: 'AI Chatbot',
        description: 'Intelligent customer support chatbot for your website',
        icon: Bot,
        features: [
          'Natural language understanding',
          'Multi-language support',
          '24/7 automated responses',
          'Customizable personality'
        ]
      },
      {
        id: 'sales-agent',
        name: 'Sales Agent',
        description: 'Automated sales outreach and lead qualification',
        icon: TrendingUp,
        features: [
          'Lead scoring & qualification',
          'Automated email sequences',
          'CRM integration',
          'Performance analytics'
        ]
      },
      {
        id: 'enrichment',
        name: 'Data Enrichment',
        description: 'Enhance your data with valuable insights',
        icon: Database,
        features: [
          'Company data enrichment',
          'Contact information discovery',
          'Social media insights',
          'Real-time data updates'
        ]
      },
      {
        id: 'setup-agent',
        name: 'Setup Agent',
        description: 'Universal setup assistant for any form or process',
        icon: Wand2,
        features: [
          'Conversational form filling',
          'Multi-step wizards',
          'Smart validation',
          'API integrations'
        ]
      }
    ];

    return allProducts.map(product => {
      const isPurchased = purchasedProducts.includes(product.id);
      const setup = setupStatus[product.id];
      
      let status: Product['status'] = 'not_purchased';
      let setupProgress = 0;
      
      if (isPurchased) {
        if (setup?.isComplete) {
          status = 'active';
          setupProgress = 100;
        } else if (setup?.inProgress) {
          status = 'setting_up';
          setupProgress = setup.progress || 50;
        } else {
          status = 'pending_setup';
          setupProgress = 0;
        }
      }

      return {
        ...product,
        status,
        setupProgress,
        usage: setup?.usage
      };
    });
  };

  const handleProductAction = (product: Product) => {
    switch (product.status) {
      case 'pending_setup':
        // Navigate to setup flow
        router.push(`/setup/${product.id}`);
        break;
      case 'setting_up':
        // Resume setup
        router.push(`/setup/${product.id}`);
        break;
      case 'active':
        // Go to product management
        router.push(`/products/${product.id}`);
        break;
      case 'not_purchased':
        // Redirect to purchase page
        window.open('https://intelagentstudios.com/products', '_blank');
        break;
    }
  };

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>;
      case 'pending_setup':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">Setup Required</Badge>;
      case 'setting_up':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">In Progress</Badge>;
      case 'disabled':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">Disabled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">Not Purchased</Badge>;
    }
  };

  const getActionButton = (product: Product) => {
    switch (product.status) {
      case 'active':
        return (
          <Button onClick={() => handleProductAction(product)} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        );
      case 'pending_setup':
        return (
          <Button onClick={() => handleProductAction(product)} className="w-full bg-blue-600 hover:bg-blue-700">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Setup
          </Button>
        );
      case 'setting_up':
        return (
          <Button onClick={() => handleProductAction(product)} className="w-full bg-yellow-600 hover:bg-yellow-700">
            <Clock className="h-4 w-4 mr-2" />
            Resume Setup ({product.setupProgress}%)
          </Button>
        );
      case 'not_purchased':
        return (
          <Button onClick={() => handleProductAction(product)} variant="outline" className="w-full">
            <Package className="h-4 w-4 mr-2" />
            Purchase
          </Button>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Products</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and configure your Intelagent products
        </p>
      </div>

      {/* Pro AI Upgrade Banner */}
      {license && !license.hasProAI && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle>Upgrade to Pro AI</CardTitle>
                  <CardDescription>
                    Connect all your products with intelligent insights and automation
                  </CardDescription>
                </div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <Card 
              key={product.id} 
              className={`border-gray-200 dark:border-gray-700 ${
                product.status === 'active' ? 'ring-2 ring-green-500 ring-opacity-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      product.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        product.status === 'active'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features List */}
                {product.features && product.status !== 'not_purchased' && (
                  <div className="space-y-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Usage Stats */}
                {product.usage && product.status === 'active' && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Usage this month</span>
                      <span className="font-medium">
                        {product.usage.current.toLocaleString()} / {product.usage.limit.toLocaleString()} {product.usage.unit}
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((product.usage.current / product.usage.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Setup Progress */}
                {product.status === 'setting_up' && product.setupProgress !== undefined && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Setup Progress</span>
                      <span className="font-medium">{product.setupProgress}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all"
                        style={{ width: `${product.setupProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-3">
                  {getActionButton(product)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Having trouble setting up your products? We're here to help!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                View Documentation
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}