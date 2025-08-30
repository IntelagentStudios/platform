'use client';

import { useState } from 'react';
import { Copy, Key, Shield, Database, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const adminKey = 'INTL-ADMIN-KEY';
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
          Admin Settings
        </h2>
        <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
          Configure platform settings and manage admin credentials
        </p>
      </div>

      {/* Admin License Key */}
      <div className="rounded-lg p-6 border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)' }}>
            <Key className="h-6 w-6" style={{ color: 'rgb(48, 54, 54)' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(48, 54, 54)' }}>
              Master Admin License
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
              This license key provides full administrative access to the platform.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{
              backgroundColor: 'rgba(48, 54, 54, 0.05)',
              border: '1px solid rgba(48, 54, 54, 0.1)'
            }}>
              <code className="flex-1 font-mono text-sm" style={{ color: 'rgb(48, 54, 54)' }}>
                {adminKey}
              </code>
              <button
                onClick={() => copyToClipboard(adminKey)}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" style={{ color: 'rgb(48, 54, 54)' }} />
              </button>
            </div>
            {copiedKey && (
              <p className="text-xs mt-2" style={{ color: 'rgb(76, 175, 80)' }}>
                Copied to clipboard!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5" style={{ color: 'rgb(48, 54, 54)' }} />
            <h3 className="font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
              Security Settings
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Admin Email:</span>
              <span style={{ color: 'rgb(48, 54, 54)' }}>admin@intelagentstudios.com</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Account Type:</span>
              <span style={{ color: 'rgb(48, 54, 54)' }}>Master Administrator</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Status:</span>
              <span className="px-2 py-0.5 rounded text-xs" style={{ 
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: 'rgb(76, 175, 80)'
              }}>
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(48, 54, 54, 0.15)'
        }}>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5" style={{ color: 'rgb(48, 54, 54)' }} />
            <h3 className="font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
              Data Management
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Excluded from Stats:</span>
              <span style={{ color: 'rgb(48, 54, 54)' }}>Admin & Test Accounts</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Test License:</span>
              <span className="font-mono text-xs" style={{ color: 'rgb(48, 54, 54)' }}>
                INTL-8K3M-QB7X-2024
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(48, 54, 54, 0.7)' }}>Test Email:</span>
              <span style={{ color: 'rgb(48, 54, 54)' }}>friend@testbusiness.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="rounded-lg p-4 border flex items-start gap-3" style={{
        backgroundColor: 'rgba(33, 150, 243, 0.05)',
        borderColor: 'rgba(33, 150, 243, 0.2)'
      }}>
        <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: 'rgb(33, 150, 243)' }} />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
            Admin Account Information
          </p>
          <p className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
            The admin account is used for platform management and is automatically excluded from all business statistics. 
            Test credentials are stored in TEST_CREDENTIALS.md for reference.
          </p>
        </div>
      </div>
    </div>
  );
}