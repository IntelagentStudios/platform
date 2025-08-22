'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { 
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Webhook,
  Key,
  HelpCircle
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: MessageSquare
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key
  },
  {
    title: 'Webhooks',
    href: '/dashboard/webhooks',
    icon: Webhook
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  },
  {
    title: 'Support',
    href: '/dashboard/support',
    icon: HelpCircle
  }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout
      items={sidebarItems}
      title="Intelagent Platform"
      subtitle="Customer Portal"
    >
      {children}
    </SidebarLayout>
  );
}