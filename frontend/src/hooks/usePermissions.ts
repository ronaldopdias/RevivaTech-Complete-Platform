'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/client';
import { useRBAC } from '@/lib/auth/rbac-context';
import { UserRole } from '@/lib/auth/types';

// Hook for comprehensive permission checking and role management
export const usePermissions = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const rbac = useRBAC();

  // Memoized permission checks for common operations
  const permissions = useMemo(() => {
    if (!isAuthenticated || !user || isLoading) {
      return {
        // Authentication state
        isAuthenticated: false,
        isLoading,
        user: null,
        
        // Role checks
        isCustomer: false,
        isTechnician: false,
        isAdmin: false,
        isSuperAdmin: false,
        isStaff: false,
        isManagement: false,
        
        // Common resource permissions
        bookings: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canCancel: false,
          canAssign: false,
        },
        
        repairs: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canComplete: false,
          canReassign: false,
        },
        
        customers: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canDelete: false,
        },
        
        inventory: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canRequest: false,
          canReserve: false,
        },
        
        quotes: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canApprove: false,
          canReject: false,
        },
        
        invoices: {
          canCreate: false,
          canView: false,
          canUpdate: false,
          canSend: false,
        },
        
        reports: {
          canView: false,
          canCreate: false,
          canExport: false,
        },
        
        settings: {
          canView: false,
          canUpdate: false,
        },
        
        users: {
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canManageRoles: false,
        },
        
        // Helper functions that return false
        hasPermission: () => false,
        hasRole: () => false,
        canManageUser: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
      };
    }

    return {
      // Authentication state
      isAuthenticated,
      isLoading,
      user,
      
      // Role checks
      isCustomer: rbac.hasRole(UserRole.CUSTOMER),
      isTechnician: rbac.hasRole(UserRole.TECHNICIAN),
      isAdmin: rbac.hasRole(UserRole.ADMIN),
      isSuperAdmin: rbac.hasRole(UserRole.SUPER_ADMIN),
      isStaff: rbac.hasRole([UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      isManagement: rbac.hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      
      // Booking permissions
      bookings: {
        canCreate: rbac.hasPermission('bookings', 'create'),
        canView: rbac.hasPermission('bookings', 'read') || rbac.hasPermission('bookings', 'read:own'),
        canUpdate: rbac.hasPermission('bookings', 'update') || rbac.hasPermission('bookings', 'update:own'),
        canCancel: rbac.hasPermission('bookings', 'cancel') || rbac.hasPermission('bookings', 'cancel:own'),
        canAssign: rbac.hasPermission('bookings', 'assign'),
      },
      
      // Repair permissions
      repairs: {
        canCreate: rbac.hasPermission('repairs', 'create'),
        canView: rbac.hasPermission('repairs', 'read'),
        canUpdate: rbac.hasPermission('repairs', 'update'),
        canComplete: rbac.hasPermission('repairs', 'complete'),
        canReassign: rbac.hasPermission('repairs', 'reassign'),
      },
      
      // Customer permissions
      customers: {
        canCreate: rbac.hasPermission('customers', 'create'),
        canView: rbac.hasPermission('customers', 'read'),
        canUpdate: rbac.hasPermission('customers', 'update'),
        canDelete: rbac.hasPermission('customers', 'delete'),
      },
      
      // Inventory permissions
      inventory: {
        canCreate: rbac.hasPermission('inventory', 'create'),
        canView: rbac.hasPermission('inventory', 'read'),
        canUpdate: rbac.hasPermission('inventory', 'update'),
        canRequest: rbac.hasPermission('inventory', 'request'),
        canReserve: rbac.hasPermission('inventory', 'reserve'),
      },
      
      // Quote permissions
      quotes: {
        canCreate: rbac.hasPermission('quotes', 'create'),
        canView: rbac.hasPermission('quotes', 'read') || rbac.hasPermission('quotes', 'read:own'),
        canUpdate: rbac.hasPermission('quotes', 'update'),
        canApprove: rbac.hasPermission('quotes', 'accept') || rbac.hasPermission('quotes', 'accept:own'),
        canReject: rbac.hasPermission('quotes', 'reject') || rbac.hasPermission('quotes', 'reject:own'),
      },
      
      // Invoice permissions
      invoices: {
        canCreate: rbac.hasPermission('invoices', 'create'),
        canView: rbac.hasPermission('invoices', 'read') || rbac.hasPermission('invoices', 'read:own'),
        canUpdate: rbac.hasPermission('invoices', 'update'),
        canSend: rbac.hasPermission('invoices', 'send'),
      },
      
      // Reporting permissions
      reports: {
        canView: rbac.hasPermission('reports', 'read'),
        canCreate: rbac.hasPermission('reports', 'create'),
        canExport: rbac.hasPermission('reports', 'export'),
      },
      
      // Settings permissions
      settings: {
        canView: rbac.hasPermission('settings', 'read'),
        canUpdate: rbac.hasPermission('settings', 'update'),
      },
      
      // User management permissions
      users: {
        canView: rbac.hasPermission('users', 'read'),
        canCreate: rbac.hasPermission('users', 'create'),
        canUpdate: rbac.hasPermission('users', 'update'),
        canDelete: rbac.hasPermission('users', 'delete'),
        canManageRoles: rbac.hasPermission('users', 'update:roles'),
      },
      
      // Helper functions
      hasPermission: rbac.hasPermission,
      hasRole: rbac.hasRole,
      canManageUser: rbac.canManageUser,
      hasAnyPermission: rbac.hasAnyPermission,
      hasAllPermissions: rbac.hasAllPermissions,
    };
  }, [user, isAuthenticated, isLoading, rbac]);

  // Navigation permissions - what sections can the user access
  const navigation = useMemo(() => ({
    dashboard: permissions.isAuthenticated,
    bookings: permissions.bookings.canView,
    repairs: permissions.repairs.canView,
    customers: permissions.customers.canView,
    inventory: permissions.inventory.canView,
    quotes: permissions.quotes.canView,
    invoices: permissions.invoices.canView,
    reports: permissions.reports.canView,
    settings: permissions.settings.canView,
    userManagement: permissions.users.canView,
    admin: permissions.isManagement,
  }), [permissions]);

  // Action permissions - what actions can the user perform
  const actions = useMemo(() => ({
    createBooking: permissions.bookings.canCreate,
    updateProfile: rbac.hasPermission('profile', 'update:own'),
    sendMessage: rbac.hasPermission('messages', 'create'),
    uploadFiles: rbac.hasPermission('files', 'upload'),
    downloadFiles: rbac.hasPermission('files', 'download'),
    exportData: rbac.hasPermission('data', 'export'),
    accessAnalytics: rbac.hasPermission('analytics', 'read'),
    configureSystem: rbac.hasPermission('system', 'configure'),
  }), [rbac]);

  // Resource-specific permission checker
  const checkResourcePermission = (resource: string, action: string, resourceData?: any) => {
    return rbac.hasPermission(resource, action, resourceData);
  };

  // Batch permission checker
  const checkMultiplePermissions = (permissionList: Array<{ resource: string; action: string }>, requireAll = true) => {
    return requireAll 
      ? rbac.hasAllPermissions(permissionList)
      : rbac.hasAnyPermission(permissionList);
  };

  // User management helper
  const getUserManagementInfo = () => {
    if (!user) return null;

    return {
      canManageUsers: permissions.users.canView,
      manageableRoles: rbac.getManageableRoles(),
      canPromoteUser: (targetRole: UserRole) => rbac.canManageUser(targetRole),
      canDemoteUser: (targetRole: UserRole) => rbac.canManageUser(targetRole),
    };
  };

  // Permission debugging helper (development only)
  const getPermissionSummary = () => {
    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      permissions: rbac.getUserPermissions(),
      permissionsByCategory: {
        basic: rbac.getPermissionsByLevel('basic'),
        advanced: rbac.getPermissionsByLevel('advanced'),
        critical: rbac.getPermissionsByLevel('critical'),
      },
    };
  };

  return {
    // Core permission data
    ...permissions,
    
    // Navigation permissions
    navigation,
    
    // Action permissions
    actions,
    
    // Helper functions
    checkResourcePermission,
    checkMultiplePermissions,
    getUserManagementInfo,
    
    // Development helpers
    getPermissionSummary,
    
    // Direct RBAC access for advanced use cases
    rbac,
  };
};

// Convenience hooks for specific roles
export const useCustomerPermissions = () => {
  const permissions = usePermissions();
  return {
    ...permissions,
    isValidRole: permissions.isCustomer,
  };
};

export const useTechnicianPermissions = () => {
  const permissions = usePermissions();
  return {
    ...permissions,
    isValidRole: permissions.isTechnician,
  };
};

export const useAdminPermissions = () => {
  const permissions = usePermissions();
  return {
    ...permissions,
    isValidRole: permissions.isAdmin || permissions.isSuperAdmin,
  };
};

// Hook for checking if user can access a specific route
export const useRoutePermissions = (routePermissions: Array<{ resource: string; action: string }>) => {
  const permissions = usePermissions();
  
  return useMemo(() => ({
    canAccess: permissions.hasAllPermissions(routePermissions),
    missingPermissions: routePermissions.filter(({ resource, action }) => 
      !permissions.hasPermission(resource, action)
    ),
  }), [permissions, routePermissions]);
};

export default usePermissions;