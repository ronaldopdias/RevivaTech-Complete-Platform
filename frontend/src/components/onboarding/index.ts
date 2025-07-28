export { default as OnboardingFlow } from './OnboardingFlow';
export { default as InteractiveOnboarding, ROLE_BASED_FLOWS } from './InteractiveOnboarding';
export { default as SmartOnboardingFlow } from './SmartOnboardingFlow';
export { default as ProgressIndicator, SimpleProgressBar, CircularProgress } from './ProgressIndicator';

// Re-export hooks
export { useOnboarding, useOnboardingAnalytics } from '../../hooks/useOnboarding';

// Re-export types
export type { UserProfile, AdaptiveRecommendation } from './SmartOnboardingFlow';
export type { UserRole, RoleBasedFlow, TrainingModule } from './InteractiveOnboarding';