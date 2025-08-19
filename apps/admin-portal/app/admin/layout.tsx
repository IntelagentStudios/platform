'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Activity, 
  Server, 
  AlertTriangle,
  Users,
  BarChart3,
  Bug,
  Settings,
  Database,
  Zap,
  Shield,
  FileText,
  Globe,
  DollarSign,
  CreditCard,
  TrendingUp,
  Brain,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { 
    title: 'Dashboard',
    items: [
      { name: 'Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Insights', href: '/admin/insights', icon: Brain },
    ]
  },
  {
    title: 'Business',
    items: [
      { name: 'Finances', href: '/admin/billing', icon: DollarSign },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Teams', href: '/admin/teams', icon: Users },
      { name: 'Usage & Billing', href: '/admin/usage', icon: CreditCard },
    ]
  },
  {
    title: 'Compliance & Security',
    items: [
      { name: 'Compliance', href: '/admin/compliance', icon: Shield },
      { name: 'Security Center', href: '/admin/security', icon: Shield },
      { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
    ]
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'Server Health', href: '/admin/health', icon: Activity },
      { name: 'Services', href: '/admin/services', icon: Server },
      { name: 'Queue Monitor', href: '/admin/queues', icon: Zap },
      { name: 'Database', href: '/admin/database', icon: Database },
      { name: 'Errors & Alerts', href: '/admin/errors', icon: AlertTriangle },
    ]
  },
  {
    title: 'Developer',
    items: [
      { name: 'Debug Tools', href: '/admin/debug', icon: Bug },
      { name: 'Integrations', href: '/admin/integrations', icon: Globe },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Dashboard', 'Business']);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <nav className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Portal
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enterprise Control
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="p-3">
            {navigation.map((section) => (
              <div key={section.title} className="mb-4">
                {sidebarOpen && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-2 py-1 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {section.title}
                    {expandedSections.includes(section.title) ? 
                      <ChevronDown className="w-3 h-3" /> : 
                      <ChevronRight className="w-3 h-3" />
                    }
                  </button>
                )}
                {(sidebarOpen ? expandedSections.includes(section.title) : true) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || 
                                     (item.href !== '/admin' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          title={!sidebarOpen ? item.name : undefined}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            isActive 
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                            !sidebarOpen && "justify-center"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", !sidebarOpen && "w-5 h-5")} />
                          {sidebarOpen && item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}