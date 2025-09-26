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
    badge: 'Best Seller',
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
    reviews: 456,
    features: ['Ticket Management', 'Auto-Response', 'Knowledge Base', 'Sentiment Analysis'],
    popular: true,
    badge: 'Top Rated',
    icon: ChatBubbleLeftRightIcon,
    color: 'green'
  },
  {
    id: 'marketing-genius',
    name: 'Marketing Genius',
    description: 'Content creation and campaign management powered by AI',
    category: 'marketing',
    price: 249,
    rating: 4.7,
    reviews: 189,
    features: ['Content Generation', 'SEO Optimization', 'Social Media', 'Campaign Tracking'],
    popular: false,
    icon: SparklesIcon,
    color: 'purple'
  },
  {
    id: 'data-wizard',
    name: 'Data Wizard',
    description: 'Advanced analytics and reporting with predictive insights',
    category: 'analytics',
    price: 399,
    rating: 4.6,
    reviews: 98,
    features: ['Data Analysis', 'Custom Reports', 'Predictive Analytics', 'Dashboard Builder'],
    popular: false,
    badge: 'Pro',
    icon: ChartBarIcon,
    color: 'indigo'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingBagIcon className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AI Marketplace</span>
              </Link>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/marketplace/public" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                >
                  Marketplace
                </Link>
                <Link 
                  href="/custom-products" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Custom Products
                </Link>
                {isLoggedIn && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      My Dashboard
                    </Link>
                    <Link 
                      href="/agent-builder" 
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Build Agent
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Welcome back!</span>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              {isLoggedIn ? 'Your Personalized AI Marketplace' : 'AI Agent Marketplace'}
            </h1>
            <p className="text-xl opacity-90 mb-8">
              {isLoggedIn 
                ? `Recommended solutions for ${userIndustry || 'your business'}`
                : 'Pre-built AI agents ready to transform your business'
              }
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for AI agents, features, or use cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Recommendations for logged-in users */}
            {isLoggedIn && recommendedProducts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
                  <span className="text-sm text-gray-500">Based on your industry</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {recommendedProducts.map(product => {
                    const Icon = product.icon;
                    return (
                      <div
                        key={product.id}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                        onClick={() => router.push(`/marketplace/product/${product.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Icon className="w-8 h-8 text-blue-600" />
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">£{product.price}/mo</span>
                          <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Products' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const Icon = product.icon;
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-200"
                    onClick={() => router.push(`/marketplace/product/${product.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 bg-${product.color}-100 rounded-lg`}>
                          <Icon className={`w-8 h-8 text-${product.color}-600`} />
                        </div>
                        {product.badge && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.badge === 'Best Seller' ? 'bg-green-100 text-green-800' :
                            product.badge === 'Top Rated' ? 'bg-blue-100 text-blue-800' :
                            product.badge === 'Pro' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{product.description}</p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                        {product.features.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{product.features.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.reviews} reviews)
                        </span>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">£{product.price}</span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLoggedIn) {
                              router.push(`/checkout?product=${product.id}`);
                            } else {
                              router.push(`/login?redirect=/marketplace/product/${product.id}`);
                            }
                          }}
                        >
                          {isLoggedIn ? 'Get Started' : 'Sign In to Buy'}
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-xl opacity-90 mb-8">
            Build your own custom AI agent with our no-code builder
          </p>
          <Link
            href="/custom-products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            <SparklesIcon className="w-5 h-5" />
            Create Custom Agent
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}