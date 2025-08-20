'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Rocket,
  BookOpen,
  Users,
  Zap,
  Trophy,
  Gift,
  Target,
  Play
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface FirstTimeExperienceProps {
  licenseKey: string;
  products: string[];
  onDismiss: () => void;
}

export function FirstTimeExperience({ licenseKey, products, onDismiss }: FirstTimeExperienceProps) {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Check what steps are already completed
    checkCompletedSteps();
  }, []);

  const checkCompletedSteps = async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const data = await response.json();
        setCompletedSteps(data.completedSteps || []);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const completeStep = async (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    
    // Save progress
    await fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, completed: true })
    });

    // Celebrate milestones
    if (completedSteps.length + 1 === quickStartSteps.length) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const quickStartSteps = [
    {
      id: 'setup-product',
      title: 'Setup Your First Product',
      description: 'Configure one of your products to start automating',
      icon: Zap,
      action: () => router.push(`/products/setup/${products[0]}?onboarding=true`),
      completed: completedSteps.includes('setup-product')
    },
    {
      id: 'watch-demo',
      title: 'Watch Quick Demo',
      description: '3-minute overview of platform capabilities',
      icon: Play,
      action: () => {
        window.open('https://demo.intelagent.ai', '_blank');
        completeStep('watch-demo');
      },
      completed: completedSteps.includes('watch-demo')
    },
    {
      id: 'explore-insights',
      title: 'View AI Insights',
      description: 'See intelligent recommendations for your business',
      icon: Sparkles,
      action: () => router.push('/dashboard?tab=insights'),
      completed: completedSteps.includes('explore-insights')
    },
    {
      id: 'join-community',
      title: 'Join Community',
      description: 'Connect with other users and get support',
      icon: Users,
      action: () => {
        window.open('https://community.intelagent.ai', '_blank');
        completeStep('join-community');
      },
      completed: completedSteps.includes('join-community')
    }
  ];

  const progressPercentage = (completedSteps.length / quickStartSteps.length) * 100;

  if (!showWelcome) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Welcome Hero */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-8 w-8" />
                <h2 className="text-3xl font-bold">Welcome to Intelagent!</h2>
              </div>
              <p className="text-lg opacity-90 max-w-2xl">
                Your unified automation platform is ready. Let's get you started with a quick tour
                and help you unlock the full potential of your products.
              </p>
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => router.push('/onboarding')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Guided Setup
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={onDismiss}
                >
                  Skip for Now
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowWelcome(false)}
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Start Checklist</CardTitle>
              <CardDescription>
                Complete these steps to get the most out of Intelagent
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {completedSteps.length}/{quickStartSteps.length} Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickStartSteps.map((step) => (
              <div
                key={step.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  ${step.completed ? 'bg-green-50 border-green-200' : 'hover:bg-accent'}
                  transition-colors cursor-pointer
                `}
                onClick={!step.completed ? step.action : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-primary/10 text-primary'}
                  `}>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                {!step.completed && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {progressPercentage === 100 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">
                    Congratulations! You're all set up!
                  </p>
                  <p className="text-sm text-yellow-700">
                    You've completed all quick start steps. Your automation journey begins now!
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Recommended Next</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your products, we suggest:
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Setup AI Chatbot
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Special Offer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade within 7 days for 20% off
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Upgrades
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Learn More</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Explore our knowledge base
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Tutorials
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}