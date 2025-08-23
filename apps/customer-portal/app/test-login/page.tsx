'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [status, setStatus] = useState('Ready to test');
  const [response, setResponse] = useState('');

  const testLogin = async () => {
    console.log('Test login button clicked!');
    setStatus('Testing login...');
    
    try {
      const res = await fetch('/api/auth/login-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'harry@intelagentstudios.com',
          password: 'Birksgrange226!'
        })
      });
      
      const data = await res.json();
      console.log('Response:', data);
      setResponse(JSON.stringify(data, null, 2));
      
      if (res.ok && data.success) {
        setStatus('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setStatus('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + error);
      setResponse('Error occurred');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Login Page</h1>
      <p>Current time: {new Date().toISOString()}</p>
      <p>Status: {status}</p>
      <button 
        onClick={testLogin}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Login with Hardcoded Credentials
      </button>
      {response && (
        <pre style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {response}
        </pre>
      )}
    </div>
  );
}