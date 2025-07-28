'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/client';
import { UserRole } from '@/lib/auth/types';

interface AuthGuardProps {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
  permissions?: Array<{ resource: string; action: string }>;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthGuard component for conditional rendering based on authentication state and permissions
 * Unlike ProtectedRoute, this doesn't redirect but conditionally renders content
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  role,
  permissions,
  fallback = null,
  requireAuth = true,
}) => {
  const { user, isAuthenticated, isLoading, checkPermission } = useAuth();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // If authentication is not required and user is not authenticated, show children
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // If we reach here, user is authenticated (or auth not required)
  if (!user && requireAuth) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (role && user) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (permissions && user) {
    const hasAllPermissions = permissions.every(({ resource, action }) =>
      checkPermission(resource, action)
    );

    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for common use cases
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <AuthGuard role={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const TechnicianOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <AuthGuard role={UserRole.TECHNICIAN} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const CustomerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <AuthGuard role={UserRole.CUSTOMER} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <AuthGuard requireAuth={true} fallback={fallback}>
    {children}
  </AuthGuard>
);

export const GuestOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <AuthGuard requireAuth={false} fallback={fallback}>
    {children}
  </AuthGuard>
);

export default AuthGuard;