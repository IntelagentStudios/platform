'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductMarketplace from '@/components/ProductMarketplace';
import { 
  CubeIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/solid';

export default function ProductsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProductActivated = (product: any) => {
    // Refresh the marketplace to show updated status
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <CubeIcon className="w-8 h-8 mr-3 text-blue-500" />
                Products
              </h1>
              <p className="text-gray-400 mt-1">
                Manage and activate AI products for your business
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/products/customize?type=custom'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Custom
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 mb-6 border border-blue-500/20">
          <div className="flex items-start">
            <SparklesIcon className="w-6 h-6 text-blue-400 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">
                Modular Product System
              </h3>
              <p className="text-gray-300 text-sm">
                Each product is built with a modular skill system. You can customize products by adding or removing skills,
                with transparent pricing based on your selection. Core skills are included in the base price.
              </p>
            </div>
          </div>
        </div>

        {/* Product Marketplace */}
        <ProductMarketplace 
          key={refreshKey}
          onProductActivated={handleProductActivated}
        />
      </div>
    </DashboardLayout>
  );
}