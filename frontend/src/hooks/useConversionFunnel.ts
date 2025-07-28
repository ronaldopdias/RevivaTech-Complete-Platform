'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useEventTracking from '@/hooks/useEventTracking';

export interface FunnelStep {
  id: string;
  name: string;
  order: number;
  required: boolean;
  category?: string;
}

export interface ConversionEventData {
  step_id: string;
  step_name: string;
  step_order: number;
  timestamp: string;
  session_id: string;
  user_id?: string;
  funnel_name: string;
  time_on_step?: number;
  interactions_count?: number;
  progression_rate?: number;
  drop_off_rate?: number;
  conversion_data?: any;
}

interface UseConversionFunnelOptions {
  funnelName: string;
  steps: FunnelStep[];
  initialStep?: string;
  sessionId?: string;
  userId?: string;
  autoTrack?: boolean;
  trackingEnabled?: boolean;
}

export default function useConversionFunnel({
  funnelName,
  steps,
  initialStep,
  sessionId,
  userId,
  autoTrack = true,
  trackingEnabled = true
}: UseConversionFunnelOptions) {
  const [currentStep, setCurrentStep] = useState<string>(initialStep || steps[0]?.id || '');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [funnelStartTime] = useState<number>(Date.now());
  const stepStartTime = useRef<number>(Date.now());
  const stepInteractions = useRef<number>(0);
  const [conversionData, setConversionData] = useState<any>({});

  const { trackEvent, trackConversion, isTrackingEnabled } = useEventTracking();

  const finalTrackingEnabled = trackingEnabled && isTrackingEnabled;

  // Generate session ID if not provided
  const finalSessionId = sessionId || `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Track funnel initialization
  useEffect(() => {
    if (finalTrackingEnabled && autoTrack) {
      trackEvent('conversion_funnel_initialized', {
        funnel_name: funnelName,
        total_steps: steps.length,
        initial_step: currentStep,
        session_id: finalSessionId,
        user_id: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        steps_config: steps
      });
    }
  }, []);

  // Get current step info
  const getCurrentStep = useCallback(() => {
    return steps.find(step => step.id === currentStep) || steps[0];
  }, [currentStep, steps]);

  // Track step entry
  const trackStepEntry = useCallback((stepId: string, additionalData?: any) => {
    if (!finalTrackingEnabled) return;

    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    stepStartTime.current = Date.now();
    stepInteractions.current = 0;

    const eventData: ConversionEventData = {
      step_id: stepId,
      step_name: step.name,
      step_order: step.order,
      timestamp: new Date().toISOString(),
      session_id: finalSessionId,
      user_id: userId,
      funnel_name: funnelName,
      progression_rate: (step.order / steps.length) * 100,
      conversion_data: { ...conversionData, ...additionalData }
    };

    trackEvent('funnel_step_entered', eventData);
    
    // Track micro-conversion for each step
    trackConversion(`step_${stepId}_entered`, {
      step_name: step.name,
      step_order: step.order,
      funnel_progress: eventData.progression_rate
    });
  }, [finalTrackingEnabled, steps, conversionData, finalSessionId, userId, funnelName]);

  // Track step exit
  const trackStepExit = useCallback((stepId: string, exitReason: 'progression' | 'abandonment' = 'progression', additionalData?: any) => {
    if (!finalTrackingEnabled) return;

    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const timeOnStep = Date.now() - stepStartTime.current;

    const eventData: ConversionEventData = {
      step_id: stepId,
      step_name: step.name,
      step_order: step.order,
      timestamp: new Date().toISOString(),
      session_id: finalSessionId,
      user_id: userId,
      funnel_name: funnelName,
      time_on_step: timeOnStep,
      interactions_count: stepInteractions.current,
      conversion_data: { ...conversionData, ...additionalData, exit_reason: exitReason }
    };

    trackEvent('funnel_step_exited', eventData);

    if (exitReason === 'abandonment') {
      const dropOffRate = ((steps.length - step.order) / steps.length) * 100;
      trackEvent('funnel_step_abandoned', {
        ...eventData,
        drop_off_rate: dropOffRate,
        abandonment_point: step.order,
        time_to_abandonment: Date.now() - funnelStartTime
      });
    }
  }, [finalTrackingEnabled, steps, conversionData, finalSessionId, userId, funnelName, funnelStartTime]);

  // Move to next step
  const nextStep = useCallback((stepData?: any) => {
    const currentStepData = getCurrentStep();
    if (!currentStepData) return false;

    // Track current step exit
    trackStepExit(currentStep, 'progression', stepData);

    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStep));

    // Find next step
    const nextStepData = steps.find(step => step.order === currentStepData.order + 1);
    if (!nextStepData) {
      // Funnel complete
      completeFunnel(stepData);
      return false;
    }

    // Update conversion data
    if (stepData) {
      setConversionData(prev => ({ ...prev, ...stepData }));
    }

    // Move to next step
    setCurrentStep(nextStepData.id);
    trackStepEntry(nextStepData.id, stepData);

    return true;
  }, [currentStep, steps, trackStepEntry, trackStepExit, getCurrentStep]);

  // Move to previous step
  const previousStep = useCallback(() => {
    const currentStepData = getCurrentStep();
    if (!currentStepData || currentStepData.order === 1) return false;

    trackStepExit(currentStep, 'progression');

    const prevStepData = steps.find(step => step.order === currentStepData.order - 1);
    if (!prevStepData) return false;

    setCurrentStep(prevStepData.id);
    trackStepEntry(prevStepData.id);

    return true;
  }, [currentStep, steps, trackStepEntry, trackStepExit, getCurrentStep]);

  // Jump to specific step
  const goToStep = useCallback((stepId: string, stepData?: any) => {
    const targetStep = steps.find(step => step.id === stepId);
    if (!targetStep) return false;

    trackStepExit(currentStep, 'progression', stepData);

    if (stepData) {
      setConversionData(prev => ({ ...prev, ...stepData }));
    }

    setCurrentStep(stepId);
    trackStepEntry(stepId, stepData);

    return true;
  }, [currentStep, steps, trackStepEntry, trackStepExit]);

  // Track interaction within current step
  const trackInteraction = useCallback((interactionType: string, interactionData?: any) => {
    if (!finalTrackingEnabled) return;

    stepInteractions.current++;

    trackEvent('funnel_step_interaction', {
      step_id: currentStep,
      step_name: getCurrentStep().name,
      interaction_type: interactionType,
      interaction_count: stepInteractions.current,
      interaction_data: interactionData,
      funnel_name: funnelName,
      session_id: finalSessionId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }, [finalTrackingEnabled, currentStep, getCurrentStep, funnelName, finalSessionId, userId]);

  // Abandon funnel
  const abandonFunnel = useCallback((reason: string, additionalData?: any) => {
    if (!finalTrackingEnabled) return;

    const currentStepData = getCurrentStep();
    const totalFunnelTime = Date.now() - funnelStartTime;
    const completionPercentage = (currentStepData.order / steps.length) * 100;

    trackStepExit(currentStep, 'abandonment', { reason, ...additionalData });

    trackEvent('conversion_funnel_abandoned', {
      funnel_name: funnelName,
      abandonment_step: currentStep,
      abandonment_step_order: currentStepData.order,
      abandonment_reason: reason,
      completion_percentage: completionPercentage,
      total_funnel_time: totalFunnelTime,
      steps_completed: completedSteps.size,
      session_id: finalSessionId,
      user_id: userId,
      conversion_data: { ...conversionData, ...additionalData },
      timestamp: new Date().toISOString()
    });

    trackConversion('funnel_abandoned', {
      funnel_name: funnelName,
      reason: reason,
      completion_percentage: completionPercentage,
      steps_completed: completedSteps.size
    });
  }, [finalTrackingEnabled, getCurrentStep, currentStep, funnelStartTime, steps.length, completedSteps.size, funnelName, finalSessionId, userId, conversionData]);

  // Complete funnel
  const completeFunnel = useCallback((finalData?: any) => {
    if (!finalTrackingEnabled) return;

    const totalFunnelTime = Date.now() - funnelStartTime;
    const finalConversionData = { ...conversionData, ...finalData };

    trackEvent('conversion_funnel_completed', {
      funnel_name: funnelName,
      total_steps: steps.length,
      total_funnel_time: totalFunnelTime,
      steps_completed: completedSteps.size + 1, // +1 for current step
      completion_rate: 100,
      session_id: finalSessionId,
      user_id: userId,
      conversion_data: finalConversionData,
      timestamp: new Date().toISOString()
    });

    trackConversion('funnel_completed', {
      funnel_name: funnelName,
      total_time: totalFunnelTime,
      final_data: finalConversionData
    });

    // Update final conversion data
    if (finalData) {
      setConversionData(prev => ({ ...prev, ...finalData }));
    }

    setCompletedSteps(prev => new Set(prev).add(currentStep));
  }, [finalTrackingEnabled, funnelStartTime, conversionData, funnelName, steps.length, completedSteps.size, finalSessionId, userId, currentStep]);

  // Get funnel analytics
  const getFunnelAnalytics = useCallback(() => {
    const currentStepData = getCurrentStep();
    const totalSteps = steps.length;
    const completionPercentage = (currentStepData.order / totalSteps) * 100;
    const totalFunnelTime = Date.now() - funnelStartTime;

    return {
      funnel_name: funnelName,
      current_step: currentStep,
      current_step_name: currentStepData.name,
      current_step_order: currentStepData.order,
      total_steps: totalSteps,
      completion_percentage: completionPercentage,
      completed_steps: Array.from(completedSteps),
      total_funnel_time: totalFunnelTime,
      conversion_data: conversionData,
      session_id: finalSessionId
    };
  }, [getCurrentStep, steps.length, currentStep, funnelName, completedSteps, funnelStartTime, conversionData, finalSessionId]);

  // Initialize first step tracking
  useEffect(() => {
    if (finalTrackingEnabled && autoTrack && currentStep) {
      trackStepEntry(currentStep);
    }
  }, [currentStep, finalTrackingEnabled, autoTrack, trackStepEntry]);

  return {
    // State
    currentStep,
    completedSteps: Array.from(completedSteps),
    conversionData,
    
    // Step navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Tracking
    trackInteraction,
    abandonFunnel,
    completeFunnel,
    
    // Utilities
    getCurrentStep,
    getFunnelAnalytics,
    
    // Computed properties
    isFirstStep: getCurrentStep()?.order === 1,
    isLastStep: getCurrentStep()?.order === steps.length,
    progressPercentage: (getCurrentStep()?.order / steps.length) * 100,
    totalSteps: steps.length,
    sessionId: finalSessionId
  };
}