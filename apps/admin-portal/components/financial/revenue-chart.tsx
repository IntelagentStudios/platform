'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RevenueChart() {
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