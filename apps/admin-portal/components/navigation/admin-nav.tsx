'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  Server,
  BarChart3,
  Settings,
  Package,
  Activity,
  AlertTriangle,
  Database,
  Zap,
  Globe
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Finances',
    href: '/admin/billing',
    icon: CreditCard,
  },
  {
    name: 'Compliance',
    href: '/admin/compliance',
    icon: Shield,
  },
  {
    name: 'Server',
    href: '/admin/health',
    icon: Server,
  },
  {
    name: 'Services',
    href: '/admin/services',
    icon: Package,
  },
  {
    name: 'Queues',
    href: '/admin/queues',
    icon: Zap,
  },
  {
    name: 'Errors',
    href: '/admin/errors',
    icon: AlertTriangle,
  },
  {
    name: 'Debug',
    href: '/admin/debug',
    icon: Activity,
  },
  {
    name: 'Teams',
    href: '/admin/teams',
    icon: Users,
  },
  {
    name: 'Integrations',
    href: '/admin/integrations',
    icon: Globe,
  },
  {
    name: 'Usage',
    href: '/admin/usage',
    icon: Database,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}