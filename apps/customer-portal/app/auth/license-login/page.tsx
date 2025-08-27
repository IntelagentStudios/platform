'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LicenseLoginPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate license key
      const response = await fetch('/api/auth/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Successfully authenticated, redirect to chatbot setup
      router.push('/products/chatbot/setup-agent-frame');
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
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
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          fontSize: '24px',
          marginBottom: '8px',
          color: '#333'
        }}>License Key Authentication</h1>
        
        <p style={{
          color: '#666',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Enter your license key to access the chatbot configuration
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            />
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#999'
            }}>
              For James: Use INTL-NW1S-QANW-2025
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#fee',
              color: '#c00',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || licenseKey.length !== 19}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || licenseKey.length !== 19 ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading || licenseKey.length !== 19 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Login with License Key'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <a
            href="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Login with email instead →
          </a>
        </div>
      </div>
    </div>
  );
}