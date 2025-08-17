/**
 * Better Auth Hooks - Official Implementation
 * Direct re-export of official Better Auth hooks
 * No custom wrappers or modifications
 */

'use client'

// Import and re-export official Better Auth hooks
// Note: Better Auth doesn't have useAuth, only useSession
export { 
  useSession,
  useActiveOrganization
} from "./better-auth-client"

// Export types for TypeScript support
export type { User, Session } from "better-auth/types"