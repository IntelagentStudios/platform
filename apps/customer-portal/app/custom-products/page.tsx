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
      'Drag-and-drop interface',
      '50+ widget types',
      'Real-time data',
      'Custom themes',
      'Export capabilities'
    ],
    startingPrice: 'From £79/month',
    buildTime: '30 minutes',
    link: '/dashboard-builder'
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Automation',
    description: 'Build complex automation workflows without code',
    icon: CogIcon,
    color: 'green',
    features: [
      'Visual workflow designer',
      'Conditional logic',
      'Multi-app integration',
      'Scheduled triggers',
      'Error handling'
    ],
    startingPrice: 'From £99/month',
    buildTime: '1 hour',
    link: '/workflow-builder'
  },
  {
    id: 'chatbot-builder',
    name: 'Chatbot Creator',
    description: 'Build intelligent chatbots for customer service',
    icon: ChatBubbleLeftRightIcon,
    color: 'indigo',
    features: [
      'NLP training',
      'Multi-language support',
      'Intent recognition',
      'Conversation flows',
      'Analytics dashboard'
    ],
    startingPrice: 'From £149/month',
    buildTime: '2 hours',
    link: '/chatbot-builder'
  },
  {
    id: 'api-builder',
    name: 'API Integration Studio',
    description: 'Connect and integrate with any API or service',
    icon: CloudIcon,
    color: 'orange',
    features: [
      'REST & GraphQL',
      'Authentication handling',
      'Rate limiting',
      'Data transformation',
      'Webhook management'
    ],
    startingPrice: 'From £199/month',
    buildTime: '2-3 hours',
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
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}
      <header className="shadow-sm border-b sticky top-0 z-10" style={{
        backgroundColor: 'rgba(58, 64, 64, 0.95)',
        borderColor: 'rgba(169, 189, 203, 0.15)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <SparklesIcon className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>Custom Products</span>
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/marketplace/public"
                  className="font-medium hover:opacity-80"
                  style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                >
                  Marketplace
                </Link>
                <Link
                  href="/custom-products"
                  className="font-medium pb-1 border-b-2"
                  style={{
                    color: 'rgb(229, 227, 220)',
                    borderColor: 'rgba(169, 189, 203, 0.5)'
                  }}
                >
                  Custom Products
                </Link>
                {isLoggedIn && (
                  <>
                    <Link
                      href="/dashboard"
                      className="font-medium hover:opacity-80"
                      style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/agent-builder"
                      className="font-medium hover:opacity-80"
                      style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                    >
                      Agent Builder
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:opacity-80 transition" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(229, 227, 220)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}>
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-4 py-2 rounded-lg hover:opacity-80 transition" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(229, 227, 220)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16" style={{
        background: 'linear-gradient(135deg, rgba(58, 64, 64, 0.8) 0%, rgba(48, 54, 54, 0.9) 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Build Your Perfect AI Solution
          </h1>
          <p className="text-xl mb-8" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>
            No-code builders to create custom AI agents, dashboards, and workflows
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              backgroundColor: 'rgba(48, 54, 54, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: '#4ade80' }} />
              <span style={{ color: 'rgb(229, 227, 220)' }}>No coding required</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              backgroundColor: 'rgba(48, 54, 54, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: '#4ade80' }} />
              <span style={{ color: 'rgb(229, 227, 220)' }}>Deploy in minutes</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              backgroundColor: 'rgba(48, 54, 54, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: '#4ade80' }} />
              <span style={{ color: 'rgb(229, 227, 220)' }}>Scale as you grow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-12" style={{ backgroundColor: 'rgba(58, 64, 64, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'rgb(229, 227, 220)' }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, idx) => (
              <div key={idx} className="text-center relative">
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5"
                    style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }} />
                )}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold relative z-10"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.8)',
                    border: '2px solid rgba(169, 189, 203, 0.3)',
                    color: 'rgb(229, 227, 220)'
                  }}>
                  {step.number}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Builders Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Your Recent Builds */}
          {isLoggedIn && userBuilds.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Your Recent Builds
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {userBuilds.map((build, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-4 border hover:shadow-lg transition cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(58, 64, 64, 0.5)',
                      borderColor: 'rgba(169, 189, 203, 0.15)'
                    }}
                  >
                    <h4 className="font-semibold mb-1" style={{ color: 'rgb(229, 227, 220)' }}>
                      {build.name}
                    </h4>
                    <p className="text-sm mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      Built with {build.builderId}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      {new Date(build.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'rgb(229, 227, 220)' }}>
            Choose Your Builder
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CUSTOM_OPTIONS.map(option => (
              <div
                key={option.id}
                className="rounded-lg border p-6 hover:shadow-lg transition-all cursor-pointer group"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
                onClick={() => router.push(option.link)}
              >
                <div className="flex items-start justify-between mb-4">
                  <option.icon className="w-10 h-10 group-hover:scale-110 transition-transform"
                    style={{ color: 'rgb(169, 189, 203)' }} />
                  <span className="px-2 py-1 text-xs rounded-full" style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}>
                    {option.buildTime}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  {option.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  {option.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-4">
                  {option.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t"
                  style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <span className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {option.startingPrice}
                  </span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    style={{ color: 'rgba(169, 189, 203, 0.8)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table for Logged In Users */}
      {isLoggedIn && (
        <section className="py-12" style={{ backgroundColor: 'rgba(58, 64, 64, 0.3)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'rgb(229, 227, 220)' }}>
              Compare Builders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(169, 189, 203, 0.2)' }}>
                    <th className="text-left py-3 px-4" style={{ color: 'rgb(229, 227, 220)' }}>Feature</th>
                    {CUSTOM_OPTIONS.slice(0, 4).map(option => (
                      <th key={option.id} className="text-center py-3 px-4" style={{ color: 'rgb(229, 227, 220)' }}>
                        {option.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(169, 189, 203, 0.1)' }}>
                    <td className="py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Build Time</td>
                    {CUSTOM_OPTIONS.slice(0, 4).map(option => (
                      <td key={option.id} className="text-center py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        {option.buildTime}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(169, 189, 203, 0.1)' }}>
                    <td className="py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Starting Price</td>
                    {CUSTOM_OPTIONS.slice(0, 4).map(option => (
                      <td key={option.id} className="text-center py-3 px-4" style={{ color: 'rgb(229, 227, 220)' }}>
                        {option.startingPrice}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Best For</td>
                    {['Quick agents', 'Data visualization', 'Process automation', 'Customer service'].map((use, idx) => (
                      <td key={idx} className="text-center py-3 px-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        {use}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl mb-8" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Start with our most popular builder and create your first AI agent in minutes
          </p>
          <button
            onClick={() => router.push('/agent-builder')}
            className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              color: 'rgb(229, 227, 220)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}
          >
            Start Building Now
          </button>
        </div>
      </section>
    </div>
  );
}