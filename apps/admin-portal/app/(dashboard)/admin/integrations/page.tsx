'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Code,
  Key,
  Webhook,
  Plug,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Zap,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string | null
  permissions: string[]
  status: string
}

interface WebhookConfig {
  id: string
  url: string
  events: string[]
  status: string
  created: string
  lastTriggered: string | null
  successRate: number
}

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  status: 'connected' | 'available' | 'coming_soon'
  features: string[]
  popularityScore: number
}

export default function IntegrationsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  
  // Dialog states
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [newApiKeyEnv, setNewApiKeyEnv] = useState('live')
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState(['read'])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api_key',
          data: {
            name: newApiKeyName,
            environment: newApiKeyEnv,
            permissions: newApiKeyPermissions
          }
        })
      })
      
      if (response.ok) {
        setApiKeyDialogOpen(false)
        setNewApiKeyName('')
        setNewApiKeyEnv('live')
        setNewApiKeyPermissions(['read'])
        await fetchIntegrations()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook',
          data: {
            url: newWebhookUrl,
            events: newWebhookEvents
          }
        })
      })
      
      if (response.ok) {
        setWebhookDialogOpen(false)
        setNewWebhookUrl('')
        setNewWebhookEvents([])
        await fetchIntegrations()
      }
    } catch (error) {
      console.error('Failed to create webhook:', error)
    }
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const filteredIntegrations = data?.integrations?.filter((integration: Integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  const categories = ['all', 'payments', 'automation', 'communication', 'crm', 'marketing', 'analytics', 'development']

  const webhookEvents = [
    'payment.succeeded',
    'payment.failed',
    'customer.created',
    'customer.updated',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'invoice.created',
    'invoice.paid'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-500">Connect your favorite tools and manage API access</p>
        </div>
        <Button onClick={fetchIntegrations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalIntegrations || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.connectedIntegrations || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.activeApiKeys || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.activeWebhooks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration: Integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {integration.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{integration.popularityScore}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {integration.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  {integration.status === 'connected' ? (
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  ) : integration.status === 'available' ? (
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">API Keys</h2>
              <p className="text-sm text-gray-500">Manage your API keys for programmatic access</p>
            </div>
            <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for your integration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production Key"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select value={newApiKeyEnv} onValueChange={setNewApiKeyEnv}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="read"
                          checked={newApiKeyPermissions.includes('read')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewApiKeyPermissions([...newApiKeyPermissions, 'read'])
                            } else {
                              setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== 'read'))
                            }
                          }}
                        />
                        <Label htmlFor="read">Read</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="write"
                          checked={newApiKeyPermissions.includes('write')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewApiKeyPermissions([...newApiKeyPermissions, 'write'])
                            } else {
                              setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== 'write'))
                            }
                          }}
                        />
                        <Label htmlFor="write">Write</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey}>
                    Create Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">API Key</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4">Last Used</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.apiKeys?.map((apiKey: ApiKey) => (
                    <tr key={apiKey.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{apiKey.name}</p>
                          <p className="text-xs text-gray-500">
                            {apiKey.permissions.join(', ')}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {showApiKey === apiKey.id 
                              ? apiKey.key 
                              : apiKey.key.substring(0, 20) + '...'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showApiKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyApiKey(apiKey.key)}
                          >
                            {copiedKey === apiKey.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(apiKey.created).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">
                        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Webhooks</h2>
              <p className="text-sm text-gray-500">Configure webhooks to receive real-time events</p>
            </div>
            <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Webhook Endpoint</DialogTitle>
                  <DialogDescription>
                    Configure a new webhook to receive events
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Endpoint URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://example.com/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Events</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {webhookEvents.map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <Checkbox
                            id={event}
                            checked={newWebhookEvents.includes(event)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewWebhookEvents([...newWebhookEvents, event])
                              } else {
                                setNewWebhookEvents(newWebhookEvents.filter(e => e !== event))
                              }
                            }}
                          />
                          <Label htmlFor={event} className="text-sm">
                            {event}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWebhook}>
                    Add Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {data?.webhooks?.map((webhook: WebhookConfig) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{webhook.url}</CardTitle>
                      <CardDescription>
                        Created on {new Date(webhook.created).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Subscribed Events:</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Success Rate: </span>
                        <span className="font-medium">{webhook.successRate}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Last Triggered: </span>
                        <span className="font-medium">
                          {webhook.lastTriggered 
                            ? new Date(webhook.lastTriggered).toLocaleString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Everything you need to integrate with our platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <code className="bg-gray-100 px-3 py-2 rounded block">
                  https://api.intelagentstudios.com/v1
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Include your API key in the Authorization header:
                </p>
                <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Request</h3>
                <pre className="bg-gray-100 px-3 py-2 rounded text-sm overflow-x-auto">
{`curl -X GET https://api.intelagentstudios.com/v1/licenses \\
  -H "Authorization: Bearer intl_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Endpoints</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/licenses</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-sm">/licenses</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/usage</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/teams</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Documentation
                </Button>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Download SDK
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}