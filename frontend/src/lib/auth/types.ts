/**
 * Better Auth Integration - Compatibility Redirect
 * 
 * This file redirects legacy import paths to the official Better Auth structure.
 * Better Auth is role-agnostic by design, so custom UserRole enum is maintained
 * in better-auth-client.ts following official patterns.
 * 
 * Official Better Auth types are imported from 'better-auth/types'
 * Custom project types are imported from './better-auth-client'
 */

// Custom role system (project-specific)
export { UserRole, hasRole, checkPermission } from './better-auth-client'

// Official Better Auth types
export type { User, Session } from 'better-auth/types'