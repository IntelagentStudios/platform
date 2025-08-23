'use client';

import { useState } from 'react';

export default function TestSimpleLogin() {
  const [status, setStatus] = useState('');
  const [debug, setDebug] = useState<any>(null);

  const testLogin = async () => {
    setStatus('Logging in...');
    
    try {
      const response = await fetch('/api/auth/login-debug-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'harry@intelagentstudios.com',
          password: 'Birksgrange226!'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      setDebug(data.debug);
      
      if (data.success) {
        setStatus('Login successful! Redirecting in 2 seconds...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setStatus(`Login failed: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/check-session', {
        credentials: 'include'
      });
      const data = await response.json();
      setDebug(data);
      setStatus(data.authenticated ? 'Authenticated!' : 'Not authenticated');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Simple Login Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLogin}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Login
        </button>
        
        <button 
          onClick={checkSession}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Session
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {debug && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Debug Info:</strong>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ color: '#007bff' }}>Try going to /dashboard directly</a>
      </div>
    </div>
  );
}