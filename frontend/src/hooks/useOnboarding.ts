'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnboardingState {
  isComplete: boolean;
  currentStep: number;
  skippedSteps: string[];
  completedSteps: string[];
  userData: Record<string, any>;
  preferences: Record<string, any>;
}

interface UseOnboardingOptions {
  steps: string[];
  storageKey?: string;
  autoStart?: boolean;
  requiresAuth?: boolean;
}

const defaultState: OnboardingState = {
  isComplete: false,
  currentStep: 0,
  skippedSteps: [],
  completedSteps: [],
  userData: {},
  preferences: {},
};

export const useOnboarding = ({
  steps,
  storageKey = 'revivatech_onboarding',
  autoStart = true,
  requiresAuth = true,
}: UseOnboardingOptions) => {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage
  useEffect(() => {
    const loadState = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedState = JSON.parse(saved);
          setState(prevState => ({ ...prevState, ...parsedState }));
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [storageKey]);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    try {
      const updatedState = { ...state, ...newState };
      setState(updatedState);
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }, [state, storageKey]);

  // Check if onboarding should be shown
  useEffect(() => {
    if (isLoading) return;

    const shouldShow = autoStart && 
      !state.isComplete && 
      (!requiresAuth || isAuthenticated);

    setIsVisible(shouldShow);
  }, [isLoading, autoStart, requiresAuth, state.isComplete]);

  // Check authentication status (you might need to adapt this to your auth system)
  const isAuthenticated = useCallback(() => {
    // This is a placeholder - replace with your actual auth check
    const token = localStorage.getItem('auth_token');
    return !!token;
  }, []);

  // Start onboarding
  const startOnboarding = useCallback(() => {
    setIsVisible(true);
    saveState({ currentStep: 0 });
  }, [saveState]);

  // Complete a step
  const completeStep = useCallback((stepId: string, data?: any) => {
    const stepIndex = steps.indexOf(stepId);
    const newCompletedSteps = [...state.completedSteps];
    
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
    }

    const newState: Partial<OnboardingState> = {
      completedSteps: newCompletedSteps,
      currentStep: Math.min(stepIndex + 1, steps.length - 1),
    };

    if (data) {
      newState.userData = { ...state.userData, [stepId]: data };
    }

    // Check if all required steps are complete
    const requiredSteps = steps.filter(step => !state.skippedSteps.includes(step));
    const allRequiredComplete = requiredSteps.every(step => 
      newCompletedSteps.includes(step)
    );

    if (allRequiredComplete) {
      newState.isComplete = true;
    }

    saveState(newState);

    // If this was the last step, hide onboarding
    if (newState.isComplete) {
      setTimeout(() => setIsVisible(false), 1000);
    }
  }, [steps, state, saveState]);

  // Skip a step
  const skipStep = useCallback((stepId: string) => {
    const stepIndex = steps.indexOf(stepId);
    const newSkippedSteps = [...state.skippedSteps];
    
    if (!newSkippedSteps.includes(stepId)) {
      newSkippedSteps.push(stepId);
    }

    saveState({
      skippedSteps: newSkippedSteps,
      currentStep: Math.min(stepIndex + 1, steps.length - 1),
    });
  }, [steps, state.skippedSteps, saveState]);

  // Go to a specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      saveState({ currentStep: stepIndex });
    }
  }, [steps, saveState]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (state.currentStep < steps.length - 1) {
      saveState({ currentStep: state.currentStep + 1 });
    }
  }, [state.currentStep, steps, saveState]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      saveState({ currentStep: state.currentStep - 1 });
    }
  }, [state.currentStep, saveState]);

  // Complete entire onboarding
  const completeOnboarding = useCallback((finalData?: any) => {
    const newState: Partial<OnboardingState> = {
      isComplete: true,
    };

    if (finalData) {
      newState.userData = { ...state.userData, ...finalData };
    }

    saveState(newState);
    setIsVisible(false);

    // Send completion event to analytics
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_completed', {
          event_category: 'user_engagement',
          event_label: 'onboarding_flow',
        });
      }
    } catch (error) {
      console.error('Failed to track onboarding completion:', error);
    }
  }, [state.userData, saveState]);

  // Skip entire onboarding
  const skipOnboarding = useCallback(() => {
    saveState({
      isComplete: true,
      skippedSteps: steps,
    });
    setIsVisible(false);

    // Send skip event to analytics
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_skipped', {
          event_category: 'user_engagement',
          event_label: 'onboarding_flow',
          value: state.currentStep,
        });
      }
    } catch (error) {
      console.error('Failed to track onboarding skip:', error);
    }
  }, [steps, state.currentStep, saveState]);

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(storageKey);
    if (autoStart) {
      setIsVisible(true);
    }
  }, [storageKey, autoStart]);

  // Update user preferences
  const updatePreferences = useCallback((preferences: Record<string, any>) => {
    saveState({
      preferences: { ...state.preferences, ...preferences },
    });
  }, [state.preferences, saveState]);

  // Get step status
  const getStepStatus = useCallback((stepId: string) => {
    if (state.completedSteps.includes(stepId)) return 'completed';
    if (state.skippedSteps.includes(stepId)) return 'skipped';
    if (steps.indexOf(stepId) === state.currentStep) return 'current';
    return 'pending';
  }, [state, steps]);

  // Check if a specific step is required
  const isStepRequired = useCallback((stepId: string) => {
    // You can customize this logic based on your requirements
    const optionalSteps = ['preferences', 'marketing']; // Example optional steps
    return !optionalSteps.includes(stepId);
  }, []);

  // Get progress percentage
  const getProgress = useCallback(() => {
    const totalSteps = steps.length;
    const completedCount = state.completedSteps.length + state.skippedSteps.length;
    return Math.round((completedCount / totalSteps) * 100);
  }, [steps, state]);

  // Check if user can proceed to next step
  const canProceed = useCallback(() => {
    const currentStepId = steps[state.currentStep];
    return !isStepRequired(currentStepId) || 
           state.completedSteps.includes(currentStepId);
  }, [steps, state, isStepRequired]);

  return {
    // State
    isVisible,
    isLoading,
    isComplete: state.isComplete,
    currentStep: state.currentStep,
    currentStepId: steps[state.currentStep],
    completedSteps: state.completedSteps,
    skippedSteps: state.skippedSteps,
    userData: state.userData,
    preferences: state.preferences,
    
    // Progress
    progress: getProgress(),
    canProceed: canProceed(),
    
    // Actions
    startOnboarding,
    completeStep,
    skipStep,
    goToStep,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    updatePreferences,
    
    // Utilities
    getStepStatus,
    isStepRequired,
    
    // Control
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
  };
};

// Hook for tracking onboarding analytics
export const useOnboardingAnalytics = () => {
  const trackStepViewed = useCallback((stepId: string) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_step_viewed', {
          event_category: 'user_engagement',
          event_label: stepId,
        });
      }
    } catch (error) {
      console.error('Failed to track step view:', error);
    }
  }, []);

  const trackStepCompleted = useCallback((stepId: string, timeSpent?: number) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_step_completed', {
          event_category: 'user_engagement',
          event_label: stepId,
          value: timeSpent,
        });
      }
    } catch (error) {
      console.error('Failed to track step completion:', error);
    }
  }, []);

  const trackStepSkipped = useCallback((stepId: string) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_step_skipped', {
          event_category: 'user_engagement',
          event_label: stepId,
        });
      }
    } catch (error) {
      console.error('Failed to track step skip:', error);
    }
  }, []);

  return {
    trackStepViewed,
    trackStepCompleted,
    trackStepSkipped,
  };
};

export default useOnboarding;