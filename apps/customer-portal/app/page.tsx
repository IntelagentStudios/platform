'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Package, Settings, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/verify', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user || {
            email: 'harry@intelagentstudios.com',
            licenseKey: 'INTL-AGNT-BOSS-MODE'
          });
        } else {
          setIsAuthenticated(false);
          // Don't redirect, just show message
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handleLogout = async () => {
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    router.push('/login');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-yellow-300 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You need to be logged in to view this page.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
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
                <p className="text-sm text-gray-500">
                  Welcome to your platform control center
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
            You are successfully logged in and viewing the dashboard!
          </AlertDescription>
        </Alert>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Email: </span>
                <span>{user?.email}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">License: </span>
                <span className="font-mono text-sm">{user?.licenseKey}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Status: </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Products</CardTitle>
              </div>
              <CardDescription>Manage your products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Products
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Settings</CardTitle>
              </div>
              <CardDescription>Account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Go to Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg">Setup Agent</CardTitle>
              </div>
              <CardDescription>Configure agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configure
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}