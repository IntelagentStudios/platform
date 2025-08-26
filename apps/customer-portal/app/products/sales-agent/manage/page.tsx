'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  Target,
  Key,
  Copy,
  CheckCircle,
  Settings,
  Code,
  Activity
} from 'lucide-react';

export default function SalesAgentManagePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [productKey, setProductKey] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasConfiguration, setHasConfiguration] = useState(false);

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Check for existing product configuration
          fetch('/api/products/check-keys')
            .then(res => res.json())
            .then(configData => {
              if (configData.success && configData.configurations['sales-agent']) {
                const config = configData.configurations['sales-agent'];
                if (config.productKey) {
                  setHasConfiguration(true);
                  setProductKey(config.productKey);
                  setEmbedCode(`<script src="https://dashboard.intelagentstudios.com/sales-agent.js" data-product-key="${config.productKey}"></script>`);
                }
              }
              setLoading(false);
            })
            .catch(err => {
              console.error('Failed to fetch configuration:', err);
              setLoading(false);
            });
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.push('/login');
      });
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAuthenticated === null || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
               style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasConfiguration) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(169, 189, 203)' }} />
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Sales Agent Not Configured
            </h2>
            <p className="mb-6" style={{ color: 'rgb(169, 189, 203)' }}>
              You need to configure your Sales Agent before you can manage it.
            </p>
            <button
              onClick={() => router.push('/products/sales-agent/setup')}
              className="px-6 py-3 rounded-lg font-medium"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              Configure Sales Agent
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
            Sales Agent Management
          </h1>
          <p style={{ color: 'rgb(169, 189, 203)' }}>
            Manage your AI sales assistant configuration and performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Total Leads</span>
              <Users className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>-</div>
          </div>

          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Conversion Rate</span>
              <TrendingUp className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>-</div>
          </div>

          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Revenue Generated</span>
              <DollarSign className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>-</div>
          </div>

          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Active Campaigns</span>
              <Target className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>-</div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: 'rgb(229, 227, 220)' }}>
              <Key className="h-5 w-5 mr-2" />
              Product Key
            </h2>
            <div className="p-4 rounded-lg font-mono text-sm break-all" style={{ 
              backgroundColor: 'rgba(48, 54, 54, 0.5)',
              color: 'rgb(169, 189, 203)'
            }}>
              {productKey}
              <button
                onClick={() => copyToClipboard(productKey)}
                className="ml-2 p-1 rounded transition-colors"
                style={{ color: copied ? '#4CAF50' : 'rgb(169, 189, 203)' }}
              >
                {copied ? <CheckCircle className="h-4 w-4 inline" /> : <Copy className="h-4 w-4 inline" />}
              </button>
            </div>
          </div>

          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: 'rgb(229, 227, 220)' }}>
              <Code className="h-5 w-5 mr-2" />
              Embed Code
            </h2>
            <div className="p-4 rounded-lg font-mono text-xs break-all" style={{ 
              backgroundColor: 'rgba(48, 54, 54, 0.5)',
              color: 'rgb(169, 189, 203)'
            }}>
              {embedCode}
              <button
                onClick={() => copyToClipboard(embedCode)}
                className="ml-2 p-1 rounded transition-colors"
                style={{ color: copied ? '#4CAF50' : 'rgb(169, 189, 203)' }}
              >
                {copied ? <CheckCircle className="h-4 w-4 inline" /> : <Copy className="h-4 w-4 inline" />}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/products/sales-agent/setup')}
            className="px-6 py-3 rounded-lg font-medium flex items-center"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Settings className="h-5 w-5 mr-2" />
            Reconfigure
          </button>
          <button
            onClick={() => router.push('/products/analytics')}
            className="px-6 py-3 rounded-lg font-medium border"
            style={{
              borderColor: 'rgb(169, 189, 203)',
              color: 'rgb(229, 227, 220)'
            }}
          >
            <Activity className="h-5 w-5 mr-2 inline" />
            View Analytics
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}