/**
 * Profile Completion Hook
 * Handles progressive registration state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth';
import { ProfileCompletionData } from './types';

export interface ProfileCompletionStatus {
  needsCompletion: boolean;
  registrationStatus: 'COMPLETE' | 'PENDING_PROFILE_COMPLETION' | null;
  profileCompletedAt?: string;
  hasPhone: boolean;
}

export interface UseProfileCompletionReturn {
  /** Current profile completion status */
  status: ProfileCompletionStatus | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Check if user needs profile completion */
  needsProfileCompletion: boolean;
  /** Complete user profile */
  completeProfile: (data: Omit<ProfileCompletionData, 'userId'>) => Promise<{ success: boolean; error?: string }>;
  /** Skip profile completion (for testing) */
  skipProfileCompletion: () => Promise<{ success: boolean; error?: string }>;
  /** Refresh profile completion status */
  refreshStatus: () => Promise<void>;
  /** Get pre-filled user data for form */
  getUserData: () => Promise<{ success: boolean; user?: any; error?: string }>;
}

/**
 * Hook for managing progressive registration and profile completion
 * 
 * @example
 * ```tsx
 * const { needsProfileCompletion, completeProfile, status } = useProfileCompletion();
 * 
 * if (needsProfileCompletion) {
 *   // Show profile completion form
 *   return <ProfileCompletionForm onComplete={completeProfile} />
 * }
 * ```
 */
export function useProfileCompletion(): UseProfileCompletionReturn {
  const { data: session } = useSession();
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;

  /**
   * Check profile completion status from server
   */
  const checkStatus = useCallback(async () => {
    if (!userId) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile-completion/status?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setStatus({
          needsCompletion: data.needsCompletion,
          registrationStatus: data.registrationStatus,
          profileCompletedAt: data.profileCompletedAt,
          hasPhone: data.hasPhone
        });
      } else {
        setError(data.error || 'Failed to check profile status');
        setStatus(null);
      }
    } catch (err) {
      setError('Failed to check profile status');
      setStatus(null);
      console.error('Profile status check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Get user data for pre-filling profile completion form
   */
  const getUserData = useCallback(async () => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch(`/api/profile-completion/user-data/${userId}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Get user data error:', err);
      return { success: false, error: 'Failed to get user data' };
    }
  }, [userId]);

  /**
   * Complete user profile with additional information
   */
  const completeProfile = useCallback(async (profileData: Omit<ProfileCompletionData, 'userId'>) => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile-completion/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...profileData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update status to reflect completion
        setStatus(prev => prev ? {
          ...prev,
          needsCompletion: false,
          registrationStatus: 'COMPLETE',
          profileCompletedAt: data.user?.profileCompletedAt,
          hasPhone: true
        } : null);
        
        return { success: true };
      } else {
        setError(data.error || 'Failed to complete profile');
        return { success: false, error: data.error || 'Failed to complete profile' };
      }
    } catch (err) {
      const errorMessage = 'Failed to complete profile. Please try again.';
      setError(errorMessage);
      console.error('Profile completion error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Skip profile completion (for testing purposes)
   */
  const skipProfileCompletion = useCallback(async () => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile-completion/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update status to reflect completion
        setStatus(prev => prev ? {
          ...prev,
          needsCompletion: false,
          registrationStatus: 'COMPLETE'
        } : null);
        
        return { success: true };
      } else {
        setError(data.error || 'Failed to skip profile completion');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = 'Failed to skip profile completion';
      setError(errorMessage);
      console.error('Skip profile completion error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check status when user changes or component mounts
  useEffect(() => {
    if (userId) {
      checkStatus();
    } else {
      setStatus(null);
      setError(null);
    }
  }, [userId, checkStatus]);

  // Also check status from session data if available (for immediate feedback)
  useEffect(() => {
    if (session?.user && 'registrationStatus' in session.user) {
      const userRegistrationStatus = (session.user as any).registrationStatus;
      
      if (userRegistrationStatus) {
        setStatus(prev => ({
          needsCompletion: userRegistrationStatus === 'PENDING_PROFILE_COMPLETION',
          registrationStatus: userRegistrationStatus,
          profileCompletedAt: (session.user as any).profileCompletedAt,
          hasPhone: !!(session.user as any).phone,
          ...prev // Keep server data if available
        }));
      }
    }
  }, [session]);

  const needsProfileCompletion = status?.needsCompletion ?? false;

  return {
    status,
    isLoading,
    error,
    needsProfileCompletion,
    completeProfile,
    skipProfileCompletion,
    refreshStatus: checkStatus,
    getUserData
  };
}