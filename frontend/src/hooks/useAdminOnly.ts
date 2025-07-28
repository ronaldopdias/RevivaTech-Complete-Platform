'use client';

import { useAuth } from '@/lib/auth/client';
import { useEffect, useState } from 'react';

/**
 * Hook for admin-only features and components
 * Returns whether the current user is an admin and provides utilities
 * for admin-restricted functionality
 */
export function useAdminOnly() {
  const { isAdmin, user, isAuthenticated } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    setIsAdminUser(isAuthenticated && isAdmin());
  }, [isAuthenticated, isAdmin]);

  return {
    isAdminUser,
    requireAdmin: () => {
      if (!isAdminUser) {
        throw new Error('Admin access required');
      }
    },
    withAdminCheck: <T extends any[], R>(
      fn: (...args: T) => R
    ) => {
      return (...args: T): R | null => {
        if (!isAdminUser) {
          console.warn('Admin access required for this function');
          return null;
        }
        return fn(...args);
      };
    },
    AdminWrapper: ({ children }: { children: React.ReactNode }) => {
      return isAdminUser ? <>{children}</> : null;
    },
  };
}

/**
 * Higher-order component that wraps a component to only render for admin users
 */
export function withAdminAccess<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AdminOnlyComponent(props: P) {
    const { isAdminUser } = useAdminOnly();
    
    if (!isAdminUser) {
      return null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Admin-only console logging that only logs when user is admin
 */
export function useAdminConsole() {
  const { isAdminUser } = useAdminOnly();

  return {
    log: (...args: any[]) => {
      if (isAdminUser) {
        console.log('[ADMIN]', ...args);
      }
    },
    warn: (...args: any[]) => {
      if (isAdminUser) {
        console.warn('[ADMIN]', ...args);
      }
    },
    error: (...args: any[]) => {
      if (isAdminUser) {
        console.error('[ADMIN]', ...args);
      }
    },
    debug: (...args: any[]) => {
      if (isAdminUser) {
        console.debug('[ADMIN]', ...args);
      }
    },
  };
}

export default useAdminOnly;