'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  ArrowRight,
  Building,
  Mail,
  Target,
  Calendar,
  Rocket,
  Users,
  Globe,
  Phone,
  Briefcase,
  Copy,
  Check
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

export default function SalesOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [productKey, setProductKey] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    companyName: '',
    website: '',
    industry: '',
    targetAudience: '',
    salesGoals: '',
    emailProvider: '',
    emailAddress: '',
    emailPassword: '',
    smtpHost: '',
    smtpPort: '587',
    timezone: 'UTC',
    sendingHours: { start: '09:00', end: '17:00' },
    dailyLimit: '100'
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sales Outreach Agent',
      description: 'Let\'s get your sales automation set up',
      icon: Rocket,
      completed: false
    },
    {
      id: 'company',
      title: 'Company Information',
      description: 'Tell us about your business',
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
      id: 'targeting',
      title: 'Target Audience',
      description: 'Define your ideal customer profile',
      icon: Target,
      completed: false
    },
    {
      id: 'schedule',
      title: 'Sending Schedule',
      description: 'Set your campaign timing preferences',
      icon: Calendar,
      completed: false
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'You\'re ready to start selling!',
      icon: CheckCircle2,
      completed: false
    }
  ];

  useEffect(() => {
    // Fetch user's product keys
    fetchProductKeys();
  }, []);

  const fetchProductKeys = async () => {
    try {
      const response = await fetch('/api/dashboard/products');
      const data = await response.json();

      // Find the sales agent product - check for 'product' field (not 'product_type')
      const salesProduct = data.products?.find((p: any) =>
        p.product === 'sales-outreach'
      );

      if (salesProduct) {
        setProductKey(salesProduct.product_key || salesProduct.key || '');
        setLicenseKey(data.licenseKey || '');
      } else {
        // If no product key exists, we might need to create one
        console.log('No sales-outreach product found, may need to create one');
        setProductKey('Please complete checkout to get your product key');
      }
    } catch (error) {
      console.error('Failed to fetch product keys:', error);
      setProductKey('Error loading product key');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Complete onboarding
      router.push('/dashboard/sales');
    } else {
      // Save progress if on email or schedule step
      if (steps[currentStep].id === 'email' || steps[currentStep].id === 'schedule') {
        await saveConfiguration();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/sales/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey,
          configuration: onboardingData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="container max-w-4xl mx-auto p-6">
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
          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  Your Sales Outreach Agent is ready to be configured. This setup wizard will help you get started in just a few minutes.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label>Your Product Key</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-background rounded">
                      {productKey || 'Loading...'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(productKey)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">What we'll set up:</h3>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Company Profile</p>
                        <p className="text-sm text-muted-foreground">Basic information about your business</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Email Integration</p>
                        <p className="text-sm text-muted-foreground">Connect your email for sending campaigns</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Target Audience</p>
                        <p className="text-sm text-muted-foreground">Define your ideal customer profile</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Sending Schedule</p>
                        <p className="text-sm text-muted-foreground">Set optimal times for your campaigns</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Information Step */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={onboardingData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Acme Inc."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  type="url"
                  value={onboardingData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={onboardingData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS / Software</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="services">Professional Services</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salesGoals">Sales Goals</Label>
                <Textarea
                  id="salesGoals"
                  value={onboardingData.salesGoals}
                  onChange={(e) => handleInputChange('salesGoals', e.target.value)}
                  placeholder="e.g., Generate 50 qualified leads per month, Book 10 demos per week"
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Email Configuration Step */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Connect your email to send campaigns. We support SMTP, Gmail, and Microsoft 365.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="emailProvider">Email Provider</Label>
                <Select
                  value={onboardingData.emailProvider}
                  onValueChange={(value) => handleInputChange('emailProvider', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select email provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Microsoft 365 / Outlook</SelectItem>
                    <SelectItem value="smtp">Custom SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {onboardingData.emailProvider === 'smtp' && (
                <>
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={onboardingData.smtpHost}
                      onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                      placeholder="smtp.example.com"
                      className="mt-2"
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
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={onboardingData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="sales@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="emailPassword">Email Password / App Password</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={onboardingData.emailPassword}
                  onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For Gmail, use an App Password. For Outlook, use your regular password.
                </p>
              </div>
            </div>
          )}

          {/* Target Audience Step */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetAudience">Describe Your Ideal Customer</Label>
                <Textarea
                  id="targetAudience"
                  value={onboardingData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="e.g., B2B SaaS companies with 10-50 employees, Marketing managers at e-commerce companies"
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <h3 className="font-medium mb-3">Targeting Criteria</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Job Titles</p>
                      <p className="text-xs text-muted-foreground">CEO, CTO, Marketing Manager, etc.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Company Size</p>
                      <p className="text-xs text-muted-foreground">1-10, 11-50, 51-200, etc.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-xs text-muted-foreground">Countries, regions, or cities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-xs text-muted-foreground">Technology, Healthcare, Finance, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Step */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={onboardingData.timezone}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sending Hours</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={onboardingData.sendingHours.start}
                      onChange={(e) => handleInputChange('sendingHours', {
                        ...onboardingData.sendingHours,
                        start: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={onboardingData.sendingHours.end}
                      onChange={(e) => handleInputChange('sendingHours', {
                        ...onboardingData.sendingHours,
                        end: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Emails will only be sent during these hours in your timezone
                </p>
              </div>

              <div>
                <Label htmlFor="dailyLimit">Daily Email Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={onboardingData.dailyLimit}
                  onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                  placeholder="100"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of emails to send per day (recommended: 50-150)
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  We'll automatically optimize sending to avoid spam filters and improve deliverability.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
                <p className="text-muted-foreground">
                  Your Sales Outreach Agent is ready to start generating leads
                </p>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Next Steps</h3>
                    <ol className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">1.</span>
                        <span>Import your leads or use our lead finder</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">2.</span>
                        <span>Create your first email campaign</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">3.</span>
                        <span>Set up email sequences for automation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">4.</span>
                        <span>Monitor your campaign performance</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => router.push('/dashboard/sales/leads/import')}>
                    <Users className="mr-2 h-4 w-4" />
                    Import Leads
                  </Button>
                  <Button onClick={() => router.push('/dashboard/sales/campaigns/new')}>
                    <Mail className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}