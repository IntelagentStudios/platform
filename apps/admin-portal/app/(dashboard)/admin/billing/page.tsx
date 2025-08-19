'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

export default function BillingManagementPage() {
  const [products] = useState([
    { id: 1, name: 'Basic Plan', price: 29, interval: 'month', active: true, subscribers: 0 },
    { id: 2, name: 'Pro Plan', price: 99, interval: 'month', active: true, subscribers: 0 },
    { id: 3, name: 'Enterprise', price: 299, interval: 'month', active: true, subscribers: 0 }
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage products, pricing, and customer billing
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 inline mr-2" />
          Add Product
        </button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 inline text-primary" /> +0% from last month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">0 new this month</p>
              </div>
              <Users className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Revenue</p>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-muted-foreground mt-1">Per customer</p>
              </div>
              <CreditCard className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products & Pricing */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products & Pricing</CardTitle>
              <CardDescription>Manage your subscription plans and pricing</CardDescription>
            </div>
            <button className="text-sm text-primary hover:underline">
              <Settings className="h-4 w-4 inline mr-1" />
              Configure Stripe
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-primary' : 'bg-muted'}`} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price}/{product.interval} • {product.subscribers} subscribers
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-accent/10 rounded-md transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-destructive/10 rounded-md transition-colors">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                  <button className={`px-3 py-1 rounded-md text-sm ${
                    product.active 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Transactions will appear here once customers subscribe</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Create Product</p>
                <p className="text-sm text-muted-foreground">Add new subscription plan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Issue Refund</p>
                <p className="text-sm text-muted-foreground">Process customer refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Payment Settings</p>
                <p className="text-sm text-muted-foreground">Configure payment methods</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}