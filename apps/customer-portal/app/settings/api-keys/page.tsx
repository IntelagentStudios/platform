'use client';

import { useState, useEffect } from 'react';
import { 
  Key, Plus, Copy, Trash2, Eye, EyeOff, Shield, 
  AlertCircle, CheckCircle2, RefreshCw, Calendar,
  Globe, Lock, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPreview: string;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  permissions: string[];
  rateLimit: number;
  status: 'active' | 'expired' | 'revoked';
  usage: {
    requests: number;
    errors: number;
    lastRequest: string | null;
  };
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const availablePermissions = [
    { id: 'read', label: 'Read', description: 'Read data from API' },
    { id: 'write', label: 'Write', description: 'Create and update data' },
    { id: 'delete', label: 'Delete', description: 'Delete data' },
    { id: 'admin', label: 'Admin', description: 'Full administrative access' }
  ];

  const expiryOptions = [
    { value: 'never', label: 'Never expires' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' },
    { value: '90days', label: '90 days' },
    { value: '1year', label: '1 year' }
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          expiry: newKeyExpiry
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show the full key once (it won't be shown again)
        setShowKey(data.key);
        
        toast({
          title: 'API Key Created',
          description: 'Make sure to copy your key now. You won\'t be able to see it again.',
        });

        // Refresh the list
        await fetchApiKeys();
        
        // Reset form
        setNewKeyName('');
        setNewKeyPermissions(['read']);
        setNewKeyExpiry('never');
        setShowCreateDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive'
      });
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'API Key Revoked',
          description: 'The API key has been revoked and can no longer be used.',
        });
        await fetchApiKeys();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive'
      });
    }
  };

  const regenerateApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}/regenerate`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setShowKey(data.key);
        
        toast({
          title: 'API Key Regenerated',
          description: 'A new key has been generated. Make sure to update your applications.',
        });
        
        await fetchApiKeys();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate API key',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (key: string, keyId: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const togglePermission = (permission: string) => {
    setNewKeyPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="w-8 h-8 text-blue-600" />
              API Keys
            </h1>
            <p className="text-gray-600 mt-2">
              Manage API keys for programmatic access to your Intelagent Platform
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for accessing the Intelagent Platform API
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    placeholder="e.g., Production App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A descriptive name to identify this key
                  </p>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {availablePermissions.map(perm => (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          newKeyPermissions.includes(perm.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{perm.label}</p>
                            <p className="text-xs text-gray-600">{perm.description}</p>
                          </div>
                          {newKeyPermissions.includes(perm.id) && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Expiration</Label>
                  <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expiryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Keep your API keys secure. Never share them publicly or commit them to version control.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createApiKey}>
                  Create Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* New Key Display */}
      {showKey && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Your new API key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded border font-mono text-sm">
                  {showKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(showKey, 'new')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-orange-600">
                ⚠️ Make sure to copy this key now. You won't be able to see it again!
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Keys</TabsTrigger>
          <TabsTrigger value="all">All Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {apiKeys.filter(k => k.status === 'active').map(key => (
            <Card key={key.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{key.name}</h3>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status}
                      </Badge>
                      {key.permissions.map(perm => (
                        <Badge key={perm} variant="outline">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                        {key.keyPreview}...
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(key.key, key.id)}
                      >
                        {copiedKey === key.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {key.usage.requests} requests
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        Rate limit: {key.rateLimit}/min
                      </div>
                    </div>

                    {key.lastUsed && (
                      <p className="text-sm text-gray-500 mt-2">
                        Last used: {new Date(key.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateApiKey(key.id)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {apiKeys.filter(k => k.status === 'active').length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No API Keys</h3>
                <p className="text-gray-600 mb-4">
                  Create your first API key to start using the Intelagent API
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Key
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {apiKeys.map(key => (
            <Card key={key.id} className={key.status !== 'active' ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{key.name}</h3>
                      <Badge 
                        variant={
                          key.status === 'active' ? 'default' : 
                          key.status === 'expired' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {key.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.expiresAt && ` • Expires: ${new Date(key.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  {key.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* API Documentation Link */}
      <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">API Documentation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Learn how to integrate with the Intelagent Platform API
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
                <Button variant="outline" size="sm">
                  API Reference
                </Button>
                <Button variant="outline" size="sm">
                  Postman Collection
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}