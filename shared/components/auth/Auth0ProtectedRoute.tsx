import React, { ReactNode } from 'react';
import { useAuth0 } from './Auth0Provider';

interface Auth0ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: string[];
  redirectTo?: string;
  className?: string;
}

export const Auth0ProtectedRoute: React.FC<Auth0ProtectedRouteProps> = ({
  children,
  fallback,
  roles = [],
  redirectTo,
  className = ''
}) => {
  const { isAuthenticated, isLoading, user } = useAuth0();

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default login redirect
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
    }
    
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check roles if specified
  if (roles.length > 0 && user) {
    const userRoles = user[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/roles`] || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className={`flex items-center justify-center min-h-screen ${className}`}>
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this resource.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Higher-order component version
export const withAuth0Protection = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    roles?: string[];
    redirectTo?: string;
    fallback?: ReactNode;
  } = {}
) => {
  const ProtectedComponent = (props: P) => {
    return (
      <Auth0ProtectedRoute {...options}>
        <Component {...props} />
      </Auth0ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withAuth0Protection(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};

// Hook for imperative protection checks
export const useAuth0Protection = () => {
  const { isAuthenticated, isLoading, user } = useAuth0();

  const checkAccess = (requiredRoles: string[] = []) => {
    if (isLoading) return { hasAccess: false, isLoading: true };
    if (!isAuthenticated) return { hasAccess: false, isLoading: false, reason: 'not_authenticated' };
    
    if (requiredRoles.length > 0) {
      const userRoles = user?.[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/roles`] || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return { hasAccess: false, isLoading: false, reason: 'insufficient_permissions' };
      }
    }
    
    return { hasAccess: true, isLoading: false };
  };

  const redirectToLogin = (returnTo?: string) => {
    if (typeof window !== 'undefined') {
      const currentPath = returnTo || window.location.pathname + window.location.search;
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    checkAccess,
    redirectToLogin
  };
};