'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SalesLayout } from '../layout-client';
import { Mail, Database, Calendar, Phone, Linkedin, Chrome, ChevronRight, Check, X } from 'lucide-react';

export default function IntegrationsPage() {
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);

  const integrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Connect your Gmail account to send personalized emails',
      status: 'available',
      category: 'Email'
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: Mail,
      description: 'Integrate with Microsoft Outlook for email campaigns',
      status: 'available',
      category: 'Email'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      icon: Database,
      description: 'Sync leads and contacts with Salesforce CRM',
      status: 'coming_soon',
      category: 'CRM'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: Database,
      description: 'Connect to HubSpot for advanced CRM features',
      status: 'coming_soon',
      category: 'CRM'
    },
    {
      id: 'calendly',
      name: 'Calendly',
      icon: Calendar,
      description: 'Automatically schedule meetings with prospects',
      status: 'coming_soon',
      category: 'Scheduling'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Sales Navigator',
      icon: Linkedin,
      description: 'Find and connect with prospects on LinkedIn',
      status: 'coming_soon',
      category: 'Social'
    }
  ];

  const handleConnect = (integrationId: string) => {
    if (integrations.find(i => i.id === integrationId)?.status === 'coming_soon') {
      toast.info('This integration is coming soon!');
      return;
    }
    setActiveIntegration(integrationId);
  };

  const handleDisconnect = (integrationId: string) => {
    setConnectedIntegrations(prev => prev.filter(id => id !== integrationId));
    toast.success('Integration disconnected');
  };

  const handleSaveIntegration = () => {
    if (activeIntegration) {
      setConnectedIntegrations(prev => [...prev, activeIntegration]);
      toast.success('Integration connected successfully');
      setActiveIntegration(null);
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, typeof integrations>);

  return (
    <SalesLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-gray-400">Connect your favorite tools to enhance your sales workflow</p>
        </div>

        {/* Connected Integrations */}
        {connectedIntegrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Connected</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedIntegrations.map(id => {
                const integration = integrations.find(i => i.id === id);
                if (!integration) return null;
                const Icon = integration.icon;

                return (
                  <Card key={id} className="bg-gray-800/50 border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <Icon className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Connected</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{integration.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{integration.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(id)}
                      className="w-full border-gray-600 hover:bg-gray-700"
                    >
                      Disconnect
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Integrations by Category */}
        {Object.entries(groupedIntegrations).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(integration => {
                const Icon = integration.icon;
                const isConnected = connectedIntegrations.includes(integration.id);
                const isComingSoon = integration.status === 'coming_soon';

                return (
                  <Card
                    key={integration.id}
                    className={`bg-gray-800/50 border-gray-700 p-6 ${
                      isComingSoon ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        isConnected ? 'bg-green-500/10' : 'bg-purple-500/10'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isConnected ? 'text-green-500' : 'text-purple-500'
                        }`} />
                      </div>
                      {isComingSoon && (
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{integration.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{integration.description}</p>

                    {!isConnected && (
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        disabled={isComingSoon}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isComingSoon ? 'Coming Soon' : 'Connect'}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Integration Setup Modal */}
        {activeIntegration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Connect {integrations.find(i => i.id === activeIntegration)?.name}
                </h3>
                <button
                  onClick={() => setActiveIntegration(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {activeIntegration === 'gmail' && (
                  <>
                    <div>
                      <Label htmlFor="gmail-email">Gmail Address</Label>
                      <Input
                        id="gmail-email"
                        type="email"
                        placeholder="your.email@gmail.com"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="app-password">App Password</Label>
                      <Input
                        id="app-password"
                        type="password"
                        placeholder="Enter your Gmail app password"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Generate an app password in your Google account settings
                      </p>
                    </div>
                  </>
                )}

                {activeIntegration === 'outlook' && (
                  <>
                    <div>
                      <Label htmlFor="outlook-email">Outlook Email</Label>
                      <Input
                        id="outlook-email"
                        type="email"
                        placeholder="your.email@outlook.com"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outlook-password">Password</Label>
                      <Input
                        id="outlook-password"
                        type="password"
                        placeholder="Enter your password"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveIntegration(null)}
                    className="flex-1 border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveIntegration}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </SalesLayout>
  );
}