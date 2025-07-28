import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { Ability, AbilityBuilder } from '@casl/ability';
import { createContextualCan } from '@casl/react';

/**
 * Enhanced RBAC Provider with comprehensive permission and role management
 * Supports real-time permission updates, role inheritance, and context-aware permissions
 */

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  priority: number;
  description?: string;
  permissions: Permission[];
}

interface RBACContextType {
  permissions: Permission[];
  roles: Role[];
  ability: Ability;
  hasPermission: (action: string, resource: string, context?: any) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  getHighestRole: () => Role | null;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | null>(null);

// Create contextual Can component for use in templates
export const Can = createContextualCan(RBACContext.Consumer);

interface RBACProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  enableCache?: boolean;
  cacheTimeout?: number;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({
  children,
  fallback = null,
  enableCache = true,
  cacheTimeout = 5 * 60 * 1000 // 5 minutes
}) => {
  const { user, isLoading: userLoading } = useUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Create ability instance based on permissions
  const ability = useMemo(() => {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    // Define abilities based on permissions
    permissions.forEach(permission => {
      can(permission.action, permission.resource);
    });

    // Add context-aware permissions
    if (user) {
      // Users can always read their own profile
      can('read', 'own_profile');
      can('update', 'own_profile');
      
      // Users can read their own data
      can('read', 'own_data');
      
      // Add other context-aware permissions
      const hasAdminRole = roles.some(role => role.name === 'admin' || role.name === 'super_admin');
      if (hasAdminRole) {
        can('manage', 'all'); // Admin can manage everything
      }
    }

    return build();
  }, [permissions, roles, user]);

  // Fetch user permissions and roles
  const fetchPermissions = async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/permissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPermissions(data.permissions || []);
      setRoles(data.roles || []);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh permissions (public method)
  const refreshPermissions = async (): Promise<void> => {
    setLastFetch(0); // Force refresh
    await fetchPermissions();
  };

  // Check if user has specific permission
  const hasPermission = (action: string, resource: string, context?: any): boolean => {
    if (!user) return false;

    // Use CASL ability for basic permission checking
    const hasBasicPermission = ability.can(action, resource);
    if (hasBasicPermission) return true;

    // Context-aware permission checking
    if (context?.resourceOwnerId && context.resourceOwnerId === user.sub) {
      // User owns the resource
      if (resource === 'profile' || resource === 'own_profile') {
        return ['read', 'update'].includes(action);
      }
      if (resource === 'own_data') {
        return ['read', 'update', 'delete'].includes(action);
      }
    }

    return false;
  };

  // Check if user has specific role
  const hasRole = (roleName: string): boolean => {
    return roles.some(role => role.name === roleName);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Get user's highest priority role
  const getHighestRole = (): Role | null => {
    if (roles.length === 0) return null;
    return roles.reduce((highest, current) => 
      current.priority > highest.priority ? current : highest
    );
  };

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    if (!userLoading && user) {
      const shouldFetch = !enableCache || 
        (Date.now() - lastFetch) > cacheTimeout ||
        permissions.length === 0;

      if (shouldFetch) {
        fetchPermissions();
      } else {
        setIsLoading(false);
      }
    } else if (!userLoading && !user) {
      // Clear permissions when user logs out
      setPermissions([]);
      setRoles([]);
      setIsLoading(false);
      setError(null);
    }
  }, [user, userLoading, enableCache, cacheTimeout, lastFetch, permissions.length]);

  // Set up periodic refresh for permissions
  useEffect(() => {
    if (!user || !enableCache) return;

    const interval = setInterval(() => {
      if (Date.now() - lastFetch > cacheTimeout) {
        fetchPermissions();
      }
    }, cacheTimeout);

    return () => clearInterval(interval);
  }, [user, enableCache, cacheTimeout, lastFetch]);

  // Context value
  const contextValue: RBACContextType = {
    permissions,
    roles,
    ability,
    hasPermission,
    hasRole,
    hasAnyRole,
    getHighestRole,
    isLoading,
    error,
    refreshPermissions
  };

  // Show fallback while loading
  if (isLoading && fallback) {
    return <>{fallback}</>;
  }

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

// Custom hook to use RBAC context
export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// Permission-based component wrapper
interface PermissionGuardProps {
  action: string;
  resource: string;
  context?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  action,
  resource,
  context,
  fallback = null,
  children
}) => {
  const { hasPermission } = useRBAC();

  if (!hasPermission(action, resource, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Role-based component wrapper
interface RoleGuardProps {
  roles: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  fallback = null,
  children
}) => {
  const { hasRole, hasAnyRole } = useRBAC();

  const roleArray = Array.isArray(roles) ? roles : [roles];
  const hasRequiredRole = roleArray.length === 1 ? hasRole(roleArray[0]) : hasAnyRole(roleArray);

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Enhanced protected route component
interface ProtectedRouteProps {
  permissions?: Array<{ action: string; resource: string }>;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permissions = [],
  roles = [],
  fallback = <div>Access Denied</div>,
  children
}) => {
  const { hasPermission, hasAnyRole } = useRBAC();

  // Check permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = permissions.every(({ action, resource }) =>
      hasPermission(action, resource)
    );
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (roles.length > 0) {
    const hasRequiredRoles = hasAnyRole(roles);
    if (!hasRequiredRoles) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RBACProvider;