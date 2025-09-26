'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CpuChipIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  RocketLaunchIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AgentBuilderChat from '../../components/AgentBuilderChat';
import SkillsConfigurator from '../../components/SkillsConfigurator';
import DashboardPreview from '../../components/DashboardPreview';

interface AgentConfiguration {
  requirements: any;
  selectedSkills: string[];
  totalPrice: number;
  agentName: string;
  agentDescription: string;
}

const STEPS = [
  { id: 'chat', name: 'Describe Your Agent', icon: CpuChipIcon },
  { id: 'skills', name: 'Select Skills', icon: SparklesIcon },
  { id: 'preview', name: 'Preview Dashboard', icon: CheckCircleIcon },
  { id: 'purchase', name: 'Activate Agent', icon: CreditCardIcon }
];

export default function AgentBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [configuration, setConfiguration] = useState<AgentConfiguration>({
    requirements: {},
    selectedSkills: [],
    totalPrice: 0,
    agentName: '',
    agentDescription: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle chat completion
  const handleChatComplete = (requirements: any, suggestedSkills: string[]) => {
    setConfiguration(prev => ({
      ...prev,
      requirements,
      selectedSkills: suggestedSkills,
      agentName: `${requirements.goal || 'Custom'} Agent`,
      agentDescription: `AI-powered agent for ${requirements.goal?.toLowerCase() || 'automation'}`
    }));
    setCurrentStep(1);
  };

  // Handle skills update
  const handleSkillsUpdate = (skills: any[], price: number) => {
    // Extract skill IDs if skills are objects, otherwise use as-is
    const skillIds = skills.map(s => typeof s === 'string' ? s : s.id);
    setConfiguration(prev => ({
      ...prev,
      selectedSkills: skillIds,
      totalPrice: price
    }));
  };

  // Handle agent name/description update
  const handleAgentDetailsUpdate = (name: string, description: string) => {
    setConfiguration(prev => ({
      ...prev,
      agentName: name,
      agentDescription: description
    }));
  };

  // Handle purchase/activation
  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      // Save agent configuration
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: configuration.agentName,
          description: configuration.agentDescription,
          requirements: configuration.requirements,
          skills: configuration.selectedSkills,
          price: configuration.totalPrice
        })
      });

      if (!response.ok) throw new Error('Failed to create agent');

      const { agentId, checkoutUrl } = await response.json();

      // Redirect to Stripe checkout or activation
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        // Free agent - activate directly
        router.push(`/dashboard?agent=${agentId}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset builder
  const handleReset = () => {
    setCurrentStep(0);
    setConfiguration({
      requirements: {},
      selectedSkills: [],
      totalPrice: 0,
      agentName: '',
      agentDescription: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CpuChipIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agent Builder</h1>
                <p className="text-sm text-gray-500">Create your custom AI agent in minutes</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex-1 flex items-center"
              >
                <div
                  className={`flex items-center gap-3 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${index < currentStep
                        ? 'bg-green-100 text-green-600'
                        : index === currentStep
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="hidden sm:block font-medium">{step.name}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-1 rounded ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {currentStep === 0 && (
            <AgentBuilderChat
              onRequirementsComplete={handleChatComplete}
              onReset={handleReset}
            />
          )}

          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Customize Your Agent's Skills
                </h2>
                <p className="text-gray-600">
                  Review and adjust the recommended skills for your agent.
                </p>
              </div>
              <SkillsConfigurator
                recommendedSkills={configuration.selectedSkills}
                onSkillsChange={handleSkillsUpdate}
                budget={configuration.requirements.budget}
              />
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={configuration.selectedSkills.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                >
                  Continue
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Preview Your Agent Dashboard
                </h2>
                <p className="text-gray-600">
                  See how your agent's dashboard will look with the selected skills.
                </p>
                
                {/* Agent Details */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Agent Name</label>
                      <input
                        type="text"
                        value={configuration.agentName}
                        onChange={(e) => handleAgentDetailsUpdate(e.target.value, configuration.agentDescription)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={configuration.agentDescription}
                        onChange={(e) => handleAgentDetailsUpdate(configuration.agentName, e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DashboardPreview
                selectedSkills={configuration.selectedSkills.map(id => ({
                  id,
                  name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  category: id.includes('email') || id.includes('chat') ? 'communication' :
                           id.includes('lead') || id.includes('sales') ? 'sales' :
                           id.includes('data') || id.includes('report') ? 'analytics' :
                           'automation'
                }))}
                agentName={configuration.agentName}
              />
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Continue to Activation
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto py-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RocketLaunchIcon className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Launch Your Agent!
                </h2>
                <p className="text-gray-600">
                  Review your configuration and activate your custom AI agent.
                </p>
              </div>

              {/* Configuration Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Configuration Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Name:</span>
                    <span className="font-medium">{configuration.agentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected Skills:</span>
                    <span className="font-medium">{configuration.selectedSkills.length} skills</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Goal:</span>
                    <span className="font-medium">{configuration.requirements.goal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry:</span>
                    <span className="font-medium">{configuration.requirements.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium">{configuration.requirements.teamSize}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Price:</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        £{configuration.totalPrice}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Skills List */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Included Skills</h3>
                <div className="grid grid-cols-2 gap-2">
                  {configuration.selectedSkills.map(skill => (
                    <div key={skill} className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">
                        {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Preview
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : configuration.totalPrice > 0 ? (
                    <>
                      <CreditCardIcon className="w-5 h-5" />
                      Purchase & Activate
                    </>
                  ) : (
                    <>
                      <RocketLaunchIcon className="w-5 h-5" />
                      Activate Free Agent
                    </>
                  )}
                </button>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By activating, you agree to our Terms of Service and Privacy Policy.
                {configuration.totalPrice > 0 && ' You can cancel your subscription anytime.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}