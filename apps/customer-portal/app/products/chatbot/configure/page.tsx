'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigureChatbot() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [productKey, setProductKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/products/chatbot/quick-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Configuration failed');
      }

      setProductKey(data.product_key);
      setEmbedCode(data.embed_code);
      setSuccess(true);
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
    setDomain('');
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {!success ? (
          <>
            <h1 style={{
              fontSize: '28px',
              marginBottom: '10px',
              color: '#1a202c',
              textAlign: 'center'
            }}>
              Configure Your AI Chatbot
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#718096',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              Enter your website domain and license key to configure your chatbot
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '8px'
                }}>
                  Website Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  placeholder="example.com"
                  required
                  pattern="[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}"
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
                <p style={{
                  fontSize: '12px',
                  color: '#a0aec0',
                  marginTop: '4px'
                }}>
                  The website where your chatbot will be installed
                </p>
              </div>

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
                  minLength={8}
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
                <p style={{
                  fontSize: '12px',
                  color: '#a0aec0',
                  marginTop: '4px'
                }}>
                  Your Intelagent license key (e.g., INTL-XXXX-XXXX-XXXX)
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
                  transition: 'transform 0.2s',
                  transform: loading ? 'scale(1)' : 'scale(1)'
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {loading ? 'Configuring...' : 'Generate Embed Code'}
              </button>
            </form>

            <div style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '14px', color: '#718096' }}>
                Need help? Check our{' '}
                <a href="/docs" style={{ color: '#667eea', textDecoration: 'none' }}>
                  documentation
                </a>
                {' '}or{' '}
                <a href="mailto:support@intelagentstudios.com" style={{ color: '#667eea', textDecoration: 'none' }}>
                  contact support
                </a>
              </p>
            </div>
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
                fontSize: '30px'
              }}>
                ✓
              </div>
              <h1 style={{
                fontSize: '28px',
                marginBottom: '10px',
                color: '#1a202c'
              }}>
                Your Chatbot is Ready!
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#718096'
              }}>
                Copy the embed code below and add it to your website
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
                Embed Code
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

            <div style={{
              padding: '16px',
              background: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#22543d',
                marginBottom: '8px'
              }}>
                Installation Instructions
              </h3>
              <ol style={{
                margin: '0',
                paddingLeft: '20px',
                color: '#2f855a',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <li>Copy the embed code above</li>
                <li>Open your website's HTML file or editor</li>
                <li>Paste the code just before the closing &lt;/body&gt; tag</li>
                <li>Save and publish your changes</li>
                <li>Your chatbot will appear immediately!</li>
              </ol>
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
              onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Configure Another Chatbot
            </button>
          </>
        )}
      </div>
    </div>
  );
}