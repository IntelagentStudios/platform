'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Play, Pause, Archive, Trash2, Edit, Users, Mail, Clock,
  Target, BarChart3, Settings, ChevronRight, Copy, Eye, Send,
  CalendarDays, Zap, GitBranch, Filter, Download, Upload
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  type: 'drip' | 'broadcast' | 'trigger' | 'nurture'
  leads_count: number
  emails_sent: number
  open_rate: number
  click_rate: number
  reply_rate: number
  created_at: string
  updated_at: string
  sequence: EmailSequenceStep[]
  settings: CampaignSettings
}

interface EmailSequenceStep {
  id: string
  order: number
  delay_days: number
  delay_hours: number
  template_id: string
  template_name: string
  subject: string
  conditions?: {
    type: 'opened' | 'clicked' | 'replied' | 'not_opened' | 'not_clicked'
    previous_step?: number
  }[]
}

interface CampaignSettings {
  send_time_preference: 'immediate' | 'business_hours' | 'optimal'
  timezone: string
  exclude_weekends: boolean
  stop_on_reply: boolean
  track_opens: boolean
  track_clicks: boolean
  daily_send_limit?: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sequenceSteps, setSequenceSteps] = useState<EmailSequenceStep[]>([])
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'drip',
    description: '',
    target_audience: '',
    goal: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCampaigns()
    fetchTemplates()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/sales/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sales/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const addSequenceStep = () => {
    const newStep: EmailSequenceStep = {
      id: `step-${Date.now()}`,
      order: sequenceSteps.length + 1,
      delay_days: sequenceSteps.length > 0 ? 3 : 0,
      delay_hours: 0,
      template_id: '',
      template_name: '',
      subject: ''
    }
    setSequenceSteps([...sequenceSteps, newStep])
  }

  const updateSequenceStep = (stepId: string, updates: Partial<EmailSequenceStep>) => {
    setSequenceSteps(steps =>
      steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    )
  }

  const removeSequenceStep = (stepId: string) => {
    setSequenceSteps(steps => {
      const filtered = steps.filter(s => s.id !== stepId)
      return filtered.map((step, index) => ({
        ...step,
        order: index + 1
      }))
    })
  }

  const createCampaign = async () => {
    try {
      const response = await fetch('/api/sales/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignForm,
          sequence: sequenceSteps,
          settings: {
            send_time_preference: 'business_hours',
            timezone: 'America/New_York',
            exclude_weekends: true,
            stop_on_reply: true,
            track_opens: true,
            track_clicks: true
          }
        })
      })

      if (response.ok) {
        toast({ title: 'Campaign created successfully' })
        fetchCampaigns()
        setIsCreating(false)
        setCampaignForm({ name: '', type: 'drip', description: '', target_audience: '', goal: '' })
        setSequenceSteps([])
      }
    } catch (error) {
      toast({ title: 'Failed to create campaign', variant: 'destructive' })
    }
  }

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/sales/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({ title: `Campaign ${status}` })
        fetchCampaigns()
      }
    } catch (error) {
      toast({ title: 'Failed to update campaign', variant: 'destructive' })
    }
  }

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
      archived: 'secondary'
    }
    return colors[status] || 'secondary'
  }

  const getCampaignTypeIcon = (type: string) => {
    const icons = {
      drip: <Clock className="w-4 h-4" />,
      broadcast: <Send className="w-4 h-4" />,
      trigger: <Zap className="w-4 h-4" />,
      nurture: <GitBranch className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <Mail className="w-4 h-4" />
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading campaigns...</div>
  }

  if (isCreating) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false)
              setSequenceSteps([])
            }}
          >
            Cancel
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Q4 Outreach Campaign"
                />
              </div>
              <div>
                <Label>Campaign Type</Label>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Campaign</SelectItem>
                    <SelectItem value="broadcast">Broadcast</SelectItem>
                    <SelectItem value="trigger">Trigger-based</SelectItem>
                    <SelectItem value="nurture">Nurture Sequence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Describe the campaign goals and target audience"
                />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={campaignForm.target_audience}
                  onChange={(e) => setCampaignForm({ ...campaignForm, target_audience: e.target.value })}
                  placeholder="e.g., Enterprise leads, score > 70"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Send during business hours only</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exclude weekends</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Stop sequence on reply</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Track email opens</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Track link clicks</Label>
                <Switch defaultChecked />
              </div>
              <div>
                <Label>Daily send limit</Label>
                <Input type="number" placeholder="50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Sequence</CardTitle>
            <CardDescription>
              Design your email sequence with delays and conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sequenceSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-semibold">
                    {step.order}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Email Template</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => {
                            const template = templates.find(t => t.id === value)
                            updateSequenceStep(step.id, {
                              template_id: value,
                              template_name: template?.name || '',
                              subject: template?.subject || ''
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label>Delay (days)</Label>
                          <Input
                            type="number"
                            value={step.delay_days}
                            onChange={(e) => updateSequenceStep(step.id, { delay_days: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Hours</Label>
                          <Input
                            type="number"
                            value={step.delay_hours}
                            onChange={(e) => updateSequenceStep(step.id, { delay_hours: parseInt(e.target.value) || 0 })}
                            min="0"
                            max="23"
                          />
                        </div>
                      </div>
                    </div>
                    {step.subject && (
                      <div className="text-sm text-muted-foreground">
                        Subject: {step.subject}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSequenceStep(step.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addSequenceStep}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Email Step
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Cancel
          </Button>
          <Button onClick={createCampaign} disabled={!campaignForm.name || sequenceSteps.length === 0}>
            Create Campaign
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your email campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first campaign to start engaging with leads
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getCampaignTypeIcon(campaign.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {campaign.type} campaign
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Leads</span>
                    </div>
                    <p className="font-semibold">{campaign.leads_count}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Sent</span>
                    </div>
                    <p className="font-semibold">{campaign.emails_sent}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Open Rate</span>
                    </div>
                    <p className="font-semibold">{campaign.open_rate}%</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">Click Rate</span>
                    </div>
                    <p className="font-semibold">{campaign.click_rate}%</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Reply Rate</span>
                    </div>
                    <p className="font-semibold">{campaign.reply_rate}%</p>
                  </div>
                </div>

                {campaign.sequence && campaign.sequence.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {campaign.sequence.length} emails in sequence
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      {campaign.sequence.map((step, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          {index < campaign.sequence.length - 1 && (
                            <span className="text-xs text-muted-foreground">
                              {step.delay_days}d
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
