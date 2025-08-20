'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Bot,
  MessageSquare,
  Settings2,
  Shield,
  Zap,
  Eye,
  PoundSterling,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  type: 'chatbot' | 'sales-agent' | 'setup-agent' | 'custom';
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  pricing: {
    model: 'per-user' | 'per-message' | 'flat-rate' | 'custom';
    price: number;
    currency: 'GBP' | 'USD' | 'EUR';
    billingPeriod: 'monthly' | 'annually' | 'one-time';
  };
  features: string[];
  usage: {
    activeUsers: number;
    totalMessages: number;
    revenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'AI Chatbot',
    description: 'Intelligent conversational AI assistant for customer support',
    type: 'chatbot',
    status: 'active',
    pricing: {
      model: 'per-message',
      price: 0.002,
      currency: 'GBP',
      billingPeriod: 'monthly'
    },
    features: [
      'Natural language processing',
      'Multi-language support',
      '24/7 availability',
      'Custom training',
      'Analytics dashboard'
    ],
    usage: {
      activeUsers: 1250,
      totalMessages: 450000,
      revenue: 8500
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: '2',
    name: 'Sales Agent',
    description: 'AI-powered sales assistant for lead qualification and conversion',
    type: 'sales-agent',
    status: 'active',
    pricing: {
      model: 'per-user',
      price: 49,
      currency: 'GBP',
      billingPeriod: 'monthly'
    },
    features: [
      'Lead scoring',
      'Automated follow-ups',
      'CRM integration',
      'Email automation',
      'Performance analytics'
    ],
    usage: {
      activeUsers: 85,
      totalMessages: 12000,
      revenue: 4165
    },
    createdAt: '2024-02-01',
    updatedAt: '2024-12-10'
  },
  {
    id: '3',
    name: 'Setup Agent',
    description: 'Automated onboarding and setup assistant for new users',
    type: 'setup-agent',
    status: 'beta',
    pricing: {
      model: 'flat-rate',
      price: 199,
      currency: 'GBP',
      billingPeriod: 'one-time'
    },
    features: [
      'Guided onboarding',
      'Configuration wizard',
      'Data migration',
      'Training resources',
      'Progress tracking'
    ],
    usage: {
      activeUsers: 32,
      totalMessages: 2500,
      revenue: 6368
    },
    createdAt: '2024-11-01',
    updatedAt: '2024-12-15'
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Calculate totals
  const totalRevenue = products.reduce((sum, p) => sum + p.usage.revenue, 0);
  const totalUsers = products.reduce((sum, p) => sum + p.usage.activeUsers, 0);
  const totalMessages = products.reduce((sum, p) => sum + p.usage.totalMessages, 0);
  const activeProducts = products.filter(p => p.status === 'active').length;

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'chatbot':
        return <Bot className="w-5 h-5" />;
      case 'sales-agent':
        return <TrendingUp className="w-5 h-5" />;
      case 'setup-agent':
        return <Settings2 className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'beta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'deprecated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/admin/products/${product.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog and monitor performance
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </div>
              <PoundSterling className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+8% from last month</p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{(totalMessages / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600 mt-1">+25% from last month</p>
              </div>
              <MessageSquare className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">of {products.length} total</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="beta">Beta</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getProductIcon(product.type)}
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing Info */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Pricing</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(product.pricing.price, product.pricing.currency)}
                        <span className="text-sm text-muted-foreground ml-1">
                          /{product.pricing.model === 'per-message' ? 'msg' : 
                            product.pricing.model === 'per-user' ? 'user' : 
                            product.pricing.billingPeriod}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(product.usage.revenue)}
                      </p>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{product.usage.activeUsers} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span>{(product.usage.totalMessages / 1000).toFixed(0)}k msgs</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Key Features</p>
                    <div className="flex flex-wrap gap-1">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {product.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.filter(p => p.status === 'active').map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getProductIcon(product.type)}
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <span className="font-medium">{product.usage.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                      <span className="font-medium">{formatCurrency(product.usage.revenue)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewProduct(product)}
                    >
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beta" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Beta Products</AlertTitle>
            <AlertDescription>
              These products are in testing phase and may have limited functionality.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.filter(p => p.status === 'beta').map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getProductIcon(product.type)}
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      BETA
                    </Badge>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Testing with {product.usage.activeUsers} users</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewProduct(product)}
                    >
                      View Beta Metrics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Overview</CardTitle>
              <CardDescription>
                Comparative analysis across all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getProductIcon(product.type)}
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(product.usage.revenue)} revenue
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{Math.round((product.usage.activeUsers / totalUsers) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(product.usage.activeUsers / totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm">{product.name}</span>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.usage.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((product.usage.revenue / totalRevenue) * 100)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm">{product.name}</span>
                      <div className="text-right">
                        <p className="font-medium">{product.usage.activeUsers}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((product.usage.activeUsers / totalUsers) * 100)}% of users
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}