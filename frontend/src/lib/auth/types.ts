/**
 * Better Auth Type Extensions
 * Extends Better Auth types to include RevivaTech-specific fields
 */

import { UserRole } from './better-auth-client'

// Type module augmentation to extend Better Auth types
declare module 'better-auth/types' {
  interface User {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string
    createdAt: Date
    updatedAt: Date
    
    // RevivaTech extensions
    firstName: string
    lastName: string
    phone?: string
    role: UserRole
    isActive: boolean
  }

  interface Session {
    id: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress?: string
    userAgent?: string
    userId: string
    user: User
  }
}

// Custom role system (project-specific)
export { UserRole, hasRole, checkPermission } from './better-auth-client'

// Official Better Auth types (now extended)
export type { User, Session } from 'better-auth/types'