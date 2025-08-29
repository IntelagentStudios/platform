'use client';

import { useState } from 'react';
import { Trash2, Plus, RefreshCw, Check } from 'lucide-react';

export default function ConsolidatePage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_for_cleanup' })
      });
      const data = await response.json();
      setLicenses(data.licenses || []);
      setMessage(`Found ${data.duplicates?.length || 0} duplicate Harry licenses and ${data.test_accounts?.length || 0} test accounts`);
    } catch (error) {
      setMessage('Failed to load licenses');
    }
    setLoading(false);
  };

  const createMasterLicense = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_master_license' })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Master license INTL-MASTER-2025 created for Harry');
        loadLicenses();
      }
    } catch (error) {
      setMessage('Failed to create master license');
    }
    setLoading(false);
  };

  const createProductKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_product_key',
          data: {
            licenseKey: 'INTL-MASTER-2025',
            product: 'chatbot',
            productKey: 'key_ya4c9x7shyz3djpn'
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Product key created! Embed code: ${data.embedCode}`);
      }
    } catch (error) {
      setMessage('Failed to create product key');
    }
    setLoading(false);
  };

  const deleteLicense = async (licenseKey: string) => {
    if (!confirm(`Delete license ${licenseKey}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete_license',
          data: { licenseKey }
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Deleted license ${licenseKey}`);
        loadLicenses();
      }
    } catch (error) {
      setMessage('Failed to delete license');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
          License Consolidation
        </h2>
        <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
          Clean up and consolidate duplicate licenses
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.2)',
          color: 'rgb(48, 54, 54)'
        }}>
          {message}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={loadLicenses}
          disabled={loading}
          className="px-4 py-2 rounded-lg border transition-colors hover:bg-white flex items-center gap-2"
          style={{ 
            backgroundColor: 'transparent',
            borderColor: 'rgb(48, 54, 54)',
            color: 'rgb(48, 54, 54)'
          }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Load Licenses
        </button>
        
        <button
          onClick={createMasterLicense}
          disabled={loading}
          className="px-4 py-2 rounded-lg transition-colors hover:opacity-90 flex items-center gap-2"
          style={{ 
            backgroundColor: 'rgb(48, 54, 54)',
            color: 'rgb(229, 227, 220)'
          }}
        >
          <Plus className="h-4 w-4" />
          Create Master License
        </button>
        
        <button
          onClick={createProductKey}
          disabled={loading}
          className="px-4 py-2 rounded-lg transition-colors hover:opacity-90 flex items-center gap-2"
          style={{ 
            backgroundColor: '#4CAF50',
            color: 'white'
          }}
        >
          <Check className="h-4 w-4" />
          Setup Website Embed
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
          Recommended Actions:
        </h3>
        <ol className="list-decimal list-inside space-y-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
          <li>Click "Load Licenses" to see all current licenses</li>
          <li>Click "Create Master License" to create INTL-MASTER-2025 for Harry</li>
          <li>Click "Setup Website Embed" to create the product key for your website</li>
          <li>Delete the old duplicate licenses below</li>
        </ol>
      </div>

      {licenses.length > 0 && (
        <div className="rounded-lg border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(48, 54, 54, 0.1)' }}>
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>License Key</th>
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>Email</th>
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>Name</th>
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>Product Keys</th>
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.license_key} className="border-b" style={{ borderColor: 'rgba(48, 54, 54, 0.05)' }}>
                  <td className="p-3" style={{ color: 'rgb(48, 54, 54)' }}>
                    <code className="text-sm">{license.license_key}</code>
                  </td>
                  <td className="p-3" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                    {license.email}
                  </td>
                  <td className="p-3" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                    {license.name || '-'}
                  </td>
                  <td className="p-3" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                    {license.product_key_count}
                  </td>
                  <td className="p-3">
                    {(license.email === 'harry@intelagentstudios.com' && 
                     license.license_key !== 'INTL-MASTER-2025') ||
                     license.email?.includes('test') ||
                     license.email?.includes('friend') ? (
                      <button
                        onClick={() => deleteLicense(license.license_key)}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        title="Delete license"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>Keep</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}