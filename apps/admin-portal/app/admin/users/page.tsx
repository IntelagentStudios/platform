'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
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
  RefreshCw
} from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'moderator' | 'support';
  status: 'active' | 'suspended' | 'banned' | 'pending';
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  lastActivity: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
  usage: {
    apiCalls: number;
    storage: number;
    bandwidth: number;
  };
  metadata: {
    ip: string;
    country: string;
    device: string;
    browser: string;
  };
  permissions: string[];
  licenses: number;
  sessions: number;
}

interface UserStats {
  total: number;
  active: number;
  new: number;
  suspended: number;
  growth: number;
  byRole: Record<string, number>;
  byPlan: Record<string, number>;
  byCountry: Record<string, number>;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({
    search: '',
    role: 'all',
    status: 'all',
    plan: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams(filter as any);
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (response.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch(`/api/admin/users/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(bulkSelection) }),
      });
      
      if (response.ok) {
        setBulkSelection(new Set());
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { token } = await response.json();
        // Open in new tab with impersonation token
        window.open(`/?impersonate=${token}`, '_blank');
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error);
    }
  };

  const handleExportGDPR = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/export-gdpr`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-${userId}-gdpr-export.json`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export GDPR data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'support':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleBulkSelection = (userId: string) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setBulkSelection(newSelection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user accounts, permissions, and access control
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </header>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{stats?.growth || 0}% this month
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.active || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">New Users</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.new || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">This week</p>
            </div>
            <UserPlus className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.suspended || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Require review</p>
            </div>
            <UserX className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="support">Support</option>
            <option value="user">User</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filter.plan}
            onChange={(e) => setFilter({ ...filter, plan: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {bulkSelection.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {bulkSelection.size} selected
              </span>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
              <button
                onClick={() => setBulkSelection(new Set())}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          )}

          <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={bulkSelection.size === users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelection(new Set(users.map(u => u.id)));
                      } else {
                        setBulkSelection(new Set());
                      }
                    }}
                  />
                </th>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Plan</th>
                <th className="text-left py-3 px-4">Last Activity</th>
                <th className="text-left py-3 px-4">Usage</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={bulkSelection.has(user.id)}
                      onChange={() => toggleBulkSelection(user.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {user.emailVerified && (
                          <span title="Email verified">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </span>
                        )}
                        {user.twoFactorEnabled && (
                          <span title="2FA enabled">
                            <Shield className="w-4 h-4 text-blue-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium">
                        {user.subscription?.plan || 'Free'}
                      </p>
                      {user.subscription && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p>{new Date(user.lastActivity).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.lastActivity).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p>{user.usage.apiCalls} API calls</p>
                      <p className="text-xs text-gray-500">
                        {Math.round(user.usage.storage / 1024 / 1024)}MB storage
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Impersonate"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="p-1 text-yellow-600 hover:text-yellow-700"
                          title="Suspend"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Activate"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <Card className="w-full max-w-3xl max-h-[90vh] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">User Details</h2>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-20 h-20 rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">User ID</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedUser.id)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Last Login</label>
                  <p className="text-sm">{new Date(selectedUser.lastLogin).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Last Activity</label>
                  <p className="text-sm">{new Date(selectedUser.lastActivity).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Sessions</label>
                  <p className="text-sm">{selectedUser.sessions} active</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Licenses</label>
                  <p className="text-sm">{selectedUser.licenses}</p>
                </div>
              </div>

              {/* Security */}
              <div>
                <h4 className="font-semibold mb-2">Security</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    {selectedUser.emailVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Two-Factor Authentication</span>
                    {selectedUser.twoFactorEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h4 className="font-semibold mb-2">Connection Info</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500">IP Address</label>
                    <p>{selectedUser.metadata.ip}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Country</label>
                    <p>{selectedUser.metadata.country}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Device</label>
                    <p>{selectedUser.metadata.device}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Browser</label>
                    <p>{selectedUser.metadata.browser}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  onClick={() => handleImpersonate(selectedUser.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Impersonate User
                </button>
                
                <button
                  onClick={() => handleExportGDPR(selectedUser.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Export GDPR Data
                </button>
                
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'reset-password')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Reset Password
                </button>
                
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser.id, 'activate')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Activate Account
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}