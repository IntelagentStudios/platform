'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, BuildingOfficeIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/outline';

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    icon: SparklesIcon,
    monthlyPrice: 299,
    annualPrice: 2990, // £299 * 10 months
    priceDisplay: '£299',
    period: '/month',
    description: 'Perfect for small businesses getting started with AI automation',
    features: [
      '1 AI Chatbot with custom training',
      '10,000 messages per month',
      'Basic analytics dashboard',
      'Email support (48h response)',
      'Standard integrations (Slack, Teams)',
      'Knowledge base (up to 100 pages)',
      'SSL encryption & security',
      'Mobile responsive widget'
    ],
    limitations: [
      'No sales agent access',
      'No data enrichment',
      'No API access',
      'Single user account'
    ],
    cta: 'Start 14-Day Free Trial',
    popular: false,
    color: 'rgba(134, 239, 172, 0.1)', // Green tint
    borderColor: 'rgba(134, 239, 172, 0.3)'
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: RocketLaunchIcon,
    monthlyPrice: 799,
    annualPrice: 7990, // £799 * 10 months
    priceDisplay: '£799',
    period: '/month',
    description: 'For growing businesses ready to scale with AI-powered automation',
    features: [
      'Everything in Starter, plus:',
      '3 AI Chatbots with A/B testing',
      '50,000 messages per month',
      'Advanced analytics & custom reports',
      'Priority support (4h response)',
      'Sales Agent with lead scoring',
      'Data enrichment (1,000 credits/mo)',
      'Custom integrations & webhooks',
      'Knowledge base (up to 1,000 pages)',
      'Full API access',
      'Team collaboration (5 users)',
      'Custom branding options'
    ],
    limitations: [],
    cta: 'Start 14-Day Free Trial',
    popular: true,
    badge: 'MOST POPULAR',
    color: 'rgba(169, 189, 203, 0.1)', // Brand color tint
    borderColor: 'rgb(169, 189, 203)'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: BuildingOfficeIcon,
    monthlyPrice: 2499,
    annualPrice: 24990,
    priceDisplay: 'Custom',
    period: '',
    description: 'Tailored AI solutions for large organizations with custom requirements',
    features: [
      'Everything in Professional, plus:',
      'Unlimited AI Chatbots',
      'Unlimited messages',
      'White-label solution',
      'Dedicated account manager',
      'Custom AI model training',
      'Advanced Sales Agent with CRM sync',
      'Unlimited data enrichment',
      'Custom skill development',
      '99.9% SLA guarantee',
      'Unlimited team members',
      'On-premise deployment option',
      'Advanced security & compliance',
      'Custom contracts & invoicing',
      '24/7 phone support'
    ],
    limitations: [],
    cta: 'Schedule Demo',
    popular: false,
    color: 'rgba(251, 191, 36, 0.1)', // Gold tint
    borderColor: 'rgba(251, 191, 36, 0.3)'
  }
];

const addons = [
  {
    id: 'extra-chatbot',
    name: 'Additional Chatbot',
    price: 199,
    priceDisplay: '£199',
    period: '/month',
    description: 'Add another AI chatbot to your account',
    features: ['Full chatbot features', 'Custom training', 'Separate analytics']
  },
  {
    id: 'sales-agent-addon',
    name: 'Sales Agent Pro',
    price: 399,
    priceDisplay: '£399',
    period: '/month',
    description: 'Advanced lead generation and automated outreach',
    features: ['Lead discovery', 'Email sequences', 'CRM integration', 'Performance tracking']
  },
  {
    id: 'enrichment-credits',
    name: 'Data Enrichment Pack',
    price: 99,
    priceDisplay: '£99',
    period: '/10,000 credits',
    description: 'Additional credits for data enrichment',
    features: ['Email finder', 'Company data', 'Social profiles', 'Contact verification']
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechStart',
    content: 'The AI chatbot has reduced our support tickets by 60%. Incredible ROI!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Head of Sales, GrowthCo',
    content: 'Sales Agent generated 200+ qualified leads in the first month alone.',
    rating: 5
  },
  {
    name: 'Emma Williams',
    role: 'Operations Manager, ServicePro',
    content: 'The automation capabilities have transformed how we operate. Game changer!',
    rating: 5
  }
];

export default function EnhancedMarketplacePage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    // Check for returning user
    const hasVisited = localStorage.getItem('marketplace_visited');
    if (!hasVisited) {
      localStorage.setItem('marketplace_visited', 'true');
    }
  }, []);

  const handleSelectTier = async (tierId: string) => {
    setIsLoading(tierId);
    
    if (tierId === 'enterprise') {
      window.location.href = 'mailto:sales@intelagentstudios.com?subject=Enterprise Plan Inquiry';
      return;
    }

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tierId,
          billing: billingPeriod,
          addons: selectedAddons
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const getPrice = (tier: any) => {
    if (tier.id === 'enterprise') return tier.priceDisplay;
    const price = billingPeriod === 'annual' ? tier.annualPrice / 12 : tier.monthlyPrice;
    return `£${price}`;
  };

  const getSavings = (tier: any) => {
    if (tier.id === 'enterprise' || billingPeriod === 'monthly') return 0;
    return Math.round(((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(48, 54, 54)', color: 'rgb(229, 227, 220)' }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(169, 189, 203, 0.2)',
        backgroundColor: 'rgba(58, 64, 64, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-10">
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
              Intelagent Platform
            </h1>
            <nav className="hidden md:flex gap-8">
              <a href="#pricing" className="hover:text-white transition-colors" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Pricing</a>
              <a href="#features" className="hover:text-white transition-colors" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Features</a>
              <a href="#testimonials" className="hover:text-white transition-colors" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>Testimonials</a>
              <a href="#faq" className="hover:text-white transition-colors" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>FAQ</a>
            </nav>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-2 rounded-lg transition-all hover:bg-opacity-20"
              style={{
                backgroundColor: 'transparent',
                color: 'rgb(169, 189, 203)',
                border: '1px solid rgba(169, 189, 203, 0.3)'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-5 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(48, 54, 54)'
              }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-10 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
               style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)', border: '1px solid rgba(169, 189, 203, 0.3)' }}>
            <SparklesIcon className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
              Trusted by 500+ businesses worldwide
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI-Powered Business<br />
            <span style={{ color: 'rgb(169, 189, 203)' }}>Automation Platform</span>
          </h2>
          
          <p className="text-xl mb-8" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
            Transform your business with 310+ AI skills orchestrated by 8 intelligent agents.
            <br />From customer service to sales automation — everything you need in one platform.
          </p>

          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2" 
                     style={{ 
                       backgroundColor: 'rgba(169, 189, 203, 0.3)',
                       borderColor: 'rgb(48, 54, 54)'
                     }} />
              ))}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} className="w-5 h-5 fill-current" style={{ color: '#fbbf24' }} />
              ))}
            </div>
            <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
              4.9/5 from 200+ reviews
            </span>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="pb-16">
        <div className="flex justify-center items-center gap-4">
          <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'opacity-60'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-16 h-8 rounded-full transition-colors"
            style={{ backgroundColor: billingPeriod === 'annual' ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)' }}
          >
            <div className="absolute w-7 h-7 bg-white rounded-full transition-transform"
                 style={{
                   top: '0.125rem',
                   left: billingPeriod === 'monthly' ? '0.125rem' : '2rem',
                   transition: 'left 0.3s'
                 }} />
          </button>
          <span className={`font-medium ${billingPeriod === 'annual' ? 'text-white' : 'opacity-60'}`}>
            Annual Billing
          </span>
          {billingPeriod === 'annual' && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold animate-pulse"
                  style={{ 
                    backgroundColor: 'rgba(134, 239, 172, 0.2)',
                    color: '#86efac'
                  }}>
              SAVE UP TO 17%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="px-10 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const savings = getSavings(tier);
              
              return (
                <div
                  key={tier.id}
                  className="relative rounded-2xl p-8 transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.95)',
                    border: `2px solid ${tier.borderColor}`,
                    background: `linear-gradient(135deg, ${tier.color} 0%, rgba(58, 64, 64, 0.95) 100%)`
                  }}
                >
                  {tier.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-2 rounded-full text-xs font-bold"
                            style={{ 
                              backgroundColor: 'rgb(169, 189, 203)',
                              color: 'rgb(48, 54, 54)'
                            }}>
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8" style={{ color: tier.borderColor }} />
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>

                  <p className="mb-6 opacity-80">{tier.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{getPrice(tier)}</span>
                      {tier.period && <span className="opacity-60">{tier.period}</span>}
                    </div>
                    {billingPeriod === 'annual' && tier.id !== 'enterprise' && (
                      <div className="mt-2">
                        <span className="text-sm line-through opacity-50">£{tier.monthlyPrice}/month</span>
                        <span className="ml-2 text-sm font-semibold" style={{ color: '#86efac' }}>
                          Save {savings}%
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={isLoading === tier.id}
                    className="w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: tier.popular ? 'rgb(169, 189, 203)' : 'transparent',
                      color: tier.popular ? 'rgb(48, 54, 54)' : 'rgb(169, 189, 203)',
                      border: tier.popular ? 'none' : '2px solid rgba(169, 189, 203, 0.3)'
                    }}
                  >
                    {isLoading === tier.id ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        {tier.cta}
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-8 space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#86efac' }} />
                        <span className="text-sm opacity-90">{feature}</span>
                      </div>
                    ))}
                    {tier.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-3 opacity-60">
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-center">✕</span>
                        <span className="text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section id="addons" className="px-10 py-20" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Power Up Your Plan</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="rounded-xl p-6 transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(48, 54, 54, 0.95)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}
              >
                <h4 className="text-xl font-semibold mb-2">{addon.name}</h4>
                <p className="mb-4 opacity-80">{addon.description}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold">{addon.priceDisplay}</span>
                  <span className="opacity-60">{addon.period}</span>
                </div>
                <div className="space-y-2">
                  {addon.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4" style={{ color: '#86efac' }} />
                      <span className="text-sm opacity-90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.95)',
                  border: '1px solid rgba(169, 189, 203, 0.2)'
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 fill-current" style={{ color: '#fbbf24' }} />
                  ))}
                </div>
                <p className="mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm opacity-60">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
          <p className="text-xl mb-8 opacity-80">
            Join 500+ companies using Intelagent to automate their operations
          </p>
          <button
            onClick={() => handleSelectTier('professional')}
            className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgb(169, 189, 203)',
              color: 'rgb(48, 54, 54)'
            }}
          >
            Start Your Free Trial Now
          </button>
          <p className="mt-4 text-sm opacity-60">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-10 py-8 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="opacity-60">© 2025 Intelagent Studios. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="opacity-60 hover:opacity-100">Privacy</a>
            <a href="/terms" className="opacity-60 hover:opacity-100">Terms</a>
            <a href="/contact" className="opacity-60 hover:opacity-100">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}