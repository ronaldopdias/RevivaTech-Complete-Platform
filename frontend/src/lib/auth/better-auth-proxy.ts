/**
 * Better Auth Official Client Configuration
 * Following Better Auth official documentation patterns
 */

import { createAuthClient } from "better-auth/react";

// Official Better Auth React client
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? 
    `${window.location.protocol}//${window.location.host}` : 
    "http://localhost:3010"
});

// Export auth methods for compatibility
export const auth = authClient;

// User roles enum (keep for compatibility)
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TECHNICIAN = "TECHNICIAN", 
  CUSTOMER = "CUSTOMER"
}

// Simple role checking utility
export function hasRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole)
}

// Permission checking utility
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