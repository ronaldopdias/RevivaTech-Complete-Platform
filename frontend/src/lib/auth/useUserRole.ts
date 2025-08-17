/**
 * User Role Hook - Better Auth Implementation
 * Provides role-based functionality using Better Auth session data
 */

'use client'

import { useSession } from './better-auth-client'
import { UserRole } from './better-auth-client'

export interface UseUserRoleReturn {
  currentRole: UserRole | null
  isLoading: boolean
  availableRoles: UserRole[]
  switchRole: (role: UserRole) => Promise<void>
  hasRole: (requiredRole: UserRole) => boolean
}

export function useUserRole(): UseUserRoleReturn {
  const { data: session, isPending } = useSession()
  
  const currentRole = (session?.user?.role as UserRole) || null
  const availableRoles: UserRole[] = currentRole ? [currentRole] : []

  const switchRole = async (role: UserRole): Promise<void> => {
    // Role switching would require server-side implementation
    // For now, this is a placeholder that doesn't actually switch roles
    console.warn('Role switching is not implemented yet')
  }

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentRole) return false
    
    // Super admin can access everything
    if (currentRole === UserRole.SUPER_ADMIN) return true
    
    // Exact role match
    if (currentRole === requiredRole) return true
    
    // Admin can access technician and customer features
    if (currentRole === UserRole.ADMIN && 
        (requiredRole === UserRole.TECHNICIAN || requiredRole === UserRole.CUSTOMER)) {
      return true
    }
    
    return false
  }

  return {
    currentRole,
    isLoading: isPending,
    availableRoles,
    switchRole,
    hasRole
  }
}

export { UserRole }