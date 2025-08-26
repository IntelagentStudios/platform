'use client';

import { useState, useEffect } from 'react';

export default function TestConfigurePage() {
  const [status, setStatus] = useState<'loading' | 'not_configured' | 'configured'>('loading');
  const [productKey, setProductKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check current configuration
  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const res = await fetch('/api/products/chatbot/configure');
      const data = await res.json();
      
      if (data.configured) {
        setStatus('configured');
        setProductKey(data.product_key);
      } else {
        setStatus('not_configured');
      }
    } catch (err) {
      setError('Failed to check configuration');
      setStatus('not_configured');
    }
  };

  const configureChatbot = async () => {
    try {
      const res = await fetch('/api/products/chatbot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: window.location.hostname,
          webhook_url: 'https://n8n.example.com/webhook/chatbot',
          settings: {
            welcome_message: 'Hello! How can I help you today?',
            primary_color: '#3B82F6'
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProductKey(data.product_key);
        setStatus('configured');
        alert(`Success! Your new product key is: ${data.product_key}`);
      } else {
        setError(data.error || 'Configuration failed');
      }
    } catch (err) {
      setError('Failed to configure chatbot');
    }
  };

  const resetConfiguration = async () => {
    if (!confirm('Are you sure you want to reset your chatbot configuration?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/products/chatbot/configure', {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProductKey(null);
        setStatus('not_configured');
        alert('Configuration reset successfully');
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Failed to reset configuration');
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(48,54,54)] text-[rgb(229,227,220)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Product Key Configuration</h1>
        
        <div className="bg-[rgba(58,64,64,0.8)] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          
          {status === 'loading' && (
            <p>Checking configuration...</p>
          )}
          
          {status === 'configured' && (
            <div>
              <p className="text-green-400 mb-2">✅ Chatbot Configured</p>
              <p className="font-mono bg-black/30 p-3 rounded">
                Product Key: {productKey}
              </p>
              {productKey && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Key Format Analysis:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Prefix: {productKey.split('_')[0]}</li>
                    <li>• Type: {productKey.startsWith('chat_') ? 'New Product Key Format' : 'Legacy Site Key'}</li>
                    <li>• Product: Chatbot</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {status === 'not_configured' && (
            <p className="text-yellow-400">⚠️ Chatbot not configured</p>
          )}
          
          {error && (
            <p className="text-red-400 mt-2">Error: {error}</p>
          )}
        </div>

        <div className="bg-[rgba(58,64,64,0.8)] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="space-y-4">
            {status === 'not_configured' && (
              <button
                onClick={configureChatbot}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Configure Chatbot (Generate New Key)
              </button>
            )}
            
            {status === 'configured' && (
              <>
                <button
                  onClick={checkConfiguration}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors mr-4"
                >
                  Refresh Status
                </button>
                
                <button
                  onClick={resetConfiguration}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Reset Configuration
                </button>
              </>
            )}
          </div>
          
          {status === 'configured' && productKey && (
            <div className="mt-6 p-4 bg-black/30 rounded">
              <p className="text-sm font-semibold mb-2">Embed Code:</p>
              <pre className="text-xs overflow-x-auto">
{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://dashboard.intelagentstudios.com/chatbot.js';
    script.setAttribute('data-product-key', '${productKey}');
    document.head.appendChild(script);
  })();
</script>`}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-[rgba(58,64,64,0.5)] rounded-lg text-sm text-gray-400">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Log in as friend@testbusiness.com (INTL-8K3M-QB7X-2024)</li>
            <li>Click "Configure Chatbot" to generate a new product key</li>
            <li>The key will have format: chat_[16 random chars]</li>
            <li>This key will be stored in the product_keys table</li>
            <li>The chatbot will use this key for all API calls</li>
          </ol>
        </div>
      </div>
    </div>
  );
}