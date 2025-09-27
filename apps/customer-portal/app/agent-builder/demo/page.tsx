'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Sparkles, Eye, CreditCard, Check, ArrowRight } from 'lucide-react';
import AgentBuilderChatV2 from '../../../components/AgentBuilderChatV2';
import DashboardPreview from '../../../components/DashboardPreview';
import DashboardLayout from '../../../components/DashboardLayout';

export default function AgentBuilderDemo() {
  const [currentStep, setCurrentStep] = useState<'chat' | 'preview' | 'payment'>('chat');
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const router = useRouter();

  const handleChatComplete = (config: any) => {
    setAgentConfig(config);
    setCurrentStep('preview');
    // Simulate preview generation
    setTimeout(() => setPreviewReady(true), 2000);
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };

  const handleTryAnother = () => {
    setCurrentStep('chat');
    setAgentConfig(null);
    setPreviewReady(false);
  };

  const handleLoginToPurchase = () => {
    // Save config to session storage for after login
    sessionStorage.setItem('pendingAgentConfig', JSON.stringify(agentConfig));
    router.push('/login?redirect=/agent-builder/purchase');
  };

  return (
    <DashboardLayout>
      {/* Top Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              {currentStep === 'chat' ? 'Configure Your Agent' : currentStep === 'preview' ? 'Preview Dashboard' : 'Activate Agent'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              {currentStep === 'chat' ? 'Describe your needs and we\'ll configure everything for you' : currentStep === 'preview' ? 'Explore the features and capabilities of your custom dashboard' : 'Choose your plan to activate your agent'}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">

        {/* Main Content */}
        {currentStep === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Section */}
            <div>
              <div className="rounded-xl shadow-sm border overflow-hidden" style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}>
                <div style={{ height: '500px' }}>
                  <AgentBuilderChatV2 onComplete={handleChatComplete} isDemo={true} />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="rounded-xl p-6 shadow-sm border" style={{
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                borderColor: 'rgba(169, 189, 203, 0.3)'
              }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  Explore Your Options
                </h3>
                <p style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                  See what's possible with our AI platform. Configure and preview your custom solution to understand all capabilities.
                </p>
              </div>

              <div className="rounded-xl p-6 shadow-sm border" style={{
                backgroundColor: 'rgba(58, 64, 64, 0.3)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  What You're Building
                </h3>
                <ul className="space-y-3">
                  {[
                    'Custom AI agent tailored to your needs',
                    'Automated workflows and integrations',
                    'Real-time analytics dashboard',
                    'No coding required'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  Your AI Agent Dashboard Preview
                </h2>
                <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  This is how your custom dashboard will look once activated
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleTryAnother}
                  className="px-4 py-2 rounded-lg border transition hover:opacity-80"
                  style={{
                    borderColor: 'rgba(169, 189, 203, 0.3)',
                    backgroundColor: 'transparent',
                    color: 'rgba(229, 227, 220, 0.9)'
                  }}
                >
                  Build Another
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="px-6 py-2 rounded-lg transition hover:opacity-80 flex items-center space-x-2"
                  style={{
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'white'
                  }}
                >
                  <span>Activate This Agent</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dashboard Preview */}
            {!previewReady ? (
              <div className="rounded-xl border p-32 text-center" style={{
                backgroundColor: 'rgba(58, 64, 64, 0.3)',
                borderColor: 'rgba(169, 189, 203, 0.15)'
              }}>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 rounded w-3/4 mx-auto" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}></div>
                  <div className="h-4 rounded w-1/2 mx-auto" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}></div>
                </div>
                <p className="mt-6" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  Generating your dashboard preview...
                </p>
              </div>
            ) : (
              <DashboardPreview agentConfig={agentConfig} />
            )}
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}>
              <div className="p-8 text-center">
                <CreditCard className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(169, 189, 203)' }} />
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  Ready to Activate Your Agent?
                </h2>

                <div className="rounded-lg p-6 mb-6" style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.3)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                    {agentConfig?.agentName || 'Custom AI Agent'}
                  </h3>
                  <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    £299<span className="text-lg font-normal">/month</span>
                  </div>
                  <ul className="space-y-2 mt-4 text-left max-w-sm mx-auto">
                    <li className="flex items-start space-x-2">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>Full agent activation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>Unlimited operations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>24/7 support</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleLoginToPurchase}
                    className="w-full px-6 py-3 rounded-lg transition hover:opacity-80"
                    style={{
                      backgroundColor: 'rgb(169, 189, 203)',
                      color: 'white'
                    }}
                  >
                    Sign In to Purchase
                  </button>

                  <button
                    onClick={() => router.push('/signup?plan=agent')}
                    className="w-full px-6 py-3 rounded-lg border transition hover:opacity-80"
                    style={{
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      backgroundColor: 'transparent',
                      color: 'rgba(229, 227, 220, 0.9)'
                    }}
                  >
                    Create Account & Purchase
                  </button>

                  <button
                    onClick={handleTryAnother}
                    className="w-full px-6 py-3 rounded-lg transition hover:opacity-80"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'rgba(169, 189, 203, 0.8)'
                    }}
                  >
                    Build Another Agent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}