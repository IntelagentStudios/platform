'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Package, Settings, LogOut, CheckCircle, Users, Activity, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardV2Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // The middleware handles authentication
    // If we reach here, user is authenticated
    // Get user info from localStorage or hardcode for now
    const userData = {
      email: 'harry@intelagentstudios.com',
      name: 'Harry',
      license_key: 'INTL-AGNT-BOSS-MODE',
      plan: 'Pro Platform',
      products: ['Chatbot', 'Sales Agent', 'Data Enrichment', 'Setup Agent']
    };
    
    setUser(userData);
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear cookie
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.intelagentstudios.com';
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Intelagent Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}!
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You are successfully logged in to your dashboard!
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-green-600">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Active Users</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,350</div>
              <p className="text-xs text-green-600">+180 new this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">API Calls</CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5M</div>
              <p className="text-xs text-green-600">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.products?.length || 4}</div>
              <p className="text-xs text-gray-500">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Products included in your {user?.plan} subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {user?.products?.map((product: string, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  </div>
                  <h3 className="font-semibold">{product}</h3>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Configure
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">License Key</p>
                <p className="mt-1 font-mono text-sm">{user?.license_key}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Plan</p>
                <p className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.plan}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}