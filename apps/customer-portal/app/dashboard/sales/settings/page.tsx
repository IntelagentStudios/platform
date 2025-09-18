'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Settings,
  Mail,
  User,
  Globe,
  Shield,
  Bell,
  Upload,
  FileText,
  Palette,
  MessageSquare,
  Clock,
  Database,
  Zap,
  Save,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    provider: 'gmail',
    fromName: 'John Doe',
    fromEmail: 'john@company.com',
    signature: '',
    dailyLimit: '100',
    timezone: 'America/New_York'
  });

  const [aiSettings, setAiSettings] = useState({
    writingStyle: 'professional',
    tone: 'friendly',
    personalization: true,
    useTemplates: true,
    autoFollowUp: true,
    smartScheduling: true
  });

  const [notifications, setNotifications] = useState({
    emailReplies: true,
    campaignComplete: true,
    dailyReport: false,
    weeklyAnalytics: true,
    lowCredits: true
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Sales Settings</h1>
        <p className="text-gray-400 mt-1">
          Configure your sales outreach preferences and integrations
        </p>
      </div>

      {/* Email Configuration */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">Email Configuration</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="provider">Email Provider</Label>
            <Select
              value={emailSettings.provider}
              onValueChange={(value) => setEmailSettings({ ...emailSettings, provider: value })}
            >
              <SelectTrigger id="provider" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
                <SelectItem value="smtp">Custom SMTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="from-name">From Name</Label>
            <Input
              id="from-name"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="daily-limit">Daily Send Limit</Label>
            <Input
              id="daily-limit"
              type="number"
              value={emailSettings.dailyLimit}
              onChange={(e) => setEmailSettings({ ...emailSettings, dailyLimit: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="signature">Email Signature</Label>
            <Textarea
              id="signature"
              placeholder="Your email signature..."
              value={emailSettings.signature}
              onChange={(e) => setEmailSettings({ ...emailSettings, signature: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={emailSettings.timezone}
              onValueChange={(value) => setEmailSettings({ ...emailSettings, timezone: value })}
            >
              <SelectTrigger id="timezone" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => handleSave('Email')}
          className="mt-6 bg-purple-600 hover:bg-purple-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Email Settings
        </Button>
      </Card>

      {/* AI & Writing Style */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">AI & Writing Style</h2>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="writing-style">Writing Style</Label>
              <Select
                value={aiSettings.writingStyle}
                onValueChange={(value) => setAiSettings({ ...aiSettings, writingStyle: value })}
              >
                <SelectTrigger id="writing-style" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={aiSettings.tone}
                onValueChange={(value) => setAiSettings({ ...aiSettings, tone: value })}
              >
                <SelectTrigger id="tone" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="assertive">Assertive</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Deep Personalization</p>
                <p className="text-sm text-gray-400">Use AI to personalize emails based on prospect data</p>
              </div>
              <Switch
                checked={aiSettings.personalization}
                onCheckedChange={(checked) => setAiSettings({ ...aiSettings, personalization: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Use Custom Templates</p>
                <p className="text-sm text-gray-400">Apply your uploaded templates to AI-generated emails</p>
              </div>
              <Switch
                checked={aiSettings.useTemplates}
                onCheckedChange={(checked) => setAiSettings({ ...aiSettings, useTemplates: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto Follow-up</p>
                <p className="text-sm text-gray-400">Automatically send follow-ups if no response</p>
              </div>
              <Switch
                checked={aiSettings.autoFollowUp}
                onCheckedChange={(checked) => setAiSettings({ ...aiSettings, autoFollowUp: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Smart Scheduling</p>
                <p className="text-sm text-gray-400">Send emails at optimal times based on recipient timezone</p>
              </div>
              <Switch
                checked={aiSettings.smartScheduling}
                onCheckedChange={(checked) => setAiSettings({ ...aiSettings, smartScheduling: checked })}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Upload Style Guides</h3>
            <p className="text-sm text-gray-400 mb-4">
              Upload examples of your best-performing emails or brand guidelines to train the AI
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Email Examples
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload Brand Guidelines
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={() => handleSave('AI')}
          className="mt-6 bg-purple-600 hover:bg-purple-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save AI Settings
        </Button>
      </Card>

      {/* Notifications */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Replies</p>
              <p className="text-sm text-gray-400">Get notified when prospects reply to your emails</p>
            </div>
            <Switch
              checked={notifications.emailReplies}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailReplies: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Campaign Complete</p>
              <p className="text-sm text-gray-400">Notification when a campaign finishes</p>
            </div>
            <Switch
              checked={notifications.campaignComplete}
              onCheckedChange={(checked) => setNotifications({ ...notifications, campaignComplete: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Daily Report</p>
              <p className="text-sm text-gray-400">Receive daily performance summary</p>
            </div>
            <Switch
              checked={notifications.dailyReport}
              onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReport: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Weekly Analytics</p>
              <p className="text-sm text-gray-400">Weekly campaign analytics report</p>
            </div>
            <Switch
              checked={notifications.weeklyAnalytics}
              onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyAnalytics: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Low Credits Alert</p>
              <p className="text-sm text-gray-400">Alert when email credits are running low</p>
            </div>
            <Switch
              checked={notifications.lowCredits}
              onCheckedChange={(checked) => setNotifications({ ...notifications, lowCredits: checked })}
            />
          </div>
        </div>

        <Button
          onClick={() => handleSave('Notification')}
          className="mt-6 bg-purple-600 hover:bg-purple-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Notification Settings
        </Button>
      </Card>

      {/* Integrations */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Integrations</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 hover:bg-gray-700"
          >
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Gmail</span>
              <Badge variant="outline" className="border-green-500/30 text-green-400">Connected</Badge>
            </div>
            <p className="text-sm text-gray-400 mb-3">Send emails via Gmail</p>
            <Button variant="outline" size="sm" className="w-full border-gray-600 hover:bg-gray-700">
              Configure
            </Button>
          </div>

          <div className="p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Salesforce</span>
              <Badge variant="outline" className="border-gray-600 text-gray-400">Not Connected</Badge>
            </div>
            <p className="text-sm text-gray-400 mb-3">Sync with Salesforce CRM</p>
            <Button variant="outline" size="sm" className="w-full border-gray-600 hover:bg-gray-700">
              Connect
            </Button>
          </div>

          <div className="p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Calendly</span>
              <Badge variant="outline" className="border-gray-600 text-gray-400">Not Connected</Badge>
            </div>
            <p className="text-sm text-gray-400 mb-3">Schedule meetings automatically</p>
            <Button variant="outline" size="sm" className="w-full border-gray-600 hover:bg-gray-700">
              Connect
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}