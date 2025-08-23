'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Mail, Lock, Key, CheckCircle, AlertCircle, ArrowLeft, User } from 'lucide-react';

export default function RegisterV2Page() {
  const [step, setStep] = useState(1); // 1: email, 2: license, 3: password
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const router = useRouter();

  const checkEmail = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/auth/register-v2?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.hasAccount) {
        setError('This email is already registered. Please login instead.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStep(2);
        setSuccess('Email verified! Now enter your license key.');
      }
    } catch (error) {
      setError('Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateLicense = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/api/auth/register-v2?email=${encodeURIComponent(email)}&licenseKey=${licenseKey}`
      );
      const data = await response.json();
      
      if (!data.success || !data.validLicense) {
        setError(data.message || 'Invalid license key');
      } else {
        setLicenseInfo(data);
        setCustomerName(data.customerName || '');
        setStep(3);
        setSuccess('License verified! Create your password to complete registration.');
      }
    } catch (error) {
      setError('Failed to validate license. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          licenseKey,
          name: customerName
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      } else {
        setError(data.message || data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-[450px] shadow-lg border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
          </div>
          <CardDescription>
            Step {step} of 3: {step === 1 ? 'Verify Email' : step === 2 ? 'Enter License Key' : 'Set Password'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress indicator */}
          <div className="flex justify-between mb-6">
            <div className={`flex-1 h-2 rounded-full mr-2 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full mr-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-4 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the email address you used for your purchase
                </p>
              </div>
              
              <Button 
                className="w-full" 
                disabled={isLoading || !email}
                onClick={checkEmail}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          )}

          {/* Step 2: License Key */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">License Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="license"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    className="pl-10 font-mono"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Find your license key in your purchase email
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  disabled={isLoading}
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={isLoading || !licenseKey}
                  onClick={validateLicense}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate License'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div className="space-y-4">
              {licenseInfo && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>Plan:</strong> {licenseInfo.plan}<br/>
                    <strong>Products:</strong> {licenseInfo.products?.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  disabled={isLoading}
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={isLoading || !password || password !== confirmPassword}
                  onClick={handleRegister}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Test License: <code className="font-mono bg-gray-100 px-1 rounded">INTL-AGNT-BOSS-MODE</code></p>
            <p>Email: <code className="font-mono bg-gray-100 px-1 rounded">harry@intelagentstudios.com</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}