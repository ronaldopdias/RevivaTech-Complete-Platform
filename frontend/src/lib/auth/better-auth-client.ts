/**
 * Fresh Better Auth Client Configuration
 * Pure Better Auth implementation - no legacy code
 * Client-side authentication for RevivaTech
 */

'use client'

import { createAuthClient } from "better-auth/react"
import { organization, twoFactor } from "better-auth/plugins"

// Get the base URL for authentication
function getAuthBaseURL(): string {
  // Always use the current origin to avoid CORS issues
  if (typeof window !== 'undefined') {
    // Client-side: use current domain (works for both localhost and production)
    return window.location.origin
  }
  
  // Server-side fallback: use environment variables or default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3010'
}

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: getAuthBaseURL() + '/api/auth',
  plugins: [
    organization(),
    twoFactor(),
  ],
})

// Custom sign-in wrapper to ensure correct endpoint usage
export const signIn = async (credentials: { email: string; password: string }) => {
  console.log('[Better Auth] Attempting sign-in with email:', credentials.email);
  try {
    // Use Better Auth's signIn.email method specifically
    const result = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    });
    console.log('[Better Auth] Sign-in successful:', result);
    return result;
  } catch (error) {
    console.error('[Better Auth] Sign-in failed:', error);
    throw error;
  }
};

// Export Better Auth hooks and utilities
// Note: Better Auth React client only provides useSession, not useAuth
export const useSession = authClient.useSession
// Organization hook may not be available without proper plugin setup  
export const useActiveOrganization = authClient.useActiveOrganization || (() => null)
// signIn is defined above as custom wrapper
export const signOut = authClient.signOut  
export const signUp = authClient.signUp

// Better Auth client does NOT have useAuth - this was causing 404 errors
// useAuth is created in useAuthCompat.ts as a compatibility layer

// User role utilities
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TECHNICIAN = "TECHNICIAN",
  CUSTOMER = "CUSTOMER"
}

export function hasRole(userRole: string, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole as UserRole)
}

export function checkPermission(userRole: string, resource: string, action: string): boolean {
  const role = userRole as UserRole
  
  // Super admin has all permissions
  if (role === UserRole.SUPER_ADMIN) return true
  
  // Admin has most permissions
  if (role === UserRole.ADMIN) {
    const adminResources = ['users', 'settings', 'reports', 'bookings', 'customers', 
                           'repairs', 'inventory', 'pricing', 'analytics', 'media',
                           'email', 'templates', 'messages', 'database', 'procedures']
    return adminResources.includes(resource)
  }
  
  // Technician has limited permissions
  if (role === UserRole.TECHNICIAN) {
    if (resource === 'repairs') return true
    if (resource === 'bookings' && ['read', 'update'].includes(action)) return true
    if (resource === 'customers' && action === 'read') return true
    return false
  }
  
  // Customer has minimal permissions
  if (role === UserRole.CUSTOMER) {
    if (resource === 'profile') return true
    if (resource === 'bookings' && ['read', 'create'].includes(action)) return true
    return false
  }
  
  return false
}

// Export default
export default authClient