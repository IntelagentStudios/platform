'use client';

import dynamic from 'next/dynamic';

// Lazy load the License Management component
const LicenseManagementTab = dynamic(
  () => import('@/components/admin/LicenseManagementTab'),
  { 
    loading: () => <div style={{ color: 'rgb(48, 54, 54)' }}>Loading license management...</div>,
    ssr: false 
  }
);

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
          License Management
        </h2>
        <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
          View and manage all platform licenses
        </p>
      </div>

      {/* License Management Component */}
      <LicenseManagementTab />
    </div>
  );
}