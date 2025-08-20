'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Users,
  Settings,
  Search,
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  Rocket,
  Target,
  Building,
  Globe,
  Mail,
  MessageSquare,
  Sparkles,
  Play,
  BookOpen,
  Video,
  HelpCircle,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Intelagent',
    description: 'Let\'s get you set up in just a few minutes',
    icon: Rocket,
    component: WelcomeStep,
    required: true
  },
  {
    id: 'business',
    title: 'Tell us about your business',
    description: 'Help us personalize your experience',
    icon: Building,
    component: BusinessInfoStep,
    required: true
  },
  {
    id: 'goals',
    title: 'What are your goals?',
    description: 'Select what you want to achieve',
    icon: Target,
    component: GoalsStep,
    required: true
  },
  {
    id: 'products',
    title: 'Choose your products',
    description: 'Select the tools you want to start with',
    icon: Settings,
    component: ProductSelectionStep,
    required: true
  },
  {
    id: 'setup',
    title: 'Quick Setup',
    description: 'Configure your first product',
    icon: Zap,
    component: QuickSetupStep,
    required: false
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Your platform is ready to use',
    icon: CheckCircle,
    component: CompletionStep,
    required: true
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;

  useEffect(() => {
    // Check if user has already completed onboarding
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const data = await response.json();
      
      if (data.completed) {
        router.push('/dashboard');
      } else if (data.currentStep) {
        setCurrentStep(data.currentStep);
        setOnboardingData(data.data || {});
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const handleNext = async (stepData?: any) => {
    const newData = {
      ...onboardingData,
      [ONBOARDING_STEPS[currentStep].id]: stepData
    };
    setOnboardingData(newData);

    // Save progress
    await saveProgress(currentStep + 1, newData);

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    const stepId = ONBOARDING_STEPS[currentStep].id;
    setSkipped([...skipped, stepId]);
    await handleNext({ skipped: true });
  };

  const saveProgress = async (step: number, data: any) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step,
          data,
          completed: step === ONBOARDING_STEPS.length
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });

      if (response.ok) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast({
          title: 'Welcome aboard!',
          description: 'Your account is all set up and ready to go'
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Getting Started</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isSkipped = skipped.includes(step.id);

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index !== ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {index !== ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-10 w-full h-[2px] transition-colors ${
                        isCompleted ? 'bg-primary/20' : 'bg-muted'
                      }`}
                      style={{ width: 'calc(100% + 40px)' }}
                    />
                  )}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block">
                  {step.title.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {React.createElement(ONBOARDING_STEPS[currentStep].icon, {
                    className: 'h-6 w-6 text-primary'
                  })}
                  {ONBOARDING_STEPS[currentStep].title}
                </CardTitle>
                <CardDescription>
                  {ONBOARDING_STEPS[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CurrentStepComponent
                  data={onboardingData}
                  onNext={handleNext}
                  onComplete={completeOnboarding}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            {!ONBOARDING_STEPS[currentStep].required && currentStep < ONBOARDING_STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ onNext }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Welcome to Intelagent Platform!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're excited to have you on board. This quick setup will help you get the most out of our platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">5 Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick setup to get you started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Secure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your data is safe and encrypted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Instant Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start using products immediately
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={() => onNext()}>
          Let's Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function BusinessInfoStep({ data, onNext }: any) {
  const [businessInfo, setBusinessInfo] = useState({
    company_name: data.business?.company_name || '',
    industry: data.business?.industry || '',
    company_size: data.business?.company_size || '',
    website: data.business?.website || '',
    description: data.business?.description || ''
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Real Estate', 'Marketing', 'Consulting', 'Other'
  ];

  const companySizes = [
    '1-10', '11-50', '51-200', '201-500', '500+'
  ];

  const handleSubmit = () => {
    if (businessInfo.company_name && businessInfo.industry) {
      onNext(businessInfo);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            value={businessInfo.company_name}
            onChange={(e) => setBusinessInfo({...businessInfo, company_name: e.target.value})}
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <Label htmlFor="industry">Industry *</Label>
          <select
            id="industry"
            className="w-full px-3 py-2 border rounded-md"
            value={businessInfo.industry}
            onChange={(e) => setBusinessInfo({...businessInfo, industry: e.target.value})}
          >
            <option value="">Select industry</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="size">Company Size</Label>
          <select
            id="size"
            className="w-full px-3 py-2 border rounded-md"
            value={businessInfo.company_size}
            onChange={(e) => setBusinessInfo({...businessInfo, company_size: e.target.value})}
          >
            <option value="">Select size</option>
            {companySizes.map(size => (
              <option key={size} value={size}>{size} employees</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={businessInfo.website}
            onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Tell us about your business</Label>
        <Textarea
          id="description"
          value={businessInfo.description}
          onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
          placeholder="What does your company do? What are your main products or services?"
          rows={4}
        />
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This information helps us customize your experience and provide better recommendations.
          Your data is secure and never shared.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!businessInfo.company_name || !businessInfo.industry}
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function GoalsStep({ data, onNext }: any) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || []);

  const goals = [
    { id: 'support', label: 'Improve customer support', icon: MessageSquare },
    { id: 'leads', label: 'Generate more leads', icon: Users },
    { id: 'automate', label: 'Automate repetitive tasks', icon: Zap },
    { id: 'data', label: 'Enrich customer data', icon: Search },
    { id: 'insights', label: 'Get AI-powered insights', icon: Brain },
    { id: 'scale', label: 'Scale operations', icon: TrendingUp }
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select all that apply. This helps us recommend the right products for you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map(goal => {
          const Icon = goal.icon;
          const isSelected = selectedGoals.includes(goal.id);

          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleGoal(goal.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{goal.label}</span>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={() => onNext(selectedGoals)}
          disabled={selectedGoals.length === 0}
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ProductSelectionStep({ data, onNext }: any) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    data.products || ['chatbot']
  );

  const products = [
    {
      id: 'chatbot',
      name: 'AI Chatbot',
      description: 'Automated customer support',
      icon: Bot,
      recommended: data.goals?.includes('support')
    },
    {
      id: 'sales_agent',
      name: 'Sales Agent',
      description: 'Lead generation & outreach',
      icon: Users,
      recommended: data.goals?.includes('leads')
    },
    {
      id: 'setup_agent',
      name: 'Setup Agent',
      description: 'Conversational forms',
      icon: Settings,
      recommended: data.goals?.includes('automate')
    },
    {
      id: 'enrichment',
      name: 'Data Enrichment',
      description: 'Company & contact data',
      icon: Search,
      recommended: data.goals?.includes('data')
    }
  ];

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter(p => p !== productId));
      }
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          You can always add more products later from your dashboard.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => {
          const Icon = product.icon;
          const isSelected = selectedProducts.includes(product.id);

          return (
            <Card
              key={product.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleProduct(product.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <div className="flex items-center gap-2">
                    {product.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                <CardTitle className="text-lg mt-2">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onNext(selectedProducts)}
          disabled={selectedProducts.length === 0}
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function QuickSetupStep({ data, onNext }: any) {
  const [domain, setDomain] = useState('');

  const primaryProduct = data.products?.[0] || 'chatbot';
  
  const productSetup = {
    chatbot: {
      title: 'Add chatbot to your website',
      description: 'Enter your website domain to get started',
      placeholder: 'example.com'
    },
    sales_agent: {
      title: 'Configure email settings',
      description: 'We\'ll help you set up email automation',
      placeholder: 'your-email@example.com'
    },
    setup_agent: {
      title: 'Create your first form',
      description: 'What type of form do you want to create?',
      placeholder: 'Contact form'
    },
    enrichment: {
      title: 'Import your contacts',
      description: 'Upload a CSV or connect your CRM',
      placeholder: 'company.com'
    }
  };

  const setup = productSetup[primaryProduct as keyof typeof productSetup];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">{setup.title}</h3>
        <p className="text-muted-foreground">{setup.description}</p>
      </div>

      <div>
        <Label htmlFor="setup-input">
          {primaryProduct === 'chatbot' ? 'Website Domain' : 'Configuration'}
        </Label>
        <Input
          id="setup-input"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder={setup.placeholder}
        />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You can complete the full setup from your dashboard after onboarding.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => onNext({ skipped: true })}>
          I'll do this later
        </Button>
        <Button onClick={() => onNext({ domain })}>
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function CompletionStep({ onComplete, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your Intelagent Platform is ready. Let's explore your new dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <BookOpen className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-base">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learn how to use each product
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Video className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-base">Video Tutorials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Watch quick setup guides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <HelpCircle className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-base">Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get help when you need it
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={onComplete}
          disabled={isLoading}
        >
          {isLoading ? 'Setting up...' : 'Go to Dashboard'}
          <Rocket className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}