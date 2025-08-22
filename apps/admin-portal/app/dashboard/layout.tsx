'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  CreditCard,
  FileText,
  Settings,
  Activity
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Licenses',
    href: '/dashboard/licenses',
    icon: Users
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: Package
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard
  },
  {
    title: 'Activity',
    href: '/dashboard/activity',
    icon: Activity
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
      subtitle="Master Admin Dashboard"
    >
      {children}
    </SidebarLayout>
  );
}