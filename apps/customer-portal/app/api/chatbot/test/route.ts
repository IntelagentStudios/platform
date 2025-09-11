import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'PK-INTL-AGNT-BOSS-MODE';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatbot Widget Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
      padding: 40px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 20px; }
    h3 { color: #555; margin-top: 30px; }
    .info-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .code-block {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 4px;
      overflow: auto;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .feature-list {
      line-height: 1.8;
      color: #666;
    }
    .reload-btn {
      background: #0070f3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    .reload-btn:hover {
      background: #0051cc;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      margin-left: 10px;
    }
    .status.loaded {
      background: #d4edda;
      color: #155724;
    }
    .status.loading {
      background: #fff3cd;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Chatbot Widget Test Page</h1>
    
    <div class="info-box">
      <p><strong>Product Key:</strong> ${productKey} <span id="status" class="status loading">Loading...</span></p>
      <p><strong>Endpoint:</strong> Dynamic (Real-time configuration)</p>
    </div>

    <h3>How to embed this widget:</h3>
    <div class="code-block">
&lt;!-- Option 1: Static Widget --&gt;
&lt;script 
  src="https://dashboard.intelagentstudios.com/chatbot-widget-v3.js"
  data-product-key="${productKey}"&gt;
&lt;/script&gt;

&lt;!-- Option 2: Dynamic Widget (Recommended) --&gt;
&lt;script 
  src="https://dashboard.intelagentstudios.com/api/widget/script?key=${productKey}"&gt;
&lt;/script&gt;
    </div>

    <h3>Widget Features:</h3>
    <ul class="feature-list">
      <li>✨ Real-time configuration updates from dashboard</li>
      <li>🎨 Customizable colors and position</li>
      <li>💬 Custom welcome messages</li>
      <li>🧠 AI-powered responses with custom knowledge base</li>
      <li>📱 Mobile-responsive design</li>
      <li>🔔 Optional notification sounds</li>
      <li>📧 Optional email collection</li>
    </ul>

    <h3>Configuration Instructions:</h3>
    <ol class="feature-list">
      <li>Go to <strong>Settings → Chatbot Widget</strong> to customize appearance</li>
      <li>Go to <strong>Settings → Knowledge Base</strong> to add custom knowledge</li>
      <li>Changes are applied automatically (refresh may be needed)</li>
      <li>The dynamic widget endpoint includes configuration in the script</li>
    </ol>

    <button class="reload-btn" onclick="reloadWidget()">Reload Widget</button>
  </div>

  <script>
    function reloadWidget() {
      // Remove existing widget
      const existing = document.getElementById('intelagent-chat-widget');
      if (existing) existing.remove();
      
      // Remove existing script
      const existingScript = document.getElementById('widget-script');
      if (existingScript) existingScript.remove();
      
      // Update status
      document.getElementById('status').className = 'status loading';
      document.getElementById('status').textContent = 'Loading...';
      
      // Add new script
      const script = document.createElement('script');
      script.id = 'widget-script';
      script.src = '/api/widget/script?key=${productKey}';
      script.onload = () => {
        document.getElementById('status').className = 'status loaded';
        document.getElementById('status').textContent = '✅ Loaded';
        console.log('Widget loaded successfully');
      };
      script.onerror = () => {
        document.getElementById('status').className = 'status loading';
        document.getElementById('status').textContent = '❌ Error';
        console.error('Failed to load widget');
      };
      document.body.appendChild(script);
    }
    
    // Load widget on page load
    window.addEventListener('DOMContentLoaded', reloadWidget);
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}