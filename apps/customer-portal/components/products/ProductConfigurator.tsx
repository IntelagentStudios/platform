'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Product configuration definitions
export const PRODUCT_CONFIGS = {
  chatbot: {
    name: 'AI Chatbot',
    description: 'Configure your AI chatbot for customer support',
    fields: [
      {
        name: 'domain',
        label: 'Website Domain',
        type: 'text',
        placeholder: 'example.com',
        required: true,
        pattern: '[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,}',
        help: 'The website where your chatbot will be installed'
      }
    ],
    embedFormat: (key: string) => 
      `<script src="https://dashboard.intelagentstudios.com/chatbot.js" data-product-key="${key}"></script>`
  },
  'sales-agent': {
    name: 'Sales Agent',
    description: 'Configure your AI sales assistant',
    fields: [
      {
        name: 'domain',
        label: 'Website Domain',
        type: 'text',
        placeholder: 'example.com',
        required: true,
        pattern: '[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,}',
        help: 'Your business website'
      },
      {
        name: 'industry',
        label: 'Industry',
        type: 'select',
        required: true,
        options: [
          { value: 'ecommerce', label: 'E-commerce' },
          { value: 'saas', label: 'SaaS' },
          { value: 'services', label: 'Services' },
          { value: 'consulting', label: 'Consulting' },
          { value: 'other', label: 'Other' }
        ],
        help: 'Your business industry for tailored responses'
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        type: 'text',
        placeholder: 'e.g., Small businesses, Enterprise clients',
        required: false,
        help: 'Who are your ideal customers?'
      }
    ],
    embedFormat: (key: string) => 
      `<script src="https://dashboard.intelagentstudios.com/sales-agent.js" data-product-key="${key}"></script>`
  },
  'data-enrichment': {
    name: 'Data Enrichment',
    description: 'Configure your data enrichment pipeline',
    fields: [
      {
        name: 'api_endpoint',
        label: 'API Endpoint',
        type: 'url',
        placeholder: 'https://api.example.com/webhook',
        required: true,
        help: 'Where to send enriched data'
      },
      {
        name: 'data_sources',
        label: 'Data Sources',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'companies_house', label: 'Companies House' },
          { value: 'google', label: 'Google' },
          { value: 'social_media', label: 'Social Media' },
          { value: 'news', label: 'News Sources' }
        ],
        help: 'Select data sources to enrich from'
      },
      {
        name: 'refresh_rate',
        label: 'Refresh Rate',
        type: 'select',
        required: true,
        options: [
          { value: 'realtime', label: 'Real-time' },
          { value: 'hourly', label: 'Hourly' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ],
        help: 'How often to update enriched data'
      }
    ],
    embedFormat: (key: string) => 
      `API Key: ${key}\nEndpoint: https://api.intelagentstudios.com/v1/enrich`
  },
  'setup-agent': {
    name: 'Setup Assistant',
    description: 'Configure your setup assistant for onboarding',
    fields: [
      {
        name: 'company_name',
        label: 'Company Name',
        type: 'text',
        placeholder: 'Your Company',
        required: true,
        help: 'Your company name for personalized responses'
      },
      {
        name: 'onboarding_steps',
        label: 'Onboarding Steps',
        type: 'textarea',
        placeholder: 'Step 1: Create account\nStep 2: Verify email\nStep 3: Complete profile',
        required: false,
        help: 'Custom onboarding flow (optional)'
      }
    ],
    embedFormat: (key: string) => 
      `<script src="https://dashboard.intelagentstudios.com/setup-assistant.js" data-product-key="${key}"></script>`
  }
};

interface ProductConfiguratorProps {
  product: keyof typeof PRODUCT_CONFIGS;
  onSuccess?: (productKey: string, embedCode: string) => void;
}

export default function ProductConfigurator({ product, onSuccess }: ProductConfiguratorProps) {
  const router = useRouter();
  const config = PRODUCT_CONFIGS[product];
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [productKey, setProductKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/products/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          password,
          configuration: formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Configuration failed');
      }

      setProductKey(data.product_key);
      setEmbedCode(data.embed_code);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(data.product_key, data.embed_code);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSuccess(false);
    setEmbedCode('');
    setProductKey('');
    setFormData({});
    setPassword('');
    setError('');
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            pattern={field.pattern}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
              outline: 'none',
              resize: 'vertical'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
              outline: 'none',
              background: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div style={{
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px'
          }}>
            {field.options.map((option: any) => (
              <label key={option.value} style={{
                display: 'block',
                padding: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(formData[field.name] || []).includes(option.value)}
                  onChange={(e) => {
                    const current = formData[field.name] || [];
                    if (e.target.checked) {
                      handleFieldChange(field.name, [...current, option.value]);
                    } else {
                      handleFieldChange(field.name, current.filter((v: string) => v !== option.value));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '40px',
      maxWidth: '600px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
    }}>
      {!success ? (
        <>
          <h1 style={{
            fontSize: '28px',
            marginBottom: '10px',
            color: '#1a202c',
            textAlign: 'center'
          }}>
            Configure {config.name}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            {config.description}
          </p>

          <form onSubmit={handleSubmit}>
            {config.fields.map((field) => (
              <div key={field.name} style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '8px'
                }}>
                  {field.label}
                </label>
                {renderField(field)}
                {field.help && (
                  <p style={{
                    fontSize: '12px',
                    color: '#a0aec0',
                    marginTop: '4px'
                  }}>
                    {field.help}
                  </p>
                )}
              </div>
            ))}

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                License Key
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                pattern="[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <p style={{
                fontSize: '12px',
                color: '#a0aec0',
                marginTop: '4px'
              }}>
                Your Intelagent license key for authentication
              </p>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fed7d7',
                border: '1px solid #fc8181',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#c53030',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s'
              }}
            >
              {loading ? 'Configuring...' : `Configure ${config.name}`}
            </button>
          </form>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '30px',
              color: 'white'
            }}>
              ✓
            </div>
            <h1 style={{
              fontSize: '28px',
              marginBottom: '10px',
              color: '#1a202c'
            }}>
              {config.name} is Ready!
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#718096'
            }}>
              Your configuration is complete
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px'
            }}>
              Product Key
            </label>
            <div style={{
              padding: '12px',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#2d3748'
            }}>
              {productKey}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px'
            }}>
              Integration Code
            </label>
            <div style={{
              position: 'relative',
              padding: '16px',
              background: '#2d3748',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#68d391',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {embedCode}
              <button
                onClick={copyToClipboard}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '8px 12px',
                  background: copied ? '#48bb78' : '#4a5568',
                  color: 'white',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Configure Another {config.name}
          </button>
        </>
      )}
    </div>
  );
}