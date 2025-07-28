/**
 * useUserRole Hook - Role-based Access Control
 * Manages user roles and permissions for navigation and features
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserRoleType, 
  UserRole, 
  USER_ROLES, 
  NAVIGATION_ACCESS, 
  DEFAULT_ROLE_CONFIG 
} from '@/types/roles';

interface UseUserRoleReturn {
  currentRole: UserRoleType;
  roleData: UserRole | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRoleType) => boolean;
  canAccessPath: (path: string) => boolean;
  setRole: (role: UserRoleType) => void;
  switchRole: (role: UserRoleType) => void;
  isLoading: boolean;
  availableRoles: UserRole[];
  getRoleDisplayName: (role: UserRoleType) => string;
  getNavigationAccess: () => string[];
}

/**
 * Custom hook for managing user roles and permissions
 * Provides role-based access control for navigation and features
 */
export const useUserRole = (): UseUserRoleReturn => {
  const [currentRole, setCurrentRole] = useState<UserRoleType>(DEFAULT_ROLE_CONFIG.defaultRole);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize role from localStorage or default
  useEffect(() => {
    const initializeRole = () => {
      try {
        // Try to get role from localStorage (simulating authentication)
        const savedRole = localStorage.getItem('userRole') as UserRoleType;
        const validRoles: UserRoleType[] = ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'];
        
        if (savedRole && validRoles.includes(savedRole)) {
          setCurrentRole(savedRole);
        } else {
          // Default to PUBLIC for demo purposes
          setCurrentRole('PUBLIC');
        }
      } catch (error) {
        console.warn('Failed to initialize user role:', error);
        setCurrentRole('PUBLIC');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRole();
  }, []);

  // Get current role data
  const roleData = useMemo(() => {
    return USER_ROLES.find(role => role.name === currentRole) || null;
  }, [currentRole]);

  // Get available roles
  const availableRoles = useMemo(() => {
    return USER_ROLES;
  }, []);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!roleData) return false;
    
    // Admin has all permissions
    if (currentRole === 'ADMIN') return true;
    
    // Check for wildcard permissions
    const hasWildcard = roleData.permissions.some(p => 
      p.endsWith('*') && permission.startsWith(p.slice(0, -1))
    );
    
    return hasWildcard || roleData.permissions.includes(permission);
  }, [roleData, currentRole]);

  // Check if user has specific role
  const hasRole = useCallback((role: UserRoleType): boolean => {
    return currentRole === role;
  }, [currentRole]);

  // Check if user can access specific path
  const canAccessPath = useCallback((path: string): boolean => {
    const access = NAVIGATION_ACCESS.find(nav => nav.role === currentRole);
    if (!access) return false;

    // Admin can access all paths
    if (currentRole === 'ADMIN') return true;

    // Check if path is explicitly restricted
    if (access.restrictedPaths.some(restrictedPath => 
      path.startsWith(restrictedPath)
    )) {
      return false;
    }

    // Check if path is in allowed paths
    if (access.allowedPaths.includes('*')) return true;
    
    return access.allowedPaths.some(allowedPath => 
      path === allowedPath || path.startsWith(allowedPath + '/')
    );
  }, [currentRole]);

  // Set user role
  const setRole = useCallback((role: UserRoleType) => {
    setCurrentRole(role);
    localStorage.setItem('userRole', role);
  }, []);

  // Switch role (for demo purposes)
  const switchRole = useCallback((role: UserRoleType) => {
    setRole(role);
    // In a real app, this would involve API calls and proper authentication
    console.log(`Role switched to: ${role}`);
  }, [setRole]);

  // Get role display name
  const getRoleDisplayName = useCallback((role: UserRoleType): string => {
    const roleInfo = USER_ROLES.find(r => r.name === role);
    return roleInfo?.displayName || role;
  }, []);

  // Get navigation access paths
  const getNavigationAccess = useCallback((): string[] => {
    const access = NAVIGATION_ACCESS.find(nav => nav.role === currentRole);
    return access?.allowedPaths || [];
  }, [currentRole]);

  return {
    currentRole,
    roleData,
    hasPermission,
    hasRole,
    canAccessPath,
    setRole,
    switchRole,
    isLoading,
    availableRoles,
    getRoleDisplayName,
    getNavigationAccess
  };
};

// Role-based navigation filter function
export const filterNavigationByRole = (
  navigationItems: any[],
  currentRole: UserRoleType,
  canAccessPath: (path: string) => boolean
): any[] => {
  return navigationItems.filter(item => {
    // Check if user can access the main path
    if (!canAccessPath(item.href)) return false;

    // Filter dropdown items if they exist
    if (item.dropdown && item.dropdown.length > 0) {
      item.dropdown = item.dropdown.filter((dropdownItem: any) => 
        canAccessPath(dropdownItem.href)
      );
      
      // Remove dropdown if no items are accessible
      if (item.dropdown.length === 0) {
        delete item.dropdown;
      }
    }

    return true;
  });
};

// Role-based menu ordering
export const orderNavigationByRole = (
  navigationItems: any[],
  currentRole: UserRoleType
): any[] => {
  const access = NAVIGATION_ACCESS.find(nav => nav.role === currentRole);
  const priorityOrder = access?.priorityOrder || 1;

  // Sort based on role priority and usage patterns
  const roleBasedOrder: { [key: string]: number } = {
    'PUBLIC': { 'Home': 1, 'Apple Repair': 2, 'PC Repair': 3, 'Pricing': 4, 'Book Repair': 5 },
    'CUSTOMER': { 'Home': 1, 'Customer Portal': 2, 'Book Repair': 3, 'Apple Repair': 4, 'PC Repair': 5 },
    'ADMIN': { 'Home': 1, 'Admin Dashboard': 2, 'Analytics': 3, 'Customer Portal': 4, 'Book Repair': 5 },
    'TECHNICIAN': { 'Home': 1, 'Technician Dashboard': 2, 'Repair Queue': 3, 'Work Schedule': 4, 'Book Repair': 5 }
  };

  const currentOrder = roleBasedOrder[currentRole] || {};

  return navigationItems.sort((a, b) => {
    const aOrder = currentOrder[a.name] || 999;
    const bOrder = currentOrder[b.name] || 999;
    return aOrder - bOrder;
  });
};

export default useUserRole;