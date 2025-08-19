/**
 * Enhanced User Role Hook - Better Auth Implementation
 * Provides comprehensive role-based functionality with improved type safety and performance
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useSession } from './better-auth-client'
import { UserRole } from './better-auth-client'
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
 * Return type for useUserRole hook with enhanced functionality
 */
export interface UseUserRoleReturn {
  /** Current user's role */
  currentRole: UserRole | null
  /** Loading state from session */
  isLoading: boolean
  /** Role hierarchy level (higher = more permissions) */
  roleLevel: number
  /** All available roles for the current user */
  availableRoles: UserRole[]
  /** All permissions for current role */
  permissions: string[]
  /** Switch to a different role (if available) */
  switchRole: (role: UserRole) => Promise<void>
  /** Check if user has a specific role or higher */
  hasRole: (requiredRole: UserRole) => boolean
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean
  /** Check if role can access resource with action */
  canAccess: (resource: string, action?: string) => boolean
  /** Check if current role is higher than target role */
  isHigherThan: (targetRole: UserRole) => boolean
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
  
  // Memoize current role to prevent unnecessary re-renders
  const currentRole = useMemo(() => {
    return (session?.user?.role as UserRole) || null
  }, [session?.user?.role])
  
  // Memoize role level for performance
  const roleLevel = useMemo(() => {
    return currentRole ? getRoleLevel(currentRole) : 0
  }, [currentRole])
  
  // Memoize available roles (for future multi-role support)
  const availableRoles = useMemo((): UserRole[] => {
    return currentRole ? [currentRole] : []
  }, [currentRole])
  
  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    return currentRole ? getRolePermissions(currentRole) : []
  }, [currentRole])
  
  // Memoize role info
  const roleInfo = useMemo(() => {
    if (!currentRole) return null
    const config = ROLE_HIERARCHY[currentRole]
    return {
      name: config?.name || currentRole,
      description: config?.description || '',
      level: config?.level || 0
    }
  }, [currentRole])
  
  // Role switching function (placeholder for future implementation)
  const switchRole = useCallback(async (role: UserRole): Promise<void> => {
    // TODO: Implement server-side role switching
    // This would require API endpoint and session update
    console.warn('Role switching is not implemented yet. Target role:', role)
    throw new Error('Role switching not yet implemented')
  }, [])
  
  // Enhanced role checking with hierarchy support
  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    if (!currentRole) return false
    
    // Exact role match
    if (currentRole === requiredRole) return true
    
    // Check if current role is higher in hierarchy
    const currentLevel = getRoleLevel(currentRole)
    const requiredLevel = getRoleLevel(requiredRole)
    
    return currentLevel >= requiredLevel
  }, [currentRole])
  
  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role))
  }, [hasRole])
  
  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    return currentRole ? roleHasPermission(currentRole, permission) : false
  }, [currentRole])
  
  // Check resource access with optional action
  const canAccess = useCallback((resource: string, action = 'read'): boolean => {
    const permission = `${resource}:${action}`
    return hasPermission(permission)
  }, [hasPermission])
  
  // Check if current role is higher than target role
  const isHigherThan = useCallback((targetRole: UserRole): boolean => {
    if (!currentRole) return false
    return getRoleLevel(currentRole) > getRoleLevel(targetRole)
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