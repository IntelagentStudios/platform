'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bot,
  Users,
  Settings,
  Search,
  Brain,
  Package,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Info,
  CreditCard,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  basePrice: number;
  features: {
    name: string;
    included: boolean;
    tier?: 'starter' | 'professional' | 'enterprise';
  }[];
  limits: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  popular?: boolean;
}

interface CurrentPlan {
  tier: 'starter' | 'professional' | 'enterprise';
  products: string[];
  price: number;
}

const PRODUCTS: Product[] = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Intelligent customer support automation',
    icon: Bot,
    basePrice: 49,
    features: [
      { name: 'Basic responses', included: true, tier: 'starter' },
      { name: 'AI-powered conversations', included: true, tier: 'professional' },
      { name: 'Custom training', included: true, tier: 'enterprise' },
      { name: 'Multi-language support', included: true, tier: 'professional' },
      { name: 'White-label options', included: true, tier: 'enterprise' },
      { name: 'Priority support', included: true, tier: 'enterprise' }
    ],
    limits: {
      starter: 1000,
      professional: 10000,
      enterprise: -1
    },
    popular: true
  },
  {
    id: 'sales_agent',
    name: 'Sales Agent',
    description: 'Automated lead generation and outreach',
    icon: Users,
    basePrice: 99,
    features: [
      { name: 'Lead discovery', included: true, tier: 'starter' },
      { name: 'Email automation', included: true, tier: 'starter' },
      { name: 'AI personalization', included: true, tier: 'professional' },
      { name: 'CRM integration', included: true, tier: 'professional' },
      { name: 'Custom workflows', included: true, tier: 'enterprise' },
      { name: 'Dedicated IP', included: true, tier: 'enterprise' }
    ],
    limits: {
      starter: 100,
      professional: 1000,
      enterprise: -1
    }
  },
  {
    id: 'setup_agent',
    name: 'Setup Agent',
    description: 'Conversational forms and onboarding',
    icon: Settings,
    basePrice: 29,
    features: [
      { name: 'Basic forms', included: true, tier: 'starter' },
      { name: 'Conditional logic', included: true, tier: 'professional' },
      { name: 'Multi-step flows', included: true, tier: 'professional' },
      { name: 'Custom branding', included: true, tier: 'enterprise' },
      { name: 'API access', included: true, tier: 'enterprise' },
      { name: 'Analytics', included: true, tier: 'professional' }
    ],
    limits: {
      starter: 50,
      professional: 500,
      enterprise: -1
    }
  },
  {
    id: 'enrichment',
    name: 'Data Enrichment',
    description: 'Company and contact data enhancement',
    icon: Search,
    basePrice: 79,
    features: [
      { name: 'Email finder', included: true, tier: 'starter' },
      { name: 'Company data', included: true, tier: 'starter' },
      { name: 'Social profiles', included: true, tier: 'professional' },
      { name: 'Technographics', included: true, tier: 'professional' },
      { name: 'Custom sources', included: true, tier: 'enterprise' },
      { name: 'Bulk enrichment', included: true, tier: 'professional' }
    ],
    limits: {
      starter: 500,
      professional: 5000,
      enterprise: -1
    }
  },
  {
    id: 'ai_insights',
    name: 'AI Insights',
    description: 'Predictive analytics and recommendations',
    icon: Brain,
    basePrice: 149,
    features: [
      { name: 'Basic analytics', included: false, tier: 'starter' },
      { name: 'Pattern detection', included: true, tier: 'professional' },
      { name: 'Predictive models', included: true, tier: 'professional' },
      { name: 'Custom queries', included: true, tier: 'professional' },
      { name: 'Real-time analysis', included: true, tier: 'enterprise' },
      { name: 'API access', included: true, tier: 'enterprise' }
    ],
    limits: {
      starter: 0,
      professional: 100,
      enterprise: -1
    },
    popular: true
  }
];

const PLAN_PRICING = {
  starter: { multiplier: 1, name: 'Starter', description: 'For small businesses' },
  professional: { multiplier: 2, name: 'Professional', description: 'For growing teams', popular: true },
  enterprise: { multiplier: 3.5, name: 'Enterprise', description: 'For large organizations' }
};

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get('product');
  const { toast } = useToast();

  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>({
    tier: 'starter',
    products: ['chatbot'],
    price: 49
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>(['chatbot']);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Load current plan
    fetchCurrentPlan();
    
    // If product specified in URL, add it to selection
    if (productParam && !selectedProducts.includes(productParam)) {
      setSelectedProducts([...selectedProducts, productParam]);
    }
  }, [productParam]);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/customer/plan');
      const data = await response.json();
      setCurrentPlan(data);
      setSelectedProducts(data.products);
      setSelectedTier(data.tier);
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
    }
  };

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter(p => p !== productId));
      } else {
        toast({
          title: 'At least one product required',
          description: 'You must have at least one product in your plan',
          variant: 'destructive'
        });
      }
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const calculatePrice = () => {
    const baseTotal = selectedProducts.reduce((sum, productId) => {
      const product = PRODUCTS.find(p => p.id === productId);
      return sum + (product?.basePrice || 0);
    }, 0);

    const tierMultiplier = PLAN_PRICING[selectedTier].multiplier;
    const monthlyPrice = Math.round(baseTotal * tierMultiplier);
    const yearlyPrice = Math.round(monthlyPrice * 10); // 2 months free
    
    return billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
  };

  const calculateSavings = () => {
    const monthly = calculatePrice();
    if (billingCycle === 'yearly') {
      return Math.round(monthly * 2); // 2 months free
    }
    return 0;
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/customer/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts,
          tier: selectedTier,
          billingCycle
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Redirect to Stripe checkout or handle upgrade
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          toast({
            title: 'Upgrade Successful',
            description: 'Your plan has been upgraded successfully'
          });
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: 'There was an error processing your upgrade',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const isUpgrade = () => {
    // Check if this is an upgrade from current plan
    const newPrice = calculatePrice();
    return newPrice > currentPlan.price || 
           selectedProducts.length > currentPlan.products.length ||
           PLAN_PRICING[selectedTier].multiplier > PLAN_PRICING[currentPlan.tier].multiplier;
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Select products and features that match your business needs
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <RadioGroup
            value={billingCycle}
            onValueChange={(value: any) => setBillingCycle(value)}
            className="flex"
          >
            <div className="flex items-center">
              <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
              <Label
                htmlFor="monthly"
                className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                  billingCycle === 'monthly' ? 'bg-background shadow-sm' : ''
                }`}
              >
                Monthly
              </Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
              <Label
                htmlFor="yearly"
                className={`px-4 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-2 ${
                  billingCycle === 'yearly' ? 'bg-background shadow-sm' : ''
                }`}
              >
                Yearly
                <Badge variant="secondary" className="text-xs">Save 2 months</Badge>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Plan Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map(tier => {
          const plan = PLAN_PRICING[tier];
          const isSelected = selectedTier === tier;
          const isProfessional = tier === 'professional';
          
          return (
            <Card 
              key={tier}
              className={`relative cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${isProfessional ? 'border-primary' : ''}`}
              onClick={() => setSelectedTier(tier)}
            >
              {isProfessional && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">
                    {tier === 'enterprise' ? 'Custom' : `${plan.multiplier}x`}
                  </span>
                  <span className="text-muted-foreground ml-2">pricing</span>
                </div>
                
                <div className="space-y-2">
                  {tier === 'starter' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Basic features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Email support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Standard limits</span>
                      </div>
                    </>
                  )}
                  {tier === 'professional' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">All Starter features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold">AI Insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">10x higher limits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    </>
                  )}
                  {tier === 'enterprise' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">All Professional features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Unlimited usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">White-label options</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Dedicated support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Custom integrations</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={isSelected ? 'default' : 'outline'} 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier(tier);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Product Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Select Your Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map(product => {
            const Icon = product.icon;
            const isSelected = selectedProducts.includes(product.id);
            const isAIInsights = product.id === 'ai_insights';
            const canSelect = !isAIInsights || selectedTier !== 'starter';
            
            return (
              <Card 
                key={product.id}
                className={`relative ${!canSelect ? 'opacity-50' : 'cursor-pointer'} ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => canSelect && toggleProduct(product.id)}
              >
                {product.popular && (
                  <Badge className="absolute -top-2 right-2" variant="secondary">
                    Popular
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    <Switch
                      checked={isSelected}
                      disabled={!canSelect}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => canSelect && toggleProduct(product.id)}
                    />
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <span className="text-2xl font-bold">
                      ${product.basePrice * PLAN_PRICING[selectedTier].multiplier}
                    </span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  
                  <div className="space-y-1">
                    {product.features?.slice(0, 3).map((feature, index) => {
                      const included = feature.tier ? 
                        PLAN_PRICING[selectedTier].multiplier >= PLAN_PRICING[feature.tier].multiplier :
                        feature.included;
                      
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {included ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={included ? '' : 'text-muted-foreground line-through'}>
                            {feature.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage limit</span>
                      <span className="font-medium">
                        {product.limits[selectedTier] === -1 
                          ? 'Unlimited' 
                          : product.limits[selectedTier].toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {isAIInsights && selectedTier === 'starter' && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Requires Professional or Enterprise
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pricing Summary */}
      <Card className="sticky bottom-0 bg-background/95 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">Your selection</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ${calculatePrice()}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
                {calculateSavings() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    Save ${calculateSavings()}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} • 
                {' '}{PLAN_PRICING[selectedTier].name} tier
              </p>
            </div>
            
            <div className="flex gap-3">
              {isUpgrade() ? (
                <Button 
                  size="lg" 
                  onClick={() => setShowCheckout(true)}
                  disabled={processing}
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Upgrade Now
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button size="lg" variant="outline" disabled>
                  Current Plan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Upgrade</DialogTitle>
            <DialogDescription>
              Review your selection before proceeding to payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Selected Products</h4>
              {selectedProducts.map(productId => {
                const product = PRODUCTS.find(p => p.id === productId);
                return (
                  <div key={productId} className="flex items-center justify-between text-sm">
                    <span>{product?.name}</span>
                    <span>${(product?.basePrice || 0) * PLAN_PRICING[selectedTier].multiplier}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ${calculatePrice()}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to our secure payment processor to complete your upgrade.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={processing}>
              {processing ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  );
}