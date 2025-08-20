'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Database, 
  Key, 
  Settings, 
  CheckCircle,
  Copy,
  Shield,
  Zap,
  AlertCircle,
  Globe,
  Building,
  Mail,
  Phone,
  User,
  Linkedin,
  Twitter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrichmentSetupProps {
  licenseKey: string;
  onComplete?: () => void;
}

export function EnrichmentSetup({ licenseKey, onComplete }: EnrichmentSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [dataPoints, setDataPoints] = useState({
    email: true,
    phone: true,
    company: true,
    jobTitle: false,
    linkedin: false,
    twitter: false,
    location: true,
    industry: true
  });
  const [setupStep, setSetupStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/products/enrichment/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        setSetupStep(1);
        toast({
          title: 'API Key generated',
          description: 'Your enrichment API key is ready'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate API key',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard'
    });
  };

  const handleSaveConfiguration = async () => {
    try {
      const response = await fetch('/api/products/enrichment/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPoints })
      });

      if (response.ok) {
        setSetupStep(2);
        toast({
          title: 'Configuration saved',
          description: 'Your enrichment service is ready'
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

  const exampleRequest = `curl -X POST https://api.intelagent.ai/v1/enrich \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "domain": "example.com"
  }'`;

  const exampleResponse = `{
  "person": {
    "email": "john@example.com",
    "name": "John Doe",
    "jobTitle": "VP of Sales",
    "phone": "+1-555-0123",
    "linkedin": "linkedin.com/in/johndoe",
    "location": "San Francisco, CA"
  },
  "company": {
    "name": "Example Corp",
    "domain": "example.com",
    "industry": "Technology",
    "size": "100-500",
    "founded": 2010
  }
}`;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {['Generate API Key', 'Configure Data', 'Integration'].map((label, idx) => (
          <div
            key={idx}
            className={`flex items-center ${idx < 2 ? 'flex-1' : ''}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${setupStep >= idx 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                `}
              >
                {setupStep > idx ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </div>
            {idx < 2 && (
              <div
                className={`
                  flex-1 h-1 mx-2 -mt-4
                  ${setupStep > idx ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Generate API Key */}
      {setupStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Your API Key</CardTitle>
            <CardDescription>
              Create a secure key to access the enrichment API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-muted rounded-lg text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm mb-4">
                Generate a unique API key to authenticate your requests
              </p>
              <Button 
                onClick={generateApiKey}
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? 'Generating...' : 'Generate API Key'}
              </Button>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your API key will be shown only once. Make sure to save it securely.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure Data Points */}
      {setupStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your API Key</CardTitle>
            <CardDescription>
              Save this key securely - it won't be shown again
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyApiKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Save this key now! For security reasons, we don't store it and cannot show it again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Select Data Points to Enrich</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {Object.entries({
                  email: { icon: Mail, label: 'Email Address' },
                  phone: { icon: Phone, label: 'Phone Number' },
                  company: { icon: Building, label: 'Company Information' },
                  jobTitle: { icon: User, label: 'Job Title' },
                  linkedin: { icon: Linkedin, label: 'LinkedIn Profile' },
                  twitter: { icon: Twitter, label: 'Twitter/X Handle' },
                  location: { icon: Globe, label: 'Location' },
                  industry: { icon: Database, label: 'Industry' }
                }).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={dataPoints[key as keyof typeof dataPoints]}
                      onCheckedChange={(checked) => 
                        setDataPoints(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <Label
                      htmlFor={key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setSetupStep(0)}>
                Back
              </Button>
              <Button onClick={handleSaveConfiguration}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Integration Guide */}
      {setupStep === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>
                Start enriching your data with our API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Example Request</Label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                    <code>{exampleRequest}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(exampleRequest);
                      toast({ title: 'Copied!', description: 'Example request copied' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Example Response</Label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                    <code>{exampleResponse}</code>
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge className="mb-2">Rate Limit</Badge>
                      <p className="text-2xl font-bold">1000</p>
                      <p className="text-sm text-muted-foreground">requests/hour</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge className="mb-2">Response Time</Badge>
                      <p className="text-2xl font-bold">&lt;500ms</p>
                      <p className="text-sm text-muted-foreground">average</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={onComplete} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                View Full API Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Webhooks & Integrations
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security & Compliance
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}