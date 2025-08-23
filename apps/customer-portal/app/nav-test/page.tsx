'use client';

import { useEffect, useState } from 'react';

export default function NavTestPage() {
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Capture any errors
    const errorHandler = (e: ErrorEvent) => {
      setErrors(prev => [...prev, `Error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`]);
      console.error('Captured error:', e);
      return true;
    };

    const unhandledRejection = (e: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, `Unhandled Promise: ${e.reason}`]);
      console.error('Unhandled promise rejection:', e);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejection);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejection);
    };
  }, []);

  const testNavigation = (method: string, url: string) => {
    console.log(`Testing ${method} to ${url}`);
    
    try {
      switch (method) {
        case 'href':
          window.location.href = url;
          break;
        case 'replace':
          window.location.replace(url);
          break;
        case 'assign':
          window.location.assign(url);
          break;
        case 'setTimeout':
          setTimeout(() => {
            window.location.href = url;
          }, 100);
          break;
        case 'requestAnimationFrame':
          requestAnimationFrame(() => {
            window.location.href = url;
          });
          break;
      }
    } catch (e: any) {
      setErrors(prev => [...prev, `${method} error: ${e.message}`]);
      console.error(`${method} navigation error:`, e);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Navigation Test Page</h1>
      <p>Client-side rendered: {mounted ? 'YES' : 'NO'}</p>
      
      <div style={{ margin: '20px 0' }}>
        <h2>Test Basic Navigation:</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <button onClick={() => testNavigation('href', '/simple')}>
            window.location.href
          </button>
          
          <button onClick={() => testNavigation('replace', '/simple')}>
            window.location.replace
          </button>
          
          <button onClick={() => testNavigation('assign', '/simple')}>
            window.location.assign
          </button>
          
          <button onClick={() => testNavigation('setTimeout', '/simple')}>
            setTimeout redirect
          </button>
          
          <button onClick={() => testNavigation('requestAnimationFrame', '/simple')}>
            requestAnimationFrame redirect
          </button>
          
          <a href="/simple" style={{ 
            padding: '10px', 
            backgroundColor: '#28a745', 
            color: 'white',
            textDecoration: 'none',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            Regular Link
          </a>
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          <h3>Captured Errors:</h3>
          <pre style={{ fontSize: '11px' }}>
            {errors.map((err, i) => `${i + 1}. ${err}`).join('\n')}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Open console (F12) to see detailed logs</p>
        <p>All buttons should navigate to /simple page</p>
      </div>
    </div>
  );
}