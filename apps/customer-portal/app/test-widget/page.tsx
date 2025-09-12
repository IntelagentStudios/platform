'use client';

import { useState, useEffect } from 'react';

export default function TestWidget() {
  const [config, setConfig] = useState<any>(null);
  const [widgetUrl, setWidgetUrl] = useState('');
  const [productKey, setProductKey] = useState('chat_9b3f7e8a2c5d1f0e');
  
  const fetchConfig = async () => {
    try {
      // Test the config endpoint directly
      const response = await fetch(`/api/widget/config?key=${productKey}`);
      const data = await response.json();
      setConfig(data);
      console.log('Config fetched:', data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };
  
  useEffect(() => {
    fetchConfig();
    setWidgetUrl(`${window.location.origin}/api/widget/dynamic?key=${productKey}`);
  }, [productKey]);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>Widget Configuration Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <label>
          Product Key: 
          <input 
            type="text" 
            value={productKey} 
            onChange={(e) => setProductKey(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
          />
        </label>
        <button onClick={fetchConfig} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Refresh Config
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Current Configuration:</h2>
        {config ? (
          <pre style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        ) : (
          <p>Loading configuration...</p>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Widget Embed Code:</h2>
        <pre style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {`<script src="${widgetUrl}"></script>`}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Test Embed (iframe):</h2>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px' }}>
          <div dangerouslySetInnerHTML={{ __html: `
            <iframe 
              srcdoc='
                <!DOCTYPE html>
                <html>
                <head><title>Widget Test</title></head>
                <body style="margin: 0; padding: 20px;">
                  <h1>Test Page</h1>
                  <p>The widget should appear on this page.</p>
                  <script src="${widgetUrl}"></script>
                </body>
                </html>
              '
              style="width: 100%; height: 600px; border: 1px solid #ccc;"
            ></iframe>
          ` }} />
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Direct Config API Test:</h2>
        <p>API URL: <code>/api/widget/config?key={productKey}</code></p>
        <a 
          href={`/api/widget/config?key=${productKey}`} 
          target="_blank" 
          style={{ color: '#0070f3', textDecoration: 'underline' }}
        >
          Open Config API in New Tab
        </a>
      </div>
    </div>
  );
}