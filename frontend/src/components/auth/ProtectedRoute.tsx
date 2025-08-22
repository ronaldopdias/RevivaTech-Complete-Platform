'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  fallback,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkPermission } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  
  // CRITICAL DEBUG: Log the auth state on EVERY render
  console.log('🔒 ProtectedRoute RENDER:', {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role,
    requiredRole,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    timestamp: new Date().toISOString()
  });

  // FIXED: All navigation moved to useEffect to prevent React rendering errors
  useEffect(() => {
    if (shouldRedirect) {
      router.push(shouldRedirect);
      setShouldRedirect(null); // Clear redirect state
    }
  }, [shouldRedirect, router]);

  // ENHANCED navigation protection - prevent ANY redirects if stored credentials exist
  useEffect(() => {
    // Only redirect after a grace period AND if no stored credentials exist
    const redirectTimer = setTimeout(() => {
      if (!isLoading && (!isAuthenticated || !user)) {
        // CRITICAL: Always check localStorage before any redirect
        const hasStoredTokens = typeof window !== 'undefined' && 
          localStorage.getItem('revivatech_auth_tokens') && 
          localStorage.getItem('revivatech_auth_user');
        
        if (!hasStoredTokens) {
          setShouldRedirect(redirectTo);
        } else {
          // Do NOT redirect - let AuthContext handle authentication restoration
        }
      }
    }, 1000); // Increased to 1000ms grace period for better reliability

    return () => clearTimeout(redirectTimer);
  }, [isLoading, isAuthenticated, user, redirectTo]);

  // Show loading state with improved UX
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // AGGRESSIVE localStorage check to prevent false redirects
  const hasStoredCredentials = typeof window !== 'undefined' && 
    localStorage.getItem('revivatech_auth_tokens') && 
    localStorage.getItem('revivatech_auth_user');

  // CRITICAL FIX: If we have stored credentials, ALWAYS show loading, never redirect
  // This prevents the race condition where ProtectedRoute redirects before AuthContext initializes
  if (!isAuthenticated || !user) {
    // If we have stored credentials, FORCE loading state (AuthContext will handle auth)
    if (hasStoredCredentials) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600">Restoring your session...</p>
            <p className="text-xs text-gray-400">Found stored authentication, please wait...</p>
          </div>
        </div>
      );
    }

    // No stored credentials - show redirect message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role requirements with hierarchy support
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Role hierarchy check: SUPER_ADMIN > ADMIN > TECHNICIAN > CUSTOMER
    const getRoleLevel = (role: UserRole): number => {
      switch (role) {
        case UserRole.SUPER_ADMIN: return 4;
        case UserRole.ADMIN: return 3;
        case UserRole.TECHNICIAN: return 2;
        case UserRole.CUSTOMER: return 1;
        default: return 0;
      }
    };
    
    const userRoleLevel = getRoleLevel(user.role as UserRole);
    const hasRequiredRole = roles.some(requiredRole => 
      userRoleLevel >= getRoleLevel(requiredRole)
    );
    
    // DEBUG: Log role comparison details
    console.log('🔐 ProtectedRoute Role Check:', {
      userRole: user.role,
      userRoleLevel,
      requiredRoles: roles,
      requiredRoleLevels: roles.map(r => getRoleLevel(r)),
      hasRequiredRole: hasRequiredRole,
      hierarchyCheck: true,
      UserRoleEnum: UserRole
    });
    
    if (!hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      // For most cases, role mismatch means user should login with correct account
      // Only show access denied for specific admin-only pages with authenticated users
      const isAdminOnlyPage = roles.every(role => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN);
      const userIsAuthenticated = isAuthenticated && user && user.role;
      
      if (!isAdminOnlyPage || !userIsAuthenticated) {
        // FIXED: Use state to trigger redirect in useEffect instead of during render
        if (!shouldRedirect) {
          setShouldRedirect(redirectTo);
        }
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          </div>
        );
      }
      
      // Only show access denied for authenticated users on admin-only pages
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <button
              onClick={() => router.back()}
              className="text-primary hover:underline text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      checkPermission(resource, action)
    );

    if (!hasAllPermissions) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      // For permission issues, also redirect to login in most cases
      // Only show permissions error for clearly authenticated users
      const userIsFullyAuthenticated = isAuthenticated && user && user.role;
      
      if (!userIsFullyAuthenticated) {
        // FIXED: Use state to trigger redirect in useEffect instead of during render
        if (!shouldRedirect) {
          setShouldRedirect(redirectTo);
        }
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          </div>
        );
      }
      
      // Only show insufficient permissions for authenticated users
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="text-4xl mb-4">🛡️</div>
            <h2 className="text-xl font-semibold">Insufficient Permissions</h2>
            <p className="text-sm text-muted-foreground">
              You don't have the required permissions to access this resource.
            </p>
            <button
              onClick={() => router.back()}
              className="text-primary hover:underline text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;