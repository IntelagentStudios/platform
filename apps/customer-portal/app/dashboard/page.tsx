'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if authenticated
    fetch('/api/auth/simple')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (!data.authenticated) {
          window.location.href = '/login';
        }
      });
  }, []);

  const handleLogout = () => {
    // Clear cookie by setting expired date
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    window.location.href = '/login';
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 font-semibold">
                ✅ You are successfully logged in!
              </p>
              <p className="mt-4">
                User: Harry (harry@intelagentstudios.com)
              </p>
              <p>
                License: INTL-AGNT-BOSS-MODE
              </p>
              <p>
                Plan: Pro Platform
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Chatbot</li>
                <li>Sales Agent</li>
                <li>Data Enrichment</li>
                <li>Setup Agent</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}