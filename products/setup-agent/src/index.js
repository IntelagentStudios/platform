import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// In-memory session storage (use Redis in production)
const sessions = new Map();

// Configuration for different products
const productConfigs = {
  chatbot: {
    steps: ['domain', 'confirmDomain', 'licenseKey', 'validateLicense', 'generateSiteKey'],
    webhookUrl: process.env.CHATBOT_WEBHOOK_URL || 'https://intelagentchatbotn8n.up.railway.app/webhook/setup-agent'
  },
  sales: {
    steps: ['companyName', 'industry', 'targetAudience', 'campaignGoals', 'confirmation'],
    webhookUrl: process.env.SALES_WEBHOOK_URL || 'https://intelagentsalesn8n.up.railway.app/webhook/setup'
  },
  default: {
    steps: ['collectInfo', 'validate', 'complete'],
    webhookUrl: process.env.DEFAULT_WEBHOOK_URL
  }
};

// Create a new setup session
app.post('/api/setup/session', (req, res) => {
  const { product = 'default', userId, metadata } = req.body;
  
  const sessionId = uuidv4();
  const config = productConfigs[product] || productConfigs.default;
  
  const session = {
    sessionId,
    product,
    userId,
    metadata,
    currentStep: 0,
    steps: config.steps,
    data: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  sessions.set(sessionId, session);
  
  res.json({
    sessionId,
    product,
    currentStep: config.steps[0],
    totalSteps: config.steps.length
  });
});

// Get session status
app.get('/api/setup/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.sessionId,
    product: session.product,
    currentStep: session.steps[session.currentStep],
    stepNumber: session.currentStep + 1,
    totalSteps: session.steps.length,
    completed: session.currentStep >= session.steps.length,
    data: session.data
  });
});

// Process a step in the setup
app.post('/api/setup/session/:id/step', async (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const { data, action } = req.body;
  const config = productConfigs[session.product] || productConfigs.default;
  
  // Store step data
  const currentStepName = session.steps[session.currentStep];
  session.data[currentStepName] = data;
  session.updatedAt = new Date();
  
  // If product has a webhook, forward the data
  if (config.webhookUrl) {
    try {
      const webhookResponse = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          step: currentStepName,
          data: session.data,
          action
        })
      });
      
      if (!webhookResponse.ok) {
        console.error('Webhook failed:', webhookResponse.statusText);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }
  
  // Move to next step
  if (action === 'next' && session.currentStep < session.steps.length - 1) {
    session.currentStep++;
  } else if (action === 'back' && session.currentStep > 0) {
    session.currentStep--;
  }
  
  // Check if completed
  const completed = session.currentStep >= session.steps.length - 1 && action === 'complete';
  
  if (completed) {
    session.completedAt = new Date();
  }
  
  sessions.set(req.params.id, session);
  
  res.json({
    sessionId: session.sessionId,
    currentStep: session.steps[session.currentStep],
    stepNumber: session.currentStep + 1,
    totalSteps: session.steps.length,
    completed,
    nextStep: session.currentStep < session.steps.length - 1 ? session.steps[session.currentStep + 1] : null,
    data: session.data
  });
});

// Complete a session
app.post('/api/setup/session/:id/complete', async (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.completedAt = new Date();
  session.status = 'completed';
  
  // Final webhook call if configured
  const config = productConfigs[session.product] || productConfigs.default;
  if (config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'complete',
          data: session.data,
          completedAt: session.completedAt
        })
      });
    } catch (error) {
      console.error('Final webhook error:', error);
    }
  }
  
  sessions.set(req.params.id, session);
  
  res.json({
    sessionId: session.sessionId,
    product: session.product,
    status: 'completed',
    data: session.data,
    completedAt: session.completedAt
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    activeSessions: sessions.size,
    products: Object.keys(productConfigs)
  });
});

const PORT = process.env.SETUP_AGENT_PORT || 3007;
app.listen(PORT, () => {
  console.log(`Setup Agent running on port ${PORT}`);
  console.log(`Active products: ${Object.keys(productConfigs).join(', ')}`);
});