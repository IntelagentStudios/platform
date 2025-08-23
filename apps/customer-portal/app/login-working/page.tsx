'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginWorkingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'error' | 'success' | 'info', message: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      // Step 1: Login
      setStatus({ type: 'info', message: 'Authenticating...' });
      
      const loginResponse = await fetch('/api/auth/login-hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginResponse.ok || !loginData.success) {
        setStatus({ type: 'error', message: loginData.error || 'Login failed' });
        setIsLoading(false);
        return;
      }

      // Step 2: Verify session was created
      setStatus({ type: 'info', message: 'Verifying session...' });
      
      const verifyResponse = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Verify response:', verifyData);

      if (!verifyData.authenticated) {
        setStatus({ type: 'error', message: 'Session creation failed. Please try again.' });
        setIsLoading(false);
        return;
      }

      // Step 3: Success - show success message then manually navigate
      setStatus({ type: 'success', message: 'Login successful! Click below to access dashboard.' });
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Login error:', error);
      setStatus({ type: 'error', message: error.message || 'Connection failed' });
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    // Try direct navigation via link
    const link = document.createElement('a');
    link.href = '/dashboard';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">Login (Working Version)</CardTitle>
          </div>
          <CardDescription>
            Sign in to access your Intelagent dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status && (
            <Alert className={`mb-4 ${
              status.type === 'error' ? 'border-red-300 bg-red-50' :
              status.type === 'success' ? 'border-green-300 bg-green-50' :
              'border-blue-300 bg-blue-50'
            }`}>
              {status.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {status.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {status.type === 'info' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
              <AlertDescription className={
                status.type === 'error' ? 'text-red-800' :
                status.type === 'success' ? 'text-green-800' :
                'text-blue-800'
              }>
                {status.message}
              </AlertDescription>
            </Alert>
          )}

          {status?.type === 'success' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your session has been created successfully. Click the button below to access your dashboard.
              </p>
              
              <Button 
                onClick={goToDashboard}
                className="w-full"
                size="lg"
              >
                Go to Dashboard
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Or try these direct links:</p>
                <div className="space-y-2">
                  <a 
                    href="/dashboard" 
                    className="block text-blue-600 hover:underline"
                  >
                    → Dashboard
                  </a>
                  <a 
                    href="/dashboard-simple" 
                    className="block text-blue-600 hover:underline"
                  >
                    → Simple Dashboard
                  </a>
                  <a 
                    href="/products" 
                    className="block text-blue-600 hover:underline"
                  >
                    → Products
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <div className="text-sm text-gray-500">
              <p className="font-semibold mb-1">Test Credentials:</p>
              <p>Email: harry@intelagentstudios.com</p>
              <p>Password: Birksgrange226!</p>
            </div>
          </div>

          {/* Debug info */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
{JSON.stringify({
  cookies: document.cookie.split(';').map(c => c.trim().split('=')[0]),
  timestamp: new Date().toISOString()
}, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}