'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductManagementRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to products page instead of showing "no products" error
    router.replace('/products');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" 
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
        <p style={{ color: 'rgb(229, 227, 220)' }}>Redirecting to products...</p>
      </div>
    </div>
  );
}