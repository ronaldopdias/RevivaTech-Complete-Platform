/**
 * Better Auth Integration - Client-Safe Exports
 * Only client-safe modules exported here
 * Server-side auth should be imported directly where needed
 */

// Client configuration (for React components)
export { authClient } from './better-auth-client'

// Hooks (Better Auth + legacy compatibility)
export { useAuth } from './useAuthCompat' // Legacy-compatible wrapper
export { useAuth as useBetterAuth } from './useAuthCompat' // Also export as useBetterAuth for compatibility
export { useSession, useActiveOrganization } from './better-auth-client'
export { useUserRole } from './useUserRole'

// Auth actions
export { signIn, signOut, signUp, signInSocial } from './better-auth-client'

// Types and utilities (client-safe)
export type { User, Session } from 'better-auth/types'
export type { UseUserRoleReturn } from './useUserRole'
export { UserRole, hasRole, checkPermission } from './better-auth-client'

// Role configuration and utilities
export {
  ROLE_HIERARCHY,
  PERMISSIONS,
  getRoleLevel,
  roleInheritsFrom,
  roleHasPermission,
  getRolePermissions
} from './roleConfig'

export {
  checkMinimumRole,
  createPermissionChecker,
  getRolesAtOrBelow,
  formatRoleForDisplay,
  isValidRoleTransition,
  extractRoleInfo,
  ROLE_GROUPS,
  isValidUserRole
} from './roleUtils'

// Guard components
export { ClientAuthGuard } from './client-guards'

// Provider component
export { AuthProvider } from './AuthProvider'

// Progressive registration hooks and types
export { useProfileCompletion } from './useProfileCompletion'
export type { UseProfileCompletionReturn, ProfileCompletionStatus } from './useProfileCompletion'
export type { RegisterData, ProfileCompletionData } from './types'

// Note: Server-side auth should be imported directly:
// import { auth } from '@/lib/auth/better-auth-server' (API routes only)