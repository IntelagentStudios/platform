'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductConfigurator, { PRODUCT_CONFIGS } from '@/components/products/ProductConfigurator';

export default function ConfigureProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const product = searchParams.get('product') as keyof typeof PRODUCT_CONFIGS;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    console.log('[configure-product] Checking authentication...');
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          console.log(`[configure-product] Authenticated: ${data.user.email}, License: ${data.user.license_key}`);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.log('[configure-product] Not authenticated, redirecting to login');
          setIsAuthenticated(false);
          router.push('/login');
        }
      })
      .catch((error) => {
        console.error('[configure-product] Auth check failed:', error);
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

  if (!product || !PRODUCT_CONFIGS[product]) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#1a202c' }}>
            Select a Product to Configure
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.entries(PRODUCT_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => router.push(`/products/configure?product=${key}`)}
                style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {config.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Back to Dashboard
          </button>
        </div>
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
        product={product}
        onSuccess={(productKey, embedCode) => {
          console.log(`${PRODUCT_CONFIGS[product].name} configured successfully:`, productKey);
          // Optionally redirect to dashboard or product page
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }}
      />
    </div>
  );
}