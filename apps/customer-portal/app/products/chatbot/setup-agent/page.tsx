'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Loader2, Bot, CheckCircle } from 'lucide-react';

export default function ChatbotSetupAgentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`sess_${Math.random().toString(36).substring(2, 10)}`);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
        fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
    
    // Get user data
    fetch('/api/auth/secure')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ 
                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                color: 'rgb(169, 189, 203)'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Chatbot Setup Agent
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Configure your chatbot with our AI assistant
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1" style={{ height: 'calc(100vh - 120px)' }}>
        <iframe
          src="/products/chatbot/setup-agent-frame"
          className="w-full h-full border-0"
          style={{ backgroundColor: 'rgb(48, 54, 54)' }}
          title="Chatbot Setup Agent"
        />
      </div>
    </DashboardLayout>
  );
}