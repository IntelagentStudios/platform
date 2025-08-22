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
  subtitle = 'Dashboard',
  headerActions
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-gray-900 dark:text-gray-100" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
          "fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40",
          !sidebarOpen && "-translate-x-full"
        )}
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive 
                      ? "text-white dark:text-gray-900" 
                      : "text-gray-500 dark:text-gray-400"
                  )} />
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
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
          "pt-16 transition-all duration-300",
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