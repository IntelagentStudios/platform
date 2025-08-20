'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bot,
  Workflow,
  Database,
  Globe,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  FileJson,
  Link,
  Copy,
  ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatbotN8nPage() {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:5678/webhook/chatbot');
  const [setupWebhookUrl, setSetupWebhookUrl] = useState('http://localhost:5678/webhook/setup-agent');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [indexingStatus, setIndexingStatus] = useState<'idle' | 'indexing' | 'complete' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const siteKey = 'ik_n8n_indexed_' + Math.random().toString(36).substr(2, 9);
  
  const embedCode = `<!-- Intelagent Advanced Chatbot (n8n) -->
<script src="https://yourdomain.com/widget-n8n.js" data-site="${siteKey}" data-n8n="true"></script>
<!-- End Intelagent Chatbot -->`;

  const handleIndexWebsite = async () => {
    if (!websiteUrl) return;
    
    setIndexingStatus('indexing');
    
    try {
      const response = await fetch('/api/chat/n8n', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: websiteUrl,
          siteKey: siteKey,
          action: 'index'
        })
      });
      
      if (response.ok) {
        setIndexingStatus('complete');
      } else {
        setIndexingStatus('error');
      }
    } catch (error) {
      setIndexingStatus('error');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/products')}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Advanced AI Chatbot (n8n)</h1>
              <p className="text-muted-foreground">Double Agent System with Website Indexing</p>
            </div>
          </div>
        </div>
      </div>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Advanced n8n Integration</AlertTitle>
        <AlertDescription>
          This chatbot uses your existing n8n workflows with Atlas & Hermes double agent system, 
          vector search, and intelligent website scraping.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup Agent</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Double Agent System</CardTitle>
              <CardDescription>
                Your n8n chatbot uses two specialized AI agents working together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Agent 1: Atlas</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Search Strategist - Analyzes intent, searches vectors, determines best content to retrieve
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• Vector search integration</li>
                          <li>• Intent recognition</li>
                          <li>• Smart path selection</li>
                          <li>• Context awareness</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Bot className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Agent 2: Hermes</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Response Specialist - Creates personalized, context-aware responses
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• Personalized messaging</li>
                          <li>• Sales psychology</li>
                          <li>• Link recommendations</li>
                          <li>• Conversation flow</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Workflow Files Available</AlertTitle>
                <AlertDescription>
                  Your n8n workflows are already in the repository:
                  <ul className="mt-2 text-xs space-y-1">
                    <li>• chatbot (26).json - Main double agent workflow</li>
                    <li>• chatbot-setup (12).json - Setup agent for indexing</li>
                    <li>• chatbot-index (3).json - Indexing workflow</li>
                    <li>• chatbot-vector.json - Vector search configuration</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Agent Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Indexing Setup</CardTitle>
              <CardDescription>
                Use the setup agent to index your website for intelligent responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website URL to Index</Label>
                <div className="flex gap-2">
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <Button 
                    onClick={handleIndexWebsite}
                    disabled={indexingStatus === 'indexing'}
                  >
                    {indexingStatus === 'indexing' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Index Website
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {indexingStatus === 'complete' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Indexing Complete!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your website has been indexed. The chatbot now has knowledge of your content.
                  </AlertDescription>
                </Alert>
              )}

              {indexingStatus === 'error' && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Indexing Failed</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Please check your n8n webhook is running and try again.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 space-y-3">
                <h4 className="font-semibold">What happens during indexing:</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Page Discovery</p>
                      <p className="text-xs text-muted-foreground">Crawls your website to find all pages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Content Extraction</p>
                      <p className="text-xs text-muted-foreground">Extracts text, headings, and metadata</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Vector Creation</p>
                      <p className="text-xs text-muted-foreground">Creates searchable vectors for intelligent matching</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Knowledge Graph</p>
                      <p className="text-xs text-muted-foreground">Builds relationships between pages and topics</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Workflow Files</CardTitle>
              <CardDescription>
                Import these workflows into your n8n instance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileJson className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Main Chatbot Workflow</h4>
                        <p className="text-xs text-muted-foreground mt-1">chatbot (26).json</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Double agent system with Atlas & Hermes
                        </p>
                        <Button size="sm" variant="outline" className="mt-3">
                          <Link className="w-3 h-3 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileJson className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Setup Agent Workflow</h4>
                        <p className="text-xs text-muted-foreground mt-1">chatbot-setup (12).json</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Website indexing and vector creation
                        </p>
                        <Button size="sm" variant="outline" className="mt-3">
                          <Link className="w-3 h-3 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileJson className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Index Workflow</h4>
                        <p className="text-xs text-muted-foreground mt-1">chatbot-index (3).json</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Page processing and content extraction
                        </p>
                        <Button size="sm" variant="outline" className="mt-3">
                          <Link className="w-3 h-3 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileJson className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Vector Search</h4>
                        <p className="text-xs text-muted-foreground mt-1">chatbot-vector.json</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Intelligent content matching
                        </p>
                        <Button size="sm" variant="outline" className="mt-3">
                          <Link className="w-3 h-3 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Instructions</AlertTitle>
                <AlertDescription>
                  <ol className="mt-2 text-xs space-y-1">
                    <li>1. Open your n8n instance</li>
                    <li>2. Go to Workflows → Import</li>
                    <li>3. Upload each JSON file</li>
                    <li>4. Configure webhook URLs in each workflow</li>
                    <li>5. Activate the workflows</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Configuration</CardTitle>
              <CardDescription>
                Configure your n8n webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">Chatbot Webhook URL</Label>
                <Input
                  id="webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="http://localhost:5678/webhook/chatbot"
                />
                <p className="text-xs text-muted-foreground">
                  The webhook URL from your main chatbot workflow
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-webhook">Setup Agent Webhook URL</Label>
                <Input
                  id="setup-webhook"
                  value={setupWebhookUrl}
                  onChange={(e) => setSetupWebhookUrl(e.target.value)}
                  placeholder="http://localhost:5678/webhook/setup-agent"
                />
                <p className="text-xs text-muted-foreground">
                  The webhook URL from your setup agent workflow
                </p>
              </div>

              <div className="pt-4">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Environment Variables</AlertTitle>
                <AlertDescription>
                  Add these to your .env.local file:
                  <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`N8N_WEBHOOK_URL=${webhookUrl}
N8N_SETUP_WEBHOOK=${setupWebhookUrl}`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deploy Tab */}
        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy Chatbot</CardTitle>
              <CardDescription>
                Add the advanced chatbot to your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Site Key</AlertTitle>
                <AlertDescription>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">{siteKey}</code>
                  <p className="mt-2 text-xs text-blue-700">
                    This key identifies your website and enables n8n features
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
{embedCode}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Features Enabled:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Double Agent System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Vector Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Website Scraping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Context Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Intent Recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Smart Responses</span>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Test Chatbot
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}