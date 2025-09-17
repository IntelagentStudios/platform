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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronLeft,
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
  Wand2,
  Send,
  RefreshCw,
  Copy
} from 'lucide-react';
import Link from 'next/link';

interface EmailPreview {
  subject: string;
  body: string;
  recipientName: string;
  recipientCompany: string;
  recipientRole: string;
}

export default function CreateCampaign() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState<EmailPreview[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const [campaign, setCampaign] = useState({
    // Basic Info
    name: '',
    description: '',
    type: 'email',

    // Purpose & Targeting
    purpose: '',
    targetingMode: 'ai-description',
    targetDescription: '',
    targetCriteria: {
      industry: '',
      companySize: '',
      location: '',
      jobTitle: '',
      department: '',
      seniority: '',
      technologies: [] as string[],
      revenue: '',
      fundingStage: ''
    },

    // Content Settings
    contentSettings: {
      mainCTA: '',
      valueProposition: '',
      painPoints: [] as string[],
      benefits: [] as string[],
      socialProof: '',
      tone: 'professional',
      personalizationLevel: 'high',
      includeCompanyResearch: true,
      includeRoleContext: true,
      customInstructions: ''
    },

    // Email Settings
    emailSettings: {
      fromName: '',
      fromEmail: '',
      replyTo: '',
      enablePreview: true,
      subjectLineOptions: [] as string[],
      signatureStyle: 'professional'
    },

    // Sequence
    sequence: {
      enabled: false,
      steps: [] as any[],
      followUpStrategy: 'persistent',
      stopOnReply: true,
      daysBetween: 3
    },

    // Schedule
    schedule: {
      startDate: '',
      endDate: '',
      timezone: 'UTC',
      sendDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      sendHours: { start: '09:00', end: '17:00' },
      dailyLimit: 50,
      throttleMinutes: 5
    }
  });

  const steps = [
    { id: 1, name: 'Campaign Info', icon: Mail, description: 'Name and purpose' },
    { id: 2, name: 'Target Audience', icon: Target, description: 'Who to reach' },
    { id: 3, name: 'Content & Tone', icon: MessageSquare, description: 'Message details' },
    { id: 4, name: 'Email Sequence', icon: Zap, description: 'Follow-up strategy' },
    { id: 5, name: 'Schedule', icon: Calendar, description: 'When to send' },
    { id: 6, name: 'Review & Launch', icon: CheckCircle2, description: 'Preview and confirm' }
  ];

  const generateEmailPreviews = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/sales/generate-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign,
          generateCount: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailPreviews(data.previews);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Failed to generate previews:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return campaign.name && campaign.purpose;
      case 2:
        return campaign.targetingMode === 'ai-description'
          ? campaign.targetDescription
          : true;
      case 3:
        return campaign.contentSettings.valueProposition;
      default:
        return true;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered campaign creation with personalized emails
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((s, index) => (
            <div key={s.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    step >= s.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-muted-foreground/30'
                  }`}
                >
                  {step > s.id ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <s.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">{s.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-[50%] w-full h-0.5 -z-10 ${
                    step > s.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 1: Campaign Info */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>
                Give your campaign a name and define its purpose
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  placeholder="Brief description of this campaign's goals..."
                  rows={3}
                  value={campaign.description}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Campaign Purpose / Main CTA *</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Schedule a 15-minute demo to see how our AI platform can reduce customer support tickets by 40%"
                  value={campaign.purpose}
                  onChange={(e) => setCampaign({ ...campaign, purpose: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the action you want recipients to take and the value they'll receive
                </p>
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
                    <SelectItem value="multi-channel" disabled>Multi-Channel (Coming Soon)</SelectItem>
                    <SelectItem value="linkedin" disabled>LinkedIn (Coming Soon)</SelectItem>
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
                Define your ideal customer profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>How would you like to define your audience?</Label>
                <RadioGroup
                  value={campaign.targetingMode}
                  onValueChange={(value) => setCampaign({ ...campaign, targetingMode: value })}
                >
                  <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="ai-description" id="ai-description" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="ai-description" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="font-semibold">AI Description</span>
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Describe your ideal customer in natural language and let AI identify the best prospects
                        </p>
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="filters" id="filters" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="filters" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Filter className="h-4 w-4" />
                          <span className="font-semibold">Manual Filters</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Use specific filters for industry, company size, job titles, etc.
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* AI Description Mode */}
              {campaign.targetingMode === 'ai-description' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label htmlFor="targetDescription">Describe Your Ideal Customer</Label>
                        <Textarea
                          id="targetDescription"
                          placeholder="Example: I want to reach CTOs and VPs of Engineering at B2B SaaS companies with 50-500 employees. They should be using cloud infrastructure (AWS, Azure, or GCP) and likely struggling with DevOps complexity. Prefer companies that have raised Series A or B funding in the last 2 years. Located in US or Europe, with a tech-forward culture."
                          value={campaign.targetDescription}
                          onChange={(e) => setCampaign({ ...campaign, targetDescription: e.target.value })}
                          rows={6}
                          className="mt-2"
                        />
                      </div>
                      <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertDescription>
                          <strong>AI will analyze your description to:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Identify matching companies and decision makers</li>
                            <li>Research each prospect's specific context</li>
                            <li>Personalize every email based on their role and company</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Filter Mode */}
              {campaign.targetingMode === 'filters' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
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
                          <SelectValue placeholder="Any industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Industry</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="saas">SaaS</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Company Size</Label>
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
                          <SelectValue placeholder="Any size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Size</SelectItem>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-1000">201-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Seniority</Label>
                      <Select
                        value={campaign.targetCriteria.seniority}
                        onValueChange={(value) =>
                          setCampaign({
                            ...campaign,
                            targetCriteria: { ...campaign.targetCriteria, seniority: value }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Level</SelectItem>
                          <SelectItem value="c-level">C-Level</SelectItem>
                          <SelectItem value="vp">VP</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={campaign.targetCriteria.department}
                        onValueChange={(value) =>
                          setCampaign({
                            ...campaign,
                            targetCriteria: { ...campaign.targetCriteria, department: value }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Department</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 3: Content & Tone */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Content & Personalization</CardTitle>
              <CardDescription>
                Define your message and how it should be delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Value Proposition *</Label>
                <Textarea
                  placeholder="What unique value do you offer? Why should they care? Be specific about benefits and outcomes."
                  value={campaign.contentSettings.valueProposition}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      contentSettings: { ...campaign.contentSettings, valueProposition: e.target.value }
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Pain Points to Address</Label>
                <Textarea
                  placeholder="What challenges does your target audience face? (one per line)"
                  value={campaign.contentSettings.painPoints.join('\n')}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      contentSettings: {
                        ...campaign.contentSettings,
                        painPoints: e.target.value.split('\n').filter(p => p.trim())
                      }
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Social Proof</Label>
                <Input
                  placeholder="e.g., Trusted by 500+ companies including Google, Microsoft..."
                  value={campaign.contentSettings.socialProof}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      contentSettings: { ...campaign.contentSettings, socialProof: e.target.value }
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={campaign.contentSettings.tone}
                    onValueChange={(value) =>
                      setCampaign({
                        ...campaign,
                        contentSettings: { ...campaign.contentSettings, tone: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Personalization Level</Label>
                  <Select
                    value={campaign.contentSettings.personalizationLevel}
                    onValueChange={(value) =>
                      setCampaign({
                        ...campaign,
                        contentSettings: { ...campaign.contentSettings, personalizationLevel: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Basic name/company)</SelectItem>
                      <SelectItem value="medium">Medium (+ role context)</SelectItem>
                      <SelectItem value="high">High (+ company research)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>AI Personalization Features</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="companyResearch"
                      checked={campaign.contentSettings.includeCompanyResearch}
                      onCheckedChange={(checked) =>
                        setCampaign({
                          ...campaign,
                          contentSettings: {
                            ...campaign.contentSettings,
                            includeCompanyResearch: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor="companyResearch" className="cursor-pointer">
                      Research company's recent news, funding, products
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roleContext"
                      checked={campaign.contentSettings.includeRoleContext}
                      onCheckedChange={(checked) =>
                        setCampaign({
                          ...campaign,
                          contentSettings: {
                            ...campaign.contentSettings,
                            includeRoleContext: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor="roleContext" className="cursor-pointer">
                      Reference recipient's specific role and responsibilities
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom AI Instructions (Optional)</Label>
                <Textarea
                  placeholder="Any specific instructions for the AI when generating emails..."
                  value={campaign.contentSettings.customInstructions}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      contentSettings: { ...campaign.contentSettings, customInstructions: e.target.value }
                    })
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Email Sequence */}
        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Email Sequence</CardTitle>
              <CardDescription>
                Set up your follow-up strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="enableSequence">Enable Follow-up Sequence</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send follow-ups if no response
                  </p>
                </div>
                <Switch
                  id="enableSequence"
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
                <>
                  <div className="space-y-2">
                    <Label>Follow-up Strategy</Label>
                    <RadioGroup
                      value={campaign.sequence.followUpStrategy}
                      onValueChange={(value) =>
                        setCampaign({
                          ...campaign,
                          sequence: { ...campaign.sequence, followUpStrategy: value }
                        })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gentle" id="gentle" />
                        <Label htmlFor="gentle">Gentle (2-3 follow-ups, friendly tone)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="persistent" id="persistent" />
                        <Label htmlFor="persistent">Persistent (4-5 follow-ups, professional)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="aggressive" id="aggressive" />
                        <Label htmlFor="aggressive">Aggressive (6+ follow-ups, urgent tone)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Days Between Follow-ups</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[campaign.sequence.daysBetween]}
                        onValueChange={(value) =>
                          setCampaign({
                            ...campaign,
                            sequence: { ...campaign.sequence, daysBetween: value[0] }
                          })
                        }
                        max={14}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-sm font-medium">
                        {campaign.sequence.daysBetween} days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stopOnReply"
                      checked={campaign.sequence.stopOnReply}
                      onCheckedChange={(checked) =>
                        setCampaign({
                          ...campaign,
                          sequence: { ...campaign.sequence, stopOnReply: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="stopOnReply">
                      Stop sequence when recipient replies
                    </Label>
                  </div>
                </>
              )}
            </CardContent>
          </>
        )}

        {/* Step 5: Schedule */}
        {step === 5 && (
          <>
            <CardHeader>
              <CardTitle>Sending Schedule</CardTitle>
              <CardDescription>
                Control when your emails are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
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
                  <Label>End Date (Optional)</Label>
                  <Input
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
                <Label>Timezone</Label>
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
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sending Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                    <Button
                      key={day}
                      variant={campaign.schedule.sendDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const days = campaign.schedule.sendDays.includes(day)
                          ? campaign.schedule.sendDays.filter(d => d !== day)
                          : [...campaign.schedule.sendDays, day];
                        setCampaign({
                          ...campaign,
                          schedule: { ...campaign.schedule, sendDays: days }
                        });
                      }}
                    >
                      {day.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sending Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input
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
                  <div>
                    <Label className="text-xs">End Time</Label>
                    <Input
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
              </div>

              <div className="space-y-2">
                <Label>Daily Send Limit</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[campaign.schedule.dailyLimit]}
                    onValueChange={(value) =>
                      setCampaign({
                        ...campaign,
                        schedule: { ...campaign.schedule, dailyLimit: value[0] }
                      })
                    }
                    max={200}
                    min={10}
                    step={10}
                    className="flex-1"
                  />
                  <span className="w-20 text-sm font-medium">
                    {campaign.schedule.dailyLimit} emails
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 50-100 emails per day for better deliverability
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <>
            <CardHeader>
              <CardTitle>Review & Launch</CardTitle>
              <CardDescription>
                Preview your campaign before launching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-semibold">Campaign Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{campaign.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purpose</p>
                      <p className="font-medium">{campaign.purpose}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Targeting</p>
                      <p className="font-medium">
                        {campaign.targetingMode === 'ai-description' ? 'AI-based' : 'Filter-based'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Personalization</p>
                      <p className="font-medium capitalize">{campaign.contentSettings.personalizationLevel}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Preview Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Generate sample emails to see how they'll look
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={generateEmailPreviews}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Preview
                      </>
                    )}
                  </Button>
                </div>

                {campaign.emailSettings.enablePreview && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Preview Mode Enabled:</strong> You'll review and approve each email before it's sent
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {step < 6 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 6 && (
              <Button
                onClick={handleCreateCampaign}
                disabled={loading || !isStepValid()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Launch Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how your personalized emails will look
            </DialogDescription>
          </DialogHeader>

          {emailPreviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {emailPreviews.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPreviewIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPreviewIndex(index)}
                    >
                      Sample {index + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateEmailPreviews}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-background">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To:</p>
                  <p className="font-medium">
                    {emailPreviews[currentPreviewIndex].recipientName} - {emailPreviews[currentPreviewIndex].recipientRole}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {emailPreviews[currentPreviewIndex].recipientCompany}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                  <p className="font-medium">{emailPreviews[currentPreviewIndex].subject}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Body:</p>
                  <div className="whitespace-pre-wrap text-sm">
                    {emailPreviews[currentPreviewIndex].body}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(emailPreviews[currentPreviewIndex].body);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}