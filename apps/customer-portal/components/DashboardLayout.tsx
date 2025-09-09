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
  MessageCircle,
  Cpu,
  ChevronRight
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed
  const [isHovering, setIsHovering] = useState(false);
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
    { id: 'dashboard', label: 'Overview', icon: Home, path: '/dashboard' },
    { id: 'platform', label: 'Platform', icon: Cpu, path: '/platform' },
    { id: 'products', label: 'Products', icon: Package, path: '/products' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const navigate = (path: string) => {
    router.push(path);
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    for (let i = 0; i < paths.length; i++) {
      const path = '/' + paths.slice(0, i + 1).join('/');
      const label = paths[i].charAt(0).toUpperCase() + paths[i].slice(1).replace(/-/g, ' ');
      breadcrumbs.push({ label, path });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Sidebar Navigation - Fixed position */}
      <aside 
        className={`${(sidebarCollapsed && !isHovering) ? 'w-20' : 'w-64'} fixed left-0 top-0 h-full z-40 transition-all duration-300`} 
        style={{ backgroundColor: 'rgb(58, 64, 64)' }} // Slightly lighter than main background
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(169, 189, 203, 0.15)' }}>
              <Shield className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            {(!sidebarCollapsed || isHovering) && (
              <div>
                <h2 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  Intelagent
                </h2>
                <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  {user?.license_type === 'pro_platform' ? 'Pro Platform' : 'Platform'}
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
                  {(!sidebarCollapsed || isHovering) && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div 
          className={`absolute bottom-0 ${(sidebarCollapsed && !isHovering) ? 'w-20' : 'w-64'} p-4 border-t transition-all`} 
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
            className={`w-full flex items-center ${(sidebarCollapsed && !isHovering) ? 'justify-center' : 'justify-center space-x-2'} px-4 py-2 rounded-lg transition hover:opacity-80`}
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

      {/* Main Content Area - Add margin for fixed sidebar */}
      <main className={`flex-1 overflow-y-auto ${(sidebarCollapsed && !isHovering) ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {/* Breadcrumbs - Sticky position */}
        {breadcrumbs.length > 0 && (
          <div className="sticky top-0 z-30 px-8 py-3 border-b backdrop-blur-sm" style={{ 
            borderColor: 'rgba(169, 189, 203, 0.1)',
            backgroundColor: 'rgba(58, 64, 64, 0.95)'
          }}>
            <div className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 mx-2" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  )}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={`hover:underline transition ${
                      index === breadcrumbs.length - 1 ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      color: index === breadcrumbs.length - 1 
                        ? 'rgb(229, 227, 220)' 
                        : 'rgba(169, 189, 203, 0.8)'
                    }}
                  >
                    {crumb.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}