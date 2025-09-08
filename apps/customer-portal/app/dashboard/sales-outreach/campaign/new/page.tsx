'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SkillMarketplace from '@/components/SkillMarketplace';
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  SparklesIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

interface EmailTemplate {
  id: string;
  subject: string;
  content: string;
  sequence: number;
  delay_days: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Campaign data
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    campaign_type: 'cold_outreach',
    target_industry: '',
    target_company_size: '',
    target_personas: [] as string[],
    daily_send_limit: 50,
    from_email: '',
    from_name: '',
    reply_to_email: '',
    start_date: '',
    end_date: '',
    timezone: 'UTC',
    send_times: { start: '09:00', end: '17:00' }
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      subject: '',
      content: '',
      sequence: 1,
      delay_days: 0
    }
  ]);

  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set([
    'email_automation',
    'lead_scoring',
    'response_creator'
  ]));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const campaignTypes = [
    { value: 'cold_outreach', label: 'Cold Outreach', description: 'Reach new prospects' },
    { value: 'nurture', label: 'Nurture Campaign', description: 'Engage existing leads' },
    { value: 'follow_up', label: 'Follow-up Sequence', description: 'Re-engage past contacts' },
    { value: 'event_promotion', label: 'Event Promotion', description: 'Promote webinars or events' }
  ];

  const companySizes = [
    { value: '1-10', label: 'Startup (1-10)' },
    { value: '11-50', label: 'Small (11-50)' },
    { value: '51-200', label: 'Medium (51-200)' },
    { value: '201-1000', label: 'Large (201-1000)' },
    { value: '1000+', label: 'Enterprise (1000+)' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Real Estate', 'Consulting', 'Marketing', 'Legal'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!campaignData.name) newErrors.name = 'Campaign name is required';
      if (!campaignData.campaign_type) newErrors.campaign_type = 'Campaign type is required';
      if (!campaignData.from_email) newErrors.from_email = 'From email is required';
      if (!campaignData.from_name) newErrors.from_name = 'From name is required';
    }

    if (step === 2) {
      if (emailTemplates.length === 0) {
        newErrors.templates = 'At least one email template is required';
      }
      emailTemplates.forEach((template, index) => {
        if (!template.subject) newErrors[`template_${index}_subject`] = 'Subject is required';
        if (!template.content) newErrors[`template_${index}_content`] = 'Content is required';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const addEmailTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      subject: '',
      content: '',
      sequence: emailTemplates.length + 1,
      delay_days: emailTemplates.length > 0 ? 3 : 0
    };
    setEmailTemplates([...emailTemplates, newTemplate]);
  };

  const removeEmailTemplate = (id: string) => {
    setEmailTemplates(emailTemplates.filter(t => t.id !== id));
  };

  const updateEmailTemplate = (id: string, field: string, value: any) => {
    setEmailTemplates(emailTemplates.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = new Set(selectedSkills);
    if (newSkills.has(skillId)) {
      newSkills.delete(skillId);
    } else {
      newSkills.add(skillId);
    }
    setSelectedSkills(newSkills);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sales/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...campaignData,
          email_templates: emailTemplates,
          enabled_skills: Array.from(selectedSkills)
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/sales-outreach?newCampaign=${data.campaign.id}`);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to create campaign' });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'An error occurred while creating the campaign' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Sales Outreach
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Campaign</h1>
              <p className="text-gray-400 mt-1">Set up your automated outreach campaign</p>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`flex items-center ${step < 3 ? 'mr-8' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-20 h-1 ml-2 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Q1 Enterprise Outreach"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Describe your campaign goals and strategy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {campaignTypes.map(type => (
                    <div
                      key={type.value}
                      onClick={() => setCampaignData({ ...campaignData, campaign_type: type.value })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        campaignData.campaign_type === type.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <h4 className="font-semibold text-white">{type.label}</h4>
                      <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Email *
                  </label>
                  <input
                    type="email"
                    value={campaignData.from_email}
                    onChange={(e) => setCampaignData({ ...campaignData, from_email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="sales@company.com"
                  />
                  {errors.from_email && <p className="text-red-400 text-sm mt-1">{errors.from_email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Name *
                  </label>
                  <input
                    type="text"
                    value={campaignData.from_name}
                    onChange={(e) => setCampaignData({ ...campaignData, from_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="John Smith"
                  />
                  {errors.from_name && <p className="text-red-400 text-sm mt-1">{errors.from_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Industry
                  </label>
                  <select
                    value={campaignData.target_industry}
                    onChange={(e) => setCampaignData({ ...campaignData, target_industry: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Industries</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Size
                  </label>
                  <select
                    value={campaignData.target_company_size}
                    onChange={(e) => setCampaignData({ ...campaignData, target_company_size: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Sizes</option>
                    {companySizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Daily Send Limit
                  </label>
                  <input
                    type="number"
                    value={campaignData.daily_send_limit}
                    onChange={(e) => setCampaignData({ ...campaignData, daily_send_limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={campaignData.start_date}
                    onChange={(e) => setCampaignData({ ...campaignData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={campaignData.end_date}
                    onChange={(e) => setCampaignData({ ...campaignData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Email Templates */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Email Sequence</h2>
                <button
                  onClick={addEmailTemplate}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Email
                </button>
              </div>

              {errors.templates && (
                <p className="text-red-400 text-sm">{errors.templates}</p>
              )}

              <div className="space-y-4">
                {emailTemplates.map((template, index) => (
                  <div key={template.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">
                        Email #{template.sequence}
                        {index > 0 && (
                          <span className="text-sm text-gray-400 ml-2">
                            (Sent {template.delay_days} days after previous)
                          </span>
                        )}
                      </h3>
                      {emailTemplates.length > 1 && (
                        <button
                          onClick={() => removeEmailTemplate(template.id)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {index > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Delay (days after previous email)
                        </label>
                        <input
                          type="number"
                          value={template.delay_days}
                          onChange={(e) => updateEmailTemplate(template.id, 'delay_days', parseInt(e.target.value))}
                          className="w-32 px-3 py-1 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          min="1"
                          max="30"
                        />
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject Line *
                      </label>
                      <input
                        type="text"
                        value={template.subject}
                        onChange={(e) => updateEmailTemplate(template.id, 'subject', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Quick question about {{company_name}}'s sales process"
                      />
                      {errors[`template_${index}_subject`] && (
                        <p className="text-red-400 text-sm mt-1">{errors[`template_${index}_subject`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Content *
                      </label>
                      <textarea
                        value={template.content}
                        onChange={(e) => updateEmailTemplate(template.id, 'content', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
                        placeholder="Hi {{first_name}},

I noticed that {{company_name}} is growing rapidly in the {{industry}} space...

Use variables: {{first_name}}, {{last_name}}, {{company_name}}, {{job_title}}"
                      />
                      {errors[`template_${index}_content`] && (
                        <p className="text-red-400 text-sm mt-1">{errors[`template_${index}_content`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong>Pro Tip:</strong> Use personalization variables like {'{{first_name}}'}, {'{{company_name}}'}, 
                  and {'{{job_title}}'} to make your emails more engaging. Our AI will automatically fill these in for each lead.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Skills Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Select Campaign Skills</h2>
                <p className="text-gray-400 mb-6">
                  Choose the AI skills that will power your campaign automation
                </p>
              </div>

              <SkillMarketplace
                selectedSkills={selectedSkills}
                onSkillToggle={handleSkillToggle}
                baseProduct="sales_outreach"
                showPricing={false}
              />

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Selected Skills Summary</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSkills).map(skillId => (
                    <span
                      key={skillId}
                      className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                    >
                      {skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={currentStep > 1 ? handleBack : () => router.back()}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="w-5 h-5 mr-2" />
                    Create Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}