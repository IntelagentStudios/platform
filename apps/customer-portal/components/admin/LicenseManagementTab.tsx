'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Key, 
  Activity,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  Download,
  Mail,
  Eye,
  Copy,
  Package,
  Settings,
  ChevronRight
} from 'lucide-react';

interface License {
  license_key: string;
  email: string;
  customer_name: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  products: string[];
  created_at: string;
  domain?: string;
  user?: any;
  product_keys?: any[];
  usage_stats?: any;
}

export default function LicenseManagementTab() {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/licenses');
      const data = await response.json();
      setLicenses(data.licenses || []);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImpersonate = async (license: License) => {
    const confirmAction = window.confirm(
      `⚠️ Warning: You are about to view as user ${license.email}.\\n\\n` +
      'This action will be logged. Continue?'
    );
    
    if (confirmAction) {
      // Log the action
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view_as_user',
          resource_type: 'user',
          resource_id: license.user?.id,
          license_key: license.license_key,
          severity: 'warning'
        })
      });
      
      // Open user dashboard in new tab with their license key
      // This is safer than actual impersonation
      console.log('Viewing as user:', license.email);
      alert(`Opening dashboard view for ${license.email}`);
    }
  };

  const handleResetConfiguration = async (license: License, product: string) => {
    const confirmAction = window.confirm(
      `⚠️ Critical Action: Reset ${product} configuration for ${license.email}?\\n\\n` +
      'This will delete their product key and require reconfiguration.'
    );
    
    if (confirmAction) {
      const response = await fetch('/api/admin/reset-configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          license_key: license.license_key,
          product 
        })
      });
      
      if (response.ok) {
        alert(`Successfully reset ${product} for ${license.email}`);
        fetchLicenses(); // Refresh data
      }
    }
  };

  const exportData = () => {
    const data = filteredLicenses.map(license => ({
      license_key: license.license_key,
      email: license.email,
      customer_name: license.customer_name,
      status: license.status,
      products: license.products.join(', '),
      created_at: license.created_at
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses_${new Date().toISOString()}.csv`;
    a.click();
  };

  // Filter licenses
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = searchQuery === '' || 
      license.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">License Management</h2>
          <p className="text-muted-foreground">
            Total: {licenses.length} licenses ({licenses.filter(l => l.status === 'active').length} active)
          </p>
        </div>
        <Button onClick={fetchLicenses} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by license key, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
        </select>
        <Button variant="outline" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* License Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* License List */}
        <Card>
          <CardHeader>
            <CardTitle>Licenses</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredLicenses.map((license) => (
                <div
                  key={license.license_key}
                  onClick={() => setSelectedLicense(license)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLicense?.license_key === license.license_key
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm">{license.license_key}</div>
                      <div className="text-sm text-gray-600">{license.email}</div>
                      <div className="text-xs text-gray-500">{license.customer_name}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={
                        license.status === 'active' ? 'default' :
                        license.status === 'trial' ? 'secondary' :
                        'destructive'
                      }>
                        {license.status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {license.products.length} products
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected License Details */}
        {selectedLicense ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>License Details</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleImpersonate(selectedLicense)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View As User
                </Button>
              </CardTitle>
              <CardDescription>{selectedLicense.license_key}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Information */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Information
                </h3>
                <div className="pl-6 space-y-1 text-sm">
                  <div>Email: {selectedLicense.email}</div>
                  <div>Name: {selectedLicense.customer_name}</div>
                  <div>Created: {new Date(selectedLicense.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Products & Configurations */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products
                </h3>
                <div className="pl-6 space-y-2">
                  {selectedLicense.products.map((product) => {
                    const config = selectedLicense.product_keys?.find(pk => pk.product === product);
                    return (
                      <div key={product} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium capitalize">{product}</div>
                          {config ? (
                            <div className="text-xs text-gray-500">
                              Configured: {config.product_key.substring(0, 20)}...
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-600">Not configured</div>
                          )}
                        </div>
                        {config && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetConfiguration(selectedLicense, product)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email User
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLicense.license_key);
                      alert('License key copied!');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[500px] text-gray-500">
              <div className="text-center">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a license to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}