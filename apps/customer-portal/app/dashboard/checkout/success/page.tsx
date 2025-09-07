'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLicenseKey = () => {
    if (orderDetails?.licenseKey) {
      navigator.clipboard.writeText(orderDetails.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGetStarted = () => {
    if (orderDetails?.isNewUser) {
      // New user - go to onboarding
      router.push('/dashboard/onboarding');
    } else {
      // Existing user - go to products
      router.push('/dashboard/products');
    }
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
          <div style={{ color: 'rgb(169, 189, 203)' }}>Processing your order...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 20px'
      }}>
        {/* Success Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(134, 239, 172, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircleIcon style={{
              width: '48px',
              height: '48px',
              color: 'rgb(134, 239, 172)'
            }} />
          </div>
        </div>

        {/* Success Message */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: 'rgb(229, 227, 220)',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          Payment Successful!
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'rgba(229, 227, 220, 0.8)',
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          Welcome to the Intelagent Platform. Your subscription is now active.
        </p>

        {/* Order Details */}
        {orderDetails && (
          <div style={{
            backgroundColor: 'rgba(58, 64, 64, 0.95)',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid rgba(169, 189, 203, 0.2)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'rgb(229, 227, 220)',
              marginBottom: '24px'
            }}>
              Order Details
            </h2>

            <div style={{
              display: 'grid',
              gap: '20px'
            }}>
              {/* Plan */}
              <div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.6)',
                  marginBottom: '4px'
                }}>
                  Plan
                </p>
                <p style={{
                  fontSize: '18px',
                  color: 'rgb(229, 227, 220)',
                  fontWeight: '600'
                }}>
                  {orderDetails.tier ? 
                    orderDetails.tier.charAt(0).toUpperCase() + orderDetails.tier.slice(1) 
                    : 'Starter'} Plan
                </p>
              </div>

              {/* Email */}
              <div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.6)',
                  marginBottom: '4px'
                }}>
                  Email
                </p>
                <p style={{
                  fontSize: '16px',
                  color: 'rgb(229, 227, 220)'
                }}>
                  {orderDetails.email}
                </p>
              </div>

              {/* License Key */}
              {orderDetails.licenseKey && (
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(229, 227, 220, 0.6)',
                    marginBottom: '4px'
                  }}>
                    License Key
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <code style={{
                      fontSize: '16px',
                      color: 'rgb(169, 189, 203)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace'
                    }}>
                      {orderDetails.licenseKey}
                    </code>
                    <button
                      onClick={copyLicenseKey}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(169, 189, 203, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgb(169, 189, 203)'
                      }}
                      title="Copy license key"
                    >
                      <DocumentDuplicateIcon style={{
                        width: '20px',
                        height: '20px'
                      }} />
                    </button>
                    {copied && (
                      <span style={{
                        fontSize: '14px',
                        color: 'rgb(134, 239, 172)'
                      }}>
                        Copied!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Products Included */}
              <div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(229, 227, 220, 0.6)',
                  marginBottom: '8px'
                }}>
                  Products Included
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {orderDetails.products?.map((product: string, idx: number) => (
                    <li
                      key={idx}
                      style={{
                        padding: '6px 0',
                        fontSize: '16px',
                        color: 'rgb(229, 227, 220)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircleIcon style={{
                        width: '16px',
                        height: '16px',
                        color: 'rgb(134, 239, 172)'
                      }} />
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Important Information for New Users */}
        {orderDetails?.isNewUser && (
          <div style={{
            backgroundColor: 'rgba(169, 189, 203, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(169, 189, 203, 0.3)',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'rgb(169, 189, 203)',
              marginBottom: '12px'
            }}>
              Important: Check Your Email
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(229, 227, 220, 0.8)',
              lineHeight: '1.6'
            }}>
              We've sent you an email with your login credentials and instructions to set up your password. 
              Please check your inbox (and spam folder) for an email from noreply@intelagentstudios.com.
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/dashboard/billing')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: 'rgb(169, 189, 203)',
              border: '1px solid rgba(169, 189, 203, 0.3)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Billing
          </button>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '12px 32px',
              backgroundColor: 'rgb(169, 189, 203)',
              color: 'rgb(48, 54, 54)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Get Started
            <ArrowRightIcon style={{
              width: '20px',
              height: '20px'
            }} />
          </button>
        </div>

        {/* Receipt Notice */}
        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '14px',
          color: 'rgba(229, 227, 220, 0.6)'
        }}>
          A receipt has been sent to your email address.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div style={{ color: 'rgb(169, 189, 203)' }}>Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}