'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Activity, 
  Server, 
  AlertTriangle,
  User,
  BarChart3,
  Bug,
  Settings,
  Database,
  Zap,
  FileCheck,
  FileText,
  Globe,
  PoundSterling,
  CreditCard,
  TrendingUp,
  Brain,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Shield,
  Package
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
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Finances', href: '/admin/billing', icon: PoundSterling },
      { name: 'Users', href: '/admin/users', icon: User },
      { name: 'Usage & Billing', href: '/admin/usage', icon: CreditCard },
    ]
  },
  {
    title: 'Compliance & Security',
    items: [
      { name: 'Compliance', href: '/admin/compliance', icon: FileCheck },
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
    <div className="flex h-screen bg-background">
      <nav className={cn(
        "bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-full overflow-y-auto bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Admin Portal
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Enterprise Control
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
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
                    className="flex items-center justify-between w-full px-2 py-1 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
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
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
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

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="h-full">
          <div className="border-b border-border bg-card">
            <div className="px-6 py-3">
              <Breadcrumb />
            </div>
          </div>
          <div className="bg-background">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}