'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function InvoicesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          No invoices to display
        </div>
      </CardContent>
    </Card>
  )
}