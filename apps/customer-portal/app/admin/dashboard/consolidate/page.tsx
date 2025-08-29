'use client';

import { useState } from 'react';
import { Trash2, Plus, RefreshCw, Check, Settings, Key, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConsolidatePage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);

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

  const configureExistingLicense = async (licenseKey: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'configure_existing',
          data: { licenseKey }
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ License ${licenseKey} configured as primary license`);
        loadLicenses();
      }
    } catch (error) {
      setMessage('Failed to configure license');
    }
    setLoading(false);
  };

  const createProductKey = async (licenseKey: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_product_key',
          data: {
            licenseKey: licenseKey,
            product: 'chatbot',
            productKey: null // Will generate a new one
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Product key created! ${data.productKey.product_key}\nEmbed code: ${data.embedCode}`);
      }
    } catch (error) {
      setMessage('Failed to create product key');
    }
    setLoading(false);
  };

  const deleteLicense = async (licenseKey: string) => {
    if (!confirm(`Delete license ${licenseKey}? This will also delete all associated product keys.`)) return;
    
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
        setMessage(`✅ ${data.message}`);
        loadLicenses();
      } else {
        setMessage(`❌ ${data.message || 'Failed to delete license'}`);
        console.error('Delete failed:', data);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage(`❌ Failed to delete license: ${error}`);
    }
    setLoading(false);
  };

  const deleteProductKeys = async (licenseKey: string) => {
    console.log('Deleting product keys for:', licenseKey);
    if (!confirm(`Delete all product keys for license ${licenseKey}?`)) return;
    
    setLoading(true);
    setMessage('Deleting product keys...');
    try {
      const response = await fetch('/api/admin/consolidate-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete_product_keys',
          data: { licenseKey }
        })
      });
      const data = await response.json();
      console.log('Delete response:', data);
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        await loadLicenses();
      } else {
        console.error('Delete failed with details:', data);
        setMessage(`❌ ${data.message || 'Failed to delete product keys'}`);
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage(`❌ Failed to delete product keys: ${error}`);
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
        
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
          Recommended Actions:
        </h3>
        <ol className="list-decimal list-inside space-y-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
          <li>Click "Load Licenses" to see all current licenses</li>
          <li>Select one of your unused licenses and click "Use This License"</li>
          <li>Click "Generate Product Key" to create a new chatbot key</li>
          <li>Delete the other duplicate licenses</li>
        </ol>
      </div>

      {selectedLicense && (
        <div className="rounded-lg border p-4" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.2)'
        }}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
              Selected License: {selectedLicense}
            </h3>
            <button
              onClick={() => router.push('/products/chatbot/configure')}
              className="px-3 py-1 rounded-lg border transition-colors hover:bg-white flex items-center gap-2 text-sm"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: 'rgb(48, 54, 54)',
                color: 'rgb(48, 54, 54)'
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Configure Chatbot
            </button>
          </div>
          {(() => {
            const license = licenses.find(l => l.license_key === selectedLicense);
            if (license?.product_keys?.length > 0) {
              return (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
                    Product Keys ({license.product_keys.length}):
                  </p>
                  <div className="space-y-1">
                    {license.product_keys.map((pk: any) => (
                      <div key={pk.key} className="flex items-center gap-2 text-sm font-mono">
                        <span style={{ color: 'rgb(48, 54, 54)' }}>{pk.key}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ 
                          backgroundColor: 'rgba(48, 54, 54, 0.1)',
                          color: 'rgba(48, 54, 54, 0.7)'
                        }}>
                          {pk.product}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  No product keys yet. Click the key icon to generate one.
                </p>
              );
            }
          })()}
        </div>
      )}

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
                <th className="p-3 text-left" style={{ color: 'rgb(48, 54, 54)' }}>Actions</th>
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
                    <div className="flex gap-2">
                      {license.email === 'harry@intelagentstudios.com' && (
                        <>
                          {selectedLicense === license.license_key ? (
                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                              Selected
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLicense(license.license_key);
                                configureExistingLicense(license.license_key);
                              }}
                              className="p-1 rounded hover:bg-blue-50 text-blue-600"
                              title="Use this license"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          )}
                          {selectedLicense === license.license_key && (
                            <>
                              <button
                                onClick={() => createProductKey(license.license_key)}
                                className="p-1 rounded hover:bg-green-50 text-green-600"
                                title="Generate product key"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              {license.product_key_count > 0 && (
                                <button
                                  onClick={() => deleteProductKeys(license.license_key)}
                                  className="p-1 rounded hover:bg-red-50 text-red-600"
                                  title="Delete all product keys"
                                  disabled={loading}
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {((license.email === 'harry@intelagentstudios.com' && 
                        license.license_key !== selectedLicense) ||
                        license.email?.includes('test') ||
                        license.email?.includes('friend')) && (
                        <button
                          onClick={() => deleteLicense(license.license_key)}
                          className="p-1 rounded hover:bg-red-50 text-red-600"
                          title="Delete license"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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