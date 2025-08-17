import { NextRequest, NextResponse } from 'next/server'
import { usageTracker } from '@/lib/usage-tracker'
import { UsageMetric } from '@/types/usage'
import { getAuthFromCookies } from '@/lib/auth'

export async function trackApiUsage(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now()
  const auth = await getAuthFromCookies()
  
  try {
    const response = await handler()
    
    if (auth?.licenseKey) {
      const organizationId = await getOrganizationId(auth.licenseKey)
      
      if (organizationId) {
        // Track API call
        await usageTracker.track({
          organizationId,
          licenseKey: auth.licenseKey,
          metric: UsageMetric.API_CALLS,
          value: 1
        })
        
        // Track compute time
        const computeTime = Date.now() - startTime
        await usageTracker.track({
          organizationId,
          licenseKey: auth.licenseKey,
          metric: UsageMetric.COMPUTE,
          value: Math.ceil(computeTime / 1000)
        })
        
        // Track bandwidth (response size)
        const responseSize = estimateResponseSize(response)
        await usageTracker.track({
          organizationId,
          licenseKey: auth.licenseKey,
          metric: UsageMetric.BANDWIDTH,
          value: responseSize
        })
      }
    }
    
    return response
  } catch (error) {
    if (auth?.licenseKey) {
      const organizationId = await getOrganizationId(auth.licenseKey)
      if (organizationId) {
        await usageTracker.track({
          organizationId,
          licenseKey: auth.licenseKey,
          metric: UsageMetric.API_CALLS,
          value: 1
        })
      }
    }
    throw error
  }
}

async function getOrganizationId(licenseKey: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const license = await prisma.license.findUnique({
    where: { licenseKey },
    select: { organizationId: true }
  })
  return license?.organizationId || null
}

function estimateResponseSize(response: NextResponse): number {
  try {
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      return parseInt(contentLength)
    }
    
    // Estimate based on response body
    const clonedResponse = response.clone()
    const reader = clonedResponse.body?.getReader()
    if (!reader) return 0
    
    let size = 0
    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value?.length || 0
      }
    }
    
    processStream().catch(() => {})
    return size
  } catch {
    return 1024 // Default 1KB
  }
}