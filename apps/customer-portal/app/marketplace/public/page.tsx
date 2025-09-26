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
  CurrencyPoundIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  features: string[];
  popular: boolean;
  badge?: string;
  icon: any;
  color: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'sales-pro',
    name: 'Sales Pro Agent',
    description: 'Complete sales automation with AI-powered outreach and CRM integration',
    category: 'sales',
    price: 299,
    rating: 4.8,
    reviews: 234,
    features: ['Email Automation', 'Lead Scoring', 'CRM Sync', 'Analytics'],
    popular: true,
    badge: 'Popular',
    icon: ChartBarIcon,
    color: 'blue'
  },
  {
    id: 'support-hero',
    name: 'Support Hero',
    description: '24/7 customer support automation with intelligent ticket routing',
    category: 'support',
    price: 199,
    rating: 4.9,
    reviews: 189,
    features: ['Auto Responses', 'Ticket Routing', 'Sentiment Analysis', 'Multi-channel'],
    popular: true,
    icon: ChatBubbleLeftRightIcon,
    color: 'green'
  },
  {
    id: 'marketing-genius',
    name: 'Marketing Genius',
    description: 'AI-powered content creation and campaign management',
    category: 'marketing',
    price: 249,
    rating: 4.7,
    reviews: 156,
    features: ['Content Generation', 'SEO Optimization', 'Social Media', 'Email Campaigns'],
    popular: false,
    icon: SparklesIcon,
    color: 'purple'
  },
  {
    id: 'data-wizard',
    name: 'Data Analytics Wizard',
    description: 'Advanced analytics and reporting with predictive insights',
    category: 'analytics',
    price: 399,
    rating: 4.6,
    reviews: 98,
    features: ['Real-time Analytics', 'Custom Reports', 'Predictions', 'Data Visualization'],
    popular: false,
    badge: 'Pro',
    icon: ChartBarIcon,
    color: 'orange'
  },
  {
    id: 'security-guardian',
    name: 'Security Guardian',
    description: 'Comprehensive security monitoring and threat detection',
    category: 'security',
    price: 449,
    rating: 4.9,
    reviews: 67,
    features: ['Threat Detection', 'Compliance Monitoring', 'Audit Logs', 'Access Control'],
    popular: false,
    badge: 'Enterprise',
    icon: ShieldCheckIcon,
    color: 'red'
  },
  {
    id: 'integration-hub',
    name: 'Integration Hub',
    description: 'Connect all your tools and automate workflows seamlessly',
    category: 'integration',
    price: 179,
    rating: 4.5,
    reviews: 312,
    features: ['API Connections', 'Webhook Management', 'Data Sync', 'Workflow Automation'],
    popular: true,
    icon: CloudIcon,
    color: 'cyan'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: CubeIcon },
  { id: 'sales', name: 'Sales & CRM', icon: ChartBarIcon },
  { id: 'support', name: 'Customer Support', icon: ChatBubbleLeftRightIcon },
  { id: 'marketing', name: 'Marketing', icon: SparklesIcon },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'integration', name: 'Integrations', icon: CloudIcon }
];

export default function PublicMarketplacePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch marketplace data
    Promise.all([
      fetch('/api/marketplace/agents').then(res => res.json()),
      fetch('/api/marketplace/templates').then(res => res.json()),
      fetch('/api/auth/check-session').then(res => res.json())
    ])
      .then(([agentsData, templatesData, authData]) => {
        if (agentsData.success) {
          setAgents(agentsData.agents || PRODUCTS);
        }
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }
        setIsLoggedIn(authData.authenticated || false);
        setUserIndustry(agentsData.userContext?.industry || authData.industry || null);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching marketplace data:', error);
        setAgents(PRODUCTS);
        setLoading(false);
      });
  }, []);

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.reviews - a.reviews;
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Get personalized recommendations for logged-in users
  const getRecommendations = () => {
    if (!isLoggedIn) return [];

    // Simple recommendation logic based on industry
    if (userIndustry === 'ecommerce') {
      return ['sales-pro', 'marketing-genius', 'data-wizard'];
    } else if (userIndustry === 'technology') {
      return ['security-guardian', 'integration-hub', 'data-wizard'];
    } else if (userIndustry === 'services') {
      return ['support-hero', 'sales-pro', 'integration-hub'];
    }
    return ['sales-pro', 'support-hero', 'marketing-genius'];
  };

  const recommendedIds = getRecommendations();
  const recommendedProducts = PRODUCTS.filter(p => recommendedIds.includes(p.id));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}
      <header className="shadow-sm border-b sticky top-0 z-10" style={{
        backgroundColor: 'rgba(58, 64, 64, 0.95)',
        borderColor: 'rgba(169, 189, 203, 0.15)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingBagIcon className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                <span className="text-xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>AI Marketplace</span>
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/marketplace/public"
                  className="font-medium pb-1 border-b-2"
                  style={{
                    color: 'rgb(229, 227, 220)',
                    borderColor: 'rgba(169, 189, 203, 0.5)'
                  }}
                >
                  Marketplace
                </Link>
                <Link
                  href="/custom-products"
                  className="font-medium hover:opacity-80"
                  style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                >
                  Custom Products
                </Link>
                {isLoggedIn && (
                  <>
                    <Link
                      href="/dashboard"
                      className="font-medium hover:opacity-80"
                      style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/agent-builder"
                      className="font-medium hover:opacity-80"
                      style={{ color: 'rgba(169, 189, 203, 0.8)' }}
                    >
                      Agent Builder
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:opacity-80 transition" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(229, 227, 220)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}>
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-4 py-2 rounded-lg hover:opacity-80 transition" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(229, 227, 220)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16" style={{
        background: 'linear-gradient(135deg, rgba(58, 64, 64, 0.8) 0%, rgba(48, 54, 54, 0.9) 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            AI Agent Marketplace
          </h1>
          <p className="text-xl mb-8" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>
            Pre-built AI agents ready to transform your business
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
              <input
                type="text"
                placeholder="Search for agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: 'rgba(48, 54, 54, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.3)',
                  color: 'rgb(229, 227, 220)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" style={{ color: 'rgba(169, 189, 203, 0.8)' }} />
            <span style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Filter by:</span>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  selectedCategory === cat.id ? 'ring-1' : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id
                    ? 'rgba(169, 189, 203, 0.2)'
                    : 'rgba(58, 64, 64, 0.5)',
                  color: selectedCategory === cat.id
                    ? 'rgb(229, 227, 220)'
                    : 'rgba(169, 189, 203, 0.8)',
                  borderColor: 'rgba(169, 189, 203, 0.3)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                borderColor: 'rgba(169, 189, 203, 0.3)',
                color: 'rgb(229, 227, 220)'
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {isLoggedIn && recommendedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedProducts.map(product => (
                <div
                  key={product.id}
                  className="rounded-lg border p-6 hover:shadow-lg transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    borderColor: 'rgba(169, 189, 203, 0.15)'
                  }}
                  onClick={() => router.push(`/marketplace/agent/${product.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <product.icon className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                    {product.badge && (
                      <span className="px-2 py-1 text-xs rounded-full" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(229, 227, 220)'
                      }}>
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      £{product.price}
                      <span className="text-sm font-normal" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        /month
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} />
                      <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Products Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
            {selectedCategory === 'all' ? 'All Agents' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="rounded-lg border p-6 hover:shadow-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  borderColor: 'rgba(169, 189, 203, 0.15)'
                }}
                onClick={() => router.push(`/marketplace/agent/${product.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <product.icon className="w-8 h-8" style={{ color: 'rgb(169, 189, 203)' }} />
                  {product.badge && (
                    <span className="px-2 py-1 text-xs rounded-full" style={{
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(229, 227, 220)'
                    }}>
                      {product.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                  {product.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                  {product.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: 'rgba(48, 54, 54, 0.5)',
                        color: 'rgba(169, 189, 203, 0.8)',
                        border: '1px solid rgba(169, 189, 203, 0.15)'
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                    £{product.price}
                    <span className="text-sm font-normal" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      /month
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} />
                    <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}