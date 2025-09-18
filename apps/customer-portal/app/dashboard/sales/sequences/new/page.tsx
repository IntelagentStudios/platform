'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Clock,
  Mail,
  ArrowLeft,
  Save,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Upload,
  FileText
} from 'lucide-react';

interface SequenceStep {
  id: string;
  type: 'email' | 'delay' | 'condition';
  subject?: string;
  content?: string;
  delay?: number;
  delayUnit?: 'hours' | 'days';
  condition?: string;
}

export default function NewSequencePage() {
  const router = useRouter();
  const [sequenceName, setSequenceName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      id: '1',
      type: 'email',
      subject: '',
      content: ''
    }
  ]);

  const addStep = (type: 'email' | 'delay') => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      type,
      ...(type === 'email' ? { subject: '', content: '' } : { delay: 1, delayUnit: 'days' })
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
    }
  };

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    } else if (direction === 'down' && index < steps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    setSteps(newSteps);
  };

  const handleSave = (asDraft: boolean = false) => {
    if (!sequenceName) {
      toast.error('Please enter a sequence name');
      return;
    }

    const emailSteps = steps.filter(s => s.type === 'email');
    if (emailSteps.length === 0) {
      toast.error('Please add at least one email step');
      return;
    }

    const invalidEmails = emailSteps.filter(s => !s.subject || !s.content);
    if (!asDraft && invalidEmails.length > 0) {
      toast.error('Please fill in all email subjects and content');
      return;
    }

    toast.success(asDraft ? 'Sequence saved as draft' : 'Sequence created successfully');
    router.push('/dashboard/sales/sequences');
  };

  const generateWithAI = (stepId: string) => {
    // Simulate AI generation
    const templates = [
      {
        subject: 'Quick question about {{company}}',
        content: `Hi {{firstName}},

I noticed you're working at {{company}} and wanted to reach out about how we're helping similar companies in {{industry}} improve their sales process.

Would you be open to a brief 15-minute call next week to discuss how we could help {{company}} achieve similar results?

Best regards,
{{senderName}}`
      },
      {
        subject: 'Following up on my previous email',
        content: `Hi {{firstName}},

I wanted to follow up on my previous email about helping {{company}} improve their sales process.

I understand you're busy, so I'll keep this brief. We've helped companies like yours:
• Increase conversion rates by 35%
• Reduce sales cycle time by 20%
• Improve lead quality scores by 40%

Would it make sense to have a quick conversation about this?

Best,
{{senderName}}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    updateStep(stepId, template);
    toast.success('Email generated with AI');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Create Email Sequence</h1>
          <p className="text-gray-400 mt-1">Build an automated email campaign</p>
        </div>
        <Button
          variant="outline"
          onClick={() => handleSave(true)}
          className="border-gray-600 hover:bg-gray-700"
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSave(false)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Create Sequence
        </Button>
      </div>

      {/* Sequence Details */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Sequence Details</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Sequence Name</Label>
            <Input
              id="name"
              placeholder="e.g., Cold Outreach Campaign"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and target audience for this sequence"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
      </Card>

      {/* Upload Templates Section */}
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Email Templates & Style Guide</h2>
        <p className="text-gray-400 mb-4">
          Upload examples of successful emails or style guides to help the AI match your writing style
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="border-gray-600 hover:bg-gray-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Templates
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 hover:bg-gray-700"
          >
            <FileText className="mr-2 h-4 w-4" />
            Upload Style Guide
          </Button>
        </div>
      </Card>

      {/* Sequence Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Sequence Steps</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addStep('delay')}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Clock className="mr-2 h-4 w-4" />
              Add Delay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addStep('email')}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              Add Email
            </Button>
          </div>
        </div>

        {steps.map((step, index) => (
          <Card key={step.id} className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  {step.type === 'email' ? (
                    <Mail className="h-5 w-5 text-purple-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-purple-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Step {index + 1}: {step.type === 'email' ? 'Email' : 'Delay'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {step.type === 'email' ? 'Send an email to the prospect' : 'Wait before next step'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                  disabled={steps.length === 1}
                  className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {step.type === 'email' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`subject-${step.id}`}>Email Subject</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`subject-${step.id}`}
                      placeholder="Enter email subject line"
                      value={step.subject || ''}
                      onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      variant="outline"
                      onClick={() => generateWithAI(step.id)}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`content-${step.id}`}>Email Content</Label>
                  <Textarea
                    id={`content-${step.id}`}
                    placeholder="Enter email content. Use variables like {{firstName}}, {{company}}, {{industry}}"
                    value={step.content || ''}
                    onChange={(e) => updateStep(step.id, { content: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white min-h-[200px]"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{industry}}'}, {'{{title}}'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Wait Time</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={step.delay || 1}
                      onChange={(e) => updateStep(step.id, { delay: parseInt(e.target.value) })}
                      className="w-24 bg-gray-700 border-gray-600 text-white"
                    />
                    <Select
                      value={step.delayUnit || 'days'}
                      onValueChange={(value: 'hours' | 'days') => updateStep(step.id, { delayUnit: value })}
                    >
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

        {/* Add Step Button */}
        <Card className="bg-gray-800/50 border-gray-700 border-dashed p-6 text-center">
          <p className="text-gray-400 mb-4">Add another step to your sequence</p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => addStep('delay')}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Clock className="mr-2 h-4 w-4" />
              Add Delay
            </Button>
            <Button
              variant="outline"
              onClick={() => addStep('email')}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              Add Email
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}