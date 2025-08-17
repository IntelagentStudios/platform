import { ReactNode } from 'react';
import Link from 'next/link';
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
  GitBranch,
  Package,
  Terminal,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'System Health', href: '/admin/health', icon: Activity },
  { name: 'Services', href: '/admin/services', icon: Server },
  { name: 'Errors & Alerts', href: '/admin/errors', icon: AlertTriangle },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Debug Tools', href: '/admin/debug', icon: Bug },
  { name: 'Queue Monitor', href: '/admin/queues', icon: Zap },
  { name: 'Database', href: '/admin/database', icon: Database },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  { name: 'API Gateway', href: '/admin/api', icon: Globe },
  { name: 'Deployments', href: '/admin/deployments', icon: GitBranch },
  { name: 'Packages', href: '/admin/packages', icon: Package },
  { name: 'Terminal', href: '/admin/terminal', icon: Terminal },
  { name: 'Resources', href: '/admin/resources', icon: Cpu },
  { name: 'Storage', href: '/admin/storage', icon: HardDrive },
  { name: 'Network', href: '/admin/network', icon: Wifi },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Master Admin
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enterprise Control Center
            </p>
          </div>
          
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
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