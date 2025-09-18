'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building,
  Mail,
  CheckCircle2,
  Rocket,
  Sparkles,
  Loader2,
  ChevronRight,
  Home
} from 'lucide-react';
import { useLocalization } from '@/lib/localization';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

export default function SalesOnboardingPage() {
  const router = useRouter();
  const { localize, isUK } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [companyResearchComplete, setCompanyResearchComplete] = useState(false);

  // Check if onboarding was already completed
  useEffect(() => {
    // Quick check localStorage first to prevent flashing
    const localComplete = localStorage.getItem('salesOnboardingComplete');
    if (localComplete === 'true') {
      router.push('/dashboard/sales');
      return;
    }

    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/sales/configuration');
        if (response.ok) {
          const { onboardingComplete } = await response.json();
          if (onboardingComplete) {
            // Set localStorage to match server state
            localStorage.setItem('salesOnboardingComplete', 'true');
            router.push('/dashboard/sales');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboarding();
  }, [router]);

  const [onboardingData, setOnboardingData] = useState({
    companyName: '',
    website: '',
    industry: '',
    description: '',
    targetMarket: '',
    companySize: '',
    painPoints: [] as string[],
    technologies: [] as string[],
    competitors: [] as string[],
    marketTrends: [] as string[],
    valueProposition: '',
    emailProvider: '',
    emailAddress: '',
    emailPassword: '',
    smtpHost: '',
    smtpPort: '587'
  });

  const steps: OnboardingStep[] = [
    {
      id: 'company',
      title: 'Company Information',
      description: 'Just your company name and website',
      icon: Building,
      completed: false
    },
    {
      id: 'email',
      title: 'Email Configuration',
      description: 'Connect your email for sending campaigns',
      icon: Mail,
      completed: false
    },
    {
      id: 'complete',
      title: 'Ready to Launch!',
      description: 'Start creating your first campaign',
      icon: CheckCircle2,
      completed: false
    }
  ];

  const handleInputChange = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const analyzeWebsite = async () => {
    if (!onboardingData.website) return;

    setAnalyzingWebsite(true);
    setAnalysisProgress(localize('Initializing AI research agent...'));

    try {
      // Use the comprehensive analysis endpoint
      const response = await fetch('/api/sales/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: onboardingData.website,
          useSkillsOrchestrator: true
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buffer = '';

          // Handle streaming response for progress updates
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'progress') {
                    setAnalysisProgress(data.message);
                  } else if (data.type === 'complete') {
                    // Update ALL fields from the comprehensive analysis
                    setOnboardingData(prev => ({
                      ...prev,
                      companyName: data.data.companyName || prev.companyName,
                      industry: data.data.industry || prev.industry,
                      description: data.data.description || prev.description,
                      targetMarket: data.data.targetMarket || prev.targetMarket,
                      companySize: data.data.companySize || prev.companySize,
                      painPoints: data.data.painPoints || prev.painPoints,
                      technologies: data.data.technologies || prev.technologies,
                      competitors: data.data.competitors || prev.competitors,
                      marketTrends: data.data.marketTrends || prev.marketTrends,
                      valueProposition: data.data.valueProposition || prev.valueProposition
                    }));
                    setCompanyResearchComplete(true);
                    setAnalysisProgress('');
                  } else if (data.type === 'error') {
                    setAnalysisProgress(localize('Analysis failed. Please try again.'));
                  }
                } catch (e) {
                  console.error('Failed to parse SSE message:', e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to analyze website:', error);
      setAnalysisProgress(localize('Analysis failed. Please try again.'));
    } finally {
      setAnalyzingWebsite(false);
    }
  };

  // Removed auto-start analysis - now manual only

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Save configuration and complete onboarding
      await saveConfiguration();
      router.push('/dashboard/sales');
    } else {
      // Save progress if on email step
      if (steps[currentStep].id === 'email') {
        await saveConfiguration();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const saveConfiguration = async () => {
    try {
      // First get the product key
      const getResponse = await fetch('/api/sales/configuration');
      if (getResponse.ok) {
        const { productKey } = await getResponse.json();

        // Now save with the product key
        const response = await fetch('/api/sales/configuration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productKey,
            configuration: {
              ...onboardingData,
              onboardingComplete: true
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save configuration');
        }

        // Set a flag in localStorage to prevent redirect loop
        localStorage.setItem('salesOnboardingComplete', 'true');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return onboardingData.companyName && onboardingData.website;
    }
    if (currentStep === 1) {
      return onboardingData.emailProvider && onboardingData.emailAddress;
    }
    return true;
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="container max-w-2xl mx-auto p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </a>
        <ChevronRight className="h-4 w-4" />
        <a href="/products" className="hover:text-foreground transition-colors">
          Products
        </a>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Sales Outreach Setup</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Sales Outreach Agent Setup</h1>
          <Badge variant="outline">Step {currentStep + 1} of {steps.length}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {React.createElement(steps[currentStep].icon, {
              className: "h-8 w-8 text-primary"
            })}
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Company Information Step - Super Simple */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={onboardingData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Acme Inc."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={onboardingData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your website URL for AI analysis
                </p>
              </div>

              {/* Auto-research status */}
              {analyzingWebsite && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">AI Research in Progress</span>
                  </div>
                  {analysisProgress && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{analysisProgress}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Analyze Button */}
              {onboardingData.website && !analyzingWebsite && !companyResearchComplete && (
                <Button
                  onClick={analyzeWebsite}
                  className="w-full"
                  variant="default"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {localize('Analyze Company')}
                </Button>
              )}

              {/* Research Complete */}
              {companyResearchComplete && onboardingData.description && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <h4 className="font-medium">AI Research Complete!</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{onboardingData.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Industry:</span> {onboardingData.industry}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {onboardingData.companySize}
                      </div>
                      <div>
                        <span className="font-medium">Market:</span> {onboardingData.targetMarket}
                      </div>
                      {onboardingData.technologies.length > 0 && (
                        <div>
                          <span className="font-medium">Tech:</span> {onboardingData.technologies.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Configuration Step */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Connect your email to send campaigns. We support all major email providers.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="emailProvider">Email Provider</Label>
                <Select
                  value={onboardingData.emailProvider}
                  onValueChange={(value) => {
                    handleInputChange('emailProvider', value);
                    // Auto-fill SMTP settings for known providers
                    if (value === 'zoho') {
                      handleInputChange('smtpHost', 'smtp.zoho.com');
                      handleInputChange('smtpPort', '465');
                    } else if (value === 'gmail') {
                      handleInputChange('smtpHost', 'smtp.gmail.com');
                      handleInputChange('smtpPort', '587');
                    } else if (value === 'outlook') {
                      handleInputChange('smtpHost', 'smtp-mail.outlook.com');
                      handleInputChange('smtpPort', '587');
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select email provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Microsoft 365 / Outlook</SelectItem>
                    <SelectItem value="zoho">Zoho Mail</SelectItem>
                    <SelectItem value="smtp">Custom SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={onboardingData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="sales@company.com"
                  className="mt-2"
                />
              </div>

              {(onboardingData.emailProvider === 'smtp' ||
                onboardingData.emailProvider === 'zoho' ||
                onboardingData.emailProvider === 'gmail' ||
                onboardingData.emailProvider === 'outlook') && (
                <>
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={onboardingData.smtpHost}
                      onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                      placeholder="smtp.example.com"
                      className="mt-2"
                      disabled={onboardingData.emailProvider !== 'smtp'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={onboardingData.smtpPort}
                      onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                      placeholder="587"
                      className="mt-2"
                      disabled={onboardingData.emailProvider !== 'smtp'}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="emailPassword">
                  {onboardingData.emailProvider === 'gmail' ? 'App Password' :
                   onboardingData.emailProvider === 'zoho' ? 'App Password' : 'Password'}
                </Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={onboardingData.emailPassword}
                  onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                />
                {onboardingData.emailProvider === 'gmail' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Use an app-specific password, not your regular Gmail password.
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary hover:underline ml-1">
                      Generate one here
                    </a>
                  </p>
                )}
                {onboardingData.emailProvider === 'zoho' && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <p>To get your Zoho app password:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Enable 2FA first at <a href="https://accounts.zoho.com/home#security" target="_blank" className="text-primary hover:underline">Zoho Security</a></li>
                      <li>Go to <a href="https://accounts.zoho.com/home#security/security_pwd/apppassword" target="_blank" className="text-primary hover:underline">App Passwords</a></li>
                      <li>Enter "Sales Outreach" as the app name</li>
                      <li>Copy the generated password and paste it here</li>
                    </ol>
                    <p className="text-amber-600 dark:text-amber-500">Note: Use this app password, NOT your regular Zoho password</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion Step */}
          {currentStep === 2 && (
            <div className="space-y-6 text-center py-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">You're All Set!</h3>
                <p className="text-muted-foreground">
                  Your Sales Outreach Agent is ready. Time to create your first campaign!
                </p>
              </div>

              {companyResearchComplete && (
                <div className="text-left p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">AI discovered about your company:</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>✓ Industry: {onboardingData.industry}</p>
                    <p>✓ Target Market: {onboardingData.targetMarket}</p>
                    <p>✓ Company Size: {onboardingData.companySize}</p>
                    {onboardingData.competitors.length > 0 && (
                      <p>✓ Competitors: {onboardingData.competitors.slice(0, 3).join(', ')}</p>
                    )}
                    {onboardingData.painPoints.length > 0 && (
                      <p>✓ Customer Pain Points identified</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation */}
        {currentStep < 2 && (
          <div className="px-6 pb-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || (currentStep === 0 && analyzingWebsite)}
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}