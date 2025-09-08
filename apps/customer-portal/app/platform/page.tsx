'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Settings,
  Cpu,
  Zap,
  Package,
  Users,
  BarChart3,
  Shield,
  Globe,
  Database,
  GitBranch,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function PlatformPage() {
  const router = useRouter();
  const [activeProducts, setActiveProducts] = useState<string[]>([]);

  const platformFeatures = [
    {
      id: 'analytics',
      title: 'Platform Analytics',
      description: 'View insights into your AI operations',
      icon: BarChart3,
      status: 'active',
      path: '/analytics',
      color: 'indigo'
    },
    {
      id: 'integration-hub',
      title: 'Integration Hub',
      description: 'Connect with external services and APIs',
      icon: GitBranch,
      status: 'coming-soon',
      path: '/platform/integrations',
      color: 'orange'
    },
    {
      id: 'security',
      title: 'Security Center',
      description: 'Manage access control and compliance',
      icon: Shield,
      status: 'coming-soon',
      path: '/platform/security',
      color: 'red'
    }
  ];

  // TODO: Connect to real data sources
  const quickStats = [
    { label: 'Active Agents', value: '1', trend: 'Chatbot active' },
    { label: 'API Calls', value: '-', trend: 'No data available' },
    { label: 'Automations', value: '-', trend: 'No data available' },
    { label: 'Data Processed', value: '-', trend: 'No data available' }
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Platform Intelligence
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Manage your AI-powered platform features and integrations
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg flex items-center space-x-2 transition hover:opacity-80"
            style={{ 
              backgroundColor: 'rgb(73, 90, 88)',
              color: 'rgb(229, 227, 220)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade Platform</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.1)'
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(229, 227, 220)' }}>
                {stat.value}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                {stat.trend}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Features Grid */}
      <div className="px-8 pb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature) => {
            const Icon = feature.icon;
            const isActive = feature.status === 'active';
            
            return (
              <div
                key={feature.id}
                className={`rounded-lg p-6 transition-all ${
                  isActive ? 'cursor-pointer hover:shadow-lg' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}
                onClick={() => isActive && router.push(feature.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}
                  >
                    <Icon className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
                  </div>
                  {isActive ? (
                    <CheckCircle className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  ) : (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: 'rgba(169, 189, 203, 0.1)',
                      color: 'rgba(169, 189, 203, 0.6)'
                    }}>
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  {feature.description}
                </p>
                
                {isActive && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      View Details
                    </span>
                    <ArrowRight className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Services */}
      <div className="px-8 pb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
          Connected Services
        </h2>
        <div className="rounded-lg p-6" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.15)'
        }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                  API Endpoints
                </p>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  Chatbot API active
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                  Database
                </p>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  PostgreSQL on Railway
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                  Webhooks
                </p>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                  Not configured
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}