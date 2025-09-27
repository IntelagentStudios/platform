'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CubeIcon,
  SparklesIcon,
  ShoppingBagIcon,
  TagIcon,
  StarIcon,
  ArrowRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BoltIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CloudIcon,
  CurrencyPoundIcon,
  CogIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/DashboardLayout';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  features: string[];
  popular: boolean;
  badge?: string;
  icon: any;
  color: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Intelligent chatbot with natural language understanding and custom knowledge base',
    category: 'support',
    price: 349,
    features: ['Custom Training', 'Multi-channel', 'Knowledge Base', 'Analytics Dashboard'],
    popular: true,
    badge: 'Active',
    icon: ChatBubbleLeftRightIcon,
    color: 'rgb(169, 189, 203)'
  },
  {
    id: 'sales-outreach',
    name: 'Sales Outreach Agent',
    description: 'Automated sales outreach with personalized email campaigns and lead management',
    category: 'sales',
    price: 649,
    features: ['Email Automation', 'Lead Scoring', 'CRM Integration', 'Campaign Analytics'],
    popular: true,
    badge: 'Active',
    icon: UserGroupIcon,
    color: 'rgb(169, 189, 203)'
  },
  {
    id: 'operations',
    name: 'Operations Agent',
    description: 'Streamline business operations with automated workflows and process optimization',
    category: 'automation',
    price: 549,
    features: ['Workflow Automation', 'Task Management', 'Process Optimization', 'Performance Monitoring'],
    popular: false,
    badge: 'New',
    icon: CogIcon,
    color: 'rgb(169, 189, 203)'
  },
  {
    id: 'data',
    name: 'Data Agent',
    description: 'Advanced data processing, analysis, and insights generation for informed decision-making',
    category: 'analytics',
    price: 449,
    features: ['Data Processing', 'Real-time Analytics', 'Custom Reports', 'Predictive Insights'],
    popular: false,
    badge: 'New',
    icon: CircleStackIcon,
    color: 'rgb(169, 189, 203)'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Products', count: 4 },
  { id: 'sales', name: 'Sales', count: 1 },
  { id: 'support', name: 'Support', count: 1 },
  { id: 'automation', name: 'Automation', count: 1 },
  { id: 'analytics', name: 'Analytics', count: 1 },
];

export default function MarketplacePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price'>('popular');
  const [priceRange, setPriceRange] = useState<'all' | 'under200' | '200-300' | 'over300'>('all');

  const filteredProducts = PRODUCTS
    .filter(product => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !product.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (priceRange === 'under200' && product.price >= 200) return false;
      if (priceRange === '200-300' && (product.price < 200 || product.price > 649)) return false;
      if (priceRange === 'over300' && product.price <= 649) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.popular ? 1 : -1;
      if (sortBy === 'price') return a.price - b.price;
      return 0;
    });

  return (
    <DashboardLayout>
      {/* Top Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              AI Marketplace
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Discover pre-built AI agents ready to transform your business
            </p>
          </div>
          <button
            onClick={() => router.push('/agent-builder/demo')}
            className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2"
            style={{
              backgroundColor: 'rgb(169, 189, 203)',
              color: 'white'
            }}
          >
            <SparklesIcon className="h-5 w-5" />
            Build Custom Agent
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Search and Filters */}
        <div className="mb-8 p-4 rounded-lg" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.15)'
        }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(48, 54, 54, 0.5)',
                    borderColor: 'rgba(169, 189, 203, 0.3)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'rgba(48, 54, 54, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.3)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="price">Price: Low to High</option>
            </select>

            {/* Price Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'rgba(48, 54, 54, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.3)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <option value="all">All Prices</option>
              <option value="under200">Under £200</option>
              <option value="200-300">£200 - £649</option>
              <option value="over300">Over £649</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Categories Sidebar */}
          <div className="w-64 flex-shrink-0">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Categories
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedCategory === category.id ? '' : ''
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id
                      ? 'rgba(169, 189, 203, 0.1)'
                      : 'transparent',
                    borderLeft: selectedCategory === category.id
                      ? '3px solid rgb(169, 189, 203)'
                      : '3px solid transparent',
                    color: selectedCategory === category.id
                      ? 'rgb(229, 227, 220)'
                      : 'rgba(169, 189, 203, 0.8)'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <span className="text-sm px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgba(169, 189, 203, 0.8)'
                      }}>
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Showing {filteredProducts.length} agents
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="rounded-xl border hover:shadow-lg transition-all group cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    borderColor: 'rgba(169, 189, 203, 0.15)'
                  }}
                  onClick={() => router.push(`/marketplace/agent/${product.id}`)}
                >
                  <div className="p-6">
                    {/* Badge */}
                    {product.badge && (
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.1)',
                            color: 'rgb(169, 189, 203)'
                          }}>
                          {product.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)'
                      }}>
                        <product.icon className="h-8 w-8" style={{ color: product.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:opacity-80 transition"
                          style={{ color: 'rgb(229, 227, 220)' }}>
                          {product.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.1)',
                            color: 'rgba(229, 227, 220, 0.8)'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-4 border-t"
                      style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                      <div>
                        <span className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                          £{product.price}
                        </span>
                        <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                          /month
                        </span>
                      </div>
                      <button
                        className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2"
                        style={{
                          backgroundColor: 'rgb(169, 189, 203)',
                          color: 'white'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/billing?product=${product.id}`);
                        }}
                      >
                        Get Started
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBagIcon className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  No agents found
                </h3>
                <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}