'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function PricingPage() {
  const router = useRouter();

  const products = [
    {
      name: 'Additional Chatbot',
      price: '£349',
      period: '/month',
      description: 'Add another AI chatbot to your account',
      features: [
        'Separate configuration',
        'Independent training',
        'Unique product key',
        'Full analytics',
        'Custom knowledge base'
      ]
    },
    {
      name: 'Ops Agent (Workflow Assistant)',
      price: '£399',
      period: '/month',
      description: 'Automated workflow orchestration and management',
      features: [
        'Workflow automation',
        'SLA monitoring',
        'Exception handling',
        'Process optimization',
        'Real-time tracking'
      ]
    },
    {
      name: 'Data/Insights Agent (AI Analyst)',
      price: '£449',
      period: '/month',
      description: 'AI-powered data analysis and insights',
      features: [
        'KPI monitoring',
        'AI-generated insights',
        'Anomaly detection',
        'Data exploration',
        'Predictive analytics'
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'rgb(48, 54, 54)',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'rgb(229, 227, 220)',
              marginBottom: '16px'
            }}>
              Expand Your Platform
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'rgba(229, 227, 220, 0.7)'
            }}>
              Add more products and capabilities to your account
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            marginBottom: '60px'
          }}>
            {products.map((product, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.95)',
                  borderRadius: '12px',
                  padding: '32px',
                  border: '1px solid rgba(169, 189, 203, 0.15)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'rgb(229, 227, 220)',
                  marginBottom: '8px'
                }}>
                  {product.name}
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    fontSize: product.price === 'Coming Soon' ? '24px' : '36px',
                    fontWeight: 'bold',
                    color: 'rgb(169, 189, 203)'
                  }}>
                    {product.price}
                  </span>
                  {product.period && (
                    <span style={{
                      fontSize: '16px',
                      color: 'rgba(229, 227, 220, 0.6)'
                    }}>
                      {product.period}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.7)',
                  marginBottom: '24px'
                }}>
                  {product.description}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 24px 0'
                }}>
                  {product.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: '8px 0',
                        fontSize: '14px',
                        color: 'rgba(229, 227, 220, 0.8)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ color: 'rgb(169, 189, 203)', marginRight: '8px' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    alert('Payment integration coming soon. Please contact sales@intelagentstudios.com to purchase.');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgb(169, 189, 203)',
                    color: 'rgb(48, 54, 54)',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgb(149, 169, 183)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgb(169, 189, 203)'}
                >
                  Purchase
                </button>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(169, 189, 203, 0.15)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'rgb(229, 227, 220)',
              marginBottom: '16px'
            }}>
              Need a Custom Solution?
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(229, 227, 220, 0.7)',
              marginBottom: '24px'
            }}>
              Contact our sales team for enterprise pricing and custom packages
            </p>
            <button
              onClick={() => window.location.href = 'mailto:sales@intelagentstudios.com'}
              style={{
                padding: '12px 32px',
                backgroundColor: 'transparent',
                color: 'rgb(169, 189, 203)',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid rgba(169, 189, 203, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(169, 189, 203, 0.5)';
                e.currentTarget.style.backgroundColor = 'rgba(169, 189, 203, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(169, 189, 203, 0.3)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}