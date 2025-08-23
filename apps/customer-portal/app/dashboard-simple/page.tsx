'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Package, Settings, LogOut, CheckCircle } from 'lucide-react';

export default function SimpleDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking cookies
    const checkAuth = async () => {
      try {
        // Simple auth check
        const cookies = document.cookie.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith('session='));
        
        if (!sessionCookie) {
          router.push('/login');
          return;
        }
        
        // Set basic user info
        setUser({
          email: 'harry@intelagentstudios.com',
          name: 'Harry',
          license_key: 'INTL-AGNT-BOSS-MODE',
          plan: 'Pro Platform'
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      router.push('/login');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Intelagent Dashboard
                </h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}!</p>
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
        {/* Success Message */}
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Login successful! You are now in the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and license information</CardDescription>
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
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Products</CardTitle>
              </div>
              <CardDescription>View and manage your products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/products')}
              >
                View Products
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Settings</CardTitle>
              </div>
              <CardDescription>Manage account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                Go to Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Setup Agent</CardTitle>
              </div>
              <CardDescription>Configure your setup agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/products/setup-agent')}
              >
                Configure Agent
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="mt-6 bg-gray-100 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
{JSON.stringify({
  authenticated: true,
  timestamp: new Date().toISOString(),
  cookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}