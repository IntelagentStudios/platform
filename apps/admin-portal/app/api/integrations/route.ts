import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { redis } from '@/lib/redis'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get API keys for this license
    const apiKeysKey = `apikeys:${auth.licenseKey}`
    const cachedKeys = await redis.get(apiKeysKey)
    
    const apiKeys = cachedKeys ? JSON.parse(cachedKeys) : [
      {
        id: 'key_1',
        name: 'Production API Key',
        key: 'intl_live_' + crypto.randomBytes(16).toString('hex'),
        created: new Date('2024-01-15').toISOString(),
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        permissions: ['read', 'write'],
        status: 'active'
      },
      {
        id: 'key_2',
        name: 'Development API Key',
        key: 'intl_test_' + crypto.randomBytes(16).toString('hex'),
        created: new Date('2024-02-01').toISOString(),
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
        permissions: ['read'],
        status: 'active'
      }
    ]

    // Get webhooks
    const webhooksKey = `webhooks:${auth.licenseKey}`
    const cachedWebhooks = await redis.get(webhooksKey)
    
    const webhooks = cachedWebhooks ? JSON.parse(cachedWebhooks) : [
      {
        id: 'webhook_1',
        url: 'https://example.com/webhook',
        events: ['payment.succeeded', 'customer.created'],
        status: 'active',
        created: new Date('2024-01-20').toISOString(),
        lastTriggered: new Date(Date.now() - 7200000).toISOString(),
        successRate: 98.5
      }
    ]

    // Available integrations
    const integrations = [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Accept payments and manage subscriptions',
        category: 'payments',
        icon: '💳',
        status: 'connected',
        features: ['Payments', 'Subscriptions', 'Invoicing'],
        popularityScore: 95
      },
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect with 5000+ apps and automate workflows',
        category: 'automation',
        icon: '⚡',
        status: 'available',
        features: ['Automation', 'Workflows', 'Triggers'],
        popularityScore: 92
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Get notifications and alerts in Slack',
        category: 'communication',
        icon: '💬',
        status: 'connected',
        features: ['Notifications', 'Alerts', 'Commands'],
        popularityScore: 88
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Sync customer data with Salesforce CRM',
        category: 'crm',
        icon: '☁️',
        status: 'available',
        features: ['Contact Sync', 'Lead Management', 'Opportunities'],
        popularityScore: 85
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Marketing automation and CRM integration',
        category: 'marketing',
        icon: '🎯',
        status: 'available',
        features: ['Marketing', 'CRM', 'Analytics'],
        popularityScore: 82
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        description: 'Track and analyze user behavior',
        category: 'analytics',
        icon: '📊',
        status: 'connected',
        features: ['Analytics', 'Tracking', 'Reports'],
        popularityScore: 90
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Collaborate with Teams integration',
        category: 'communication',
        icon: '👥',
        status: 'available',
        features: ['Chat', 'Meetings', 'Collaboration'],
        popularityScore: 75
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Integrate with GitHub repositories',
        category: 'development',
        icon: '🐙',
        status: 'available',
        features: ['Issues', 'Pull Requests', 'Webhooks'],
        popularityScore: 87
      },
      {
        id: 'twilio',
        name: 'Twilio',
        description: 'SMS and voice communication',
        category: 'communication',
        icon: '📱',
        status: 'available',
        features: ['SMS', 'Voice', 'WhatsApp'],
        popularityScore: 78
      },
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        description: 'Email marketing and automation',
        category: 'marketing',
        icon: '📧',
        status: 'available',
        features: ['Email', 'Automation', 'Campaigns'],
        popularityScore: 80
      }
    ]

    return NextResponse.json({
      apiKeys,
      webhooks,
      integrations,
      stats: {
        totalIntegrations: integrations.length,
        connectedIntegrations: integrations.filter((i: any) => i.status === 'connected').length,
        activeApiKeys: apiKeys.filter((k: any) => k.status === 'active').length,
        activeWebhooks: webhooks.filter((w: any) => w.status === 'active').length
      }
    })
  } catch (error) {
    console.error('Integrations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, data } = body

    if (type === 'api_key') {
      // Generate new API key
      const newKey = {
        id: 'key_' + Date.now(),
        name: data.name || 'New API Key',
        key: `intl_${data.environment}_` + crypto.randomBytes(24).toString('hex'),
        created: new Date().toISOString(),
        lastUsed: null,
        permissions: data.permissions || ['read'],
        status: 'active'
      }

      // Store in Redis (in production, store in database)
      const apiKeysKey = `apikeys:${auth.licenseKey}`
      const existing = await redis.get(apiKeysKey)
      const keys = existing ? JSON.parse(existing) : []
      keys.push(newKey)
      await redis.setex(apiKeysKey, 86400, JSON.stringify(keys))

      return NextResponse.json({
        success: true,
        apiKey: newKey
      })
    } else if (type === 'webhook') {
      // Create new webhook
      const newWebhook = {
        id: 'webhook_' + Date.now(),
        url: data.url,
        events: data.events || [],
        status: 'active',
        created: new Date().toISOString(),
        lastTriggered: null,
        successRate: 100
      }

      // Store in Redis (in production, store in database)
      const webhooksKey = `webhooks:${auth.licenseKey}`
      const existing = await redis.get(webhooksKey)
      const webhooks = existing ? JSON.parse(existing) : []
      webhooks.push(newWebhook)
      await redis.setex(webhooksKey, 86400, JSON.stringify(webhooks))

      return NextResponse.json({
        success: true,
        webhook: newWebhook
      })
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Integration create error:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}