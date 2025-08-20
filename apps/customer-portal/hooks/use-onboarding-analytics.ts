'use client';

import { useEffect, useRef } from 'react';

interface OnboardingEvent {
  event: string;
  properties?: Record<string, any>;
}

export function useOnboardingAnalytics() {
  const startTimeRef = useRef<number>(Date.now());
  const stepStartTimeRef = useRef<number>(Date.now());

  const trackEvent = async (event: string, properties?: Record<string, any>) => {
    try {
      await fetch('/api/analytics/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            session_duration: Date.now() - startTimeRef.current
          }
        })
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  };

  const trackStepStart = (stepName: string) => {
    stepStartTimeRef.current = Date.now();
    trackEvent('step_started', { step_name: stepName });
  };

  const trackStepComplete = (stepName: string, additionalData?: any) => {
    const duration = Date.now() - stepStartTimeRef.current;
    trackEvent('step_completed', {
      step_name: stepName,
      duration,
      ...additionalData
    });
  };

  const trackOnboardingStart = () => {
    startTimeRef.current = Date.now();
    trackEvent('started', {
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });
  };

  const trackOnboardingComplete = (data?: any) => {
    const totalDuration = Date.now() - startTimeRef.current;
    trackEvent('completed', {
      total_duration: totalDuration,
      ...data
    });
  };

  const trackOnboardingSkip = (reason?: string, currentStep?: string) => {
    trackEvent('skipped', {
      reason,
      current_step: currentStep,
      time_spent: Date.now() - startTimeRef.current
    });
  };

  const trackOnboardingAbandon = (currentStep: string) => {
    trackEvent('abandoned', {
      step: currentStep,
      time_spent: Date.now() - startTimeRef.current
    });
  };

  const trackInteraction = (element: string, action: string, value?: any) => {
    trackEvent('interaction', {
      element,
      action,
      value
    });
  };

  const trackProductInterest = (productId: string, action: string) => {
    trackEvent('product_interest', {
      product: productId,
      action
    });
  };

  const trackError = (error: string, context?: any) => {
    trackEvent('error', {
      error,
      context
    });
  };

  // Track page visibility changes (user leaving/returning)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('tab_hidden', {
          time_on_page: Date.now() - startTimeRef.current
        });
      } else {
        trackEvent('tab_visible', {
          time_away: Date.now() - startTimeRef.current
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Track page unload (user leaving)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentPath = window.location.pathname;
      if (currentPath.includes('onboarding')) {
        // User is leaving during onboarding
        navigator.sendBeacon('/api/analytics/onboarding', JSON.stringify({
          event: 'page_exit',
          properties: {
            path: currentPath,
            time_spent: Date.now() - startTimeRef.current,
            completed: false
          }
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    trackEvent,
    trackStepStart,
    trackStepComplete,
    trackOnboardingStart,
    trackOnboardingComplete,
    trackOnboardingSkip,
    trackOnboardingAbandon,
    trackInteraction,
    trackProductInterest,
    trackError
  };
}