'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { UserRole, Permission } from './types';

// Extended permission definitions for granular access control
export interface ExtendedPermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  metadata?: {
    description?: string;
    category?: string;
    level?: 'basic' | 'advanced' | 'critical';
  };
}

export interface RBACConfig {
  permissions: ExtendedPermission[];
  hierarchicalRoles: boolean;
  inheritPermissions: boolean;
  customConditions?: Record<string, (user: any, resource: any) => boolean>;
}

// Enhanced role hierarchy and permissions
const enhancedRolePermissions: Record<UserRole, ExtendedPermission[]> = {
  [UserRole.CUSTOMER]: [
    // Booking permissions
    { 
      resource: 'bookings', 
      action: 'create', 
      metadata: { description: 'Create new repair bookings', category: 'booking', level: 'basic' }
    },
    { 
      resource: 'bookings', 
      action: 'read:own', 
      conditions: { ownership: 'self' },
      metadata: { description: 'View own bookings', category: 'booking', level: 'basic' }
    },
    { 
      resource: 'bookings', 
      action: 'update:own', 
      conditions: { ownership: 'self', status: 'pending' },
      metadata: { description: 'Update pending bookings', category: 'booking', level: 'basic' }
    },
    { 
      resource: 'bookings', 
      action: 'cancel:own', 
      conditions: { ownership: 'self', status: ['pending', 'confirmed'] },
      metadata: { description: 'Cancel bookings', category: 'booking', level: 'basic' }
    },
    
    // Profile permissions
    { 
      resource: 'profile', 
      action: 'read:own', 
      metadata: { description: 'View own profile', category: 'profile', level: 'basic' }
    },
    { 
      resource: 'profile', 
      action: 'update:own', 
      metadata: { description: 'Update own profile', category: 'profile', level: 'basic' }
    },
    
    // Quote permissions
    { 
      resource: 'quotes', 
      action: 'read:own', 
      metadata: { description: 'View own quotes', category: 'quote', level: 'basic' }
    },
    { 
      resource: 'quotes', 
      action: 'accept:own', 
      metadata: { description: 'Accept quotes', category: 'quote', level: 'basic' }
    },
    { 
      resource: 'quotes', 
      action: 'reject:own', 
      metadata: { description: 'Reject quotes', category: 'quote', level: 'basic' }
    },
    
    // Communication permissions
    { 
      resource: 'messages', 
      action: 'create', 
      metadata: { description: 'Send messages', category: 'communication', level: 'basic' }
    },
    { 
      resource: 'messages', 
      action: 'read:own', 
      metadata: { description: 'View own messages', category: 'communication', level: 'basic' }
    },
    
    // Invoice permissions
    { 
      resource: 'invoices', 
      action: 'read:own', 
      metadata: { description: 'View own invoices', category: 'billing', level: 'basic' }
    },
  ],

  [UserRole.TECHNICIAN]: [
    // Repair permissions
    { 
      resource: 'repairs', 
      action: 'read', 
      metadata: { description: 'View all repairs', category: 'repair', level: 'basic' }
    },
    { 
      resource: 'repairs', 
      action: 'update', 
      conditions: { assigned: 'self' },
      metadata: { description: 'Update assigned repairs', category: 'repair', level: 'basic' }
    },
    { 
      resource: 'repairs', 
      action: 'complete', 
      conditions: { assigned: 'self' },
      metadata: { description: 'Complete assigned repairs', category: 'repair', level: 'basic' }
    },
    { 
      resource: 'repairs', 
      action: 'reassign:request', 
      metadata: { description: 'Request repair reassignment', category: 'repair', level: 'advanced' }
    },
    
    // Inventory permissions
    { 
      resource: 'inventory', 
      action: 'read', 
      metadata: { description: 'View inventory', category: 'inventory', level: 'basic' }
    },
    { 
      resource: 'inventory', 
      action: 'request', 
      metadata: { description: 'Request inventory items', category: 'inventory', level: 'basic' }
    },
    { 
      resource: 'inventory', 
      action: 'reserve', 
      metadata: { description: 'Reserve inventory for repairs', category: 'inventory', level: 'basic' }
    },
    
    // Customer permissions
    { 
      resource: 'customers', 
      action: 'read', 
      metadata: { description: 'View customer information', category: 'customer', level: 'basic' }
    },
    { 
      resource: 'customers', 
      action: 'communicate', 
      metadata: { description: 'Communicate with customers', category: 'customer', level: 'basic' }
    },
    
    // Schedule permissions
    { 
      resource: 'schedule', 
      action: 'read:own', 
      metadata: { description: 'View own schedule', category: 'schedule', level: 'basic' }
    },
    { 
      resource: 'schedule', 
      action: 'update:own', 
      metadata: { description: 'Update own schedule', category: 'schedule', level: 'basic' }
    },
    
    // Diagnostics permissions
    { 
      resource: 'diagnostics', 
      action: 'create', 
      metadata: { description: 'Create diagnostic reports', category: 'diagnostics', level: 'advanced' }
    },
    { 
      resource: 'diagnostics', 
      action: 'update', 
      metadata: { description: 'Update diagnostic reports', category: 'diagnostics', level: 'advanced' }
    },
  ],

  [UserRole.ADMIN]: [
    // All repair permissions
    { 
      resource: 'repairs', 
      action: '*', 
      metadata: { description: 'Full repair management', category: 'repair', level: 'critical' }
    },
    
    // Customer management
    { 
      resource: 'customers', 
      action: '*', 
      metadata: { description: 'Full customer management', category: 'customer', level: 'critical' }
    },
    
    // Technician management
    { 
      resource: 'technicians', 
      action: '*', 
      metadata: { description: 'Full technician management', category: 'staff', level: 'critical' }
    },
    
    // Inventory management
    { 
      resource: 'inventory', 
      action: '*', 
      metadata: { description: 'Full inventory management', category: 'inventory', level: 'critical' }
    },
    
    // Financial permissions
    { 
      resource: 'quotes', 
      action: '*', 
      metadata: { description: 'Full quote management', category: 'financial', level: 'critical' }
    },
    { 
      resource: 'invoices', 
      action: '*', 
      metadata: { description: 'Full invoice management', category: 'financial', level: 'critical' }
    },
    { 
      resource: 'payments', 
      action: '*', 
      metadata: { description: 'Full payment management', category: 'financial', level: 'critical' }
    },
    
    // Reporting permissions
    { 
      resource: 'reports', 
      action: '*', 
      metadata: { description: 'Generate and view all reports', category: 'analytics', level: 'advanced' }
    },
    { 
      resource: 'analytics', 
      action: '*', 
      metadata: { description: 'Access analytics dashboard', category: 'analytics', level: 'advanced' }
    },
    
    // Settings permissions
    { 
      resource: 'settings', 
      action: 'read', 
      metadata: { description: 'View system settings', category: 'system', level: 'advanced' }
    },
    { 
      resource: 'settings', 
      action: 'update', 
      metadata: { description: 'Update system settings', category: 'system', level: 'critical' }
    },
    
    // User management (limited)
    { 
      resource: 'users', 
      action: 'read', 
      metadata: { description: 'View user accounts', category: 'user-management', level: 'advanced' }
    },
    { 
      resource: 'users', 
      action: 'update:roles', 
      conditions: { maxRole: 'admin' },
      metadata: { description: 'Update user roles (non-super-admin)', category: 'user-management', level: 'critical' }
    },
  ],

  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    { 
      resource: '*', 
      action: '*', 
      metadata: { description: 'Full system access', category: 'system', level: 'critical' }
    },
  ],
};

interface RBACContextValue {
  // Permission checking
  hasPermission: (resource: string, action: string, resourceData?: any) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean;
  
  // Role checking
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasHigherRoleThan: (role: UserRole) => boolean;
  
  // Permission discovery
  getUserPermissions: () => ExtendedPermission[];
  getPermissionsByCategory: (category: string) => ExtendedPermission[];
  getPermissionsByLevel: (level: 'basic' | 'advanced' | 'critical') => ExtendedPermission[];
  
  // Role hierarchy
  canManageUser: (targetUserRole: UserRole) => boolean;
  getManageableRoles: () => UserRole[];
  
  // Resource-specific permissions
  canCreateResource: (resource: string) => boolean;
  canReadResource: (resource: string, resourceData?: any) => boolean;
  canUpdateResource: (resource: string, resourceData?: any) => boolean;
  canDeleteResource: (resource: string, resourceData?: any) => boolean;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

export const useRBAC = (): RBACContextValue => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: React.ReactNode;
  config?: Partial<RBACConfig>;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const { user, isAuthenticated } = useAuth();

  const rbacConfig: RBACConfig = {
    permissions: [],
    hierarchicalRoles: true,
    inheritPermissions: true,
    ...config,
  };

  // Role hierarchy for role comparison
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.CUSTOMER]: 1,
    [UserRole.TECHNICIAN]: 2,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 4,
  };

  const getUserPermissions = (): ExtendedPermission[] => {
    if (!user || !isAuthenticated) return [];
    return enhancedRolePermissions[user.role] || [];
  };

  const hasPermission = (resource: string, action: string, resourceData?: any): boolean => {
    if (!user || !isAuthenticated) return false;

    const userPermissions = getUserPermissions();
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Check if user has the specific permission
    const hasDirectPermission = userPermissions.some(permission => {
      // Check resource match
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      if (!resourceMatch) return false;

      // Check action match
      const actionMatch = permission.action === '*' || permission.action === action;
      if (!actionMatch) return false;

      // Check conditions if they exist
      if (permission.conditions && resourceData) {
        return evaluateConditions(permission.conditions, user, resourceData);
      }

      return true;
    });

    return hasDirectPermission;
  };

  const evaluateConditions = (conditions: Record<string, any>, user: any, resourceData: any): boolean => {
    // Evaluate ownership conditions
    if (conditions.ownership === 'self' && resourceData.userId !== user.id) {
      return false;
    }

    // Evaluate status conditions
    if (conditions.status) {
      const allowedStatuses = Array.isArray(conditions.status) ? conditions.status : [conditions.status];
      if (!allowedStatuses.includes(resourceData.status)) {
        return false;
      }
    }

    // Evaluate assignment conditions
    if (conditions.assigned === 'self' && resourceData.assignedTo !== user.id) {
      return false;
    }

    // Evaluate role restrictions
    if (conditions.maxRole) {
      const maxRoleLevel = roleHierarchy[conditions.maxRole as UserRole];
      const targetRoleLevel = roleHierarchy[resourceData.role as UserRole];
      if (targetRoleLevel > maxRoleLevel) {
        return false;
      }
    }

    return true;
  };

  const hasAnyPermission = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action));
  };

  const hasAllPermissions = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.every(({ resource, action }) => hasPermission(resource, action));
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const hasHigherRoleThan = (role: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] > roleHierarchy[role];
  };

  const getPermissionsByCategory = (category: string): ExtendedPermission[] => {
    return getUserPermissions().filter(permission => 
      permission.metadata?.category === category
    );
  };

  const getPermissionsByLevel = (level: 'basic' | 'advanced' | 'critical'): ExtendedPermission[] => {
    return getUserPermissions().filter(permission => 
      permission.metadata?.level === level
    );
  };

  const canManageUser = (targetUserRole: UserRole): boolean => {
    if (!user) return false;
    
    // Super admin can manage anyone
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // Admin can manage non-super-admin users
    if (user.role === UserRole.ADMIN && targetUserRole !== UserRole.SUPER_ADMIN) {
      return true;
    }
    
    return false;
  };

  const getManageableRoles = (): UserRole[] => {
    if (!user) return [];
    
    if (user.role === UserRole.SUPER_ADMIN) {
      return [UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    }
    
    if (user.role === UserRole.ADMIN) {
      return [UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN];
    }
    
    return [];
  };

  const canCreateResource = (resource: string): boolean => {
    return hasPermission(resource, 'create');
  };

  const canReadResource = (resource: string, resourceData?: any): boolean => {
    return hasPermission(resource, 'read', resourceData) || 
           hasPermission(resource, 'read:own', resourceData);
  };

  const canUpdateResource = (resource: string, resourceData?: any): boolean => {
    return hasPermission(resource, 'update', resourceData) || 
           hasPermission(resource, 'update:own', resourceData);
  };

  const canDeleteResource = (resource: string, resourceData?: any): boolean => {
    return hasPermission(resource, 'delete', resourceData) || 
           hasPermission(resource, 'delete:own', resourceData);
  };

  const value: RBACContextValue = useMemo(() => ({
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasHigherRoleThan,
    getUserPermissions,
    getPermissionsByCategory,
    getPermissionsByLevel,
    canManageUser,
    getManageableRoles,
    canCreateResource,
    canReadResource,
    canUpdateResource,
    canDeleteResource,
  }), [user, isAuthenticated]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export default RBACProvider;