'use client';

import { useEffect, useState } from 'react';

export default function DashboardTestPage() {
  const [status, setStatus] = useState('Checking...');
  
  useEffect(() => {
    // Set a test cookie manually
    document.cookie = `session=test-token; path=/; max-age=3600`;
    setStatus('Test cookie set. Try accessing /dashboard now.');
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Dashboard Access Test</h1>
      <p>Status: {status}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Manual Tests:</h2>
        
        <div style={{ marginTop: '10px' }}>
          <a href="/dashboard" style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white',
            textDecoration: 'none',
            display: 'inline-block',
            borderRadius: '4px'
          }}>
            Go to Dashboard (Link)
          </a>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <form action="/dashboard" method="GET">
            <button type="submit" style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Go to Dashboard (Form GET)
            </button>
          </form>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => {
            console.log('Attempting location change...');
            try {
              window.location.href = '/dashboard';
            } catch (e) {
              alert('Error: ' + e.message);
            }
          }} style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Go to Dashboard (JavaScript)
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Console Output:</h3>
        <p>Open browser console (F12) to see any errors</p>
      </div>
    </div>
  );
}