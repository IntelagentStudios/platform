'use client';

import SidebarLayout from '@/components/layout/sidebar-layout-old';
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
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Licenses',
    href: '/admin/dashboard/licenses',
    icon: Users
  },
  {
    title: 'Products',
    href: '/admin/dashboard/products',
    icon: Package
  },
  {
    title: 'Analytics',
    href: '/admin/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'Billing',
    href: '/admin/dashboard/billing',
    icon: CreditCard
  },
  {
    title: 'Activity',
    href: '/admin/dashboard/activity',
    icon: Activity
  },
  {
    title: 'Reports',
    href: '/admin/dashboard/reports',
    icon: FileText
  },
  {
    title: 'Settings',
    href: '/admin/dashboard/settings',
    icon: Settings
  }
];

export default function AdminDashboardLayout({
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