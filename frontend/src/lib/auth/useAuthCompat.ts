/**
 * Better Auth Compatibility Layer
 * Simplified for Phase 4 completion - maintains essential compatibility only
 */

'use client'

import { useSession, signIn, signOut, signUp } from './better-auth-client'
import { useUserRole } from './useUserRole'
import { UserRole } from './better-auth-client'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, isPending: sessionLoading, error: sessionError } = useSession()
  const { currentRole, hasRole: hasRoleFunc, isLoading: roleLoading } = useUserRole();
  
  // Simplified user extraction - Better Auth standard structure
  const user = session?.user || null;
  const isLoading = sessionLoading || roleLoading;
  
  // Simplified authentication check
  const isAuthenticated = !!session && !!session.user && !sessionError;
  
  // Simplified role extraction
  const userRole = session?.user?.role || currentRole;

  // Simplified role check functions
  const isAdmin = () => userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  const isSuperAdmin = () => userRole === UserRole.SUPER_ADMIN;
  const isTechnician = () => userRole === UserRole.TECHNICIAN;
  const isCustomer = () => userRole === UserRole.CUSTOMER;

  // Simplified authentication actions using Better Auth directly
  const enhancedSignIn = async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Missing email or password');
    }
    return signIn(credentials);
  };

  const enhancedSignOut = async () => {
    return signOut();
  };

  // Simplified permission check
  const checkPermission = useCallback((resource: string, action: string) => {
    if (!userRole || !resource || !action) return false;
    
    if (userRole === 'SUPER_ADMIN') return true;
    
    if (userRole === 'ADMIN') {
      const adminResources = ['users', 'settings', 'reports', 'bookings', 'customers', 
                             'repairs', 'inventory', 'pricing', 'analytics'];
      return adminResources.includes(resource);
    }
    
    if (userRole === 'TECHNICIAN') {
      return resource === 'repairs' || (resource === 'bookings' && ['read', 'update'].includes(action));
    }
    
    if (userRole === 'CUSTOMER') {
      return ['profile', 'bookings'].includes(resource) && ['read', 'create'].includes(action);
    }
    
    return false;
  }, [userRole]);

  return {
    // Better Auth core data
    user,
    session,
    
    // Authentication state
    isAuthenticated,
    isLoading,
    error: sessionError,
    
    // Authentication actions
    signIn: enhancedSignIn,
    signOut: enhancedSignOut,
    signUp,
    
    // Role checking functions
    isAdmin,
    isSuperAdmin, 
    isTechnician,
    isCustomer,
    
    // Role information
    role: userRole,
    currentRole: userRole,
    
    // Utility functions
    hasRole: hasRoleFunc,
    checkPermission
  }
}