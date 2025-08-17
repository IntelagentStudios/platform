'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CustomerMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Customers</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Customers</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Churn Rate</span>
            <span className="font-medium">0%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}