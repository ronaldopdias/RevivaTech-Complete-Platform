'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/auth/types';

export interface ErrorHandlingOptions {
  fallbackToLogin?: boolean;
  showErrorMessage?: boolean;
  logError?: boolean;
}

export function useRoleBasedErrorHandling() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const getRoleBasedFallbackPath = (role?: UserRole | string): string => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return '/admin';
      case UserRole.TECHNICIAN:
        return '/technician';
      case UserRole.CUSTOMER:
        return '/dashboard';
      default:
        return '/login';
    }
  };

  const handleAuthError = (
    error: Error,
    options: ErrorHandlingOptions = {}
  ) => {
    const {
      fallbackToLogin = true,
      showErrorMessage = true,
      logError = true
    } = options;

    if (logError) {
      console.error('[Role-Based Error Handler]', {
        error: error.message,
        stack: error.stack,
        userRole: user?.role,
        isAuthenticated,
        timestamp: new Date().toISOString()
      });
    }

    // Handle different types of auth errors
    if (error.message.includes('session') || error.message.includes('token')) {
      if (showErrorMessage) {
        console.warn('[Auth Error] Session/token error, redirecting to appropriate dashboard');
      }
      
      if (isAuthenticated && user?.role) {
        // User is authenticated but has session issues, redirect to their dashboard
        const fallbackPath = getRoleBasedFallbackPath(user.role);
        router.push(fallbackPath);
      } else if (fallbackToLogin) {
        router.push('/login?error=session_expired');
      }
      return;
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      if (showErrorMessage) {
        console.warn('[Auth Error] Permission error, redirecting based on role');
      }
      
      if (isAuthenticated && user?.role) {
        // User lacks permissions, redirect to their appropriate dashboard
        const fallbackPath = getRoleBasedFallbackPath(user.role);
        router.push(fallbackPath);
      } else if (fallbackToLogin) {
        router.push('/login?error=unauthorized');
      }
      return;
    }

    if (error.message.includes('role') || error.message.includes('access')) {
      if (showErrorMessage) {
        console.warn('[Auth Error] Role/access error, using role-based fallback');
      }
      
      const userRole = user?.role;
      if (userRole) {
        const fallbackPath = getRoleBasedFallbackPath(userRole);
        router.push(fallbackPath);
      } else if (fallbackToLogin) {
        router.push('/login?error=invalid_role');
      }
      return;
    }

    // Generic error fallback
    if (showErrorMessage) {
      console.warn('[Auth Error] Generic auth error, using default fallback');
    }
    
    if (isAuthenticated && user?.role) {
      const fallbackPath = getRoleBasedFallbackPath(user.role);
      router.push(fallbackPath);
    } else if (fallbackToLogin) {
      router.push('/login?error=auth_error');
    }
  };

  const handleRedirectError = (targetPath: string, error?: Error) => {
    console.error('[Redirect Error]', {
      targetPath,
      error: error?.message,
      userRole: user?.role,
      isAuthenticated
    });

    // If redirect fails, use role-based fallback
    if (user?.role) {
      const fallbackPath = getRoleBasedFallbackPath(user.role);
      
      // If the fallback is the same as the failed target, go to login
      if (fallbackPath === targetPath) {
        router.push('/login?error=redirect_failed');
      } else {
        router.push(fallbackPath);
      }
    } else {
      router.push('/login?error=redirect_failed');
    }
  };

  return {
    handleAuthError,
    handleRedirectError,
    getRoleBasedFallbackPath,
    currentUserRole: user?.role
  };
}