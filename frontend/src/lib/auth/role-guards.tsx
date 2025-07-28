'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useRBAC } from './rbac-context';
import { UserRole } from './types';

// Enhanced route protection with granular permissions
interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requireAll?: boolean; // Whether to require ALL permissions or just ANY
  resourceData?: any; // Data for conditional permission checking
  fallback?: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles,
  requiredPermissions,
  requireAll = true,
  resourceData,
  fallback,
  redirectTo,
  showAccessDenied = true,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasRole, hasPermission, hasAllPermissions, hasAnyPermission } = useRBAC();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    if (redirectTo) {
      router.push(redirectTo);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      );
    }
    return <>{fallback || null}</>;
  }

  // Check role requirements
  if (requiredRoles && !hasRole(requiredRoles)) {
    if (fallback) return <>{fallback}</>;
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    if (!showAccessDenied) return null;
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don't have the required role to access this resource.
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

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const permissionCheck = requireAll 
      ? requiredPermissions.every(({ resource, action }) => hasPermission(resource, action, resourceData))
      : requiredPermissions.some(({ resource, action }) => hasPermission(resource, action, resourceData));

    if (!permissionCheck) {
      if (fallback) return <>{fallback}</>;
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }
      
      if (!showAccessDenied) return null;
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="text-4xl mb-4">🛡️</div>
            <h2 className="text-xl font-semibold">Insufficient Permissions</h2>
            <p className="text-sm text-muted-foreground">
              You don't have the required permissions to access this resource.
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Required: {requiredPermissions.map(p => `${p.resource}:${p.action}`).join(', ')}
            </div>
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

  return <>{children}</>;
};

// Permission gate for conditional rendering (no redirection)
interface PermissionGateProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  resourceData?: any;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  resourceData,
  fallback = null,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = useRBAC();

  if (isLoading) return null;

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (!hasPermission(resource, action, resourceData)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Resource-specific permission gates
interface ResourceGateProps {
  children: React.ReactNode;
  resource: string;
  resourceData?: any;
  fallback?: React.ReactNode;
}

export const CanCreate: React.FC<ResourceGateProps> = ({ children, resource, fallback }) => {
  const { canCreateResource } = useRBAC();
  return canCreateResource(resource) ? <>{children}</> : <>{fallback}</>;
};

export const CanRead: React.FC<ResourceGateProps> = ({ children, resource, resourceData, fallback }) => {
  const { canReadResource } = useRBAC();
  return canReadResource(resource, resourceData) ? <>{children}</> : <>{fallback}</>;
};

export const CanUpdate: React.FC<ResourceGateProps> = ({ children, resource, resourceData, fallback }) => {
  const { canUpdateResource } = useRBAC();
  return canUpdateResource(resource, resourceData) ? <>{children}</> : <>{fallback}</>;
};

export const CanDelete: React.FC<ResourceGateProps> = ({ children, resource, resourceData, fallback }) => {
  const { canDeleteResource } = useRBAC();
  return canDeleteResource(resource, resourceData) ? <>{children}</> : <>{fallback}</>;
};

// Role-specific gates
interface RoleGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) ? <>{children}</> : <>{fallback}</>;
};

export const SuperAdminGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole(UserRole.SUPER_ADMIN) ? <>{children}</> : <>{fallback}</>;
};

export const TechnicianGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole(UserRole.TECHNICIAN) ? <>{children}</> : <>{fallback}</>;
};

export const CustomerGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole(UserRole.CUSTOMER) ? <>{children}</> : <>{fallback}</>;
};

// Staff gate (Technician, Admin, or Super Admin)
export const StaffGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole([UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]) ? <>{children}</> : <>{fallback}</>;
};

// Management gate (Admin or Super Admin)
export const ManagementGate: React.FC<RoleGateProps> = ({ children, fallback }) => {
  const { hasRole } = useRBAC();
  return hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) ? <>{children}</> : <>{fallback}</>;
};

// Conditional rendering based on multiple permissions
interface MultiPermissionGateProps {
  children: React.ReactNode;
  permissions: Array<{ resource: string; action: string }>;
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const MultiPermissionGate: React.FC<MultiPermissionGateProps> = ({
  children,
  permissions,
  requireAll = true,
  fallback = null,
}) => {
  const { hasAllPermissions, hasAnyPermission } = useRBAC();
  
  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for role-based component wrapping
interface WithRoleProps {
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  fallback?: React.ReactNode;
}

export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  roleConfig: WithRoleProps
) {
  return function WrappedComponent(props: P) {
    return (
      <RoleGuard
        requiredRoles={roleConfig.requiredRole}
        requiredPermissions={roleConfig.requiredPermissions}
        fallback={roleConfig.fallback}
        showAccessDenied={false}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// Hook for checking permissions in components
export const usePermissionCheck = () => {
  const { hasPermission, hasRole, hasAllPermissions, hasAnyPermission } = useRBAC();
  const { isAuthenticated } = useAuth();

  return {
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAllPermissions,
    hasAnyPermission,
    canAccess: (resource: string, action: string, resourceData?: any) => 
      isAuthenticated && hasPermission(resource, action, resourceData),
  };
};

export default RoleGuard;