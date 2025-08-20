'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Key,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Copy,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Send,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface License {
  license_key: string;
  customer_email: string;
  customer_name: string;
  company_name?: string;
  products: string[];
  plan_tier: string;
  status: string;
  created_at: string;
  activation_date?: string;
  expiration_date?: string;
  allowed_domains: string[];
  usage_current?: any;
  usage_limits?: any;
  usage_percentage?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  last_payment?: number;
  total_revenue?: number;
}

export default function LicenseManagementPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState({
    total_licenses: 0,
    active_licenses: 0,
    total_revenue: 0,
    mrr: 0,
    products_distribution: {} as Record<string, number>,
    plan_distribution: {} as Record<string, number>
  });

  // New license form
  const [newLicense, setNewLicense] = useState({
    customer_email: '',
    customer_name: '',
    company_name: '',
    products: [] as string[],
    plan_tier: 'starter',
    allowed_domains: [''],
    expiration_date: '',
    send_email: true
  });

  useEffect(() => {
    fetchLicenses();
    fetchStats();
  }, []);

  useEffect(() => {
    filterLicenses();
  }, [licenses, searchTerm, statusFilter, productFilter, planFilter]);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses/unified');
      const data = await response.json();
      setLicenses(data.licenses || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch licenses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/licenses/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (productFilter !== 'all') {
      filtered = filtered.filter(l => l.products.includes(productFilter));
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(l => l.plan_tier === planFilter);
    }

    setFilteredLicenses(filtered);
  };

  const createLicense = async () => {
    try {
      const response = await fetch('/api/licenses/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLicense,
          products: newLicense.products.map(p => ({
            product_id: p,
            tier: newLicense.plan_tier === 'enterprise' ? 'enterprise' : 
                  newLicense.plan_tier === 'professional' ? 'pro' : 'basic',
            features: [],
            usage_limit: getDefaultLimit(p, newLicense.plan_tier)
          })),
          allowed_domains: newLicense.allowed_domains.filter(d => d)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'License Created',
          description: `License ${data.license.license_key} created successfully`
        });
        setShowCreateDialog(false);
        fetchLicenses();
        resetNewLicenseForm();
      } else {
        throw new Error('Failed to create license');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create license',
        variant: 'destructive'
      });
    }
  };

  const getDefaultLimit = (product: string, plan: string): number => {
    const limits: any = {
      starter: { chatbot: 1000, sales_agent: 100, setup_agent: 50, enrichment: 500, ai_insights: 10 },
      professional: { chatbot: 10000, sales_agent: 1000, setup_agent: 500, enrichment: 5000, ai_insights: 100 },
      enterprise: { chatbot: -1, sales_agent: -1, setup_agent: -1, enrichment: -1, ai_insights: -1 }
    };
    return limits[plan]?.[product] || 100;
  };

  const resetNewLicenseForm = () => {
    setNewLicense({
      customer_email: '',
      customer_name: '',
      company_name: '',
      products: [],
      plan_tier: 'starter',
      allowed_domains: [''],
      expiration_date: '',
      send_email: true
    });
  };

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'License key copied to clipboard'
    });
  };

  const revokeLicense = async (key: string) => {
    if (!confirm('Are you sure you want to revoke this license?')) return;

    try {
      const response = await fetch(`/api/admin/licenses/${key}/revoke`, {
        method: 'PUT'
      });

      if (response.ok) {
        toast({
          title: 'License Revoked',
          description: 'License has been revoked successfully'
        });
        fetchLicenses();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke license',
        variant: 'destructive'
      });
    }
  };

  const resendWelcomeEmail = async (license: License) => {
    try {
      const response = await fetch('/api/admin/licenses/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: license.license_key })
      });

      if (response.ok) {
        toast({
          title: 'Email Sent',
          description: 'Welcome email has been resent'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-orange-500';
      case 'expired': return 'bg-red-500';
      case 'revoked': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">License Management</h1>
          <p className="text-muted-foreground">Manage all customer licenses and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLicenses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New License</DialogTitle>
                <DialogDescription>
                  Generate a new license for a customer with selected products and features
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Customer Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLicense.customer_email}
                      onChange={(e) => setNewLicense({...newLicense, customer_email: e.target.value})}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      value={newLicense.customer_name}
                      onChange={(e) => setNewLicense({...newLicense, customer_name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <Input
                    id="company"
                    value={newLicense.company_name}
                    onChange={(e) => setNewLicense({...newLicense, company_name: e.target.value})}
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <Label>Products</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['chatbot', 'sales_agent', 'setup_agent', 'enrichment', 'ai_insights'].map(product => (
                      <div key={product} className="flex items-center space-x-2">
                        <Checkbox
                          id={product}
                          checked={newLicense.products.includes(product)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewLicense({...newLicense, products: [...newLicense.products, product]});
                            } else {
                              setNewLicense({...newLicense, products: newLicense.products.filter(p => p !== product)});
                            }
                          }}
                        />
                        <Label htmlFor={product} className="capitalize">
                          {product.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan">Plan Tier</Label>
                  <Select value={newLicense.plan_tier} onValueChange={(value) => setNewLicense({...newLicense, plan_tier: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Allowed Domains</Label>
                  {newLicense.allowed_domains.map((domain, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={domain}
                        onChange={(e) => {
                          const domains = [...newLicense.allowed_domains];
                          domains[index] = e.target.value;
                          setNewLicense({...newLicense, allowed_domains: domains});
                        }}
                        placeholder="example.com"
                      />
                      {index === newLicense.allowed_domains.length - 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNewLicense({...newLicense, allowed_domains: [...newLicense.allowed_domains, '']})}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const domains = newLicense.allowed_domains.filter((_, i) => i !== index);
                            setNewLicense({...newLicense, allowed_domains: domains});
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                  <Input
                    id="expiration"
                    type="date"
                    value={newLicense.expiration_date}
                    onChange={(e) => setNewLicense({...newLicense, expiration_date: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-email"
                    checked={newLicense.send_email}
                    onCheckedChange={(checked) => setNewLicense({...newLicense, send_email: !!checked})}
                  />
                  <Label htmlFor="send-email">Send welcome email to customer</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createLicense}>
                  Create License
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_licenses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_licenses} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.mrr.toLocaleString()} MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.products_distribution).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all licenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search licenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="chatbot">Chatbot</SelectItem>
                <SelectItem value="sales_agent">Sales Agent</SelectItem>
                <SelectItem value="setup_agent">Setup Agent</SelectItem>
                <SelectItem value="enrichment">Enrichment</SelectItem>
                <SelectItem value="ai_insights">AI Insights</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* License Table */}
      <Card>
        <CardHeader>
          <CardTitle>Licenses ({filteredLicenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading licenses...
                  </TableCell>
                </TableRow>
              ) : filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((license) => (
                  <TableRow key={license.license_key}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{license.license_key}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyLicenseKey(license.license_key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{license.customer_email}</div>
                        {license.company_name && (
                          <div className="text-xs text-muted-foreground">{license.company_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {license.products.map(product => (
                          <Badge key={product} variant="secondary" className="text-xs">
                            {product.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {license.plan_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(license.status)} text-white`}>
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {license.usage_percentage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getUsageColor(license.usage_percentage)}`}>
                            {license.usage_percentage}%
                          </span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${license.usage_percentage < 50 ? 'bg-green-500' : license.usage_percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(license.usage_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(license.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedLicense(license);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => resendWelcomeEmail(license)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => revokeLicense(license.license_key)}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* License Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLicense && (
            <>
              <DialogHeader>
                <DialogTitle>License Details</DialogTitle>
                <DialogDescription>
                  Complete information for license {selectedLicense.license_key}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedLicense.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedLicense.customer_email}</p>
                    </div>
                    {selectedLicense.company_name && (
                      <div>
                        <Label className="text-muted-foreground">Company</Label>
                        <p className="font-medium">{selectedLicense.company_name}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Plan</Label>
                      <Badge variant="outline" className="capitalize mt-1">
                        {selectedLicense.plan_tier}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* License Information */}
                <div>
                  <h3 className="font-semibold mb-3">License Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge className={`${getStatusColor(selectedLicense.status)} text-white mt-1`}>
                        {selectedLicense.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="font-medium">{new Date(selectedLicense.created_at).toLocaleString()}</p>
                    </div>
                    {selectedLicense.activation_date && (
                      <div>
                        <Label className="text-muted-foreground">Activated</Label>
                        <p className="font-medium">{new Date(selectedLicense.activation_date).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedLicense.expiration_date && (
                      <div>
                        <Label className="text-muted-foreground">Expires</Label>
                        <p className="font-medium">{new Date(selectedLicense.expiration_date).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="font-semibold mb-3">Licensed Products</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLicense.products.map(product => (
                      <Badge key={product} variant="secondary">
                        {product.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Domains */}
                <div>
                  <h3 className="font-semibold mb-3">Allowed Domains</h3>
                  <div className="space-y-2">
                    {selectedLicense.allowed_domains.map(domain => (
                      <div key={domain} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-sm">{domain}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage Statistics */}
                {selectedLicense.usage_current && (
                  <div>
                    <h3 className="font-semibold mb-3">Usage Statistics</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedLicense.usage_current).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{value}</span>
                            {selectedLicense.usage_limits?.[key] && (
                              <>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">
                                  {selectedLicense.usage_limits[key] === -1 ? '∞' : selectedLicense.usage_limits[key]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {(selectedLicense.stripe_customer_id || selectedLicense.stripe_subscription_id) && (
                  <div>
                    <h3 className="font-semibold mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLicense.stripe_customer_id && (
                        <div>
                          <Label className="text-muted-foreground">Stripe Customer</Label>
                          <p className="font-mono text-sm">{selectedLicense.stripe_customer_id}</p>
                        </div>
                      )}
                      {selectedLicense.stripe_subscription_id && (
                        <div>
                          <Label className="text-muted-foreground">Subscription ID</Label>
                          <p className="font-mono text-sm">{selectedLicense.stripe_subscription_id}</p>
                        </div>
                      )}
                      {selectedLicense.total_revenue && (
                        <div>
                          <Label className="text-muted-foreground">Total Revenue</Label>
                          <p className="font-medium">${selectedLicense.total_revenue.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedLicense.last_payment && (
                        <div>
                          <Label className="text-muted-foreground">Last Payment</Label>
                          <p className="font-medium">${selectedLicense.last_payment.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => resendWelcomeEmail(selectedLicense)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Welcome Email
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit License
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600"
                    onClick={() => {
                      revokeLicense(selectedLicense.license_key);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Revoke License
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}