'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/client';
import SmartOnboardingFlow, { type UserProfile } from '@/components/onboarding/SmartOnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  isOnboardingVisible: boolean;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  resetOnboarding: () => void;
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isOnboardingComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
  enableAutoStart?: boolean;
  skipForDevelopment?: boolean;
}

export const OnboardingProvider = ({ 
  children, 
  enableAutoStart = true,
  skipForDevelopment = false
}: OnboardingProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  
  // Use the advanced onboarding hook
  const {
    isComplete: isOnboardingComplete,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding: resetOnboardingHook,
    userData
  } = useOnboarding({
    steps: ['assessment', 'role_selection', 'training', 'competency_assessment', 'completion'],
    storageKey: 'revivatech_advanced_onboarding',
    autoStart: false,
    requiresAuth: true
  });

  // Check if user should see onboarding
  useEffect(() => {
    if (skipForDevelopment && process.env.NODE_ENV === 'development') {
      return;
    }

    // Auto-start onboarding for new authenticated users
    if (enableAutoStart && isAuthenticated && !isOnboardingComplete && user) {
      // Check if user is new (you might have a field for this)
      const isNewUser = !user.lastLoginAt || 
                       (user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)); // Created within last 24 hours
      
      if (isNewUser) {
        setIsOnboardingVisible(true);
      }
    }
  }, [isAuthenticated, isOnboardingComplete, user, enableAutoStart, skipForDevelopment]);

  // Load user profile from storage or user data
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('revivatech_user_profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else if (user) {
        // Create profile from user data
        const initialProfile: UserProfile = {
          id: user.id,
          role: user.role || 'customer',
          experience: 'beginner',
          preferences: {
            learningStyle: 'mixed',
            pace: 'normal',
            skipIntroductions: false,
            enableGamification: true,
            preferredLanguage: 'en'
          },
          completedOnboardingBefore: isOnboardingComplete
        };
        setUserProfile(initialProfile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, [user, isOnboardingComplete]);

  const showOnboarding = () => {
    setIsOnboardingVisible(true);
    startOnboarding();
  };

  const hideOnboarding = () => {
    setIsOnboardingVisible(false);
  };

  const resetOnboarding = () => {
    resetOnboardingHook();
    setUserProfile(null);
    localStorage.removeItem('revivatech_user_profile');
    if (enableAutoStart && isAuthenticated) {
      showOnboarding();
    }
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    if (!userProfile) return;
    
    const updatedProfile = { ...userProfile, ...profileUpdate };
    setUserProfile(updatedProfile);
    
    try {
      localStorage.setItem('revivatech_user_profile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  };

  const handleOnboardingComplete = (completionData: any) => {
    completeOnboarding(completionData);
    setIsOnboardingVisible(false);
    
    // Update user profile with completion data
    if (completionData.userProfile) {
      updateUserProfile(completionData.userProfile);
    }

    // Track completion event
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_completed', {
          event_category: 'user_engagement',
          event_label: completionData.userProfile?.role || 'unknown',
          value: completionData.achievements?.length || 0
        });
      }
    } catch (error) {
      console.error('Failed to track onboarding completion:', error);
    }
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
    setIsOnboardingVisible(false);
    
    // Track skip event
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_skipped', {
          event_category: 'user_engagement',
          event_label: userProfile?.role || 'unknown'
        });
      }
    } catch (error) {
      console.error('Failed to track onboarding skip:', error);
    }
  };

  const contextValue: OnboardingContextType = {
    isOnboardingVisible,
    showOnboarding,
    hideOnboarding,
    resetOnboarding,
    userProfile,
    updateUserProfile,
    isOnboardingComplete
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* Advanced Onboarding Overlay */}
      {isOnboardingVisible && (
        <SmartOnboardingFlow
          userProfile={userProfile}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          onProfileUpdate={updateUserProfile}
          enableAI={true}
          showProgress={true}
          className="z-[9999]"
        />
      )}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;