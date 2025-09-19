'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Edit, Trash2, Copy, Eye, Code, Wand2, FileText,
  Mail, Calendar, User, Building, Tag, Sparkles, Save,
  X, ChevronLeft, ChevronRight, Search, Filter, Download
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  template_type: 'outreach' | 'follow_up' | 'nurture' | 'meeting' | 'introduction'
  variables: string[]
  tags: string[]
  usage_count: number
  last_used?: string
  performance?: {
    open_rate: number
    click_rate: number
    reply_rate: number
  }
  ai_optimized: boolean
  created_at: string
  updated_at: string
}

const TEMPLATE_VARIABLES = [
  { key: '{{first_name}}', label: 'First Name' },
  { key: '{{last_name}}', label: 'Last Name' },
  { key: '{{company_name}}', label: 'Company' },
  { key: '{{job_title}}', label: 'Job Title' },
  { key: '{{industry}}', label: 'Industry' },
  { key: '{{custom_field_1}}', label: 'Custom Field 1' },
  { key: '{{custom_field_2}}', label: 'Custom Field 2' },
  { key: '{{sender_name}}', label: 'Your Name' },
  { key: '{{sender_title}}', label: 'Your Title' },
  { key: '{{meeting_link}}', label: 'Meeting Link' }
]

const DEFAULT_TEMPLATES = [
  {
    name: 'Initial Outreach',
    subject: 'Quick question about {{company_name}}',
    body: `Hi {{first_name}},

I noticed that {{company_name}} is growing rapidly in the {{industry}} space.

We've helped similar companies streamline their sales processes and increase conversion rates by 35% on average.

Would you be open to a brief 15-minute call next week to discuss how we might be able to help {{company_name}}?

Best regards,
{{sender_name}}`,
    template_type: 'outreach',
    tags: ['cold', 'introduction']
  },
  {
    name: 'Follow-up #1',
    subject: 'Re: Quick question about {{company_name}}',
    body: `Hi {{first_name}},

I wanted to follow up on my previous email about helping {{company_name}} improve its sales processes.

I understand you're busy, so I'll keep this brief. We recently helped a company in your industry achieve:
• 40% reduction in lead response time
• 25% increase in qualified leads
• 30% improvement in close rates

Would any of these outcomes be valuable for {{company_name}}?

If so, I'd love to share how we achieved these results. Are you available for a quick 15-minute call this week?

Best,
{{sender_name}}`,
    template_type: 'follow_up',
    tags: ['follow-up', 'value-prop']
  }
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    templateType: 'outreach',
    tags: [] as string[],
    variables: [] as string[]
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sales/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    try {
      const extractedVariables = extractVariables(templateForm.body + ' ' + templateForm.subject)

      const response = await fetch('/api/sales/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateForm,
          variables: extractedVariables
        })
      })

      if (response.ok) {
        toast({ title: 'Template saved successfully' })
        fetchTemplates()
        setIsCreating(false)
        resetForm()
      }
    } catch (error) {
      toast({ title: 'Failed to save template', variant: 'destructive' })
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/sales/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({ title: 'Template deleted' })
        fetchTemplates()
      }
    } catch (error) {
      toast({ title: 'Failed to delete template', variant: 'destructive' })
    }
  }

  const duplicateTemplate = (template: EmailTemplate) => {
    setTemplateForm({
      name: `${template.name} (Copy)`,
      subject: template.subject,
      body: template.body,
      templateType: template.template_type,
      tags: [...template.tags],
      variables: [...template.variables]
    })
    setIsCreating(true)
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g
    const matches = text.match(regex) || []
    return [...new Set(matches)]
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = templateForm.body
      const newText = text.substring(0, start) + variable + text.substring(end)
      setTemplateForm({ ...templateForm, body: newText })

      setTimeout(() => {
        textarea.selectionStart = start + variable.length
        textarea.selectionEnd = start + variable.length
        textarea.focus()
      }, 0)
    }
  }

  const loadDefaultTemplate = (template: any) => {
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      templateType: template.template_type,
      tags: template.tags,
      variables: extractVariables(template.body + ' ' + template.subject)
    })
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      body: '',
      templateType: 'outreach',
      tags: [],
      variables: []
    })
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || template.template_type === filterType
    return matchesSearch && matchesFilter
  })

  const getTypeColor = (type: string) => {
    const colors = {
      outreach: 'default',
      follow_up: 'secondary',
      nurture: 'outline',
      meeting: 'default',
      introduction: 'secondary'
    }
    return colors[type as keyof typeof colors] || 'secondary'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>
  }

  if (isCreating || isEditing) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false)
              setIsEditing(false)
              resetForm()
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g., Initial Outreach - Enterprise"
                  />
                </div>
                <div>
                  <Label>Template Type</Label>
                  <Select
                    value={templateForm.templateType}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, templateType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outreach">Initial Outreach</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="nurture">Nurture</SelectItem>
                      <SelectItem value="meeting">Meeting Request</SelectItem>
                      <SelectItem value="introduction">Introduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="e.g., Quick question about {{company_name}}"
                  />
                </div>
                <div>
                  <Label>Email Body</Label>
                  <Textarea
                    id="template-body"
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    placeholder="Write your email template here..."
                    className="min-h-[300px] font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>
                  Start with a pre-written template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {DEFAULT_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start"
                      onClick={() => loadDefaultTemplate(template)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Variables</CardTitle>
                <CardDescription>
                  Click to insert into template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {TEMPLATE_VARIABLES.map(variable => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => insertVariable(variable.key)}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      {variable.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Improve Subject Line
                </Button>
                <Button className="w-full" variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance Email Copy
                </Button>
                <Button className="w-full" variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Add Personalization
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="outreach">Outreach</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="nurture">Nurture</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.subject}
                    </CardDescription>
                  </div>
                  <Badge variant={getTypeColor(template.template_type)}>
                    {template.template_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {template.body}
                </div>

                {template.performance && (
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Open</span>
                      <p className="font-semibold">{template.performance.open_rate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Click</span>
                      <p className="font-semibold">{template.performance.click_rate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reply</span>
                      <p className="font-semibold">{template.performance.reply_rate}%</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.ai_optimized && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Used {template.usage_count} times
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setPreviewMode(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
