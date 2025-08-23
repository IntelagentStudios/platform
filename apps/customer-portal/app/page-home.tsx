'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight, Package, Users, TrendingUp, Bot } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      // Not authenticated, stay on home page
      console.log('Auth check - user not logged in');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Intelagent Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your AI-powered products and services in one unified dashboard
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Existing Customer */}
          <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Existing Customer
              </CardTitle>
              <CardDescription>
                Access your dashboard to manage products and view analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Sign In to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* New Customer */}
          <Card className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                New Customer
              </CardTitle>
              <CardDescription>
                Register with your license key from your purchase email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => router.push('/register')}
              >
                Register Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8">
            Your Products at a Glance
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <Bot className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">AI Chatbot</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                24/7 intelligent customer support
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Sales Agent</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automated lead qualification
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <Package className="h-10 w-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">More Products</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Data enrichment and setup tools
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Need help? Contact support at{' '}
            <a href="mailto:support@intelagentstudios.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@intelagentstudios.com
            </a>
          </p>
          <div className="mt-4 space-x-4">
            <a href="/terms" className="hover:underline">Terms</a>
            <span>•</span>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <span>•</span>
            <a href="https://intelagentstudios.com" className="hover:underline">Main Website</a>
          </div>
        </div>
      </div>
    </div>
  );
}