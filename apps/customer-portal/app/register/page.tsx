'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [licenseInfo, setLicenseInfo] = useState<{
    hasLicense: boolean;
    customerName?: string;
    products?: string[];
    plan?: string;
  } | null>(null);

  // Step 1: Check email for license
  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/register?email=${encodeURIComponent(formData.email)}`);
      const data = await response.json();

      if (data.hasAccount) {
        setError('This email already has an account. Please log in instead.');
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
        return;
      }

      if (!data.hasLicense) {
        setError(data.message || 'No purchase found for this email.');
        return;
      }

      // Found a valid license!
      setLicenseInfo(data);
      setFormData(prev => ({ 
        ...prev, 
        name: data.customerName || '' 
      }));
      setStep('password');
    } catch (err) {
      setError('Failed to check email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Create account with password
  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?welcome=true');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Intelagent Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your AI Business Automation Hub
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {step === 'email' ? 'Create Your Account' : 'Set Your Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter the email address you used for your Squarespace purchase'
                : `Welcome back, ${formData.name || 'there'}! Create a secure password for your account.`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'email' ? (
              <form onSubmit={checkEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use the same email from your Squarespace purchase
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !formData.email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={createAccount} className="space-y-4">
                {licenseInfo && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Purchase Found!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Plan: {licenseInfo.plan}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {licenseInfo.products?.map(product => (
                            <span 
                              key={product}
                              className="text-xs bg-green-200 dark:bg-green-800 px-2 py-1 rounded"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
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
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading || !formData.password || !formData.confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Need help?{' '}
              <a href="mailto:support@intelagentstudios.com" className="text-blue-600 hover:underline">
                Contact Support
              </a>
            </div>
          </CardFooter>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-4">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}