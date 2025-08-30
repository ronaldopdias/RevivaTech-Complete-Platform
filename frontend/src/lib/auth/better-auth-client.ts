/**
 * Fresh Better Auth Client Configuration
 * Pure Better Auth implementation - no legacy code
 * Client-side authentication for RevivaTech
 */

'use client'

import React from 'react'
import { createAuthClient } from "better-auth/react"
import { organization, twoFactor } from "better-auth/plugins"

// Get the base URL for authentication - Point to backend API server
function getAuthBaseURL(): string {
  if (typeof window !== 'undefined') {
    // Client-side: Point to the backend API server
    const hostname = window.location.hostname;
    
    // Production domain handling
    if (hostname === 'revivatech.co.uk' || hostname === 'www.revivatech.co.uk') {
      return 'https://api.revivatech.co.uk/api/auth';
    }
    
    if (hostname === 'revivatech.com.br' || hostname === 'www.revivatech.com.br') {
      return 'https://api.revivatech.com.br/api/auth';
    }
    
    // For ALL local development (localhost, 192.x.x.x, 100.x.x.x, etc.)
    // Always use localhost:3011 backend to avoid OAuth redirect issues
    return 'http://localhost:3011/api/auth';
  }
  
  // Server-side fallback: always use localhost backend
  return 'http://localhost:3011/api/auth';
}

// Create Better Auth client with error handling and timeout
export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    organization(),
    twoFactor(),
  ],
  fetchOptions: {
    timeout: 3000, // 3 second timeout
    credentials: "include", // Essential for cross-origin cookie handling
    onError: (error) => {
      console.warn('[Better Auth] Network error, falling back to offline mode:', error);
      // Don't throw - allow graceful fallback
    }
  },
})

// Enhanced sign-in with explicit session synchronization
export const signIn = async (credentials: { email: string; password: string }) => {
  // Sign-in attempt (removed debug log)
  try {
    // Use Better Auth's signIn.email method specifically
    const result = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    }, {
      onRequest: (context) => {
        console.log('[Better Auth] Sign-in request:', context);
      },
      onSuccess: (context) => {
        console.log('[Better Auth] Sign-in success:', context);
      },
      onError: (context) => {
        console.log('[Better Auth] Sign-in error:', context);
      }
    });
    // Sign-in result processed
    
    // Optimized session synchronization for Better Auth
    if (result && !result.error) {
      // Login successful, synchronizing session
      
      // Quick session validation - let Better Auth handle the session state
      try {
        const sessionCheck = await fetch(getAuthBaseURL() + '/get-session', {
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

// Better Auth native session hook - this is the proper way
export const useSession = authClient.useSession;
// Organization hook may not be available without proper plugin setup  
export const useActiveOrganization = authClient.useActiveOrganization || (() => null)
// signIn is defined above as custom wrapper
export const signOut = authClient.signOut  
export const signUp = authClient.signUp
// Social sign-in for OAuth providers
export const signInSocial = authClient.signIn.social

// Enhanced session refresh utility for Better Auth sync
export const refreshSession = async () => {
  try {
    // Refreshing session
    const response = await fetch(getAuthBaseURL() + '/get-session', {
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