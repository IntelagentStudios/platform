'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InvoicesListProps {
  data?: any
}

export function InvoicesList({ data }: InvoicesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          {data?.length > 0 ? `${data.length} invoices` : 'No invoices to display'}
        </div>
      </CardContent>
    </Card>
  )
}