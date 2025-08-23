'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Shield, 
  Package, 
  LogOut, 
  Users,
  BarChart3,
  Home,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get user data
    fetch('/api/auth/secure')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          // Try sessionStorage
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/secure', { method: 'DELETE' });
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'products', label: 'Products', icon: Package, path: '/products' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Sidebar Navigation - More subtle colors */}
      <aside 
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'} min-h-screen transition-all duration-300 relative`} 
        style={{ backgroundColor: 'rgb(58, 64, 64)' }} // Slightly lighter than main background
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 p-1 rounded-full transition hover:opacity-80"
          style={{ 
            backgroundColor: 'rgb(73, 90, 88)',
            border: '1px solid rgba(169, 189, 203, 0.2)'
          }}
        >
          <ChevronLeft 
            className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} 
            style={{ color: 'rgb(169, 189, 203)' }}
          />
        </button>

        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(169, 189, 203, 0.15)' }}>
              <Shield className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Intelagent
                </h2>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Pro Platform
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-opacity-10"
                  style={{
                    backgroundColor: pathname === item.path ? 'rgba(169, 189, 203, 0.1)' : 'transparent',
                    color: pathname === item.path ? 'rgb(229, 227, 220)' : 'rgba(229, 227, 220, 0.7)'
                  }}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div 
          className={`absolute bottom-0 ${sidebarCollapsed ? 'w-20' : 'w-64'} p-4 border-t transition-all`} 
          style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                  {user?.name || 'Harry'}
                </p>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  {user?.role || 'Owner'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center space-x-2'} px-4 py-2 rounded-lg transition hover:opacity-80`}
            style={{ 
              backgroundColor: 'rgba(169, 189, 203, 0.05)',
              border: '1px solid rgba(169, 189, 203, 0.2)',
              color: 'rgba(229, 227, 220, 0.9)'
            }}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}