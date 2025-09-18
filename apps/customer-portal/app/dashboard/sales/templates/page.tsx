'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to campaigns page since templates are incorporated there
    router.push('/dashboard/sales/campaigns');
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-12">
        <p className="text-gray-400">Redirecting to campaigns...</p>
      </div>
    </div>
  );
}