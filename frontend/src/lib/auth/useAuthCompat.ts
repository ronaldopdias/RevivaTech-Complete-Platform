/**
 * Better Auth Compatibility Layer
 * 
 * Provides backward compatibility for components expecting legacy auth interface
 * while using Better Auth under the hood.
 */

'use client'

import { useSession, signIn, signOut, signUp } from './better-auth-client'
import { useUserRole } from './useUserRole'
import { UserRole } from './better-auth-client'

export function useAuth() {
  // Better Auth only provides useSession, not useAuth
  const { data: session, isPending: sessionLoading, error: sessionError } = useSession()
  
  // Enhanced user extraction with fallback sources
  const extractUser = () => {
    // Try multiple sources for user data
    const sessionUser = session?.user;
    const directSession = session;
    
    // Return the most complete user object available
    if (sessionUser && typeof sessionUser === 'object') {
      return sessionUser;
    }
    
    // Fallback: if session has user-like properties directly
    if (directSession && (directSession.email || directSession.id)) {
      return directSession;
    }
    
    return null;
  };
  
  const user = extractUser();
  const userLoading = sessionLoading;
  const { currentRole, hasRole: hasRoleFunc, isLoading: roleLoading } = useUserRole();
  
  // Enhanced loading state management
  const isLoading = userLoading || sessionLoading || roleLoading;
  
  // More reliable authentication check for Better Auth
  // Sometimes session exists before user is extracted, so check session first
  const isAuthenticated = (
    (!!session && !sessionError) || // Primary: session exists and no error
    (!!user && !!session && !sessionError) // Secondary: both user and session
  );
  
  // Enhanced session validation
  const hasValidSession = !!session && !!session.user && !sessionError;
  const hasSessionData = !!session && (session.email || session.user?.email);

  // Enhanced role extraction with Better Auth session structure
  const getUserRole = () => {
    // Try session.user.role first (most common Better Auth structure)
    if (session?.user?.role) return session.user.role;
    
    // Try extracted user role
    if (user?.role) return user.role;
    
    // Try direct session role (less common but possible)
    if (session?.role) return session.role;
    
    // Try useUserRole hook result
    if (currentRole) return currentRole;
    
    // Additional Better Auth specific checks
    if (session?.user && session.user.email) {
      // Check if we can infer role from session structure
      const sessionData = session.user;
      if (sessionData.role) return sessionData.role;
    }
    
    return null;
  };

  const userRole = getUserRole();

  // Legacy compatibility functions with enhanced role detection
  const isAdmin = () => {
    const role = userRole || currentRole;
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  };
  
  const isSuperAdmin = () => {
    const role = userRole || currentRole;
    return role === UserRole.SUPER_ADMIN;
  };
  
  const isTechnician = () => {
    const role = userRole || currentRole;
    return role === UserRole.TECHNICIAN;
  };
  
  const isCustomer = () => {
    const role = userRole || currentRole;
    return role === UserRole.CUSTOMER;
  };

  // Enhanced sign out with comprehensive error handling
  const enhancedSignOut = async () => {
    try {
      console.log('[Auth] Starting sign out process...');
      
      // Check if we're already signed out
      if (!isAuthenticated && !session) {
        console.log('[Auth] Already signed out, clearing any stale state');
        return { success: true, message: 'Already signed out' };
      }
      
      const result = await signOut();
      console.log('[Auth] Sign out successful');
      
      // Add small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return result;
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          console.log('[Auth] Network error during sign out, clearing local session');
          return { success: true, message: 'Local sign out completed due to network error' };
        }
        
        if (error.message.includes('session') || error.message.includes('token')) {
          console.log('[Auth] Session error during sign out, likely already expired');
          return { success: true, message: 'Session already expired' };
        }
      }
      
      // Re-throw for other errors
      throw error;
    }
  };

  // Enhanced sign in with comprehensive error handling
  const enhancedSignIn = async (credentials) => {
    try {
      console.log('[Auth] Starting sign in process for:', credentials.email);
      
      // Validate credentials before attempting sign in
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Missing email or password');
      }
      
      const result = await signIn(credentials);
      console.log('[Auth] Sign in successful, result:', { success: result?.success, error: result?.error });
      
      // Check if sign in was actually successful
      if (result?.error) {
        throw new Error(result.error.message || 'Sign in failed');
      }
      
      return result;
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('unauthorized')) {
          throw new Error('Invalid email or password');
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        
        if (error.message.includes('account') && error.message.includes('locked')) {
          throw new Error('Account is temporarily locked. Please contact support.');
        }
      }
      
      // Re-throw with generic message for unknown errors
      throw new Error(error.message || 'An unexpected error occurred during sign in');
    }
  };

  return {
    // Better Auth data - enhanced user structure
    user: user,
    session,
    
    // Authentication state with error handling
    isAuthenticated,
    isLoading,
    error: sessionError,
    
    // Authentication actions with enhanced error handling
    signIn: enhancedSignIn,
    signOut: enhancedSignOut,
    signUp,
    
    // Role checking functions (legacy compatibility) with enhanced detection
    isAdmin,
    isSuperAdmin, 
    isTechnician,
    isCustomer,
    
    // Enhanced role information with Better Auth compatibility
    role: userRole || currentRole,
    currentRole: userRole,
    
    // Additional Better Auth session info
    hasValidSession,
    hasSessionData,
    sessionData: session,
    
    // Role utility function
    hasRole: hasRoleFunc,
    
    // Enhanced permission checking function with error handling
    checkPermission: (resource: string, action: string) => {
      try {
        const roleToCheck = userRole || session?.user?.role || currentRole;
        
        if (!roleToCheck) {
          console.log('[Auth] No role available for permission check');
          return false;
        }
        
        if (!resource || !action) {
          console.warn('[Auth] Invalid resource or action for permission check:', { resource, action });
          return false;
        }
        
        console.log('[Auth] Checking permission for role:', roleToCheck, 'resource:', resource, 'action:', action);
        
        // Super admin has all permissions
        if (roleToCheck === 'SUPER_ADMIN') return true;
        
        // Admin has most permissions
        if (roleToCheck === 'ADMIN') {
          const adminResources = ['users', 'settings', 'reports', 'bookings', 'customers', 
                                 'repairs', 'inventory', 'pricing', 'analytics', 'media',
                                 'email', 'templates', 'messages', 'database', 'procedures'];
          return adminResources.includes(resource);
        }
        
        // Technician permissions
        if (roleToCheck === 'TECHNICIAN') {
          const techResources = ['repairs', 'bookings', 'customers'];
          const allowedActions = ['read', 'update'];
          return techResources.includes(resource) && allowedActions.includes(action);
        }
        
        // Customer permissions
        if (roleToCheck === 'CUSTOMER') {
          const customerResources = ['profile', 'bookings', 'repairs'];
          const allowedActions = ['read', 'create'];
          return customerResources.includes(resource) && allowedActions.includes(action);
        }
        
        return false;
      } catch (error) {
        console.error('[Auth] Error checking permissions:', error);
        return false; // Fail secure - deny access on error
      }
    },
    
    // Enhanced error recovery function
    recoverFromAuthError: async () => {
      try {
        console.log('[Auth] Attempting to recover from auth error...');
        
        // Try to refresh session
        const { data: refreshedSession } = useSession();
        
        if (refreshedSession) {
          console.log('[Auth] Session recovered successfully');
          return { success: true, session: refreshedSession };
        }
        
        console.log('[Auth] No session available, user needs to re-authenticate');
        return { success: false, requiresReauth: true };
      } catch (error) {
        console.error('[Auth] Error during auth recovery:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Enhanced session validation
    validateSession: () => {
      try {
        if (!session) {
          return { valid: false, reason: 'No session available' };
        }
        
        if (sessionError) {
          return { valid: false, reason: 'Session error', error: sessionError };
        }
        
        if (!user) {
          return { valid: false, reason: 'No user data in session' };
        }
        
        if (!userRole && !currentRole) {
          return { valid: false, reason: 'No role information available' };
        }
        
        return { valid: true };
      } catch (error) {
        console.error('[Auth] Error validating session:', error);
        return { valid: false, reason: 'Validation error', error: error.message };
      }
    }
  }
}