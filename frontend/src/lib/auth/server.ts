import NextAuth from "next-auth"
import { authConfig } from "./config"
import type { UserRole } from "./types"

// Debug logging
console.log('NextAuth server initialization starting...')
console.log('Using authConfig instead of nextAuthConfig')

/**
 * Professional server-side authentication for RevivaTech
 * Enterprise-grade session management and route protection
 */
const nextAuth = NextAuth(authConfig)

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = nextAuth

console.log('NextAuth server initialized successfully')

/**
 * Professional permission definitions for enterprise RBAC
 */
export const ROLE_PERMISSIONS = {
  CUSTOMER: [
    { resource: 'bookings', actions: ['create', 'read:own', 'update:own', 'cancel:own'] },
    { resource: 'profile', actions: ['read:own', 'update:own'] },
    { resource: 'quotes', actions: ['read:own', 'accept:own', 'reject:own'] },
    { resource: 'messages', actions: ['create', 'read:own'] },
    { resource: 'invoices', actions: ['read:own'] },
  ],
  TECHNICIAN: [
    { resource: 'repairs', actions: ['read', 'update', 'complete'] },
    { resource: 'inventory', actions: ['read', 'request'] },
    { resource: 'customers', actions: ['read'] },
    { resource: 'messages', actions: ['create', 'read'] },
    { resource: 'schedule', actions: ['read:own', 'update:own'] },
  ],
  ADMIN: [
    { resource: 'repairs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'technicians', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pricing', actions: ['create', 'read', 'update', 'delete'] },
  ],
  SUPER_ADMIN: [
    { resource: '*', actions: ['*'] }, // Super admin has all permissions
  ],
} as const

/**
 * Professional permission checking utility
 * Enterprise-grade role-based access control
 */
export function checkPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  
  // Super admin check
  if (permissions.some(p => p.resource === '*' && p.actions.includes('*'))) {
    return true
  }
  
  // Specific permission check
  return permissions.some(permission => {
    if (permission.resource === resource || permission.resource === '*') {
      return permission.actions.includes(action) || permission.actions.includes('*')
    }
    return false
  })
}

/**
 * Professional role hierarchy checking
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

/**
 * Professional session validation middleware
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  return session
}

/**
 * Professional role-based access control middleware
 */
export async function requireRole(requiredRoles: UserRole | UserRole[]) {
  const session = await requireAuth()
  
  if (!hasRole(session.user.role, requiredRoles)) {
    throw new Error('Insufficient permissions')
  }
  
  return session
}

/**
 * Professional admin access control
 */
export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN'])
}

/**
 * Professional session utilities for server components
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

/**
 * Professional authentication state checker
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth()
  return !!session?.user
}

/**
 * Professional role checking utilities
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return hasRole(session?.user?.role || 'CUSTOMER', ['ADMIN', 'SUPER_ADMIN'])
}

export async function isTechnician(): Promise<boolean> {
  const session = await auth()
  return hasRole(session?.user?.role || 'CUSTOMER', 'TECHNICIAN')
}

export async function isCustomer(): Promise<boolean> {
  const session = await auth()
  return hasRole(session?.user?.role || 'CUSTOMER', 'CUSTOMER')
}