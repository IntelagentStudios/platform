'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function ValidateLicensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          license_key: licenseKey,
          email: isRegistering ? email : undefined,
          name: isRegistering ? name : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid license key');
        return;
      }

      toast({
        title: 'Welcome!',
        description: isRegistering ? 'License registered successfully' : 'License validated successfully',
      });

      // Check if onboarding is needed
      if (!data.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to validate license. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Intelagent Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customer Portal
          </p>
        </div>

        <Card className="shadow-lg border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>{isRegistering ? 'Register License' : 'Access Your Dashboard'}</CardTitle>
            <CardDescription>
              {isRegistering 
                ? 'Enter your license key and details to get started'
                : 'Enter your license key to access your products and services'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleValidate} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isRegistering}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={isRegistering}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="license">License Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="license"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      // Auto-format with dashes
                      const formatted = value.replace(/[^A-Z0-9]/g, '').match(/.{1,4}/g)?.join('-') || value;
                      setLicenseKey(formatted.substring(0, 19));
                    }}
                    className="pl-10 font-mono"
                    required
                    disabled={isLoading}
                    maxLength={19}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Format: XXXX-XXXX-XXXX-XXXX
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                disabled={isLoading || licenseKey.length !== 19 || (isRegistering && (!email || !name))}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    {isRegistering ? 'Register License' : 'Access Dashboard'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                disabled={isLoading}
              >
                {isRegistering 
                  ? 'Already registered? Access your dashboard' 
                  : 'First time? Register your license'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                Don't have a license key?{' '}
                <a 
                  href="https://intelagentstudios.com/purchase" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 dark:text-gray-100 hover:underline"
                >
                  Purchase one
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-4">
          Need help?{' '}
          <a href="mailto:support@intelagentstudios.com" className="underline">
            Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  );
}