'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle>Admin Portal Access</CardTitle>
          <CardDescription>
            The admin portal is a separate application for master administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>For Master Admins:</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The admin portal should be deployed separately. Please contact your system administrator for the correct URL.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>For Customers:</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you're a customer, you're in the right place!
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/validate-license">
              <Button className="w-full">
                Customer Portal Login
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                  Setup Instructions
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-2">
              <p>
                <strong>Deployment Note:</strong> The admin portal should be deployed as a separate Railway service or on a different subdomain.
              </p>
              <p>
                Suggested setup:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Customer Portal: dashboard.intelagentstudios.com</li>
                <li>Admin Portal: admin.intelagentstudios.com</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}