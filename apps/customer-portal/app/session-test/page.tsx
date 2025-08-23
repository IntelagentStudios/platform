'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SessionTestPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check cookies client-side
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const cookieObj: any = {};
      cookies.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key) cookieObj[key] = value;
      });

      // Check session via API
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      const data = await response.json();

      setSessionInfo({
        cookies: cookieObj,
        apiResponse: data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setSessionInfo({
        error: error.message,
        cookies: typeof document !== 'undefined' ? document.cookie : 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    }
    checkSession();
  };

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login-hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'harry@intelagentstudios.com',
          password: 'Birksgrange226!'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      // Recheck session after login
      setTimeout(checkSession, 500);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Session Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={checkSession} disabled={loading}>
                  Refresh Session Info
                </Button>
                <Button onClick={testLogin} variant="outline">
                  Test Login
                </Button>
                <Button onClick={clearSession} variant="destructive">
                  Clear Session
                </Button>
              </div>

              <div className="space-y-4">
                <a href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Try Dashboard Link →
                </a>
                <a href="/dashboard-simple" className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-4">
                  Try Simple Dashboard →
                </a>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-bold mb-2">Session Information:</h3>
                  <pre className="text-xs overflow-auto">
{JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>This page bypasses middleware to show raw session state.</p>
                <p>If you see a session cookie but dashboard redirects, the token may be invalid.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}