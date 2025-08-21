'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Globe, 
  Key, 
  Code, 
  CheckCircle, 
  Circle,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Bot,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SetupData {
  domain: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
  position: 'bottom-right' | 'bottom-left';
}

const defaultSetupData: SetupData = {
  domain: '',
  businessName: '',
  primaryColor: '#6366f1',
  welcomeMessage: 'Hi! How can I help you today?',
  position: 'bottom-right'
};

const steps = [
  { id: 'domain', title: 'Domain Setup', description: 'Configure your website domain' },
  { id: 'customize', title: 'Customize', description: 'Personalize your chatbot' },
  { id: 'generate', title: 'Generate Key', description: 'Create your secure site key' },
  { id: 'install', title: 'Install', description: 'Add chatbot to your website' },
  { id: 'test', title: 'Test', description: 'Verify everything works' }
];

export default function ChatbotSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>(defaultSetupData);
  const [siteKey, setSiteKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponses, setChatResponses] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Load existing setup if any
  useEffect(() => {
    fetchExistingSetup();
  }, []);

  const fetchExistingSetup = async () => {
    try {
      const response = await fetch('/api/products/chatbot/setup');
      if (response.ok) {
        const data = await response.json();
        if (data.setup_completed) {
          setSetupData(data.setup_data || defaultSetupData);
          setSiteKey(data.site_key || '');
          setSetupComplete(true);
          setCurrentStep(4); // Go to last step
        }
      }
    } catch (error) {
      console.error('Error fetching setup:', error);
    }
  };

  const validateDomain = (domain: string) => {
    const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainPattern.test(domain);
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateDomain(setupData.domain)) {
      toast({
        title: 'Invalid Domain',
        description: 'Please enter a valid domain (e.g., example.com)',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateSiteKey = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/products/chatbot/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: setupData.domain,
          setup_data: setupData
        })
      });

      if (!response.ok) throw new Error('Failed to generate site key');
      
      const data = await response.json();
      setSiteKey(data.site_key);
      
      // Simulate calling N8N webhook to set up the agent
      await setupN8NAgent(data.site_key);
      
      toast({
        title: 'Success!',
        description: 'Your chatbot has been configured successfully',
      });
      
      handleNext();
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to generate site key. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const setupN8NAgent = async (siteKey: string) => {
    // This would call your N8N webhook to set up the agent
    try {
      const response = await fetch('/api/webhook/setup-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_key: siteKey,
          domain: setupData.domain,
          config: setupData
        })
      });
      
      if (!response.ok) {
        console.error('N8N setup failed');
      }
    } catch (error) {
      console.error('N8N webhook error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
  };

  const verifyInstallation = async () => {
    setIsVerifying(true);
    
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSetupComplete(true);
      
      toast({
        title: 'Verification Complete!',
        description: 'Your chatbot is now active on your website',
      });
      
      // Mark setup as complete in database
      await fetch('/api/products/chatbot/setup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setup_completed: true })
      });
      
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Please check your installation and try again',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage;
    setChatMessage('');
    setChatResponses(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Simulate assistant response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'help': 'I can help you set up your chatbot! Just follow the steps above.',
        'install': 'Copy the embed code from Step 4 and paste it before the closing </body> tag on your website.',
        'domain': 'Enter your website domain without http:// or https://, just the domain name like example.com',
        'test': 'Once installed, visit your website and look for the chat widget in the bottom corner!',
        'default': 'I\'m here to help with your chatbot setup. What would you like to know?'
      };
      
      const response = responses[userMessage.toLowerCase()] || 
                      responses.default;
      
      setChatResponses(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  const embedCode = siteKey ? `<!-- Intelagent Chatbot Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://widget.intelagent.ai/chatbot.js';
    script.async = true;
    script.setAttribute('data-site-key', '${siteKey}');
    script.setAttribute('data-position', '${setupData.position}');
    script.setAttribute('data-primary-color', '${setupData.primaryColor}');
    document.body.appendChild(script);
  })();
</script>` : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                  Chatbot Setup
                </h1>
                <p className="text-sm text-gray-600">Configure your AI customer support assistant</p>
              </div>
            </div>
            {setupComplete && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${index <= currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'}
                  `}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2
                    ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Steps */}
          <div className="lg:col-span-2">
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
                    <CardTitle>{steps[currentStep].title}</CardTitle>
                    <CardDescription>{steps[currentStep].description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Step 1: Domain Setup */}
                    {currentStep === 0 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="domain">Website Domain</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="domain"
                              type="text"
                              placeholder="example.com"
                              value={setupData.domain}
                              onChange={(e) => setSetupData({ ...setupData, domain: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Enter your domain without http:// or https://
                          </p>
                        </div>
                        
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This domain will be locked to your license for security. 
                            Make sure it's correct before proceeding.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    {/* Step 2: Customize */}
                    {currentStep === 1 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            type="text"
                            placeholder="Your Company"
                            value={setupData.businessName}
                            onChange={(e) => setSetupData({ ...setupData, businessName: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="welcomeMessage">Welcome Message</Label>
                          <Input
                            id="welcomeMessage"
                            type="text"
                            placeholder="Hi! How can I help you today?"
                            value={setupData.welcomeMessage}
                            onChange={(e) => setSetupData({ ...setupData, welcomeMessage: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={setupData.primaryColor}
                              onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                              className="w-20"
                            />
                            <Input
                              type="text"
                              value={setupData.primaryColor}
                              onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Widget Position</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={setupData.position === 'bottom-right' ? 'default' : 'outline'}
                              onClick={() => setSetupData({ ...setupData, position: 'bottom-right' })}
                            >
                              Bottom Right
                            </Button>
                            <Button
                              type="button"
                              variant={setupData.position === 'bottom-left' ? 'default' : 'outline'}
                              onClick={() => setSetupData({ ...setupData, position: 'bottom-left' })}
                            >
                              Bottom Left
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 3: Generate Key */}
                    {currentStep === 2 && (
                      <div className="text-center py-8">
                        {!siteKey ? (
                          <>
                            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold mb-2">Ready to Generate Your Site Key</h3>
                            <p className="text-gray-600 mb-6">
                              Click below to generate a unique secure key for your chatbot
                            </p>
                            <Button
                              onClick={generateSiteKey}
                              disabled={isGenerating}
                              size="lg"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-4 w-4" />
                                  Generate Site Key
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                            <h3 className="text-lg font-semibold mb-2">Site Key Generated!</h3>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                              <code className="text-sm break-all">{siteKey}</code>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(siteKey)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Key
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 4: Install */}
                    {currentStep === 3 && (
                      <>
                        <Alert>
                          <Code className="h-4 w-4" />
                          <AlertDescription>
                            Copy this code and paste it before the closing &lt;/body&gt; tag on your website
                          </AlertDescription>
                        </Alert>
                        
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs">
                            <code>{embedCode}</code>
                          </pre>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(embedCode)}
                            className="flex-1"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(`https://${setupData.domain}`, '_blank')}
                            className="flex-1"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Website
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Step 5: Test */}
                    {currentStep === 4 && (
                      <div className="text-center py-8">
                        {!setupComplete ? (
                          <>
                            <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-bounce" />
                            <h3 className="text-lg font-semibold mb-2">Test Your Chatbot</h3>
                            <p className="text-gray-600 mb-6">
                              Visit your website and verify the chatbot appears in the {setupData.position.replace('-', ' ')}
                            </p>
                            <Button
                              onClick={verifyInstallation}
                              disabled={isVerifying}
                              size="lg"
                            >
                              {isVerifying ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Installation
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-green-500" />
                            <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
                            <p className="text-gray-600 mb-6">
                              Your chatbot is now active and ready to assist your customers
                            </p>
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={() => router.push('/products/chatbot')}
                              >
                                Go to Dashboard
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => window.open(`https://${setupData.domain}`, '_blank')}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View on Website
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    {currentStep < 4 && (
                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          disabled={currentStep === 0}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          onClick={currentStep === 2 && !siteKey ? generateSiteKey : handleNext}
                          disabled={
                            (currentStep === 0 && !setupData.domain) ||
                            (currentStep === 2 && !siteKey)
                          }
                        >
                          {currentStep === 2 && !siteKey ? 'Generate Key' : 'Next'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Help Assistant */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    Setup Assistant
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  I'm here to help you set up your chatbot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showChat ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <HelpCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Quick Tips</p>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          <li>• Use your main website domain</li>
                          <li>• Customize colors to match your brand</li>
                          <li>• Test on multiple devices</li>
                          <li>• Check console for any errors</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Zap className="w-4 h-4 mr-2 mt-0.5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Common Issues</p>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          <li>• Widget not showing? Check if code is added</li>
                          <li>• Wrong position? Update and refresh</li>
                          <li>• Blocked by ad-blocker? Whitelist domain</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {chatResponses.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">
                          Ask me anything about the setup process!
                        </p>
                      )}
                      {chatResponses.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[80%] p-2 rounded-lg text-sm
                              ${msg.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800'}
                            `}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your question..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      />
                      <Button onClick={sendChatMessage} size="sm">
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}