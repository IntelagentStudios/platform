'use client';

import { useState } from 'react';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('harry@intelagentstudios.com');
  const [password, setPassword] = useState('Birksgrange226!');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Try secure endpoint first, fallback to simple if it fails
      const response = await fetch('/api/auth/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful! Redirecting...');
        // Store user data in sessionStorage for dashboard
        if (data.user) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/dashboard';
      } else {
        setMessage(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      setMessage('Network error');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'rgb(48, 54, 54)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
               style={{ backgroundColor: 'rgb(169, 189, 203)' }}>
            <Shield className="w-8 h-8" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
            Intelagent Platform
          </h1>
          <p className="mt-2" style={{ color: 'rgb(169, 189, 203)' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-lg shadow-xl p-8"
          style={{ backgroundColor: 'rgb(73, 90, 88)' }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(229, 227, 220)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 rounded-md focus:outline-none focus:ring-2 transition"
                  style={{ 
                    backgroundColor: 'rgb(48, 54, 54)',
                    color: 'rgb(229, 227, 220)',
                    borderColor: 'rgb(169, 189, 203)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(229, 227, 220)' }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 rounded-md focus:outline-none focus:ring-2 transition"
                  style={{ 
                    backgroundColor: 'rgb(48, 54, 54)',
                    color: 'rgb(229, 227, 220)',
                    borderColor: 'rgb(169, 189, 203)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error/Success Message */}
            {message && (
              <div 
                className="text-sm p-3 rounded"
                style={{ 
                  backgroundColor: message.includes('successful') ? 'rgba(169, 189, 203, 0.2)' : 'rgba(255, 100, 100, 0.2)',
                  color: message.includes('successful') ? 'rgb(169, 189, 203)' : '#ff6464'
                }}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-md font-medium transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(48, 54, 54)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
          Pro Platform License
        </p>
      </div>
    </div>
  );
}