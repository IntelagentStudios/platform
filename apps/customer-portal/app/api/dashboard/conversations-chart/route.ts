import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { dateRange } = await request.json()
    const fromDate = new Date(dateRange?.from || Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = new Date(dateRange?.to || Date.now())

    let whereClause: any = {
      timestamp: {
        gte: fromDate,
        lte: toDate,
      },
    }

    if (!auth.license_key) {
      // Get the user's site_key from their license_key
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: auth.license_key },
        select: { site_key: true }
      })
      
      if (userLicense?.site_key) {
        whereClause.site_key = userLicense?.site_key
      } else {
        // No site_key found, return empty data
        return NextResponse.json([])
      }
    }

    const conversations = await prisma.chatbot_logs.findMany({
      where: whereClause,
      select: {
        timestamp: true,
        session_id: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    const dailyData = new Map<string, Set<string>>()

    conversations.forEach(log => {
      if (log.timestamp && log.session_id) {
        const date = new Date(log.timestamp).toISOString().split('T')[0]
        if (!dailyData.has(date)) {
          dailyData.set(date, new Set())
        }
        dailyData.get(date)!.add(log.session_id)
      }
    })

    const chartData = Array.from(dailyData.entries()).map(([date, sessions]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      conversations: sessions.size,
    }))

    const currentDate = new Date(fromDate)
    const endDate = new Date(toDate)
    const completeData = []

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const existingData = chartData.find(d => 
        d.date === currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      )
      
      completeData.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        conversations: existingData?.conversations || 0,
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json(completeData)
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}