'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupAgentFramePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check authentication
    console.log('[setup-agent-frame-page] Checking authentication...');
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          console.log(`[setup-agent-frame-page] Authenticated: ${data.user.email}, License: ${data.user.license_key}`);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.log('[setup-agent-frame-page] Not authenticated, redirecting to login');
          setIsAuthenticated(false);
          router.push('/login');
        }
      })
      .catch((error) => {
        console.error('[setup-agent-frame-page] Auth check failed:', error);
        setIsAuthenticated(false);
        router.push('/login');
      });
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'rgb(48, 54, 54)'
      }}>
        <div style={{ color: 'rgb(229, 227, 220)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <iframe
        src="/api/products/chatbot/setup-agent-frame"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Setup Agent Chat"
      />
    </div>
  );
}