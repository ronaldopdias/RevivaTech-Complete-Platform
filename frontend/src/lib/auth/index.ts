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
export { signIn, signOut, signUp } from './better-auth-client'

// Types and utilities (client-safe)
export type { User, Session } from 'better-auth/types'
export { UserRole, hasRole, checkPermission } from './better-auth-client'

// Guard components
export { ClientAuthGuard } from './client-guards'

// Provider component
export { AuthProvider } from './AuthProvider'

// Note: Server-side auth should be imported directly:
// import { auth } from '@/lib/auth/better-auth-server' (API routes only)