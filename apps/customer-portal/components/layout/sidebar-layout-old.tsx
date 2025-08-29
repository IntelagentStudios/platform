'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  items: SidebarItem[];
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function SidebarLayout({
  children,
  items,
  title = 'Intelagent Platform',
  subtitle = 'Customer Portal',
  headerActions
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Check if this is admin or customer
      const isAdmin = pathname.startsWith('/admin');
      
      if (isAdmin) {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        router.push('/admin/login');
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/validate-license');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(229, 227, 220)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b z-50" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(48, 54, 54, 0.1)' }}>
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgb(48, 54, 54)' }}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'rgb(48, 54, 54)' }}>
                {title}
              </h1>
              <p className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              style={{ color: 'rgb(48, 54, 54)' }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 w-64 border-r transition-transform duration-300 z-40",
          !sidebarOpen && "-translate-x-full"
        )}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(48, 54, 54, 0.1)' }}
      >
        <nav className="h-full py-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group"
                  style={{
                    backgroundColor: isActive ? 'rgb(48, 54, 54)' : 'transparent',
                    color: isActive ? 'rgb(229, 227, 220)' : 'rgb(48, 54, 54)'
                  }}
                >
                  <Icon 
                    className="h-5 w-5"
                    style={{ color: isActive ? 'rgb(229, 227, 220)' : 'rgba(48, 54, 54, 0.7)' }}
                  />
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: 'rgba(48, 54, 54, 0.1)', color: 'rgb(48, 54, 54)' }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={cn(
                    "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive && "opacity-100"
                  )} />
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300 min-h-screen",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}