'use client';

import { useState } from 'react';

export default function LoginFixPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1];
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[LOGIN-FIX] ${message}`);
  };

  const tryRedirect = async (method: string, url: string) => {
    try {
      addLog(`Attempting ${method} redirect to ${url}`);
      
      switch (method) {
        case 'location.href':
          window.location.href = url;
          break;
        case 'location.replace':
          window.location.replace(url);
          break;
        case 'location.assign':
          window.location.assign(url);
          break;
        case 'history.pushState':
          window.history.pushState({}, '', url);
          window.location.reload();
          break;
        case 'form':
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = url;
          document.body.appendChild(form);
          form.submit();
          break;
        case 'link':
          const link = document.createElement('a');
          link.href = url;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          break;
        default:
          window.location.href = url;
      }
      
      addLog(`${method} redirect initiated`);
      
      // Wait to see if redirect happens
      setTimeout(() => {
        addLog(`Still on page after ${method} redirect attempt`);
      }, 2000);
      
    } catch (error: any) {
      addLog(`${method} redirect error: ${error.message}`);
      console.error(`Redirect error (${method}):`, error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      addLog('Starting login attempt');
      setStatus('Logging in...');
      
      const response = await fetch('/api/auth/login-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      addLog(`Response: ${JSON.stringify(data)}`);

      if (response.ok && data.success) {
        addLog('Login successful, starting redirect attempts');
        setStatus('Login successful! Trying redirects...');
        
        // Try multiple redirect methods
        const methods = [
          'location.href',
          'location.replace',
          'location.assign',
          'form',
          'link'
        ];
        
        for (let i = 0; i < methods.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await tryRedirect(methods[i], '/dashboard');
        }
        
      } else {
        addLog(`Login failed: ${data.error}`);
        setStatus(`Error: ${data.error}`);
      }
      
    } catch (error: any) {
      addLog(`Caught error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
      console.error('Login error:', error);
    }
  };

  const testSimpleRedirect = () => {
    try {
      addLog('Testing simple redirect');
      window.location.href = '/simple';
    } catch (e: any) {
      addLog(`Simple redirect error: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Login Fix Test</h1>
      
      <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              padding: '8px', 
              width: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              padding: '8px', 
              width: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button 
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSimpleRedirect}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Redirect to /simple
        </button>
        
        <button 
          onClick={() => setLogs([])}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>

      {status && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: status.includes('Error') ? '#ffebee' : '#e8f5e9',
          color: status.includes('Error') ? '#c62828' : '#2e7d32',
          borderRadius: '4px'
        }}>
          {status}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '4px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <h3>Debug Logs:</h3>
        {logs.length === 0 ? (
          <p>No logs yet...</p>
        ) : (
          <pre style={{ fontSize: '12px', lineHeight: '1.5' }}>
            {logs.join('\n')}
          </pre>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Test credentials:</p>
        <p>Email: harry@intelagentstudios.com</p>
        <p>Password: Birksgrange226!</p>
      </div>
    </div>
  );
}