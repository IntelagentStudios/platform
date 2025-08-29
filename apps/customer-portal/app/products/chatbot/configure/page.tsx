'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

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
    <DashboardLayout>
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'rgb(48, 54, 54)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(58, 64, 64, 0.95)',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          border: '1px solid rgba(169, 189, 203, 0.15)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {!success ? (
            <>
              <h1 style={{
                fontSize: '28px',
                marginBottom: '10px',
                color: 'rgb(229, 227, 220)',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Configure Your AI Chatbot
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'rgba(229, 227, 220, 0.7)',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                Enter your website domain to configure your chatbot
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgb(229, 227, 220)',
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
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      color: 'rgb(229, 227, 220)',
                      transition: 'border-color 0.2s, background-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgb(169, 189, 203)';
                      e.target.style.backgroundColor = 'rgba(48, 54, 54, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(169, 189, 203, 0.2)';
                      e.target.style.backgroundColor = 'rgba(48, 54, 54, 0.5)';
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(229, 227, 220, 0.5)',
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
                    color: 'rgb(229, 227, 220)',
                    marginBottom: '8px'
                  }}>
                    Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to use your account license"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid rgba(169, 189, 203, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      color: 'rgb(229, 227, 220)',
                      transition: 'border-color 0.2s, background-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgb(169, 189, 203)';
                      e.target.style.backgroundColor = 'rgba(48, 54, 54, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(169, 189, 203, 0.2)';
                      e.target.style.backgroundColor = 'rgba(48, 54, 54, 0.5)';
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(229, 227, 220, 0.5)',
                    marginTop: '4px'
                  }}>
                    Since you're logged in, you can leave this blank to use your account (INTL-AGNT-BOSS-MODE)
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'rgb(248, 113, 113)',
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
                    backgroundColor: loading ? 'rgba(169, 189, 203, 0.3)' : 'rgb(169, 189, 203)',
                    color: loading ? 'rgba(48, 54, 54, 0.5)' : 'rgb(48, 54, 54)',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = 'rgb(149, 169, 183)')}
                  onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = 'rgb(169, 189, 203)')}
                >
                  {loading ? 'Configuring...' : 'Generate Embed Code'}
                </button>
              </form>

              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(169, 189, 203, 0.1)',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => router.push('/products')}
                  style={{
                    color: 'rgb(169, 189, 203)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Back to Products
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'rgb(34, 197, 94)',
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
                  color: 'rgb(229, 227, 220)',
                  fontWeight: 'bold'
                }}>
                  Your Chatbot is Ready!
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: 'rgba(229, 227, 220, 0.7)'
                }}>
                  Copy the embed code below and add it to your website
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgb(229, 227, 220)',
                  marginBottom: '8px'
                }}>
                  Product Key
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.2)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: 'rgb(169, 189, 203)'
                }}>
                  {productKey}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgb(229, 227, 220)',
                  marginBottom: '8px'
                }}>
                  Embed Code
                </label>
                <div style={{
                  position: 'relative',
                  padding: '16px',
                  backgroundColor: 'rgba(38, 44, 44, 0.95)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'rgb(134, 239, 172)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}>
                  {embedCode}
                  <button
                    onClick={copyToClipboard}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '8px 12px',
                      backgroundColor: copied ? 'rgb(34, 197, 94)' : 'rgba(169, 189, 203, 0.2)',
                      color: 'white',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'rgb(229, 227, 220)',
                  marginBottom: '8px'
                }}>
                  Installation Instructions
                </h3>
                <ol style={{
                  margin: '0',
                  paddingLeft: '20px',
                  color: 'rgba(229, 227, 220, 0.8)',
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

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => router.push('/products/chatbot/manage')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(48, 54, 54)',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgb(149, 169, 183)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgb(169, 189, 203)'}
                >
                  Manage Chatbot
                </button>
                <button
                  onClick={reset}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: 'transparent',
                    color: 'rgb(229, 227, 220)',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: '2px solid rgba(169, 189, 203, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(169, 189, 203, 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(169, 189, 203, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(169, 189, 203, 0.3)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Configure Another
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}