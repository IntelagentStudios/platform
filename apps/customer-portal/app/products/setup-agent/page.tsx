'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wand2, Code, Users, Settings, BarChart3, Play, 
  CheckCircle2, AlertCircle, Plus, Copy, ExternalLink,
  FileJson, Terminal, Sparkles, Zap, Globe, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface SetupWizard {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  completions: number;
  avgCompletionTime: string;
  steps: number;
  lastEdited: string;
  embedCode?: string;
}

export default function SetupAgentPage() {
  const router = useRouter();
  const [wizards, setWizards] = useState<SetupWizard[]>([
    {
      id: '1',
      name: 'Customer Onboarding',
      description: 'Guide new customers through account setup',
      status: 'active',
      completions: 245,
      avgCompletionTime: '3.5 min',
      steps: 5,
      lastEdited: '2 hours ago'
    },
    {
      id: '2',
      name: 'Product Configuration',
      description: 'Help users configure complex product settings',
      status: 'active',
      completions: 189,
      avgCompletionTime: '5.2 min',
      steps: 7,
      lastEdited: '1 day ago'
    },
    {
      id: '3',
      name: 'API Integration Guide',
      description: 'Step-by-step API setup assistant',
      status: 'draft',
      completions: 0,
      avgCompletionTime: '-',
      steps: 4,
      lastEdited: '3 days ago'
    }
  ]);

  const stats = {
    totalWizards: wizards.length,
    activeWizards: wizards.filter(w => w.status === 'active').length,
    totalCompletions: wizards.reduce((sum, w) => sum + w.completions, 0),
    avgCompletionRate: '78%'
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-purple-600" />
              Setup Agent
            </h1>
            <p className="text-gray-600 mt-2">
              Create intelligent setup wizards and onboarding flows for any product
            </p>
          </div>
          <Button 
            onClick={() => router.push('/products/setup-agent/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Wizard
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Wizards</p>
                <p className="text-2xl font-bold">{stats.totalWizards}</p>
              </div>
              <FileJson className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.activeWizards}</p>
              </div>
              <Play className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completions</p>
                <p className="text-2xl font-bold">{stats.totalCompletions}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold">{stats.avgCompletionRate}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="wizards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wizards">My Wizards</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="wizards" className="space-y-4">
          {wizards.map(wizard => (
            <Card key={wizard.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{wizard.name}</h3>
                      <Badge variant={wizard.status === 'active' ? 'default' : 'secondary'}>
                        {wizard.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{wizard.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {wizard.completions} completions
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {wizard.avgCompletionTime} avg time
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        {wizard.steps} steps
                      </span>
                      <span>
                        Updated {wizard.lastEdited}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/products/setup-agent/edit/${wizard.id}`)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(wizard.embedCode || '')}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed hover:border-purple-500 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">SaaS Onboarding</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Complete onboarding flow for SaaS applications with user profile, team setup, and integrations
                    </p>
                    <Badge variant="secondary">12 steps</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-purple-500 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">API Configuration</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Guide developers through API setup with key generation, webhook config, and testing
                    </p>
                    <Badge variant="secondary">8 steps</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-purple-500 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Security Setup</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Configure 2FA, permissions, and security policies for enterprise applications
                    </p>
                    <Badge variant="secondary">6 steps</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-purple-500 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Terminal className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Developer Tools</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Set up development environment, CLI tools, and SDK configuration
                    </p>
                    <Badge variant="secondary">10 steps</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Funnel</CardTitle>
                <CardDescription>User drop-off by step</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Step 1: Welcome</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Step 2: Account Info</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Step 3: Configuration</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Step 4: Integration</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Step 5: Complete</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>Common pain points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Step 3:</strong> Users spending 2x longer on API configuration
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Step 4:</strong> 15% of users request help with webhook setup
                    </AlertDescription>
                  </Alert>
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 mb-2">Satisfaction Score</p>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">4.6</div>
                      <div className="flex text-yellow-500">
                        {'★★★★☆'.split('').map((star, i) => (
                          <span key={i}>{star}</span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">(324 reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed Your Setup Wizard</CardTitle>
              <CardDescription>
                Add intelligent setup flows to any website or application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">JavaScript Embed</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre>{`<script src="https://cdn.intelagent.ai/setup-agent.js"></script>
<script>
  IntelagentSetup.init({
    wizardId: 'your-wizard-id',
    apiKey: 'your-api-key',
    onComplete: (data) => {
      console.log('Setup completed:', data);
    }
  });
</script>`}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText('...')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>

              <div>
                <h3 className="font-medium mb-2">React Component</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre>{`import { SetupWizard } from '@intelagent/setup-agent';

<SetupWizard 
  wizardId="your-wizard-id"
  apiKey="your-api-key"
  onComplete={(data) => console.log(data)}
/>`}</pre>
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Setup Agent automatically adapts to your brand colors and styling
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}