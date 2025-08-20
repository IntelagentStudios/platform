'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Bot,
  ChevronLeft,
  Copy,
  Check,
  Globe,
  Code,
  Settings,
  MessageSquare,
  Palette,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function ChatbotProductPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('ik_prod_xxx...'); // This would come from your backend
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [botName, setBotName] = useState('Support Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [position, setPosition] = useState('bottom-right');
  const [autoOpen, setAutoOpen] = useState(false);
  const [collectEmail, setCollectEmail] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const embedCode = `<!-- Intelagent Chatbot -->
<script>
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://chat.intelagent.ai/widget.js?id='+i;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${apiKey}');
</script>
<!-- End Intelagent Chatbot -->`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    // TODO: Save settings to backend
    alert('Settings saved! The chatbot will update on your website shortly.');
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
            Back to Products
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Chatbot</h1>
              <p className="text-muted-foreground">Configure and deploy your chatbot</p>
            </div>
            <Badge className={enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {enabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Enable chatbot"
        />
      </div>

      {/* Quick Setup Alert */}
      {!websiteUrl && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quick Setup Required</AlertTitle>
          <AlertDescription>
            Add your website URL below and copy the embed code to get started.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Add the chatbot to your website in just 2 steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Website URL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-semibold">Add Your Website</h3>
                </div>
                <div className="ml-10 space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the URL where you want to install the chatbot
                  </p>
                </div>
              </div>

              {/* Step 2: Embed Code */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h3 className="font-semibold">Copy & Paste Embed Code</h3>
                </div>
                <div className="ml-10 space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <Textarea
                      value={embedCode}
                      readOnly
                      className="font-mono text-xs h-32"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add this code to your website&apos;s HTML, just before the closing &lt;/body&gt; tag
                  </p>
                </div>
              </div>

              {/* API Key Info */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Your API Key</AlertTitle>
                <AlertDescription>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{apiKey}</code>
                  <p className="mt-2 text-sm">
                    Keep this key secure. It&apos;s unique to your account and allows the chatbot to work on your website.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Integration Options */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Options</CardTitle>
              <CardDescription>
                Alternative ways to integrate the chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Globe className="w-5 h-5 mb-2" />
                <span>WordPress Plugin</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Code className="w-5 h-5 mb-2" />
                <span>React Component</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Zap className="w-5 h-5 mb-2" />
                <span>API Integration</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customize Tab */}
        <TabsContent value="customize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the chatbot looks on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <Input
                    id="bot-name"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Support Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger id="position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome">Welcome Message</Label>
                  <Textarea
                    id="welcome"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hello! How can I help you today?"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={handleSaveSettings}>
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Behavior</CardTitle>
              <CardDescription>
                Configure how the chatbot interacts with visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-open Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically open the chat window when a visitor arrives
                    </p>
                  </div>
                  <Switch
                    checked={autoOpen}
                    onCheckedChange={setAutoOpen}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Collect Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Ask visitors for their email before starting a conversation
                    </p>
                  </div>
                  <Switch
                    checked={collectEmail}
                    onCheckedChange={setCollectEmail}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Typing Indicator</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when the bot is typing a response
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Play a sound when new messages arrive
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={handleSaveSettings}>
                  Save Behavior Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Train your chatbot with custom information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Training Your Chatbot</AlertTitle>
                <AlertDescription>
                  Upload documents, add FAQs, or provide website URLs to train your chatbot with specific knowledge about your business.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-6">
                  <div className="text-center">
                    <Globe className="w-8 h-8 mx-auto mb-2" />
                    <span>Import from Website</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-6">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <span>Add FAQs</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-6">
                  <div className="text-center">
                    <Code className="w-8 h-8 mx-auto mb-2" />
                    <span>Upload Documents</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Conversations</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages Today</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">0s</p>
                  </div>
                  <Bot className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                View and manage recent chatbot interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Conversations will appear here once your chatbot is active</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}