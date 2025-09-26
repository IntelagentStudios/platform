'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  CubeIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CustomOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  startingPrice: string;
  buildTime: string;
  link: string;
}

const CUSTOM_OPTIONS: CustomOption[] = [
  {
    id: 'agent-builder',
    name: 'AI Agent Builder',
    description: 'Create a custom AI agent with our conversational builder',
    icon: CpuChipIcon,
    color: 'blue',
    features: [
      'Conversational setup wizard',
      'Choose from 310+ skills',
      'Custom workflows',
      'Real-time preview',
      'Pay-as-you-go pricing'
    ],
    startingPrice: 'From £49/month',
    buildTime: '10 minutes',
    link: '/agent-builder'
  },
  {
    id: 'dashboard-builder',
    name: 'Dashboard Designer',
    description: 'Design custom dashboards with drag-and-drop widgets',
    icon: ChartBarIcon,
    color: 'purple',
    features: [
      'Drag-and-drop builder',
      '20+ widget types',
      'Custom themes',
      'Real-time data',
      'Export capabilities'
    ],
    startingPrice: 'From £29/month',
    buildTime: '5 minutes',
    link: '/dashboard/agent-builder'
  },
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    description: 'Build complex multi-step automations without code',
    icon: CogIcon,
    color: 'green',
    features: [
      'Visual workflow builder',
      'Conditional logic',
      'API integrations',
      'Schedule triggers',
      'Error handling'
    ],
    startingPrice: 'From £99/month',
    buildTime: '15 minutes',
    link: '/workflow-builder'
  },
  {
    id: 'chatbot-creator',
    name: 'Chatbot Creator',
    description: 'Build intelligent chatbots for your website or app',
    icon: ChatBubbleLeftRightIcon,
    color: 'indigo',
    features: [
      'Natural language processing',
      'Custom training data',
      'Multi-channel support',
      'Analytics dashboard',
      'A/B testing'
    ],
    startingPrice: 'From £79/month',
    buildTime: '20 minutes',
    link: '/chatbot-builder'
  },
  {
    id: 'api-connector',
    name: 'API Connector',
    description: 'Connect any API and create custom integrations',
    icon: CloudIcon,
    color: 'cyan',
    features: [
      'REST API support',
      'GraphQL support',
      'Authentication handling',
      'Data transformation',
      'Webhook management'
    ],
    startingPrice: 'From £59/month',
    buildTime: '30 minutes',
    link: '/api-builder'
  },
  {
    id: 'enterprise-solution',
    name: 'Enterprise Solution',
    description: 'Fully customized solution tailored to your business',
    icon: ShieldCheckIcon,
    color: 'red',
    features: [
      'Dedicated support team',
      'Custom development',
      'On-premise deployment',
      'SLA guarantee',
      'White-label options'
    ],
    startingPrice: 'Custom pricing',
    buildTime: '2-4 weeks',
    link: '/enterprise-contact'
  }
];

const PROCESS_STEPS = [
  {
    number: '1',
    title: 'Choose Your Builder',
    description: 'Select from our range of no-code builders'
  },
  {
    number: '2',
    title: 'Customize Features',
    description: 'Add skills, integrations, and workflows'
  },
  {
    number: '3',
    title: 'Preview & Test',
    description: 'See your solution in action before deploying'
  },
  {
    number: '4',
    title: 'Deploy & Scale',
    description: 'Go live instantly and scale as needed'
  }
];

export default function CustomProductsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [builders, setBuilders] = useState<any[]>([]);
  const [userBuilds, setUserBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch custom builders data
    Promise.all([
      fetch('/api/custom-products/builders').then(res => res.json()),
      fetch('/api/auth/check-session').then(res => res.json())
    ])
      .then(([buildersData, authData]) => {
        if (buildersData.success) {
          setBuilders(buildersData.builders || CUSTOM_OPTIONS);
          setUserBuilds(buildersData.userBuilds || []);
        }
        setIsLoggedIn(authData.authenticated || false);
        if (authData.authenticated) {
          setUserProfile(authData.user);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching builders data:', error);
        setBuilders(CUSTOM_OPTIONS);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-8 h-8 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">Custom Builder</span>
              </Link>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/marketplace/public" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Marketplace
                </Link>
                <Link 
                  href="/custom-products" 
                  className="text-purple-600 font-medium border-b-2 border-purple-600 pb-1"
                >
                  Custom Products
                </Link>
                {isLoggedIn && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      My Dashboard
                    </Link>
                    <Link 
                      href="/agent-builder" 
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Build Agent
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Hi, {userProfile?.name || 'there'}!</span>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full">
                <SparklesIcon className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Build Your Custom AI Solution
            </h1>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              {isLoggedIn 
                ? `Welcome back${userProfile?.name ? `, ${userProfile.name}` : ''}! Create a solution perfectly tailored to your needs.`
                : 'No coding required. Build powerful AI agents, dashboards, and workflows in minutes.'
              }
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/agent-builder')}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium flex items-center gap-2"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Start Building Now
              </button>
              <button
                onClick={() => document.getElementById('options')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition font-medium"
              >
                Explore Options
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Build your custom solution in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full">
                    <div className="w-full border-t-2 border-dashed border-purple-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Options Grid */}
      <div id="options" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isLoggedIn ? 'Choose Your Builder' : 'Custom Building Options'}
            </h2>
            <p className="text-xl text-gray-600">
              {isLoggedIn 
                ? 'Select the perfect builder for your needs'
                : 'Powerful no-code builders for every use case'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CUSTOM_OPTIONS.map(option => {
              const Icon = option.icon;
              const isRecommended = isLoggedIn && userProfile?.industry === 'technology' && 
                                   (option.id === 'api-connector' || option.id === 'workflow-automation');
              
              return (
                <div
                  key={option.id}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer ${
                    isRecommended ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => {
                    if (isLoggedIn) {
                      router.push(option.link);
                    } else {
                      router.push(`/login?redirect=${option.link}`);
                    }
                  }}
                >
                  {isRecommended && (
                    <div className="bg-purple-500 text-white text-center py-2 px-4 rounded-t-xl text-sm font-medium">
                      ✨ Recommended for {userProfile.industry}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 bg-${option.color}-100 rounded-lg`}>
                        <Icon className={`w-8 h-8 text-${option.color}-600`} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Build time</p>
                        <p className="font-semibold text-gray-900">{option.buildTime}</p>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
                    <p className="text-gray-600 mb-4">{option.description}</p>

                    <div className="space-y-2 mb-6">
                      {option.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Starting at</p>
                          <p className="text-lg font-bold text-gray-900">{option.startingPrice}</p>
                        </div>
                        <button
                          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                            isLoggedIn 
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLoggedIn) {
                              router.push(option.link);
                            } else {
                              router.push(`/login?redirect=${option.link}`);
                            }
                          }}
                        >
                          {isLoggedIn ? 'Start Building' : 'Sign In to Build'}
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      {isLoggedIn && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Comparison</h2>
              <p className="text-xl text-gray-600">Find the right builder for your needs</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Builder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best For</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">AI Agent Builder</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">Sales, Support, Operations</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Easy</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">£49-499/mo</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href="/agent-builder" className="text-purple-600 hover:text-purple-800">Build →</Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Dashboard Designer</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">Analytics, Reporting</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Easy</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">£29-199/mo</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href="/dashboard/agent-builder" className="text-purple-600 hover:text-purple-800">Build →</Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Workflow Automation</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">Process Automation</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Medium</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">£99-999/mo</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href="/workflow-builder" className="text-purple-600 hover:text-purple-800">Build →</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <BeakerIcon className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            {isLoggedIn ? 'Ready to Build Something Amazing?' : 'Start Your Free Trial Today'}
          </h2>
          <p className="text-xl opacity-90 mb-8">
            {isLoggedIn 
              ? 'Your custom AI solution is just a few clicks away'
              : 'No credit card required. Build your first agent in minutes.'
            }
          </p>
          <div className="flex justify-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/agent-builder"
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium flex items-center gap-2"
                >
                  <CpuChipIcon className="w-5 h-5" />
                  Build AI Agent
                </Link>
                <Link
                  href="/dashboard/agent-builder"
                  className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition font-medium flex items-center gap-2"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  Design Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/marketplace/public"
                  className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition font-medium"
                >
                  Browse Marketplace
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}