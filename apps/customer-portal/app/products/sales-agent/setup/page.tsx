'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Settings, Mail, Target, Zap, CheckCircle2, 
  AlertCircle, ChevronRight, ArrowLeft, Copy, ExternalLink,
  Calendar, Filter, MessageSquare, Database, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const steps = [
  { id: 'crm', title: 'CRM Integration', description: 'Connect your CRM system' },
  { id: 'targeting', title: 'Lead Targeting', description: 'Define your ideal customer' },
  { id: 'campaigns', title: 'Campaigns', description: 'Set up outreach campaigns' },
  { id: 'automation', title: 'Automation', description: 'Configure automation rules' },
  { id: 'complete', title: 'Complete', description: 'Review and activate' }
];

interface SetupData {
  crmType?: string;
  crmApiKey?: string;
  crmWebhook?: string;
  targetIndustries?: string[];
  targetCompanySize?: string;
  targetRegions?: string[];
  leadScoringRules?: any[];
  campaignName?: string;
  emailTemplate?: string;
  followUpSequence?: any[];
  automationRules?: any[];
  dailyLimit?: number;
  workingHours?: { start: string; end: string };
}

export default function SalesAgentSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentKey, setAgentKey] = useState('');

  const updateData = (data: Partial<SetupData>) => {
    setSetupData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateAgentKey = () => {
    const key = `SA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setAgentKey(key);
    return key;
  };

  const completeSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const key = generateAgentKey();
      
      const response = await fetch('/api/products/sales-agent/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setupData,
          agent_key: key
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete setup');
      }

      // Redirect to success page
      router.push('/products/sales-agent?setup=complete');
    } catch (err) {
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // CRM Integration
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Connect Your CRM</h2>
              <p className="text-gray-600 mt-2">Integrate with your existing CRM system</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>CRM System</Label>
                <Select 
                  value={setupData.crmType || ''} 
                  onValueChange={(value) => updateData({ crmType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your CRM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    <SelectItem value="zoho">Zoho CRM</SelectItem>
                    <SelectItem value="custom">Custom Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {setupData.crmType && (
                <>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your CRM API key"
                      value={setupData.crmApiKey || ''}
                      onChange={(e) => updateData({ crmApiKey: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Find this in your CRM's API settings
                    </p>
                  </div>

                  <div>
                    <Label>Webhook URL (Optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://your-crm.com/webhook"
                      value={setupData.crmWebhook || ''}
                      onChange={(e) => updateData({ crmWebhook: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For real-time lead updates
                    </p>
                  </div>
                </>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Don't have a CRM yet? You can skip this step and use our built-in lead management.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 1: // Lead Targeting
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Define Your Target Audience</h2>
              <p className="text-gray-600 mt-2">Tell us who your ideal customers are</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Target Industries</Label>
                <Textarea
                  placeholder="E.g., Technology, Healthcare, Finance, Real Estate"
                  value={setupData.targetIndustries?.join(', ') || ''}
                  onChange={(e) => updateData({ 
                    targetIndustries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple industries with commas
                </p>
              </div>

              <div>
                <Label>Company Size</Label>
                <Select 
                  value={setupData.targetCompanySize || ''} 
                  onValueChange={(value) => updateData({ targetCompanySize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                    <SelectItem value="small">Small (11-50 employees)</SelectItem>
                    <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Regions</Label>
                <Textarea
                  placeholder="E.g., United States, Europe, Asia Pacific"
                  value={setupData.targetRegions?.join(', ') || ''}
                  onChange={(e) => updateData({ 
                    targetRegions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={2}
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">AI-Powered Matching</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Our AI will automatically find and qualify leads matching your criteria
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2: // Campaigns
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Create Your First Campaign</h2>
              <p className="text-gray-600 mt-2">Set up your outreach messaging</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  placeholder="E.g., Q1 Enterprise Outreach"
                  value={setupData.campaignName || ''}
                  onChange={(e) => updateData({ campaignName: e.target.value })}
                />
              </div>

              <div>
                <Label>Initial Email Template</Label>
                <Textarea
                  placeholder="Hi [Name],

I noticed your company [Company] is in the [Industry] space. We've helped similar companies increase their sales by 30% through our AI automation platform.

Would you be interested in a quick 15-minute call to discuss how we could help [Company] achieve similar results?

Best regards,
[Your Name]"
                  value={setupData.emailTemplate || ''}
                  onChange={(e) => updateData({ emailTemplate: e.target.value })}
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use [Name], [Company], [Industry] as merge tags
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Enable Follow-up Sequence</p>
                  <p className="text-sm text-gray-600">Send automatic follow-ups if no response</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Alert className="bg-green-50 border-green-200">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Our AI will personalize each message based on the recipient's profile and company information
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3: // Automation Rules
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Configure Automation</h2>
              <p className="text-gray-600 mt-2">Set rules for your sales agent</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Daily Outreach Limit</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={setupData.dailyLimit || 50}
                  onChange={(e) => updateData({ dailyLimit: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of new contacts per day
                </p>
              </div>

              <div>
                <Label>Working Hours</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={setupData.workingHours?.start || '09:00'}
                    onChange={(e) => updateData({ 
                      workingHours: { ...setupData.workingHours, start: e.target.value, end: setupData.workingHours?.end || '17:00' }
                    })}
                  />
                  <span className="self-center">to</span>
                  <Input
                    type="time"
                    value={setupData.workingHours?.end || '17:00'}
                    onChange={(e) => updateData({ 
                      workingHours: { ...setupData.workingHours, start: setupData.workingHours?.start || '09:00', end: e.target.value }
                    })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Emails will only be sent during these hours (recipient's timezone)
                </p>
              </div>

              <div className="space-y-3">
                <Label>Automation Rules</Label>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto-qualify leads</p>
                    <p className="text-xs text-gray-600">Score leads based on engagement</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto-schedule meetings</p>
                    <p className="text-xs text-gray-600">Book calls when prospects show interest</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Smart follow-ups</p>
                    <p className="text-xs text-gray-600">AI determines best follow-up timing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 4: // Complete
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold">Setup Complete!</h2>
              <p className="text-gray-600 mt-2">Your Sales Agent is ready to start generating leads</p>
            </div>

            {agentKey && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Your Agent Key</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-lg font-mono font-bold text-blue-600">
                        {agentKey}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(agentKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Use this key to integrate with external systems
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm">Your Sales Agent will start finding leads immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm">First outreach campaigns will begin within 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm">You'll receive daily reports on lead generation progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-sm">AI will continuously optimize messaging for better results</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/products/sales-agent')}
              >
                View Dashboard
              </Button>
              <Button 
                onClick={completeSetup}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isLoading ? 'Activating...' : 'Activate Sales Agent'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-600">{step.title}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="mt-12">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Setup Assistant */}
      <Card className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-purple-900">Setup Assistant</p>
              <p className="text-sm text-purple-700 mt-1">
                {currentStep === 0 && "Connect your CRM to sync leads automatically. You can skip this and use our built-in system."}
                {currentStep === 1 && "Define your ideal customer profile. The more specific, the better the AI can target leads."}
                {currentStep === 2 && "Create compelling messages that resonate with your audience. Our AI will personalize each one."}
                {currentStep === 3 && "Set boundaries for your automation. You can always adjust these settings later."}
                {currentStep === 4 && "Your Sales Agent is ready! It will start working immediately after activation."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}