import { useCallback, useMemo } from 'react';
import { useRBAC } from './RBACProvider';

/**
 * Enhanced permissions hook with utility functions
 * Provides convenient methods for permission checking and role management
 */

interface UsePermissionsReturn {
  // Permission checking
  hasPermission: (action: string, resource: string, context?: any) => boolean;
  hasAnyPermission: (permissions: Array<{ action: string; resource: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ action: string; resource: string }>) => boolean;
  
  // Role checking
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
  
  // Utility functions
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  
  // Admin checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  
  // Context-aware permissions
  canAccessOwnResource: (resource: string, action: string) => boolean;
  canAccessUserResource: (userId: string, resource: string, action: string) => boolean;
  
  // Bulk operations
  canBulkEdit: (resource: string) => boolean;
  canBulkDelete: (resource: string) => boolean;
  canExport: (resource: string) => boolean;
  canImport: (resource: string) => boolean;
  
  // System permissions
  canAccessSystem: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canBackupSystem: boolean;
  
  // UI helpers
  getPermissionLevel: (resource: string) => 'none' | 'read' | 'write' | 'manage';
  getHighestRole: () => string | null;
  getUserRoles: () => string[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export const usePermissions = (): UsePermissionsReturn => {
  const {
    hasPermission,
    hasRole,
    hasAnyRole,
    roles,
    permissions,
    getHighestRole,
    isLoading,
    error
  } = useRBAC();

  // Enhanced permission checking
  const hasAnyPermission = useCallback(
    (permissionList: Array<{ action: string; resource: string }>) => {
      return permissionList.some(({ action, resource }) => 
        hasPermission(action, resource)
      );
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissionList: Array<{ action: string; resource: string }>) => {
      return permissionList.every(({ action, resource }) => 
        hasPermission(action, resource)
      );
    },
    [hasPermission]
  );

  // Role checking utilities
  const hasAllRoles = useCallback(
    (roleNames: string[]) => {
      return roleNames.every(roleName => hasRole(roleName));
    },
    [hasRole]
  );

  // CRUD operation shortcuts
  const canCreate = useCallback(
    (resource: string) => hasPermission('create', resource),
    [hasPermission]
  );

  const canRead = useCallback(
    (resource: string) => hasPermission('read', resource),
    [hasPermission]
  );

  const canUpdate = useCallback(
    (resource: string) => hasPermission('update', resource),
    [hasPermission]
  );

  const canDelete = useCallback(
    (resource: string) => hasPermission('delete', resource),
    [hasPermission]
  );

  const canManage = useCallback(
    (resource: string) => hasPermission('manage', resource),
    [hasPermission]
  );

  // Admin role checks
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isSuperAdmin = useMemo(() => hasRole('super_admin'), [hasRole]);
  const isManager = useMemo(() => hasRole('manager'), [hasRole]);
  const isEditor = useMemo(() => hasRole('editor'), [hasRole]);

  // Context-aware permissions
  const canAccessOwnResource = useCallback(
    (resource: string, action: string) => {
      return hasPermission(action, resource) || 
             hasPermission(action, `own_${resource}`);
    },
    [hasPermission]
  );

  const canAccessUserResource = useCallback(
    (userId: string, resource: string, action: string) => {
      return hasPermission(action, resource, { resourceOwnerId: userId });
    },
    [hasPermission]
  );

  // Bulk operations
  const canBulkEdit = useCallback(
    (resource: string) => hasPermission('bulk_edit', resource) || 
                          hasPermission('update', resource),
    [hasPermission]
  );

  const canBulkDelete = useCallback(
    (resource: string) => hasPermission('bulk_delete', resource) || 
                          hasPermission('delete', resource),
    [hasPermission]
  );

  const canExport = useCallback(
    (resource: string) => hasPermission('export', resource),
    [hasPermission]
  );

  const canImport = useCallback(
    (resource: string) => hasPermission('import', resource),
    [hasPermission]
  );

  // System permissions
  const canAccessSystem = useMemo(
    () => hasPermission('read', 'system'),
    [hasPermission]
  );

  const canViewAuditLogs = useMemo(
    () => hasPermission('read', 'audit'),
    [hasPermission]
  );

  const canManageUsers = useMemo(
    () => hasPermission('manage', 'users'),
    [hasPermission]
  );

  const canManageRoles = useMemo(
    () => hasPermission('manage', 'roles'),
    [hasPermission]
  );

  const canBackupSystem = useMemo(
    () => hasPermission('backup', 'system'),
    [hasPermission]
  );

  // UI helpers
  const getPermissionLevel = useCallback(
    (resource: string): 'none' | 'read' | 'write' | 'manage' => {
      if (hasPermission('manage', resource)) return 'manage';
      if (hasPermission('update', resource) || hasPermission('create', resource)) return 'write';
      if (hasPermission('read', resource)) return 'read';
      return 'none';
    },
    [hasPermission]
  );

  const getHighestRoleName = useCallback(() => {
    const highestRole = getHighestRole();
    return highestRole ? highestRole.name : null;
  }, [getHighestRole]);

  const getUserRoles = useCallback(() => {
    return roles.map(role => role.name);
  }, [roles]);

  return {
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Utility functions
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    
    // Admin checks
    isAdmin,
    isSuperAdmin,
    isManager,
    isEditor,
    
    // Context-aware permissions
    canAccessOwnResource,
    canAccessUserResource,
    
    // Bulk operations
    canBulkEdit,
    canBulkDelete,
    canExport,
    canImport,
    
    // System permissions
    canAccessSystem,
    canViewAuditLogs,
    canManageUsers,
    canManageRoles,
    canBackupSystem,
    
    // UI helpers
    getPermissionLevel,
    getHighestRole: getHighestRoleName,
    getUserRoles,
    
    // Loading and error states
    isLoading,
    error
  };
};

export default usePermissions;