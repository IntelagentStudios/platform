import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth || !auth.isMaster) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'
    const organizationId = searchParams.get('organizationId')

    // Date ranges
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get all organizations or specific one
    const orgWhere = organizationId ? { id: organizationId } : {}

    // Calculate MRR/ARR
    const activeSubscriptions = await prisma.organization.findMany({
      where: {
        ...orgWhere,
        subscriptionStatus: 'active',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mrr: true,
        subscriptionTier: true,
        createdAt: true
      }
    })

    const mrr = activeSubscriptions.reduce((sum, org) => sum + Number(org.mrr), 0)
    const arr = mrr * 12

    // Calculate revenue by tier
    const revenueByTier = await prisma.organization.groupBy({
      by: ['subscriptionTier'],
      where: {
        ...orgWhere,
        subscriptionStatus: 'active',
        deletedAt: null
      },
      _sum: {
        mrr: true
      },
      _count: true
    })

    // Get new customers this period
    const newCustomers = await prisma.organization.count({
      where: {
        ...orgWhere,
        createdAt: { gte: startDate },
        deletedAt: null
      }
    })

    // Get churned customers this period
    const churnedCustomers = await prisma.organization.count({
      where: {
        ...orgWhere,
        subscriptionStatus: 'canceled',
        updatedAt: { gte: startDate }
      }
    })

    // Calculate churn rate
    const totalCustomers = await prisma.organization.count({
      where: {
        ...orgWhere,
        deletedAt: null
      }
    })
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0

    // Get payment metrics
    const [successfulPayments, failedPayments] = await Promise.all([
      prisma.transaction.count({
        where: {
          type: 'payment',
          status: 'success',
          createdAt: { gte: startDate }
        }
      }),
      prisma.transaction.count({
        where: {
          type: 'payment',
          status: 'failed',
          createdAt: { gte: startDate }
        }
      })
    ])

    // Calculate LTV (simplified: average revenue per customer * average customer lifetime)
    const avgCustomerLifetime = 24 // months (assumed)
    const arpu = totalCustomers > 0 ? mrr / totalCustomers : 0
    const ltv = arpu * avgCustomerLifetime

    // Get cost data
    const costs = await prisma.costTracking.aggregate({
      where: {
        date: { gte: startDate }
      },
      _sum: {
        computeCost: true,
        storageCost: true,
        bandwidthCost: true,
        databaseCost: true,
        emailCost: true,
        smsCost: true,
        aiApiCost: true,
        thirdPartyCost: true,
        totalCost: true
      }
    })

    const totalCosts = Number(costs._sum.totalCost || 0)
    const grossProfit = mrr - totalCosts
    const grossMargin = mrr > 0 ? (grossProfit / mrr) * 100 : 0

    // Calculate growth rate
    const previousMonthStart = new Date(startDate)
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
    
    const previousMRR = await prisma.organization.aggregate({
      where: {
        ...orgWhere,
        subscriptionStatus: 'active',
        createdAt: { lte: previousMonthStart }
      },
      _sum: {
        mrr: true
      }
    })

    const previousMRRValue = Number(previousMRR._sum.mrr || 0)
    const growthRate = previousMRRValue > 0 
      ? ((mrr - previousMRRValue) / previousMRRValue) * 100 
      : 0

    // Calculate runway (months of cash left at current burn rate)
    const bankBalance = 100000 // This would come from actual bank integration
    const burnRate = totalCosts - mrr
    const runway = burnRate > 0 ? Math.floor(bankBalance / burnRate) : 999

    // Revenue trends (last 12 months)
    const revenueTrends = await getRevenueTrends()

    const metrics = {
      overview: {
        mrr,
        arr,
        ltv,
        arpu,
        churnRate,
        growthRate,
        grossMargin,
        runway,
        burnRate: Math.max(0, burnRate)
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        churned: churnedCustomers,
        active: totalCustomers - churnedCustomers
      },
      revenue: {
        byTier: revenueByTier.map(tier => ({
          tier: tier.subscriptionTier,
          mrr: Number(tier._sum.mrr || 0),
          customers: tier._count
        })),
        trends: revenueTrends
      },
      costs: {
        infrastructure: {
          compute: Number(costs._sum.computeCost || 0),
          storage: Number(costs._sum.storageCost || 0),
          bandwidth: Number(costs._sum.bandwidthCost || 0),
          database: Number(costs._sum.databaseCost || 0)
        },
        services: {
          email: Number(costs._sum.emailCost || 0),
          sms: Number(costs._sum.smsCost || 0),
          ai: Number(costs._sum.aiApiCost || 0),
          thirdParty: Number(costs._sum.thirdPartyCost || 0)
        },
        total: totalCosts
      },
      payments: {
        successful: successfulPayments,
        failed: failedPayments,
        successRate: (successfulPayments + failedPayments) > 0 
          ? (successfulPayments / (successfulPayments + failedPayments)) * 100 
          : 100
      },
      period: {
        start: startDate,
        end: now,
        label: period
      }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    )
  }
}

async function getRevenueTrends() {
  const trends = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthlyRevenue = await prisma.organization.aggregate({
      where: {
        subscriptionStatus: 'active',
        createdAt: { lte: monthEnd },
        deletedAt: null
      },
      _sum: {
        mrr: true
      }
    })
    
    trends.push({
      month: monthStart.toISOString().substring(0, 7),
      mrr: Number(monthlyRevenue._sum.mrr || 0)
    })
  }
  
  return trends
}