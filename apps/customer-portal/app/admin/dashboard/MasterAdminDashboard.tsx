'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Key, 
  Activity, 
  Shield,
  AlertCircle,
  CheckCircle,
  Brain,
  Search,
  RefreshCw,
  Download,
  Mail,
  Eye,
  UserCheck,
  AlertTriangle,
  Database,
  Clock,
  TrendingUp,
  Package,
  Settings,
  ChevronRight,
  Copy,
  ExternalLink,
  Zap,
  MessageSquare,
  FileText,
  Filter
} from 'lucide-react';

interface License {
  license_key: string;
  email: string;
  customer_name: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  products: string[];
  created_at: string;
  domain?: string;
  // Nested data
  user?: {
    id: string;
    email: string;
    last_login?: string;
    email_verified: boolean;
  };
  product_keys?: {
    product: string;
    product_key: string;
    status: string;
    created_at: string;
    last_used?: string;
    metadata?: any;
  }[];
  usage_stats?: {
    total_conversations?: number;
    total_api_calls?: number;
    last_activity?: string;
  };
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id?: string;
  license_key?: string;
  changes?: any;
  ip_address?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export default function MasterAdminDashboard() {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('licenses');
  
  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    fetchLicenses();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    // Generate AI suggestions based on context
    generateAISuggestions();
  }, [selectedLicense, activeTab]);

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

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs');
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const generateAISuggestions = () => {
    const suggestions = [];
    
    if (selectedLicense) {
      if (!selectedLicense.user?.email_verified) {
        suggestions.push('Send verification email to ' + selectedLicense.email);
      }
      if (selectedLicense.status === 'trial') {
        suggestions.push('Convert trial to paid subscription');
      }
      if (!selectedLicense.product_keys?.some(pk => pk.product === 'chatbot')) {
        suggestions.push('Help configure chatbot for this user');
      }
    }
    
    if (activeTab === 'licenses') {
      suggestions.push('View expired licenses requiring attention');
      suggestions.push('Export license report for this month');
    }
    
    if (activeTab === 'audit') {
      suggestions.push('Filter critical security events');
      suggestions.push('Generate compliance report');
    }
    
    setAiSuggestions(suggestions.slice(0, 4));
  };

  const handleImpersonate = async (license: License) => {
    const confirmAction = window.confirm(
      `⚠️ Warning: You are about to impersonate user ${license.email}.\\n\\n` +
      'This action will be logged. Continue?'
    );
    
    if (confirmAction) {
      // Log the action
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'impersonate_user',
          resource_type: 'user',
          resource_id: license.user?.id,
          license_key: license.license_key,
          severity: 'warning'
        })
      });
      
      // Create impersonation session
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: license.license_key })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open in new tab with impersonation token
        window.open(`/dashboard?impersonate=${data.token}`, '_blank');
      }
    }
  };

  const handleResetConfiguration = async (license: License, product: string) => {
    const confirmAction = window.confirm(
      `⚠️ Critical Action: Reset ${product} configuration for ${license.email}?\\n\\n` +
      'This will delete their product key and require reconfiguration.'
    );
    
    if (confirmAction) {
      await fetch('/api/admin/reset-configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          license_key: license.license_key,
          product 
        })
      });
      
      fetchLicenses(); // Refresh data
    }
  };

  const exportData = (format: 'csv' | 'json' | 'excel') => {
    const data = filteredLicenses.map(license => ({
      license_key: license.license_key,
      email: license.email,
      customer_name: license.customer_name,
      status: license.status,
      products: license.products.join(', '),
      created_at: license.created_at,
      configurations: license.product_keys?.length || 0,
      last_activity: license.usage_stats?.last_activity || 'Never'
    }));
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses_${new Date().toISOString()}.json`;
      a.click();
    } else if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses_${new Date().toISOString()}.csv`;
      a.click();
    }
  };

  // Filter licenses based on search and status
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = searchQuery === '' || 
      license.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with AI Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Control Center</h1>
          <p className="text-muted-foreground">Complete oversight of all licenses and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowAI(!showAI)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button onClick={fetchLicenses} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAI && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Business Intelligence
            </CardTitle>
            <CardDescription>
              Context-aware assistance for {selectedLicense ? selectedLicense.email : 'system overview'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about licenses, users, configurations, or business metrics..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                />
                <Button onClick={handleAIQuery}>
                  <Zap className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>
              </div>
              
              {/* Quick Suggestions */}
              <div className="grid grid-cols-2 gap-2">
                {aiSuggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => executeAISuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="licenses">
            <Key className="h-4 w-4 mr-2" />
            Licenses
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Activity className="h-4 w-4 mr-2" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Licenses Tab - Root of Everything */}
        <TabsContent value="licenses" className="space-y-4">
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
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* License Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* License List */}
            <Card>
              <CardHeader>
                <CardTitle>All Licenses ({filteredLicenses.length})</CardTitle>
                <CardDescription>Click to view details and manage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLicenses.map((license) => (
                    <div
                      key={license.license_key}
                      onClick={() => setSelectedLicense(license)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
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
                      Impersonate
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
                      <div className="flex items-center gap-2">
                        Email Verified: 
                        {selectedLicense.user?.email_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products & Configurations */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Products & Configurations
                    </h3>
                    <div className="pl-6 space-y-2">
                      {selectedLicense.products.map((product) => {
                        const config = selectedLicense.product_keys?.find(pk => pk.product === product);
                        return (
                          <div key={product} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{product}</div>
                              {config ? (
                                <div className="text-xs text-gray-500">
                                  Key: {config.product_key}
                                  {config.metadata?.domain && ` • ${config.metadata.domain}`}
                                </div>
                              ) : (
                                <div className="text-xs text-yellow-600">Not configured</div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetConfiguration(selectedLicense, product)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
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
                        Send Email
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit License
                      </Button>
                    </div>
                  </div>

                  {/* Usage Statistics */}
                  {selectedLicense.usage_stats && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Usage Statistics
                      </h3>
                      <div className="pl-6 space-y-1 text-sm">
                        <div>Conversations: {selectedLicense.usage_stats.total_conversations || 0}</div>
                        <div>API Calls: {selectedLicense.usage_stats.total_api_calls || 0}</div>
                        <div>Last Activity: {selectedLicense.usage_stats.last_activity || 'Never'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-[600px] text-gray-500">
                  <div className="text-center">
                    <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a license to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Audit Log</CardTitle>
              <CardDescription>All system operations and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border rounded-lg ${
                      log.severity === 'critical' ? 'border-red-300 bg-red-50' :
                      log.severity === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                      log.severity === 'error' ? 'border-orange-300 bg-orange-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {log.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {log.severity === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.resource_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {log.license_key && <span className="font-mono">{log.license_key} • </span>}
                          {log.resource_id}
                        </div>
                        {log.changes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Changes: {JSON.stringify(log.changes)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>{new Date(log.timestamp).toLocaleString()}</div>
                        {log.ip_address && <div>IP: {log.ip_address}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs can be added here */}
      </Tabs>
    </div>
  );
}

// Helper functions
function handleAIQuery() {
  // Implement AI query processing
  console.log('Processing AI query...');
}

function executeAISuggestion(suggestion: string) {
  // Implement suggestion execution
  console.log('Executing suggestion:', suggestion);
}