'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatbotRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual chatbot dashboard
    router.replace('/products/chatbot/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
           style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
    </div>
  );
}