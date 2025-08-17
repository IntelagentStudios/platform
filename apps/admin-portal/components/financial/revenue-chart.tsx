'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueChartProps {
  data?: any
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Revenue chart visualization coming soon
        </div>
      </CardContent>
    </Card>
  )
}