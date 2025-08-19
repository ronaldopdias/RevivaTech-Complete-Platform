/**
 * Role Configuration Module
 * Centralized role hierarchy and permission management
 */

import { UserRole } from './better-auth-client'

export interface RoleConfig {
  level: number
  name: string
  description: string
  inherits?: UserRole[]
  permissions: string[]
}

export interface PermissionConfig {
  resource: string
  actions: string[]
  description: string
}

/**
 * Role hierarchy configuration with numeric levels for easy comparison
 * Higher level = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, RoleConfig> = {
  [UserRole.CUSTOMER]: {
    level: 1,
    name: 'Customer',
    description: 'Basic customer access',
    permissions: [
      'profile:read',
      'profile:update',
      'bookings:read',
      'bookings:create',
      'repairs:read'
    ]
  },
  [UserRole.TECHNICIAN]: {
    level: 2,
    name: 'Technician',
    description: 'Repair technician access',
    inherits: [UserRole.CUSTOMER],
    permissions: [
      'repairs:read',
      'repairs:update',
      'bookings:read',
      'bookings:update',
      'inventory:read',
      'customers:read'
    ]
  },
  [UserRole.ADMIN]: {
    level: 3,
    name: 'Administrator',
    description: 'Full administrative access',
    inherits: [UserRole.TECHNICIAN],
    permissions: [
      'users:*',
      'settings:*',
      'reports:*',
      'bookings:*',
      'customers:*',
      'repairs:*',
      'inventory:*',
      'pricing:*',
      'analytics:*',
      'media:*',
      'email:*',
      'templates:*',
      'messages:*',
      'database:*',
      'procedures:*'
    ]
  },
  [UserRole.SUPER_ADMIN]: {
    level: 4,
    name: 'Super Administrator',
    description: 'System-level access with all permissions',
    inherits: [UserRole.ADMIN],
    permissions: ['*']
  }
}

/**
 * Available permissions in the system
 */
export const PERMISSIONS: Record<string, PermissionConfig> = {
  profile: {
    resource: 'profile',
    actions: ['read', 'update'],
    description: 'User profile management'
  },
  bookings: {
    resource: 'bookings',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Booking management'
  },
  repairs: {
    resource: 'repairs',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Repair job management'
  },
  customers: {
    resource: 'customers',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Customer management'
  },
  inventory: {
    resource: 'inventory',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Inventory management'
  },
  analytics: {
    resource: 'analytics',
    actions: ['read'],
    description: 'Analytics and reporting'
  },
  settings: {
    resource: 'settings',
    actions: ['read', 'update'],
    description: 'System settings'
  }
}

/**
 * Get role hierarchy level for comparison
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role]?.level ?? 0
}

/**
 * Check if a role inherits from another role
 */
export function roleInheritsFrom(role: UserRole, targetRole: UserRole): boolean {
  const config = ROLE_HIERARCHY[role]
  if (!config) return false
  
  if (config.inherits?.includes(targetRole)) return true
  
  // Check nested inheritance
  return config.inherits?.some(inheritedRole => 
    roleInheritsFrom(inheritedRole, targetRole)
  ) ?? false
}

/**
 * Get all permissions for a role (including inherited)
 */
export function getRolePermissions(role: UserRole): string[] {
  const config = ROLE_HIERARCHY[role]
  if (!config) return []
  
  const permissions = new Set(config.permissions)
  
  // Add inherited permissions
  if (config.inherits) {
    for (const inheritedRole of config.inherits) {
      const inheritedPermissions = getRolePermissions(inheritedRole)
      inheritedPermissions.forEach(p => permissions.add(p))
    }
  }
  
  return Array.from(permissions)
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: string): boolean {
  if (!role) return false
  
  const permissions = getRolePermissions(role)
  
  // Check for wildcard permissions
  if (permissions.includes('*')) return true
  
  // Check for exact permission match
  if (permissions.includes(permission)) return true
  
  // Check for resource-level wildcard (e.g., "users:*")
  const [resource] = permission.split(':')
  if (permissions.includes(`${resource}:*`)) return true
  
  return false
}