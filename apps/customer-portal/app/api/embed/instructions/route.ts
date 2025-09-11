import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'YOUR_PRODUCT_KEY';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatbot Widget - Embed Instructions</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 48px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1a202c;
      margin-bottom: 8px;
      font-size: 32px;
    }
    .subtitle {
      color: #718096;
      margin-bottom: 32px;
      font-size: 16px;
    }
    .product-key-badge {
      display: inline-block;
      background: #edf2f7;
      color: #2d3748;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .embed-section {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .embed-title {
      color: #2d3748;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .code-block {
      background: #1a202c;
      color: #68d391;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #4a5568;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }
    .copy-btn:hover {
      background: #2d3748;
    }
    .copy-btn.copied {
      background: #48bb78;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .feature-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .feature-title {
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .feature-desc {
      color: #718096;
      font-size: 14px;
    }
    .info-box {
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .info-box-title {
      color: #2c5282;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .info-box-text {
      color: #2a4e7c;
      font-size: 14px;
      line-height: 1.6;
    }
    .steps-list {
      counter-reset: steps;
      margin-bottom: 32px;
    }
    .step {
      counter-increment: steps;
      position: relative;
      padding-left: 40px;
      margin-bottom: 16px;
      color: #4a5568;
      line-height: 1.6;
    }
    .step::before {
      content: counter(steps);
      position: absolute;
      left: 0;
      top: 0;
      background: #667eea;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    @media (max-width: 640px) {
      .container {
        padding: 32px 24px;
      }
      h1 {
        font-size: 24px;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Intelagent Chatbot Widget</h1>
    <p class="subtitle">Embed an intelligent AI chatbot on your website in seconds</p>
    
    <div class="product-key-badge">Product Key: ${productKey}</div>
    
    <div class="info-box">
      <div class="info-box-title">⚡ Quick Start</div>
      <div class="info-box-text">
        Copy the code below and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
        The widget will automatically load with your custom configuration and knowledge base.
      </div>
    </div>
    
    <div class="embed-section">
      <div class="embed-title">📋 Embed Code</div>
      <div class="code-block">
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
        <code id="embedCode">&lt;script src="https://dashboard.intelagentstudios.com/api/widget/dynamic?key=${productKey}"&gt;&lt;/script&gt;</code>
      </div>
    </div>
    
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <div class="feature-title">Custom Styling</div>
        <div class="feature-desc">Matches your brand with customizable colors and positioning</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <div class="feature-title">AI-Powered</div>
        <div class="feature-desc">Intelligent responses using your custom knowledge base</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">Real-time Updates</div>
        <div class="feature-desc">Configuration changes apply instantly without code changes</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <div class="feature-title">Mobile Ready</div>
        <div class="feature-desc">Responsive design that works perfectly on all devices</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <div class="feature-title">Secure</div>
        <div class="feature-desc">Product key authentication ensures only you can modify settings</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🌐</div>
        <div class="feature-title">Multi-site Support</div>
        <div class="feature-desc">Use the same widget across multiple websites</div>
      </div>
    </div>
    
    <div class="embed-section">
      <div class="embed-title">🔧 Configuration Steps</div>
      <div class="steps-list">
        <div class="step">Navigate to <strong>Settings → Chatbot Widget</strong> to customize appearance</div>
        <div class="step">Go to <strong>Settings → Knowledge Base</strong> to add your content</div>
        <div class="step">Copy the embed code above and add it to your website</div>
        <div class="step">The widget will appear in the bottom-right corner (or left, based on settings)</div>
        <div class="step">Test the chatbot to ensure it's using your custom knowledge</div>
      </div>
    </div>
    
    <div class="info-box" style="background: #f0fdf4; border-color: #86efac;">
      <div class="info-box-title" style="color: #166534;">✅ What's Included</div>
      <div class="info-box-text" style="color: #14532d;">
        Each product key includes its own configuration, knowledge base, styling preferences, 
        response style, and analytics tracking. Changes made in the dashboard apply immediately 
        to all websites using this product key.
      </div>
    </div>
    
    <div class="embed-section">
      <div class="embed-title">💡 Advanced Options</div>
      <div class="code-block">
        <button class="copy-btn" onclick="copyAdvanced(this)">Copy</button>
        <code id="advancedCode">&lt;!-- Test locally during development --&gt;
&lt;script src="http://localhost:3000/api/widget/dynamic?key=${productKey}"&gt;&lt;/script&gt;

&lt;!-- Production deployment --&gt;
&lt;script src="https://dashboard.intelagentstudios.com/api/widget/dynamic?key=${productKey}"&gt;&lt;/script&gt;

&lt;!-- With custom domain (CNAME required) --&gt;
&lt;script src="https://chat.yourdomain.com/api/widget/dynamic?key=${productKey}"&gt;&lt;/script&gt;</code>
      </div>
    </div>
  </div>
  
  <script>
    function copyCode(btn) {
      const code = document.getElementById('embedCode').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }
    
    function copyAdvanced(btn) {
      const code = document.getElementById('advancedCode').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }
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