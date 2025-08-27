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
      borderRadius: '20px',
      padding: '48px',
      maxWidth: '720px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }} />
      {!success ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(102, 126, 234, 0.08)',
              borderRadius: '100px',
              marginBottom: '16px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <span style={{ fontSize: '13px', color: '#667eea', fontWeight: '600', letterSpacing: '0.05em' }}>
                🚀 QUICK SETUP
              </span>
            </div>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '12px',
              color: '#1a202c',
              fontWeight: '700'
            }}>
              Configure {config.name}
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#718096',
              lineHeight: '1.6'
            }}>
              {config.description}
            </p>
          </div>

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
                padding: '16px',
                background: loading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                transform: loading ? 'none' : 'translateY(0)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? '⌛ Configuring...' : `✨ Configure ${config.name}`}
            </button>
          </form>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '40px',
              color: 'white',
              boxShadow: '0 10px 30px rgba(72, 187, 120, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              ✓
            </div>
            <style jsx>{`
              @keyframes pulse {
                0% {
                  box-shadow: 0 10px 30px rgba(72, 187, 120, 0.3);
                }
                50% {
                  box-shadow: 0 10px 40px rgba(72, 187, 120, 0.5);
                }
                100% {
                  box-shadow: 0 10px 30px rgba(72, 187, 120, 0.3);
                }
              }
            `}</style>
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

          <div style={{ marginBottom: '30px' }}>
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
              background: '#1a202c',
              borderRadius: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#68d391',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {embedCode}
              <button
                onClick={copyToClipboard}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '8px 12px',
                  background: copied ? '#48bb78' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div style={{ 
            marginBottom: '30px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📚 Installation Instructions
            </h3>
            
            <details style={{ marginBottom: '12px' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                🌐 HTML/Static Website
              </summary>
              <div style={{
                padding: '12px',
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                Add the script tag just before the closing <code style={{ background: '#f7fafc', padding: '2px 4px', borderRadius: '3px' }}>&lt;/body&gt;</code> tag in your HTML file:
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '12px'
                }}>
{`<body>
  <!-- Your website content -->
  
  <!-- Add before closing body tag -->
  ${embedCode}
</body>`}
                </pre>
              </div>
            </details>

            <details style={{ marginBottom: '12px' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                ⚡ React/Next.js
              </summary>
              <div style={{
                padding: '12px',
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                Add to your main layout or _app.js/_document.js file:
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '12px'
                }}>
{`// In _app.js or layout component
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script 
        src="https://dashboard.intelagentstudios.com/chatbot-widget.js" 
        data-product-key="${productKey}"
        strategy="lazyOnload"
      />
    </>
  )
}`}
                </pre>
              </div>
            </details>

            <details style={{ marginBottom: '12px' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                🔷 WordPress
              </summary>
              <div style={{
                padding: '12px',
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                <ol style={{ marginLeft: '20px' }}>
                  <li>Go to <strong>Appearance → Theme Editor</strong></li>
                  <li>Select <strong>footer.php</strong></li>
                  <li>Add the script before <code style={{ background: '#f7fafc', padding: '2px 4px', borderRadius: '3px' }}>&lt;/body&gt;</code></li>
                </ol>
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: '#fef5e7',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#9a7d0a'
                }}>
                  💡 <strong>Tip:</strong> You can also use a plugin like "Insert Headers and Footers" to add the code without editing theme files.
                </div>
              </div>
            </details>

            <details style={{ marginBottom: '12px' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                🛍️ Shopify
              </summary>
              <div style={{
                padding: '12px',
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                <ol style={{ marginLeft: '20px' }}>
                  <li>Go to <strong>Online Store → Themes</strong></li>
                  <li>Click <strong>Actions → Edit code</strong></li>
                  <li>Find <strong>theme.liquid</strong> under Layout</li>
                  <li>Add the script before <code style={{ background: '#f7fafc', padding: '2px 4px', borderRadius: '3px' }}>&lt;/body&gt;</code></li>
                  <li>Save your changes</li>
                </ol>
              </div>
            </details>

            <details>
              <summary style={{
                cursor: 'pointer',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}>
                🌈 Other Platforms
              </summary>
              <div style={{
                padding: '12px',
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.6'
              }}>
                <p><strong>General steps for most platforms:</strong></p>
                <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Access your website's HTML editor or template files</li>
                  <li>Locate the footer section or main layout file</li>
                  <li>Add the script tag before the closing body tag</li>
                  <li>Save and publish your changes</li>
                </ol>
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: '#e8f5e9',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#2e7d32'
                }}>
                  💬 Need help? Contact our support team for platform-specific guidance.
                </div>
              </div>
            </details>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              🚀 Continue to Dashboard
            </button>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: 'white',
                color: '#667eea',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.background = '#f7fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'white';
              }}
            >
              ➕ Configure Another
            </button>
          </div>
        </>
      )}
    </div>
  );
}