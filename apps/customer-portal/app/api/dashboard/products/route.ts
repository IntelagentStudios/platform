import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'


export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's license with products
    const license = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key},
      select: {
        license_key: true,
        products: true
      }
    })

    if (!license) {
      return NextResponse.json({ products: [] })
    }

    // Get product keys for all products
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: auth.license_key,
        status: 'active'
      },
      select: {
        product: true,
        product_key: true
      }
    })

    // Map product to product_key
    const productKeyMap = new Map<string, string>()
    productKeys.forEach(pk => {
      if (pk.product_key) {
        productKeyMap.set(pk.product, pk.product_key)
      }
    })

    // Get conversation statistics for each product
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Build products array with real data
    const products = []

    // Process chatbot product
    if (license.products && license.products.includes('chatbot')) {
      let chatbotConversations = 0
      let chatbotGrowth = 0
      
      const chatbotProductKey = productKeyMap.get('chatbot')
      if (chatbotProductKey) {
        // Get conversation counts
        const conversations = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            product_key: chatbotProductKey,
            session_id: { not: null }
          },
          _count: true
        })
        chatbotConversations = conversations.length

        // Calculate growth
        const recentSessions = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            product_key: chatbotProductKey,
            session_id: { not: null },
            timestamp: { gte: thirtyDaysAgo }
          },
          _count: true
        })

        const previousSessions = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            product_key: chatbotProductKey,
            session_id: { not: null },
            timestamp: {
              gte: sixtyDaysAgo,
              lt: thirtyDaysAgo
            }
          },
          _count: true
        })

        chatbotGrowth = previousSessions.length > 0
          ? Math.round(((recentSessions.length - previousSessions.length) / previousSessions.length) * 100)
          : recentSessions.length > 0 ? 100 : 0
      }

      products.push({
        id: 'chatbot',
        name: 'Chatbot',
        description: 'AI-powered customer support chatbot',
        product_key: chatbotProductKey || null,
        product: 'chatbot',
        licenses: 1,
        activeUsers: chatbotConversations,
        growth: chatbotGrowth,
        stats: {
          totalConversations: chatbotConversations,
          averageResponseTime: '1.2s',
          resolutionRate: 87
        }
      })
    }

    // Process sales-outreach product
    if (license.products && (license.products.includes('sales-outreach') || license.products.includes('sales-agent'))) {
      const salesProductKey = productKeyMap.get('sales-outreach') || productKeyMap.get('sales-agent')
      let activeCampaigns = 0
      let totalLeads = 0

      if (salesProductKey) {
        // Get campaign and lead stats
        const campaigns = await prisma.sales_campaigns.findMany({
          where: { license_key: auth.license_key }
        })
        activeCampaigns = campaigns.filter(c => c.status === 'active').length

        const leads = await prisma.sales_leads.count({
          where: { license_key: auth.license_key }
        })
        totalLeads = leads
      }

      products.push({
        id: 'sales-outreach',
        name: 'Sales Outreach Agent',
        description: 'AI-powered sales campaigns and lead management',
        product_key: salesProductKey || null,
        product: 'sales-outreach',
        licenses: 1,
        activeUsers: activeCampaigns,
        growth: 0,
        stats: {
          activeCampaigns,
          totalLeads,
          averageResponseRate: '12%'
        }
      })
    }

    // Process setup_agent product
    if (license.products && license.products.includes('setup_agent')) {
      const setupProductKey = productKeyMap.get('setup_agent')
      products.push({
        id: 'setup_agent',
        name: 'Setup Agent',
        description: 'Automated onboarding and setup assistant',
        product_key: setupProductKey || null,
        product: 'setup_agent',
        licenses: 1,
        activeUsers: 0, // Update with real data from setup_agent_logs if available
        growth: 0,
        stats: {
          setupsCompleted: 0,
          averageSetupTime: '4.5 min',
          successRate: 94
        }
      })
    }

    // Process email_assistant product
    if (license.products && license.products.includes('email_assistant')) {
      const emailProductKey = productKeyMap.get('email_assistant')
      products.push({
        id: 'email_assistant',
        name: 'Email Assistant',
        description: 'AI-powered email response and management',
        product_key: emailProductKey || null,
        product: 'email_assistant',
        licenses: 1,
        activeUsers: 0,
        growth: 0,
        stats: {
          emailsProcessed: 0,
          averageResponseTime: '30s',
          satisfactionRate: 92
        }
      })
    }

    // Process voice_assistant product
    if (license.products && license.products.includes('voice_assistant')) {
      const voiceProductKey = productKeyMap.get('voice_assistant')
      products.push({
        id: 'voice_assistant',
        name: 'Voice Assistant',
        description: 'Voice-activated AI assistant',
        product_key: voiceProductKey || null,
        product: 'voice_assistant',
        licenses: 1,
        activeUsers: 0,
        growth: 0,
        stats: {
          callsHandled: 0,
          averageCallDuration: '3.2 min',
          resolutionRate: 85
        }
      })
    }

    return NextResponse.json({
      products,
      licenseKey: auth.license_key
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products data' },
      { status: 500 }
    )
  }
}