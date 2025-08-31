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
    
    // Google OAuth extensions
    googleId?: string
    profilePicture?: string
    locale?: string
    domain?: string
    
    // Progressive registration
    registrationStatus?: 'COMPLETE' | 'PENDING_PROFILE_COMPLETION'
    profileCompletedAt?: string
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

// Registration data interface
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  acceptTerms: boolean
  marketingConsent?: boolean
}

// Profile completion data interface
export interface ProfileCompletionData {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

// Official Better Auth types (now extended)
export type { User, Session } from 'better-auth/types'