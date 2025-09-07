'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCardIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  currentPeriodEnd: Date;
  price: number;
  interval: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: Date;
  invoiceUrl?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch subscription data
      const subResponse = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        setPaymentMethod(subData.paymentMethod);
      }

      // Fetch invoices
      const invoicesResponse = await fetch('/api/billing/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/marketplace');
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open billing portal');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const getTierDisplay = (tier: string) => {
    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Free';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div style={{ color: 'rgb(169, 189, 203)' }}>Loading billing information...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'rgb(229, 227, 220)',
          marginBottom: '32px'
        }}>
          Billing & Subscription
        </h1>

        {/* Current Plan Section */}
        <div style={{
          backgroundColor: 'rgba(58, 64, 64, 0.95)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(169, 189, 203, 0.2)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgb(229, 227, 220)',
                marginBottom: '8px'
              }}>
                Current Plan
              </h2>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'rgb(169, 189, 203)',
                marginBottom: '4px'
              }}>
                {subscription ? getTierDisplay(subscription.tier) : 'Free'} Plan
              </div>
              {subscription && (
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.7)'
                }}>
                  {subscription.status === 'active' 
                    ? `Renews on ${formatDate(subscription.currentPeriodEnd)}`
                    : `Status: ${subscription.status}`}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {subscription ? (
                <button
                  onClick={handleManageSubscription}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'rgb(169, 189, 203)',
                    border: '1px solid rgba(169, 189, 203, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Manage Subscription
                </button>
              ) : null}
              <button
                onClick={handleUpgrade}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgb(169, 189, 203)',
                  color: 'rgb(48, 54, 54)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {subscription ? 'Change Plan' : 'Upgrade Now'}
              </button>
            </div>
          </div>

          {subscription && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(169, 189, 203, 0.1)'
            }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(229, 227, 220, 0.5)',
                  marginBottom: '4px'
                }}>
                  Billing Period
                </p>
                <p style={{
                  fontSize: '16px',
                  color: 'rgb(229, 227, 220)'
                }}>
                  {subscription.interval === 'year' ? 'Annual' : 'Monthly'}
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(229, 227, 220, 0.5)',
                  marginBottom: '4px'
                }}>
                  Amount
                </p>
                <p style={{
                  fontSize: '16px',
                  color: 'rgb(229, 227, 220)'
                }}>
                  {formatPrice(subscription.price)}/{subscription.interval === 'year' ? 'year' : 'month'}
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(229, 227, 220, 0.5)',
                  marginBottom: '4px'
                }}>
                  Status
                </p>
                <p style={{
                  fontSize: '16px',
                  color: subscription.status === 'active' ? 'rgb(134, 239, 172)' : 'rgb(248, 113, 113)'
                }}>
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div style={{
          backgroundColor: 'rgba(58, 64, 64, 0.95)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(169, 189, 203, 0.2)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'rgb(229, 227, 220)'
            }}>
              Payment Method
            </h2>
            {paymentMethod && (
              <button
                onClick={handleManageSubscription}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'rgb(169, 189, 203)',
                  border: '1px solid rgba(169, 189, 203, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Update
              </button>
            )}
          </div>

          {paymentMethod ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <CreditCardIcon style={{
                width: '32px',
                height: '32px',
                color: 'rgba(169, 189, 203, 0.5)'
              }} />
              <div>
                <p style={{
                  fontSize: '16px',
                  color: 'rgb(229, 227, 220)',
                  marginBottom: '4px'
                }}>
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.6)'
                }}>
                  Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                </p>
              </div>
            </div>
          ) : (
            <p style={{
              color: 'rgba(229, 227, 220, 0.6)',
              fontSize: '14px'
            }}>
              No payment method on file
            </p>
          )}
        </div>

        {/* Invoices Section */}
        <div style={{
          backgroundColor: 'rgba(58, 64, 64, 0.95)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(169, 189, 203, 0.2)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'rgb(229, 227, 220)',
            marginBottom: '20px'
          }}>
            Billing History
          </h2>

          {invoices.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(169, 189, 203, 0.2)'
                  }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(229, 227, 220, 0.7)',
                      textTransform: 'uppercase'
                    }}>
                      Date
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(229, 227, 220, 0.7)',
                      textTransform: 'uppercase'
                    }}>
                      Amount
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(229, 227, 220, 0.7)',
                      textTransform: 'uppercase'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'right',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(229, 227, 220, 0.7)',
                      textTransform: 'uppercase'
                    }}>
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      style={{
                        borderBottom: '1px solid rgba(169, 189, 203, 0.1)'
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        color: 'rgb(229, 227, 220)',
                        fontSize: '14px'
                      }}>
                        {formatDate(invoice.date)}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: 'rgb(229, 227, 220)',
                        fontSize: '14px'
                      }}>
                        {formatPrice(invoice.amount)}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: invoice.status === 'paid' 
                            ? 'rgba(134, 239, 172, 0.1)' 
                            : 'rgba(248, 113, 113, 0.1)',
                          color: invoice.status === 'paid' 
                            ? 'rgb(134, 239, 172)' 
                            : 'rgb(248, 113, 113)'
                        }}>
                          {invoice.status === 'paid' ? 'Paid' : invoice.status}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right'
                      }}>
                        {invoice.invoiceUrl && (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'rgb(169, 189, 203)',
                              textDecoration: 'none',
                              fontSize: '14px'
                            }}
                          >
                            <DocumentTextIcon style={{
                              width: '16px',
                              height: '16px'
                            }} />
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{
              color: 'rgba(229, 227, 220, 0.6)',
              fontSize: '14px',
              textAlign: 'center',
              padding: '32px'
            }}>
              No billing history available
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}