/**
 * User Role Types for RevivaTech Platform
 * Defines role-based access control for navigation and features
 */

export type UserRoleType = 'PUBLIC' | 'CUSTOMER' | 'ADMIN' | 'TECHNICIAN';

export interface UserRole {
  id: string;
  name: UserRoleType;
  displayName: string;
  permissions: string[];
  description: string;
}

export interface UserRoleConfig {
  roles: UserRole[];
  defaultRole: UserRoleType;
}

export interface NavigationAccess {
  role: UserRoleType;
  allowedPaths: string[];
  restrictedPaths: string[];
  priorityOrder: number;
}

export interface RoleBasedNavigationItem {
  name: string;
  href: string;
  allowedRoles: UserRoleType[];
  requiredPermissions?: string[];
  priorityOrder?: number;
  dropdown?: {
    name: string;
    href: string;
    allowedRoles: UserRoleType[];
    requiredPermissions?: string[];
    icon?: any;
  }[];
}

// Role definitions with permissions
export const USER_ROLES: UserRole[] = [
  {
    id: 'public',
    name: 'PUBLIC',
    displayName: 'Public User',
    permissions: ['view:public_pages', 'book:repair', 'contact:support'],
    description: 'General public access with basic functionality'
  },
  {
    id: 'customer',
    name: 'CUSTOMER',
    displayName: 'Customer',
    permissions: [
      'view:public_pages',
      'view:customer_dashboard',
      'track:repair',
      'view:repair_history',
      'manage:profile',
      'book:repair',
      'contact:support',
      'view:invoices',
      'manage:appointments'
    ],
    description: 'Registered customer with access to personal dashboard'
  },
  {
    id: 'admin',
    name: 'ADMIN',
    displayName: 'Administrator',
    permissions: [
      'view:*',
      'manage:*',
      'admin:dashboard',
      'admin:analytics',
      'admin:users',
      'admin:repairs',
      'admin:settings',
      'admin:reports',
      'admin:system',
      'manage:bookings',
      'manage:customers',
      'manage:technicians',
      'manage:inventory',
      'manage:pricing',
      'view:all_repairs',
      'edit:all_repairs'
    ],
    description: 'Full administrative access to all platform features'
  },
  {
    id: 'technician',
    name: 'TECHNICIAN',
    displayName: 'Technician',
    permissions: [
      'view:public_pages',
      'view:technician_dashboard',
      'manage:assigned_repairs',
      'update:repair_status',
      'upload:repair_images',
      'communicate:customers',
      'view:repair_queue',
      'manage:work_schedule',
      'view:customer_info',
      'update:repair_notes'
    ],
    description: 'Technical staff with repair management capabilities'
  }
];

// Navigation access configuration
export const NAVIGATION_ACCESS: NavigationAccess[] = [
  {
    role: 'PUBLIC',
    allowedPaths: [
      '/',
      '/apple',
      '/laptop-pc',
      '/consoles',
      '/data-recovery',
      '/pricing',
      '/testimonials',
      '/about',
      '/contact',
      '/faq',
      '/warranty',
      '/careers',
      '/reviews',
      '/book-repair',
      '/login',
      '/register'
    ],
    restrictedPaths: [
      '/dashboard',
      '/admin',
      '/technician',
      '/profile',
      '/track-repair',
      '/repair-history'
    ],
    priorityOrder: 1
  },
  {
    role: 'CUSTOMER',
    allowedPaths: [
      '/',
      '/apple',
      '/laptop-pc',
      '/consoles',
      '/data-recovery',
      '/pricing',
      '/testimonials',
      '/about',
      '/contact',
      '/faq',
      '/warranty',
      '/careers',
      '/reviews',
      '/book-repair',
      '/dashboard',
      '/profile',
      '/track-repair',
      '/repair-history',
      '/invoices',
      '/appointments'
    ],
    restrictedPaths: [
      '/admin',
      '/technician'
    ],
    priorityOrder: 2
  },
  {
    role: 'ADMIN',
    allowedPaths: ['*'], // All paths
    restrictedPaths: [], // No restrictions
    priorityOrder: 4
  },
  {
    role: 'TECHNICIAN',
    allowedPaths: [
      '/',
      '/apple',
      '/laptop-pc',
      '/consoles',
      '/data-recovery',
      '/pricing',
      '/testimonials',
      '/about',
      '/contact',
      '/faq',
      '/warranty',
      '/careers',
      '/reviews',
      '/technician',
      '/profile',
      '/repair-queue',
      '/work-schedule'
    ],
    restrictedPaths: [
      '/admin',
      '/dashboard'
    ],
    priorityOrder: 3
  }
];

// Default role configuration
export const DEFAULT_ROLE_CONFIG: UserRoleConfig = {
  roles: USER_ROLES,
  defaultRole: 'PUBLIC'
};