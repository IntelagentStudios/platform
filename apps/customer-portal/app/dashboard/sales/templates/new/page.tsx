'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTemplatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new campaign page since templates are incorporated there
    router.push('/dashboard/sales/campaigns/new');
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-12">
        <p className="text-gray-400">Redirecting to create new campaign...</p>
      </div>
    </div>
  );
}