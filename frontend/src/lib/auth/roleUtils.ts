/**
 * Role Utilities - Backward Compatibility Layer
 * Provides utility functions for role-based operations
 */

import { UserRole } from './better-auth-client'
import { UseUserRoleReturn } from './useUserRole'
import { getRoleLevel, roleHasPermission } from './roleConfig'

/**
 * Utility function to check if a user role meets minimum requirements
 * @param userRole - Current user's role
 * @param minimumRole - Minimum required role
 * @returns True if user role is sufficient
 */
export function checkMinimumRole(
  userRole: UserRole | null,
  minimumRole: UserRole
): boolean {
  if (!userRole) return false
  
  const userLevel = getRoleLevel(userRole)
  const requiredLevel = getRoleLevel(minimumRole)
  
  return userLevel >= requiredLevel
}

/**
 * Create a permission checker function for a specific role
 * @param role - Role to check permissions for
 * @returns Function that checks if role has a permission
 */
export function createPermissionChecker(role: UserRole | null) {
  return (permission: string): boolean => {
    return role ? roleHasPermission(role, permission) : false
  }
}

/**
 * Get all roles that are at or below a specific level
 * @param maxRole - Maximum role level to include
 * @returns Array of roles at or below the specified level
 */
export function getRolesAtOrBelow(maxRole: UserRole): UserRole[] {
  const maxLevel = getRoleLevel(maxRole)
  
  return Object.values(UserRole).filter(role => {
    return getRoleLevel(role) <= maxLevel
  })
}

/**
 * Format role for display purposes
 * @param role - Role to format
 * @returns Formatted role string
 */
export function formatRoleForDisplay(role: UserRole | null): string {
  if (!role) return 'No Role'
  
  return role.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Check if a role transition is valid
 * @param fromRole - Current role
 * @param toRole - Target role
 * @returns True if transition is allowed
 */
export function isValidRoleTransition(
  fromRole: UserRole | null,
  toRole: UserRole
): boolean {
  if (!fromRole) return false
  
  // For now, only allow same-level or downward transitions
  // Future: implement organization-specific transition rules
  const fromLevel = getRoleLevel(fromRole)
  const toLevel = getRoleLevel(toRole)
  
  return fromLevel >= toLevel
}

/**
 * Extract role-related properties from useUserRole hook result
 * Useful for components that only need basic role information
 */
export function extractRoleInfo(roleData: UseUserRoleReturn) {
  return {
    role: roleData.currentRole,
    level: roleData.roleLevel,
    isLoading: roleData.isLoading,
    displayName: roleData.roleInfo?.name || 'Unknown'
  }
}

/**
 * Legacy compatibility function - matches old hasRole behavior
 * @deprecated Use useUserRole().hasRole() instead
 */
export function legacyHasRole(
  currentRole: UserRole | null,
  requiredRole: UserRole
): boolean {
  console.warn('legacyHasRole is deprecated. Use useUserRole().hasRole() instead.')
  return checkMinimumRole(currentRole, requiredRole)
}

/**
 * Constants for common role combinations
 */
export const ROLE_GROUPS = {
  ADMIN_ROLES: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  STAFF_ROLES: [UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  ALL_ROLES: Object.values(UserRole)
} as const

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}