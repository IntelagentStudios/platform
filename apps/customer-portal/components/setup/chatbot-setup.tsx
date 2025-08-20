'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Globe, 
  Code, 
  Settings, 
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatbotSetupProps {
  licenseKey: string;
  onComplete?: () => void;
}

export function ChatbotSetup({ licenseKey, onComplete }: ChatbotSetupProps) {
  const [domain, setDomain] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#0066cc');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [setupStep, setSetupStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const embedCode = `<!-- Intelagent Chatbot -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.intelagent.ai/chatbot.js';
    script.async = true;
    script.dataset.license = '${licenseKey}';
    script.dataset.position = '${position}';
    script.dataset.color = '${primaryColor}';
    document.head.appendChild(script);
  })();
</script>`;

  const handleDomainValidation = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/products/chatbot/validate-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      if (response.ok) {
        setSetupStep(1);
        toast({
          title: 'Domain validated',
          description: 'Your domain is ready for chatbot installation'
        });
      } else {
        toast({
          title: 'Validation failed',
          description: 'Please check your domain and try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate domain',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      const response = await fetch('/api/products/chatbot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          welcomeMessage,
          primaryColor,
          position
        })
      });

      if (response.ok) {
        setSetupStep(2);
        toast({
          title: 'Configuration saved',
          description: 'Your chatbot is ready to deploy'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: 'Copied!',
      description: 'Embed code copied to clipboard'
    });
  };

  const handleTestChatbot = () => {
    window.open(`https://test.intelagent.ai/chatbot/${licenseKey}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {[0, 1, 2].map((step) => (
          <div
            key={step}
            className={`flex items-center ${step < 2 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${setupStep >= step 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'}
              `}
            >
              {setupStep > step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span>{step + 1}</span>
              )}
            </div>
            {step < 2 && (
              <div
                className={`
                  flex-1 h-1 mx-2
                  ${setupStep > step ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      <Tabs value={String(setupStep)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="0" disabled={setupStep < 0}>
            <Globe className="h-4 w-4 mr-2" />
            Domain Setup
          </TabsTrigger>
          <TabsTrigger value="1" disabled={setupStep < 1}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="2" disabled={setupStep < 2}>
            <Code className="h-4 w-4 mr-2" />
            Installation
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Domain Setup */}
        <TabsContent value="0" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Domain</CardTitle>
              <CardDescription>
                Enter the domain where you want to install the chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Website Domain</Label>
                <Input
                  id="domain"
                  type="url"
                  placeholder="https://example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your full website URL including https://
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have access to add scripts to this domain
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleDomainValidation}
                disabled={!domain || isValidating}
                className="w-full"
              >
                {isValidating ? 'Validating...' : 'Validate Domain'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Configuration */}
        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Chatbot</CardTitle>
              <CardDescription>
                Configure the appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  placeholder="Enter a friendly welcome message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={position === 'bottom-right' ? 'default' : 'outline'}
                    onClick={() => setPosition('bottom-right')}
                    className="justify-start"
                  >
                    Bottom Right
                  </Button>
                  <Button
                    variant={position === 'bottom-left' ? 'default' : 'outline'}
                    onClick={() => setPosition('bottom-left')}
                    className="justify-start"
                  >
                    Bottom Left
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveConfiguration} className="w-full">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your chatbot will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 bg-muted rounded-lg">
                <div
                  className={`
                    absolute ${position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'}
                    w-14 h-14 rounded-full flex items-center justify-center
                    shadow-lg cursor-pointer hover:scale-105 transition-transform
                  `}
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Installation */}
        <TabsContent value="2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Install Your Chatbot</CardTitle>
              <CardDescription>
                Add this code to your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this code just before the closing &lt;/head&gt; tag
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleTestChatbot}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Chatbot
                </Button>
                <Button onClick={onComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Train Your Chatbot</p>
                  <p className="text-sm text-muted-foreground">
                    Upload documents and FAQs to improve responses
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Monitor Conversations</p>
                  <p className="text-sm text-muted-foreground">
                    View chat logs and analytics in your dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}