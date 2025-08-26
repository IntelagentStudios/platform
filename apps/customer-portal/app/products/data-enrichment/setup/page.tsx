'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductConfigurator from '@/components/products/ProductConfigurator';

export default function SetupDataEnrichmentPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    console.log('[setup-data-enrichment] Checking authentication...');
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          console.log(`[setup-data-enrichment] Authenticated: ${data.user.email}, License: ${data.user.license_key}`);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.log('[setup-data-enrichment] Not authenticated, redirecting to login');
          setIsAuthenticated(false);
          router.push('/login');
        }
      })
      .catch((error) => {
        console.error('[setup-data-enrichment] Auth check failed:', error);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <ProductConfigurator 
        product="data-enrichment"
        onSuccess={(productKey, embedCode) => {
          console.log('Data Enrichment configured successfully:', productKey);
        }}
      />
    </div>
  );
}