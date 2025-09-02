'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Shield,
  Zap,
  Database,
  Mail,
  CreditCard,
  Globe
} from 'lucide-react';

interface SkillConfig {
  skillId: string;
  name: string;
  category: string;
  enabled: boolean;
  config: {
    [key: string]: any;
  };
  requiredKeys: string[];
}

const SKILL_CATEGORIES = {
  communication: {
    icon: Mail,
    color: 'bg-blue-600',
    skills: [
      {
        id: 'email_composer',
        name: 'Email Composer',
        requiredKeys: ['SENDGRID_API_KEY', 'DEFAULT_FROM_EMAIL']
      },
      {
        id: 'sms_sender',
        name: 'SMS Sender',
        requiredKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
      },
      {
        id: 'slack_integration',
        name: 'Slack Integration',
        requiredKeys: ['SLACK_BOT_TOKEN', 'SLACK_WEBHOOK_URL']
      }
    ]
  },
  payments: {
    icon: CreditCard,
    color: 'bg-green-600',
    skills: [
      {
        id: 'stripe_payment',
        name: 'Stripe Payments',
        requiredKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
      },
      {
        id: 'paypal_payment',
        name: 'PayPal Payments',
        requiredKeys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
      }
    ]
  },
  data: {
    icon: Database,
    color: 'bg-purple-600',
    skills: [
      {
        id: 'web_scraper',
        name: 'Web Scraper',
        requiredKeys: ['BROWSERLESS_API_KEY', 'PROXY_URL']
      },
      {
        id: 'database_connector',
        name: 'Database Connector',
        requiredKeys: ['DB_CONNECTION_STRING', 'DB_TYPE']
      }
    ]
  },
  ai: {
    icon: Zap,
    color: 'bg-orange-600',
    skills: [
      {
        id: 'text_classifier',
        name: 'Text Classifier',
        requiredKeys: ['OPENAI_API_KEY']
      },
      {
        id: 'image_analysis',
        name: 'Image Analysis',
        requiredKeys: ['GOOGLE_VISION_API_KEY', 'GOOGLE_PROJECT_ID']
      }
    ]
  },
  integrations: {
    icon: Globe,
    color: 'bg-indigo-600',
    skills: [
      {
        id: 'salesforce_connector',
        name: 'Salesforce',
        requiredKeys: ['SALESFORCE_CLIENT_ID', 'SALESFORCE_CLIENT_SECRET', 'SALESFORCE_INSTANCE_URL']
      },
      {
        id: 'hubspot_connector',
        name: 'HubSpot',
        requiredKeys: ['HUBSPOT_API_KEY']
      }
    ]
  }
};

export default function SkillsConfigPage() {
  const [configs, setConfigs] = useState<{ [key: string]: any }>({});
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('communication');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/skills-config');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs || {});
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      setMessage({ type: 'error', text: 'Failed to load configurations' });
    }
  };

  const saveConfigs = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/skills-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Configurations saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configurations' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configurations' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (skillId: string) => {
    try {
      const response = await fetch('/api/admin/skills-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, config: configs[skillId] })
      });
      
      const data = await response.json();
      setTestResults({ ...testResults, [skillId]: data.success });
      
      if (data.success) {
        setMessage({ type: 'success', text: `${skillId} connection successful!` });
      } else {
        setMessage({ type: 'error', text: `${skillId} connection failed: ${data.error}` });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setTestResults({ ...testResults, [skillId]: false });
      setMessage({ type: 'error', text: 'Test connection failed' });
    }
  };

  const updateConfig = (skillId: string, key: string, value: string) => {
    setConfigs({
      ...configs,
      [skillId]: {
        ...configs[skillId],
        [key]: value
      }
    });
  };

  const toggleShowValue = (key: string) => {
    setShowValues({ ...showValues, [key]: !showValues[key] });
  };

  const isSkillConfigured = (skillId: string, requiredKeys: string[]) => {
    const config = configs[skillId] || {};
    return requiredKeys.every(key => config[key] && config[key].length > 0);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              Skills Configuration
            </h1>
            <p className="mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
              Configure API keys and settings for skill integrations
            </p>
          </div>
          <button
            onClick={saveConfigs}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Configurations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-900' : 'bg-red-900'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span style={{ color: message.type === 'success' ? 'rgb(134, 239, 172)' : 'rgb(248, 113, 113)' }}>
            {message.text}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(73, 90, 88)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Categories
            </h2>
            <div className="space-y-2">
              {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const configured = category.skills.filter(s => 
                  isSkillConfigured(s.id, s.requiredKeys)
                ).length;
                
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${
                      selectedCategory === key 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className={`p-2 rounded ${category.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="capitalize" style={{ 
                        color: selectedCategory === key ? 'white' : 'rgb(229, 227, 220)' 
                      }}>
                        {key}
                      </div>
                      <div className="text-xs" style={{ 
                        color: selectedCategory === key ? 'rgba(255,255,255,0.8)' : 'rgb(169, 189, 203)' 
                      }}>
                        {configured}/{category.skills.length} configured
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3 space-y-6">
          {SKILL_CATEGORIES[selectedCategory]?.skills.map(skill => {
            const configured = isSkillConfigured(skill.id, skill.requiredKeys);
            const config = configs[skill.id] || {};
            
            return (
              <div 
                key={skill.id}
                className="rounded-lg p-6"
                style={{ backgroundColor: 'rgb(73, 90, 88)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2" 
                        style={{ color: 'rgb(229, 227, 220)' }}>
                      {skill.name}
                      {configured && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'rgb(169, 189, 203)' }}>
                      Skill ID: {skill.id}
                    </p>
                  </div>
                  {configured && (
                    <button
                      onClick={() => testConnection(skill.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition"
                    >
                      Test Connection
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {skill.requiredKeys.map(key => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2" 
                             style={{ color: 'rgb(229, 227, 220)' }}>
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type={showValues[`${skill.id}_${key}`] ? 'text' : 'password'}
                            value={config[key] || ''}
                            onChange={(e) => updateConfig(skill.id, key, e.target.value)}
                            placeholder={`Enter ${key}`}
                            className="w-full px-4 py-2 rounded-lg pr-10"
                            style={{ 
                              backgroundColor: 'rgb(48, 54, 54)',
                              color: 'rgb(229, 227, 220)',
                              borderColor: 'rgb(169, 189, 203)',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowValue(`${skill.id}_${key}`)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          >
                            {showValues[`${skill.id}_${key}`] ? (
                              <EyeOff className="w-4 h-4" style={{ color: 'rgb(169, 189, 203)' }} />
                            ) : (
                              <Eye className="w-4 h-4" style={{ color: 'rgb(169, 189, 203)' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Test Result */}
                {testResults[skill.id] !== undefined && (
                  <div className={`mt-4 p-3 rounded flex items-center gap-2 ${
                    testResults[skill.id] ? 'bg-green-900' : 'bg-red-900'
                  }`}>
                    {testResults[skill.id] ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Connection successful</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Connection failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-4 rounded-lg border" style={{ 
        backgroundColor: 'rgb(73, 90, 88)',
        borderColor: 'rgb(169, 189, 203)'
      }}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 mt-0.5" style={{ color: 'rgb(169, 189, 203)' }} />
          <div>
            <h4 className="font-semibold mb-1" style={{ color: 'rgb(229, 227, 220)' }}>
              Security Notice
            </h4>
            <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
              All API keys and secrets are encrypted before storage. Never share these credentials or commit them to version control. 
              Use environment variables in production for maximum security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}