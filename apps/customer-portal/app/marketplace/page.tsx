'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    priceDisplay: '£299',
    period: '/month',
    description: 'Perfect for small businesses getting started with AI',
    features: [
      '1 AI Chatbot',
      '10,000 messages/month',
      'Basic analytics',
      'Email support',
      'Standard integrations',
      'Knowledge base (up to 100 pages)'
    ],
    limitations: [
      'No sales agent',
      'No data enrichment',
      'No API access'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 799,
    priceDisplay: '£799',
    period: '/month',
    description: 'For growing businesses ready to scale with AI',
    features: [
      '3 AI Chatbots',
      '50,000 messages/month',
      'Advanced analytics & reporting',
      'Priority support',
      'Sales Agent included',
      'Data enrichment (1,000 credits)',
      'Custom integrations',
      'Knowledge base (up to 1,000 pages)',
      'API access',
      'Team collaboration (5 users)'
    ],
    limitations: [],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2499,
    priceDisplay: 'Custom',
    period: '',
    description: 'Tailored solutions for large organizations',
    features: [
      'Unlimited AI Chatbots',
      'Unlimited messages',
      'White-label options',
      'Dedicated account manager',
      'Custom AI training',
      'Advanced Sales Agent',
      'Unlimited data enrichment',
      'Custom skill development',
      'SLA guarantee',
      'Unlimited team members',
      'On-premise deployment option',
      'Advanced security features'
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false
  }
];

const addons = [
  {
    id: 'extra-chatbot',
    name: 'Additional Chatbot',
    price: 199,
    priceDisplay: '£199',
    period: '/month',
    description: 'Add another AI chatbot to your account'
  },
  {
    id: 'sales-agent-addon',
    name: 'Sales Agent',
    price: 399,
    priceDisplay: '£399',
    period: '/month',
    description: 'Automated lead generation and outreach'
  },
  {
    id: 'enrichment-credits',
    name: 'Data Enrichment Credits',
    price: 99,
    priceDisplay: '£99',
    period: '/10,000 credits',
    description: 'Additional data enrichment credits'
  }
];

export default function MarketplacePage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectTier = async (tierId: string) => {
    if (tierId === 'enterprise') {
      window.location.href = 'mailto:sales@intelagentstudios.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Logged in user - go to checkout
      router.push(`/dashboard/checkout?tier=${tierId}&billing=${billingPeriod}`);
    } else {
      // Guest user - go to signup with selected tier
      router.push(`/register?tier=${tierId}&billing=${billingPeriod}`);
    }
  };

  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 10); // 2 months free
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'rgb(48, 54, 54)',
      color: 'rgb(229, 227, 220)'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(169, 189, 203, 0.2)',
        backgroundColor: 'rgba(58, 64, 64, 0.95)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'rgb(169, 189, 203)'
            }}>
              Intelagent Platform
            </h1>
            <nav style={{ display: 'flex', gap: '30px' }}>
              <a href="#pricing" style={{ color: 'rgba(229, 227, 220, 0.8)', textDecoration: 'none' }}>Pricing</a>
              <a href="#features" style={{ color: 'rgba(229, 227, 220, 0.8)', textDecoration: 'none' }}>Features</a>
              <a href="#addons" style={{ color: 'rgba(229, 227, 220, 0.8)', textDecoration: 'none' }}>Add-ons</a>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '8px 20px',
                backgroundColor: 'transparent',
                color: 'rgb(169, 189, 203)',
                border: '1px solid rgba(169, 189, 203, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              style={{
                padding: '8px 20px',
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(48, 54, 54)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '24px',
          lineHeight: '1.2'
        }}>
          AI-Powered Business Automation
        </h2>
        <p style={{
          fontSize: '20px',
          color: 'rgba(229, 227, 220, 0.8)',
          marginBottom: '40px'
        }}>
          Transform your business with 310+ AI skills orchestrated by intelligent agents.
          From customer service to sales automation, we've got you covered.
        </p>

        {/* Billing Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '60px'
        }}>
          <span style={{
            color: billingPeriod === 'monthly' ? 'rgb(169, 189, 203)' : 'rgba(229, 227, 220, 0.6)'
          }}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            style={{
              width: '60px',
              height: '30px',
              borderRadius: '15px',
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '13px',
              backgroundColor: 'rgb(169, 189, 203)',
              position: 'absolute',
              top: '2px',
              left: billingPeriod === 'monthly' ? '2px' : '32px',
              transition: 'left 0.3s'
            }} />
          </button>
          <span style={{
            color: billingPeriod === 'annual' ? 'rgb(169, 189, 203)' : 'rgba(229, 227, 220, 0.6)'
          }}>
            Annual
          </span>
          {billingPeriod === 'annual' && (
            <span style={{
              padding: '4px 12px',
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              borderRadius: '12px',
              fontSize: '14px',
              color: 'rgb(169, 189, 203)',
              fontWeight: '600'
            }}>
              Save 17%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" style={{
        padding: '0 40px 80px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px'
        }}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.95)',
                borderRadius: '16px',
                padding: '40px',
                border: tier.popular ? '2px solid rgb(169, 189, 203)' : '1px solid rgba(169, 189, 203, 0.2)',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 16px',
                  backgroundColor: 'rgb(169, 189, 203)',
                  color: 'rgb(48, 54, 54)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {tier.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.7)',
                  marginBottom: '16px'
                }}>
                  {tier.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  {tier.id !== 'enterprise' ? (
                    <>
                      <span style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: 'rgb(169, 189, 203)'
                      }}>
                        {billingPeriod === 'monthly' 
                          ? tier.priceDisplay 
                          : `£${getAnnualPrice(tier.price)}`}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        color: 'rgba(229, 227, 220, 0.6)'
                      }}>
                        {billingPeriod === 'monthly' ? '/month' : '/year'}
                      </span>
                    </>
                  ) : (
                    <span style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: 'rgb(169, 189, 203)'
                    }}>
                      {tier.priceDisplay}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleSelectTier(tier.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: tier.popular ? 'rgb(169, 189, 203)' : 'transparent',
                  color: tier.popular ? 'rgb(48, 54, 54)' : 'rgb(169, 189, 203)',
                  border: tier.popular ? 'none' : '2px solid rgba(169, 189, 203, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.2s'
                }}
              >
                {tier.cta}
              </button>

              <div style={{ marginBottom: '16px' }}>
                <p style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  color: 'rgba(229, 227, 220, 0.5)',
                  marginBottom: '12px',
                  letterSpacing: '1px'
                }}>
                  What's included
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: '8px 0',
                        fontSize: '14px',
                        color: 'rgba(229, 227, 220, 0.9)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <CheckIcon style={{
                        width: '16px',
                        height: '16px',
                        color: 'rgb(169, 189, 203)',
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {tier.limitations.length > 0 && (
                <div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tier.limitations.map((limitation, idx) => (
                      <li
                        key={idx}
                        style={{
                          padding: '8px 0',
                          fontSize: '14px',
                          color: 'rgba(229, 227, 220, 0.5)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}
                      >
                        <span style={{ color: 'rgba(229, 227, 220, 0.3)' }}>✕</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons Section */}
      <section id="addons" style={{
        padding: '80px 40px',
        backgroundColor: 'rgba(58, 64, 64, 0.5)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Power Up Your Platform
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(229, 227, 220, 0.7)',
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            Add extra capabilities to your existing plan
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {addons.map((addon) => (
              <div
                key={addon.id}
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.95)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(169, 189, 203, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {addon.name}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(229, 227, 220, 0.7)',
                    marginBottom: '8px'
                  }}>
                    {addon.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'rgb(169, 189, 203)'
                    }}>
                      {addon.priceDisplay}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: 'rgba(229, 227, 220, 0.6)'
                    }}>
                      {addon.period}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/register?addon=${addon.id}`)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'rgb(169, 189, 203)',
                    border: '1px solid rgba(169, 189, 203, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add to Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          Ready to Transform Your Business?
        </h2>
        <p style={{
          fontSize: '18px',
          color: 'rgba(229, 227, 220, 0.7)',
          marginBottom: '32px'
        }}>
          Join thousands of businesses already using AI to grow faster
        </p>
        <button
          onClick={() => router.push('/register')}
          style={{
            padding: '16px 40px',
            backgroundColor: 'rgb(169, 189, 203)',
            color: 'rgb(48, 54, 54)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Start Your Free Trial
        </button>
        <p style={{
          marginTop: '16px',
          fontSize: '14px',
          color: 'rgba(229, 227, 220, 0.6)'
        }}>
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px',
        borderTop: '1px solid rgba(169, 189, 203, 0.2)',
        backgroundColor: 'rgba(58, 64, 64, 0.95)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          color: 'rgba(229, 227, 220, 0.6)',
          fontSize: '14px'
        }}>
          © 2025 Intelagent Studios. All rights reserved.
        </div>
      </footer>
    </div>
  );
}