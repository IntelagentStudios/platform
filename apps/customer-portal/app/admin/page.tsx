'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  BarChart3,
  Settings,
  Database,
  Shield,
  Activity,
  FileText,
  Key,
  CreditCard,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

export default function AdminPortal() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check admin authorization
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user?.role === 'master_admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          router.push('/dashboard');
        }
      })
      .catch(() => {
        setIsAuthorized(false);
        router.push('/dashboard');
      });
  }, [router]);

  if (isAuthorized === null) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
               style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const adminSections = [
    {
      title: 'Platform Management',
      description: 'Core platform administration tools',
      items: [
        {
          icon: BarChart3,
          title: 'Master Dashboard',
          description: 'Platform-wide analytics and metrics',
          href: '/admin/dashboard',
          color: '#4CAF50'
        },
        {
          icon: Users,
          title: 'Customer Management',
          description: 'Manage all customer accounts',
          href: '/admin/dashboard?tab=customers',
          color: '#2196F3'
        },
        {
          icon: CreditCard,
          title: 'Billing & Subscriptions',
          description: 'Manage billing and payments',
          href: '/admin/billing',
          color: '#FF9800'
        }
      ]
    },
    {
      title: 'System Administration',
      description: 'Technical administration and monitoring',
      items: [
        {
          icon: Database,
          title: 'Database Management',
          description: 'Direct database operations',
          href: '/admin/database',
          color: '#9C27B0'
        },
        {
          icon: Activity,
          title: 'System Monitoring',
          description: 'API usage and system health',
          href: '/admin/monitoring',
          color: '#00BCD4'
        },
        {
          icon: Key,
          title: 'License Management',
          description: 'Create and manage licenses',
          href: '/admin/licenses',
          color: '#795548'
        }
      ]
    },
    {
      title: 'Support Tools',
      description: 'Customer support and debugging',
      items: [
        {
          icon: MessageSquare,
          title: 'View All Conversations',
          description: 'Access any customer\'s chatbot logs',
          href: '/admin/conversations',
          color: '#E91E63'
        },
        {
          icon: FileText,
          title: 'Audit Logs',
          description: 'View all system audit trails',
          href: '/admin/audit',
          color: '#607D8B'
        },
        {
          icon: Shield,
          title: 'Security Settings',
          description: 'Platform security configuration',
          href: '/admin/security',
          color: '#F44336'
        }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
            Admin Portal
          </h1>
          <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
            Master administration tools for the Intelagent Platform
          </p>
        </div>

        {/* Admin Sections */}
        {adminSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                {section.title}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                {section.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(item.href)}
                  className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    borderColor: 'rgba(169, 189, 203, 0.2)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color
                        }}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 mt-1" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Stats */}
        <div className="mt-8 p-4 rounded-lg" style={{
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" style={{ color: '#4CAF50' }} />
            <span className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
              Admin Access Active
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
            You have full administrative privileges. All actions are logged for security.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}