'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  Mail,
  Users,
  Target,
  Calendar,
  Zap,
  Settings,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Eye,
  Filter,
  MessageSquare,
  Loader2,
  Brain,
  Wand2
} from 'lucide-react';
import Link from 'next/link';

export default function NewCampaign() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState({
    name: '',
    description: '',
    type: 'email',
    purpose: '', // New: Campaign purpose/CTA
    targetingMode: 'filters', // 'filters' or 'ai-description'
    targetDescription: '', // New: AI text description of target
    targetCriteria: {
      industry: '',
      companySize: '',
      location: '',
      jobTitle: '',
      department: '',
      seniority: '',
      technologies: [],
      revenue: '',
      fundingStage: ''
    },
    emailSettings: {
      fromName: '',
      fromEmail: '',
      replyTo: '',
      integrationId: '',
      enablePreview: true, // New: Preview before sending
      personalizationLevel: 'high', // low, medium, high
      tone: 'professional', // professional, casual, friendly, formal
      includeCompanyResearch: true,
      includeRoleContext: true
    },
    contentSettings: {
      mainCTA: '', // Primary call-to-action
      valueProposition: '',
      painPoints: [],
      benefits: [],
      socialProof: '',
      customInstructions: '' // Additional AI instructions
    },
    sequence: {
      enabled: false,
      steps: [],
      followUpStrategy: 'persistent', // persistent, gentle, aggressive
      stopOnReply: true
    },
    schedule: {
      startDate: '',
      endDate: '',
      timezone: 'UTC',
      sendDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      sendHours: { start: '09:00', end: '17:00' },
      dailyLimit: 50,
      throttleMinutes: 5 // Minutes between sends
    }
  });

  const [previewEmail, setPreviewEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/sales/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/sales/campaigns/${data.campaignId}`);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: Mail },
    { id: 2, name: 'Target Audience', icon: Target },
    { id: 3, name: 'Email Sequence', icon: Zap },
    { id: 4, name: 'Schedule', icon: Calendar },
    { id: 5, name: 'Review', icon: CheckCircle2 }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Set up your outreach campaign in a few simple steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-muted-foreground'
              }`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-full h-0.5 mx-2 ${
                  step > s.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>
                Give your campaign a name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Q1 2024 Enterprise Outreach"
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the goals and target audience for this campaign..."
                  rows={4}
                  value={campaign.description}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <Select
                  value={campaign.type}
                  onValueChange={(value) => setCampaign({ ...campaign, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Outreach</SelectItem>
                    <SelectItem value="multi-channel">Multi-Channel</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Outreach</SelectItem>
                    <SelectItem value="cold-call">Cold Calling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Target Audience */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Define who you want to reach with this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={campaign.targetCriteria.industry}
                    onValueChange={(value) =>
                      setCampaign({
                        ...campaign,
                        targetCriteria: { ...campaign.targetCriteria, industry: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={campaign.targetCriteria.companySize}
                    onValueChange={(value) =>
                      setCampaign({
                        ...campaign,
                        targetCriteria: { ...campaign.targetCriteria, companySize: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., United States, Europe"
                    value={campaign.targetCriteria.location}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        targetCriteria: { ...campaign.targetCriteria, location: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Titles</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., CEO, CTO, VP Sales"
                    value={campaign.targetCriteria.jobTitle}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        targetCriteria: { ...campaign.targetCriteria, jobTitle: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Target Audience Preview</p>
                    <p className="text-muted-foreground mt-1">
                      Your campaign will target {campaign.targetCriteria.jobTitle || 'decision makers'} at{' '}
                      {campaign.targetCriteria.companySize || 'companies'} in the{' '}
                      {campaign.targetCriteria.industry || 'selected industry'} located in{' '}
                      {campaign.targetCriteria.location || 'your target region'}.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Email Sequence */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Email Sequence</CardTitle>
              <CardDescription>
                Set up automated follow-ups for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sequence-enabled">Enable Email Sequence</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send follow-up emails to non-responders
                  </p>
                </div>
                <Switch
                  id="sequence-enabled"
                  checked={campaign.sequence.enabled}
                  onCheckedChange={(checked) =>
                    setCampaign({
                      ...campaign,
                      sequence: { ...campaign.sequence, enabled: checked }
                    })
                  }
                />
              </div>

              {campaign.sequence.enabled && (
                <div className="space-y-4 mt-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Choose a Template</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                        <input type="radio" name="template" className="w-4 h-4" />
                        <div className="flex-1">
                          <p className="font-medium">5-Step Introduction</p>
                          <p className="text-sm text-muted-foreground">
                            Initial email + 4 follow-ups over 14 days
                          </p>
                        </div>
                        <Badge>Popular</Badge>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                        <input type="radio" name="template" className="w-4 h-4" />
                        <div className="flex-1">
                          <p className="font-medium">3-Step Quick Follow-up</p>
                          <p className="text-sm text-muted-foreground">
                            Initial email + 2 follow-ups over 7 days
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                        <input type="radio" name="template" className="w-4 h-4" />
                        <div className="flex-1">
                          <p className="font-medium">Custom Sequence</p>
                          <p className="text-sm text-muted-foreground">
                            Create your own email sequence
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">Email Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      placeholder="Your name"
                      value={campaign.emailSettings.fromName}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          emailSettings: { ...campaign.emailSettings, fromName: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={campaign.emailSettings.fromEmail}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          emailSettings: { ...campaign.emailSettings, fromEmail: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Campaign Schedule</CardTitle>
              <CardDescription>
                When should your emails be sent?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={campaign.schedule.startDate}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        schedule: { ...campaign.schedule, startDate: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={campaign.schedule.endDate}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        schedule: { ...campaign.schedule, endDate: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Send Days</Label>
                <div className="flex gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={campaign.schedule.sendDays.includes(day.toLowerCase().slice(0, 3))}
                        onChange={(e) => {
                          const dayCode = day.toLowerCase().slice(0, 3);
                          if (e.target.checked) {
                            setCampaign({
                              ...campaign,
                              schedule: {
                                ...campaign.schedule,
                                sendDays: [...campaign.schedule.sendDays, dayCode]
                              }
                            });
                          } else {
                            setCampaign({
                              ...campaign,
                              schedule: {
                                ...campaign.schedule,
                                sendDays: campaign.schedule.sendDays.filter(d => d !== dayCode)
                              }
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sendStart">Send Time Start</Label>
                  <Input
                    id="sendStart"
                    type="time"
                    value={campaign.schedule.sendHours.start}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        schedule: {
                          ...campaign.schedule,
                          sendHours: { ...campaign.schedule.sendHours, start: e.target.value }
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendEnd">Send Time End</Label>
                  <Input
                    id="sendEnd"
                    type="time"
                    value={campaign.schedule.sendHours.end}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        schedule: {
                          ...campaign.schedule,
                          sendHours: { ...campaign.schedule.sendHours, end: e.target.value }
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={campaign.schedule.timezone}
                  onValueChange={(value) =>
                    setCampaign({
                      ...campaign,
                      schedule: { ...campaign.schedule, timezone: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <>
            <CardHeader>
              <CardTitle>Review Campaign</CardTitle>
              <CardDescription>
                Review your campaign settings before launching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Campaign Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name:</dt>
                      <dd className="font-medium">{campaign.name || 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd className="font-medium">{campaign.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Start Date:</dt>
                      <dd className="font-medium">{campaign.schedule.startDate || 'Immediately'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Target Audience</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Industry:</dt>
                      <dd className="font-medium">{campaign.targetCriteria.industry || 'All'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Company Size:</dt>
                      <dd className="font-medium">{campaign.targetCriteria.companySize || 'All'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Location:</dt>
                      <dd className="font-medium">{campaign.targetCriteria.location || 'All'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Email Settings</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sequence:</dt>
                      <dd className="font-medium">
                        {campaign.sequence.enabled ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">From:</dt>
                      <dd className="font-medium">
                        {campaign.emailSettings.fromName} ({campaign.emailSettings.fromEmail})
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Ready to Launch
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Your campaign will start sending emails according to the schedule you've set.
                        You can pause or modify the campaign at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>

          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreateCampaign}>
              Launch Campaign
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}