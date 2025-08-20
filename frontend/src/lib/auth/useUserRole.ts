/**
 * Enhanced User Role Hook - Better Auth Implementation
 * Provides comprehensive role-based functionality with improved type safety and performance
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useSession } from './better-auth-client'
import { UserRole } from './better-auth-client'
import { UserRoleType } from '../../types/roles'
import {
  getRoleLevel,
  roleInheritsFrom,
  roleHasPermission,
  getRolePermissions,
  ROLE_HIERARCHY
} from './roleConfig'
// Import to ensure type augmentation is loaded
import './types'

/**
 * Maps Better Auth UserRole enum to navigation system UserRoleType
 * Handles unauthenticated users as PUBLIC role
 */
function mapToNavigationRole(betterAuthRole: UserRole | null, isAuthenticated: boolean): UserRoleType {
  // If not authenticated, always return PUBLIC
  if (!isAuthenticated || !betterAuthRole) {
    return 'PUBLIC'
  }
  
  // Map Better Auth roles to navigation roles
  switch (betterAuthRole) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return 'ADMIN'
    case UserRole.TECHNICIAN:
      return 'TECHNICIAN'  
    case UserRole.CUSTOMER:
      return 'CUSTOMER'
    default:
      return 'PUBLIC'
  }
}

/**
 * Get role level for navigation roles (for hierarchy comparison)
 */
function getNavigationRoleLevel(role: UserRoleType): number {
  switch (role) {
    case 'ADMIN':
      return 4
    case 'TECHNICIAN':
      return 3
    case 'CUSTOMER':
      return 2
    case 'PUBLIC':
      return 1
    default:
      return 0
  }
}

/**
 * Get permissions for navigation roles
 */
function getNavigationRolePermissions(role: UserRoleType): string[] {
  switch (role) {
    case 'ADMIN':
      return ['view:*', 'manage:*', 'admin:*']
    case 'TECHNICIAN':
      return ['view:public', 'view:technician', 'manage:repairs', 'update:status']
    case 'CUSTOMER':
      return ['view:public', 'view:customer', 'track:repair', 'manage:profile']
    case 'PUBLIC':
      return ['view:public', 'book:repair']
    default:
      return []
  }
}

/**
 * Return type for useUserRole hook with enhanced functionality
 */
export interface UseUserRoleReturn {
  /** Current user's navigation role (mapped from Better Auth) */
  currentRole: UserRoleType
  /** Loading state from session */
  isLoading: boolean
  /** Role hierarchy level (higher = more permissions) */
  roleLevel: number
  /** All available roles for the current user */
  availableRoles: UserRoleType[]
  /** All permissions for current role */
  permissions: string[]
  /** Switch to a different role (if available) */
  switchRole: (role: UserRoleType) => Promise<void>
  /** Check if user has a specific role or higher */
  hasRole: (requiredRole: UserRoleType) => boolean
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRoleType[]) => boolean
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean
  /** Check if role can access resource with action */
  canAccess: (resource: string, action?: string) => boolean
  /** Check if current role is higher than target role */
  isHigherThan: (targetRole: UserRoleType) => boolean
  /** Get role display information */
  roleInfo: {
    name: string
    description: string
    level: number
  } | null
}

/**
 * Enhanced user role hook with comprehensive role management
 * Provides optimized role checking, permission validation, and hierarchy support
 * 
 * @example
 * ```tsx
 * const { hasRole, hasPermission, canAccess, roleInfo } = useUserRole()
 * 
 * // Check hierarchical role access
 * const canViewAdmin = hasRole(UserRole.ADMIN) // true for ADMIN and SUPER_ADMIN
 * 
 * // Check specific permissions
 * const canEditUsers = hasPermission('users:update')
 * 
 * // Check resource access
 * const canCreateBookings = canAccess('bookings', 'create')
 * 
 * // Display role information
 * console.log(roleInfo?.name) // "Administrator"
 * ```
 */
export function useUserRole(): UseUserRoleReturn {
  const { data: session, isPending } = useSession()
  
  // Get authentication status
  const isAuthenticated = !!session?.user
  
  // Memoize current role with proper mapping to prevent unnecessary re-renders
  const currentRole = useMemo(() => {
    const betterAuthRole = (session?.user as any)?.role as UserRole | null
    return mapToNavigationRole(betterAuthRole, isAuthenticated)
  }, [session?.user, isAuthenticated])
  
  // Memoize role level for performance
  const roleLevel = useMemo(() => {
    return getNavigationRoleLevel(currentRole)
  }, [currentRole])
  
  // Memoize available roles (for future multi-role support)
  const availableRoles = useMemo((): UserRoleType[] => {
    return currentRole ? [currentRole] : ['PUBLIC']
  }, [currentRole])
  
  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    return getNavigationRolePermissions(currentRole)
  }, [currentRole])
  
  // Memoize role info
  const roleInfo = useMemo(() => {
    if (!currentRole) return null
    
    const roleNames: Record<UserRoleType, string> = {
      'ADMIN': 'Administrator',
      'TECHNICIAN': 'Technician', 
      'CUSTOMER': 'Customer',
      'PUBLIC': 'Public User'
    }
    
    const roleDescriptions: Record<UserRoleType, string> = {
      'ADMIN': 'Full administrative access to all platform features',
      'TECHNICIAN': 'Technical staff with repair management capabilities',
      'CUSTOMER': 'Registered customer with access to personal dashboard',
      'PUBLIC': 'General public access with basic functionality'
    }
    
    return {
      name: roleNames[currentRole],
      description: roleDescriptions[currentRole],
      level: getNavigationRoleLevel(currentRole)
    }
  }, [currentRole])
  
  // Role switching function (placeholder for future implementation)
  const switchRole = useCallback(async (role: UserRoleType): Promise<void> => {
    // TODO: Implement server-side role switching
    // This would require API endpoint and session update
    console.warn('Role switching is not implemented yet. Target role:', role)
    throw new Error('Role switching not yet implemented')
  }, [])
  
  // Enhanced role checking with hierarchy support
  const hasRole = useCallback((requiredRole: UserRoleType): boolean => {
    if (!currentRole) return false
    
    // Exact role match
    if (currentRole === requiredRole) return true
    
    // Check if current role is higher in hierarchy
    const currentLevel = getNavigationRoleLevel(currentRole)
    const requiredLevel = getNavigationRoleLevel(requiredRole)
    
    return currentLevel >= requiredLevel
  }, [currentRole])
  
  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: UserRoleType[]): boolean => {
    return roles.some(role => hasRole(role))
  }, [hasRole])
  
  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentRole) return false
    const rolePermissions = getNavigationRolePermissions(currentRole)
    
    // Check for wildcard permissions first
    if (rolePermissions.includes('view:*') || rolePermissions.includes('manage:*')) {
      return true
    }
    
    // Check for exact permission match
    return rolePermissions.includes(permission)
  }, [currentRole])
  
  // Check resource access with optional action
  const canAccess = useCallback((resource: string, action = 'read'): boolean => {
    const permission = `${resource}:${action}`
    return hasPermission(permission)
  }, [hasPermission])
  
  // Check if current role is higher than target role
  const isHigherThan = useCallback((targetRole: UserRoleType): boolean => {
    if (!currentRole) return false
    return getNavigationRoleLevel(currentRole) > getNavigationRoleLevel(targetRole)
  }, [currentRole])

  return {
    currentRole,
    isLoading: isPending,
    roleLevel,
    availableRoles,
    permissions,
    switchRole,
    hasRole,
    hasAnyRole,
    hasPermission,
    canAccess,
    isHigherThan,
    roleInfo
  }
}

export { UserRole }