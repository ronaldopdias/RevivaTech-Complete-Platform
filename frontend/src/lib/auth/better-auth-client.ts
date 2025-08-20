/**
 * Fresh Better Auth Client Configuration
 * Pure Better Auth implementation - no legacy code
 * Client-side authentication for RevivaTech
 */

'use client'

import { createAuthClient } from "better-auth/react"
import { organization, twoFactor } from "better-auth/plugins"

// Get the base URL for authentication - Fixed for server alignment
function getAuthBaseURL(): string {
  // Always use the current origin to avoid CORS issues
  if (typeof window !== 'undefined') {
    // Client-side: use current domain (works for both localhost and production)
    return window.location.origin + '/api/auth'
  }
  
  // Server-side fallback: use environment variables or default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'
  return baseUrl + '/api/auth'
}

// Create Better Auth client - Fixed base URL alignment
export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    organization(),
    twoFactor(),
  ],
})

// Enhanced sign-in with explicit session synchronization
export const signIn = async (credentials: { email: string; password: string }) => {
  // Sign-in attempt (removed debug log)
  try {
    // Use Better Auth's signIn.email method specifically
    const result = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    });
    // Sign-in result processed
    
    // Optimized session synchronization for Better Auth
    if (result && !result.error) {
      // Login successful, synchronizing session
      
      // Quick session validation - let Better Auth handle the session state
      try {
        const sessionCheck = await fetch('/api/auth/get-session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (sessionCheck.ok) {
          const sessionData = await sessionCheck.json();
          // Session synchronized successfully
        }
      } catch (syncError) {
        console.warn('[Better Auth] Session sync warning:', syncError);
        // Continue - the login still succeeded
      }
    }
    
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

// Enhanced session refresh utility for Better Auth sync
export const refreshSession = async () => {
  try {
    // Refreshing session
    const response = await fetch('/api/auth/get-session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
    
    if (response.ok) {
      const sessionData = await response.json();
      // Session refreshed successfully
      return sessionData;
    } else {
      // No active session found
      return null;
    }
  } catch (error) {
    console.error('[Better Auth] Session refresh failed:', error);
    return null;
  }
};

// Better Auth client does NOT have useAuth - this was causing 404 errors
// useAuth is created in useAuthCompat.ts as a compatibility layer

// User role utilities
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TECHNICIAN = "TECHNICIAN",
  CUSTOMER = "CUSTOMER"
}

// Role hierarchy: SUPER_ADMIN > ADMIN > TECHNICIAN > CUSTOMER
function getRoleLevel(role: UserRole): number {
  switch (role) {
    case UserRole.SUPER_ADMIN: return 4;
    case UserRole.ADMIN: return 3;
    case UserRole.TECHNICIAN: return 2;
    case UserRole.CUSTOMER: return 1;
    default: return 0;
  }
}

function isSuperiorOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function hasRole(userRole: string, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  const userRoleEnum = userRole as UserRole
  
  // Check if user role is superior or equal to any required role
  return roles.some(requiredRole => isSuperiorOrEqual(userRoleEnum, requiredRole))
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