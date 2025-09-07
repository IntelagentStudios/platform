'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Shield,
  Key,
  Ban,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  CreditCard,
  Settings,
  FileText,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  RefreshCw,
  DollarSign
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  emailVerified: boolean;
  licenseKey: string;
  stripeCustomerId?: string;
  license?: {
    status: string;
    tier: string;
    products: number;
    expiresAt: string;
  };
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  newUsers: number;
  byTier: Record<string, number>;
}

export default function UserManagementClient() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    status: 'all',
    tier: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        action: 'list_users',
        filter: JSON.stringify(filter),
        limit: '100',
        offset: '0'
      });

      const response = await fetch(`/api/admin/users/management?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUsers(result.data.users || []);
          setStats(result.data.stats || null);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, params: any = {}) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/users/management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          params: { userId, ...params }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh users list
          await fetchUsers();
          setShowUserModal(false);
          alert(`${action} completed successfully`);
        } else {
          alert(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'suspended': return 'text-yellow-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500';
      case 'professional': return 'bg-blue-500';
      case 'starter': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New (30d)</p>
                <p className="text-2xl font-bold">{stats.newUsers}</p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
              <UserX className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filter.tier}
            onValueChange={(value) => setFilter({ ...filter, tier: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchUsers}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {user.licenseKey}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.license && (
                      <Badge className={getTierBadgeColor(user.license.tier)}>
                        {user.license.tier}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 ${getStatusColor(user.license?.status || 'unknown')}`}>
                      <CheckCircle className="h-4 w-4" />
                      {user.license?.status || 'No License'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {user.license?.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction('suspend_user', user.id, { reason: 'Admin action' })}
                        >
                          <Ban className="h-4 w-4 text-yellow-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction('activate_user', user.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      
                      {user.stripeCustomerId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`, '_blank')}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">User Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-gray-700">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-gray-700">{selectedUser.name || 'Not set'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">License Key</label>
                  <code className="block bg-gray-100 p-2 rounded">{selectedUser.licenseKey}</code>
                </div>

                {selectedUser.license && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Plan</label>
                      <p className="text-gray-700">{selectedUser.license.tier}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className={getStatusColor(selectedUser.license.status)}>
                        {selectedUser.license.status}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Expires</label>
                      <p className="text-gray-700">
                        {new Date(selectedUser.license.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => handleUserAction('get_user_activity', selectedUser.id)}
                    disabled={actionLoading}
                  >
                    View Activity
                  </Button>
                  
                  {selectedUser.license?.status === 'active' ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleUserAction('suspend_user', selectedUser.id, { reason: 'Admin action' })}
                      disabled={actionLoading}
                    >
                      Suspend User
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleUserAction('activate_user', selectedUser.id)}
                      disabled={actionLoading}
                    >
                      Activate User
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}