'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CostBreakdownProps {
  data?: any
}

export function CostBreakdown({ data }: CostBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Cost breakdown visualization coming soon
        </div>
      </CardContent>
    </Card>
  )
}