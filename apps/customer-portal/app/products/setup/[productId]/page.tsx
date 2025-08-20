'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ChatbotSetup } from '@/components/setup/chatbot-setup';
import { SalesAgentSetup } from '@/components/setup/sales-agent-setup';
import { EnrichmentSetup } from '@/components/setup/enrichment-setup';
import { useToast } from '@/hooks/use-toast';

export default function ProductSetupPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicenseKey();
  }, []);

  const fetchLicenseKey = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setLicenseKey(data.licenseKey);
      }
    } catch (error) {
      console.error('Failed to fetch license key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = async () => {
    toast({
      title: 'Setup Complete!',
      description: `Your ${getProductName(productId)} is ready to use`
    });
    
    // Update onboarding progress if this is part of onboarding
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === 'true') {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 5,
          data: { 
            setupCompleted: { 
              [productId]: true,
              completedAt: new Date().toISOString()
            }
          }
        })
      });
      router.push('/onboarding?step=5');
    } else {
      router.push(`/dashboard?product=${productId}`);
    }
  };

  const getProductName = (id: string) => {
    const names: Record<string, string> = {
      'chatbot': 'AI Chatbot',
      'sales-agent': 'Sales Agent',
      'enrichment': 'Data Enrichment'
    };
    return names[id] || id;
  };

  const renderSetupComponent = () => {
    switch (productId) {
      case 'chatbot':
        return (
          <ChatbotSetup 
            licenseKey={licenseKey} 
            onComplete={handleSetupComplete}
          />
        );
      case 'sales-agent':
        return (
          <SalesAgentSetup 
            licenseKey={licenseKey} 
            onComplete={handleSetupComplete}
          />
        );
      case 'enrichment':
        return (
          <EnrichmentSetup 
            licenseKey={licenseKey} 
            onComplete={handleSetupComplete}
          />
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Product Not Found</CardTitle>
              <CardDescription>
                This product setup is not available
              </CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Setup {getProductName(productId)}
            </h1>
            <p className="text-muted-foreground mt-2">
              Follow the steps below to configure your product
            </p>
          </div>
        </div>
      </div>

      {renderSetupComponent()}
    </div>
  );
}