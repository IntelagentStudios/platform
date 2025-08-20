'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Bot,
  TrendingUp,
  Settings2,
  Users,
  PoundSterling,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Mail,
  Target,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  price: string;
  billingPeriod: string;
  benefits: string[];
  activeUsers: number;
  status: 'active' | 'coming-soon' | 'beta';
  route: string;
}

const products: Product[] = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Intelligent conversational AI for customer support',
    icon: <Bot className="w-6 h-6" />,
    price: '£0.002',
    billingPeriod: 'per message',
    benefits: [
      '24/7 automated support',
      'Multi-language capable',
      'Learns from interactions',
      'Reduces support costs by 70%'
    ],
    activeUsers: 0,
    status: 'active',
    route: '/admin/products/chatbot'
  },
  {
    id: 'sales-agent',
    name: 'Sales Agent',
    description: 'AI-powered sales assistant for lead conversion',
    icon: <TrendingUp className="w-6 h-6" />,
    price: '£49',
    billingPeriod: 'per user/month',
    benefits: [
      'Automated lead qualification',
      'Email campaign automation',
      'CRM integration',
      'Increases conversion by 40%'
    ],
    activeUsers: 0,
    status: 'active',
    route: '/admin/products/sales-agent'
  },
  {
    id: 'setup-agent',
    name: 'Setup Agent',
    description: 'Automated onboarding and configuration assistant',
    icon: <Settings2 className="w-6 h-6" />,
    price: '£199',
    billingPeriod: 'one-time',
    benefits: [
      'Instant setup & configuration',
      'Data migration assistance',
      'Custom workflow creation',
      'Reduces onboarding time by 80%'
    ],
    activeUsers: 0,
    status: 'coming-soon',
    route: '/admin/products/setup-agent'
  }
];

export default function ProductsPage() {
  const router = useRouter();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleProductClick = (product: Product) => {
    if (product.status === 'active') {
      router.push(product.route);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Beta</Badge>;
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">
          Manage and configure your AI products and services
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + p.activeUsers, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">£0</p>
              </div>
              <PoundSterling className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id}
            className={`hover:shadow-lg transition-all cursor-pointer ${
              product.status !== 'active' ? 'opacity-75' : ''
            }`}
            onMouseEnter={() => setHoveredProduct(product.id)}
            onMouseLeave={() => setHoveredProduct(null)}
            onClick={() => handleProductClick(product)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    hoveredProduct === product.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  } transition-colors`}>
                    {product.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(product.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pricing</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{product.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {product.billingPeriod}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <p className="text-sm font-medium mb-3">Key Benefits</p>
                <ul className="space-y-2">
                  {product.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Users */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Active Users</span>
                </div>
                <span className="font-medium">{product.activeUsers}</span>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full"
                variant={product.status === 'active' ? 'default' : 'secondary'}
                disabled={product.status !== 'active'}
              >
                {product.status === 'active' ? (
                  <>
                    Configure & Manage
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Coming Soon'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Need Help Getting Started?</h3>
              <p className="text-muted-foreground">
                Check out our documentation or contact support for assistance with product setup and integration.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                View Documentation
              </Button>
              <Button>
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}