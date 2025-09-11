'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function TestWidgetContent() {
  const searchParams = useSearchParams();
  const [productKey, setProductKey] = useState('');
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any>(null);

  useEffect(() => {
    const key = searchParams.get('key') || 'chat_9b3f7e8a2c5d1f0e'; // Harry's key as default
    setProductKey(key);
    
    // Fetch configuration
    fetch(`/api/widget/config?key=${key}`)
      .then(res => res.json())
      .then(data => setConfig(data.config))
      .catch(console.error);
    
    // Fetch knowledge
    fetch('/api/chatbot/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productKey: key })
    })
      .then(res => res.json())
      .then(data => setKnowledge(data))
      .catch(console.error);
  }, [searchParams]);

  const loadWidget = () => {
    // Remove existing widget if any
    const existingWidget = document.getElementById('intelagent-chat-widget');
    const existingScript = document.getElementById('widget-script');
    if (existingWidget) existingWidget.remove();
    if (existingScript) existingScript.remove();
    
    // Load the widget script
    const script = document.createElement('script');
    script.id = 'widget-script';
    script.src = '/chatbot-widget-v3.js';
    script.setAttribute('data-product-key', productKey);
    script.onload = () => setWidgetLoaded(true);
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'rgb(41, 46, 46)', color: 'rgb(229, 227, 220)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Widget Test Page</h1>
        
        {/* Product Key Input */}
        <div className="mb-8 p-6 rounded-lg border" style={{ 
          backgroundColor: 'rgba(58, 64, 64, 0.5)', 
          borderColor: 'rgba(169, 189, 203, 0.15)' 
        }}>
          <label className="block text-sm font-medium mb-2">Product Key</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={productKey}
              onChange={(e) => setProductKey(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(48, 54, 54, 0.7)', 
                color: 'rgb(229, 227, 220)',
                border: '1px solid rgba(169, 189, 203, 0.2)'
              }}
            />
            <button
              onClick={loadWidget}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#0070f3',
                color: 'white'
              }}
            >
              Load Widget
            </button>
          </div>
          
          {/* Quick Select Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setProductKey('chat_9b3f7e8a2c5d1f0e')}
              className="px-4 py-1 text-sm rounded"
              style={{ 
                backgroundColor: 'rgba(48, 54, 54, 0.7)',
                border: '1px solid rgba(169, 189, 203, 0.2)'
              }}
            >
              Harry's Key
            </button>
            <button
              onClick={() => setProductKey('chat_1d37512c82d10c04')}
              className="px-4 py-1 text-sm rounded"
              style={{ 
                backgroundColor: 'rgba(48, 54, 54, 0.7)',
                border: '1px solid rgba(169, 189, 203, 0.2)'
              }}
            >
              James's Key
            </button>
          </div>
        </div>

        {/* Configuration Display */}
        <div className="mb-8 p-6 rounded-lg border" style={{ 
          backgroundColor: 'rgba(58, 64, 64, 0.5)', 
          borderColor: 'rgba(169, 189, 203, 0.15)' 
        }}>
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          {config ? (
            <pre className="p-4 rounded overflow-auto text-sm" style={{ 
              backgroundColor: 'rgba(48, 54, 54, 0.7)',
              color: '#0ff' // cyan for visibility
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">Loading configuration...</p>
          )}
        </div>

        {/* Knowledge Display */}
        <div className="mb-8 p-6 rounded-lg border" style={{ 
          backgroundColor: 'rgba(58, 64, 64, 0.5)', 
          borderColor: 'rgba(169, 189, 203, 0.15)' 
        }}>
          <h2 className="text-xl font-semibold mb-4">Custom Knowledge</h2>
          {knowledge ? (
            <div>
              <p className="mb-2">Has Knowledge: {knowledge.hasKnowledge ? 'Yes' : 'No'}</p>
              <p className="mb-2">Knowledge Count: {knowledge.knowledgeCount || 0}</p>
              {knowledge.knowledge && (
                <pre className="p-4 rounded overflow-auto text-sm mt-4" style={{ 
                  backgroundColor: 'rgba(48, 54, 54, 0.7)',
                  color: '#0f0' // green for visibility
                }}>
                  {knowledge.knowledge}
                </pre>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Loading knowledge...</p>
          )}
        </div>

        {/* Widget Status */}
        <div className="mb-8 p-6 rounded-lg border" style={{ 
          backgroundColor: 'rgba(58, 64, 64, 0.5)', 
          borderColor: 'rgba(169, 189, 203, 0.15)' 
        }}>
          <h2 className="text-xl font-semibold mb-4">Widget Status</h2>
          <p className={widgetLoaded ? 'text-green-400' : 'text-yellow-400'}>
            {widgetLoaded ? '✓ Widget Loaded' : '⚠ Widget Not Loaded - Click "Load Widget" above'}
          </p>
          {widgetLoaded && (
            <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(48, 54, 54, 0.7)' }}>
              <p className="text-sm">The chat widget should appear in the bottom-right corner.</p>
              <p className="text-sm mt-2">Open browser console to see debug messages.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-6 rounded-lg border" style={{ 
          backgroundColor: 'rgba(58, 64, 64, 0.5)', 
          borderColor: 'rgba(169, 189, 203, 0.15)' 
        }}>
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enter a product key or select a preset</li>
            <li>Click "Load Widget" to initialize the chatbot</li>
            <li>Check the configuration and knowledge displayed above</li>
            <li>Click the chat button in the bottom-right corner</li>
            <li>Send a message and verify custom knowledge is being used</li>
            <li>Open browser console (F12) to see debug logs</li>
            <li>Go to the dashboard and change settings</li>
            <li>Wait 30 seconds for settings to auto-update (or reload widget)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense
function LoadingTestWidget() {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center" style={{ backgroundColor: 'rgb(41, 46, 46)', color: 'rgb(229, 227, 220)' }}>
      <div className="text-center">
        <div className="text-2xl mb-4">Loading Widget Test...</div>
        <div className="text-sm opacity-60">Initializing test environment</div>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function TestWidgetPage() {
  return (
    <Suspense fallback={<LoadingTestWidget />}>
      <TestWidgetContent />
    </Suspense>
  );
}