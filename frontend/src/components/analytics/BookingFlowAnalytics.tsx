'use client';

import React, { useEffect, useRef } from 'react';
import useEventTracking from '@/hooks/useEventTracking';
import { analyticsService } from '@/lib/analytics/analytics-service';

interface BookingStep {
  id: string;
  name: string;
  order: number;
  required: boolean;
}

interface BookingFlowAnalyticsProps {
  children: React.ReactNode;
  currentStep?: string;
  totalSteps?: number;
  deviceSelected?: {
    brand: string;
    model: string;
    type: string;
  };
  repairType?: string;
  estimatedValue?: number;
  userId?: string;
  sessionId?: string;
  // Funnel configuration
  funnelName?: string;
  funnelSteps?: BookingStep[];
}

export default function BookingFlowAnalytics({
  children,
  currentStep = 'landing',
  totalSteps = 5,
  deviceSelected,
  repairType,
  estimatedValue,
  userId,
  sessionId,
  funnelName = 'repair_booking',
  funnelSteps = [
    { id: 'landing', name: 'Landing Page', order: 1, required: true },
    { id: 'device_selection', name: 'Device Selection', order: 2, required: true },
    { id: 'repair_type', name: 'Repair Type', order: 3, required: true },
    { id: 'pricing', name: 'Pricing & Details', order: 4, required: true },
    { id: 'contact_info', name: 'Contact Information', order: 5, required: true },
    { id: 'payment', name: 'Payment', order: 6, required: false },
    { id: 'confirmation', name: 'Confirmation', order: 7, required: true }
  ]
}: BookingFlowAnalyticsProps) {
  const { trackCustomEvent: trackEvent, trackPageView, trackConversion, isTrackingEnabled } = useEventTracking();
  const stepStartTime = useRef<number>(Date.now());
  const previousStep = useRef<string>('');
  const funnelStartTime = useRef<number | null>(null);
  const stepInteractions = useRef<number>(0);

  // Initialize funnel tracking
  useEffect(() => {
    if (isTrackingEnabled && !funnelStartTime.current && typeof trackEvent === 'function') {
      funnelStartTime.current = Date.now();
      
      // Track funnel start
      trackEvent({
        name: 'booking_funnel_started',
        parameters: {
          funnel_name: funnelName,
          total_steps: totalSteps,
          session_id: sessionId || `session_${Date.now()}`,
          user_id: userId || 'anonymous',
          timestamp: new Date().toISOString()
        }
      });

      // Initialize step tracking
      trackStepEntry(currentStep);
    }
  }, [isTrackingEnabled, funnelName, totalSteps, currentStep, trackEvent]);

  // Track step changes
  useEffect(() => {
    if (isTrackingEnabled && previousStep.current && previousStep.current !== currentStep) {
      trackStepExit(previousStep.current);
      trackStepEntry(currentStep);
    }
    previousStep.current = currentStep;
  }, [currentStep, isTrackingEnabled]);

  const trackStepEntry = (stepId: string) => {
    if (typeof trackEvent !== 'function') return;
    
    stepStartTime.current = Date.now();
    stepInteractions.current = 0;

    const step = funnelSteps.find(s => s.id === stepId);
    
    trackEvent({
      name: 'booking_step_entered',
      parameters: {
        step_id: stepId,
        step_name: step?.name || stepId,
        step_order: step?.order || 0,
        funnel_name: funnelName,
        progress_percentage: step ? (step.order / totalSteps) * 100 : 0,
        device_info: deviceSelected ? {
          brand: deviceSelected.brand,
          model: deviceSelected.model,
          type: deviceSelected.type
        } : null,
        repair_type: repairType || null,
        estimated_value: estimatedValue || null,
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

    // Track page view for the step
    trackPageView({
      page_name: `booking_${stepId}`,
      page_category: 'booking_funnel',
      funnel_step: stepId,
      funnel_position: step?.order || 0
    });
  };

  const trackStepExit = (stepId: string) => {
    if (typeof trackEvent !== 'function') return;
    
    const timeOnStep = Date.now() - stepStartTime.current;
    const step = funnelSteps.find(s => s.id === stepId);

    trackEvent({
      name: 'booking_step_exited',
      parameters: {
        step_id: stepId,
        step_name: step?.name || stepId,
        step_order: step?.order || 0,
        time_on_step: timeOnStep,
        interactions_count: stepInteractions.current,
        funnel_name: funnelName,
        session_id: sessionId,
        user_id: userId,
        exit_reason: 'step_progression',
        timestamp: new Date().toISOString()
      }
    });
  };

  // Public methods for component interactions
  const trackStepInteraction = (interactionType: string, details?: any) => {
    if (!isTrackingEnabled || typeof trackEvent !== 'function') return;
    
    stepInteractions.current++;

    trackEvent({
      name: 'booking_step_interaction',
      parameters: {
        step_id: currentStep,
        interaction_type: interactionType,
        interaction_count: stepInteractions.current,
        funnel_name: funnelName,
        details: details || {},
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });
  };

  const trackStepValidation = (isValid: boolean, validationErrors?: string[]) => {
    if (!isTrackingEnabled || typeof trackEvent !== 'function') return;

    trackEvent({
      name: 'booking_step_validation',
      parameters: {
        step_id: currentStep,
        is_valid: isValid,
        validation_errors: validationErrors || [],
        funnel_name: funnelName,
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });
  };

  const trackStepAbandonment = (reason: string) => {
    if (!isTrackingEnabled || typeof trackEvent !== 'function') return;

    const timeOnStep = Date.now() - stepStartTime.current;
    const totalFunnelTime = funnelStartTime.current ? Date.now() - funnelStartTime.current : 0;
    const step = funnelSteps.find(s => s.id === currentStep);

    trackEvent({
      name: 'booking_step_abandoned',
      parameters: {
        step_id: currentStep,
        step_name: step?.name || currentStep,
        step_order: step?.order || 0,
        abandonment_reason: reason,
        time_on_step: timeOnStep,
        total_funnel_time: totalFunnelTime,
        funnel_completion_percentage: step ? (step.order / totalSteps) * 100 : 0,
        interactions_count: stepInteractions.current,
        device_info: deviceSelected,
        repair_type: repairType,
        estimated_value: estimatedValue,
        funnel_name: funnelName,
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

    // Track as conversion abandonment
    trackConversion('booking_abandoned', {
      step_abandoned: currentStep,
      reason: reason,
      value: estimatedValue || 0
    });
  };

  const trackFunnelCompletion = (bookingId: string, finalValue: number, conversionDetails?: any) => {
    if (!isTrackingEnabled || !funnelStartTime.current || typeof trackEvent !== 'function') return;

    const totalFunnelTime = Date.now() - funnelStartTime.current;

    trackEvent({
      name: 'booking_funnel_completed',
      parameters: {
        booking_id: bookingId,
        funnel_name: funnelName,
        total_funnel_time: totalFunnelTime,
        total_steps: totalSteps,
        final_value: finalValue,
        device_info: deviceSelected,
        repair_type: repairType,
        conversion_details: conversionDetails || {},
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

    // Track successful conversion
    trackConversion('booking_completed', {
      booking_id: bookingId,
      value: finalValue,
      device_brand: deviceSelected?.brand,
      repair_type: repairType,
      funnel_time: totalFunnelTime
    });

    // Send to analytics providers
    if (typeof window !== 'undefined') {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: bookingId,
          value: finalValue,
          currency: 'GBP',
          items: [{
            item_id: `repair_${repairType}`,
            item_name: `${deviceSelected?.brand} ${deviceSelected?.model} ${repairType}`,
            category: 'repair_services',
            quantity: 1,
            price: finalValue
          }]
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: finalValue,
          currency: 'GBP',
          content_name: `${deviceSelected?.brand} ${deviceSelected?.model} Repair`,
          content_type: 'product',
          content_ids: [bookingId]
        });
      }

      // PostHog
      if (window.posthog) {
        window.posthog.capture('booking_completed', {
          booking_id: bookingId,
          revenue: finalValue,
          device_brand: deviceSelected?.brand,
          device_model: deviceSelected?.model,
          repair_type: repairType,
          funnel_duration: totalFunnelTime
        });
      }
    }
  };

  // Provide analytics context to children
  const analyticsContext = {
    trackStepInteraction,
    trackStepValidation,
    trackStepAbandonment,
    trackFunnelCompletion,
    currentStep,
    funnelName,
    sessionId: sessionId || `session_${Date.now()}`,
    isTrackingEnabled
  };

  return (
    <div data-analytics-funnel={funnelName} data-current-step={currentStep}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Only pass analyticsContext to components that accept it (not DOM elements)
          // DOM elements (like div, span, etc.) should not receive custom props
          if (typeof child.type === 'string') {
            // This is a DOM element (string type like 'div', 'span'), don't pass custom props
            return child;
          } else {
            // This is a React component, safe to pass custom props
            return React.cloneElement(child as React.ReactElement<any>, {
              analyticsContext
            });
          }
        }
        return child;
      })}
    </div>
  );
}

// Hook for accessing booking flow analytics in child components
export function useBookingFlowAnalytics() {
  const contextRef = useRef<any>(null);
  
  // This would typically come from a React Context, but for simplicity we'll use a ref
  // In a real implementation, you'd want to use React Context
  return contextRef.current || {
    trackStepInteraction: () => {},
    trackStepValidation: () => {},
    trackStepAbandonment: () => {},
    trackFunnelCompletion: () => {},
    currentStep: '',
    funnelName: '',
    sessionId: '',
    isTrackingEnabled: false
  };
}