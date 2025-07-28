import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

/**
 * Professional authentication types for RevivaTech
 * Enterprise-grade type definitions for NextAuth.js
 */

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface ExtendedUser extends DefaultUser {
  role: UserRole
  firstName: string
  lastName: string
  emailVerified?: Date | null
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      firstName: string
      lastName: string
    } & DefaultSession["user"]
  }

  interface User extends ExtendedUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole
    firstName: string
    lastName: string
  }
}

/**
 * Permission-based access control types
 */
export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  [UserRole.CUSTOMER]: Permission[]
  [UserRole.TECHNICIAN]: Permission[]
  [UserRole.ADMIN]: Permission[]
  [UserRole.SUPER_ADMIN]: Permission[]
}

/**
 * Professional authentication state interface
 */
export interface AuthState {
  user: ExtendedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Authentication guard props
 */
export interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  requiredPermissions?: Array<{ resource: string; action: string }>
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * Professional error types
 */
export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_INACTIVE'
  | 'EMAIL_NOT_VERIFIED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'

/**
 * Login form types
 */
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  acceptTerms: boolean
}

/**
 * Professional API response types
 */
export interface AuthResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: AuthError
    message: string
    field?: string
  }
  message?: string
}

/**
 * Role-based permission checking utility type
 */
export type PermissionChecker = (resource: string, action: string) => boolean

/**
 * Professional session utilities
 */
export interface SessionUtils {
  checkRole: (role: UserRole | UserRole[]) => boolean
  checkPermission: PermissionChecker
  isAdmin: () => boolean
  isTechnician: () => boolean
  isCustomer: () => boolean
}