/**
 * Role-Based Navigation Configuration
 * Defines navigation items with role-based access control
 */

import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Battery,
  Shield,
  Wrench,
  Cpu,
  HardDrive,
  User,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Users,
  Briefcase,
  Star,
  MessageSquare,
  Home,
  LucideIcon,
} from 'lucide-react';

import { UserRoleType, RoleBasedNavigationItem } from '@/types/roles';

interface NavigationConfig {
  publicNavigation: RoleBasedNavigationItem[];
  customerNavigation: RoleBasedNavigationItem[];
  adminNavigation: RoleBasedNavigationItem[];
  technicianNavigation: RoleBasedNavigationItem[];
}

// Role-based navigation configuration
export const ROLE_BASED_NAVIGATION: NavigationConfig = {
  // Public navigation (accessible to all users)
  publicNavigation: [
    { 
      name: 'Home', 
      href: '/', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 1
    },
    {
      name: 'Apple Repair',
      href: '/apple',
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 2,
      dropdown: [
        { name: 'Mac Repair', href: '/apple/mac-repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Monitor },
        { name: 'MacBook Screen Repair', href: '/apple/macbook-screen-repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Laptop },
        { name: 'Battery Replacement', href: '/apple/mac-battery-replacement', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Battery },
        { name: 'iPhone Repair', href: '/apple/iphone-repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Smartphone },
        { name: 'iPad Repair', href: '/apple/ipad-repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Tablet },
      ],
    },
    {
      name: 'PC Repair',
      href: '/laptop-pc',
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 3,
      dropdown: [
        { name: 'Laptop Repair', href: '/laptop-pc/repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Laptop },
        { name: 'Screen Repair', href: '/laptop-pc/screen-repair', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Monitor },
        { name: 'Virus Removal', href: '/laptop-pc/virus-removal', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Shield },
        { name: 'Custom PCs', href: '/laptop-pc/custom-builds', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Cpu },
        { name: 'Data Recovery', href: '/laptop-pc/data-recovery', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: HardDrive },
        { name: 'IT Recycling', href: '/laptop-pc/it-recycling', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Wrench },
      ],
    },
    { 
      name: 'Gaming Consoles', 
      href: '/consoles', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 4
    },
    { 
      name: 'Data Recovery', 
      href: '/data-recovery', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 5
    },
    { 
      name: 'Pricing', 
      href: '/pricing', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 6
    },
    { 
      name: 'Testimonials', 
      href: '/testimonials', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 7
    },
    { 
      name: 'About', 
      href: '/about', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 8
    },
    { 
      name: 'Contact', 
      href: '/contact', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 9
    },
    {
      name: 'Support',
      href: '/faq',
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 10,
      dropdown: [
        { name: 'FAQ', href: '/faq', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: MessageSquare },
        { name: 'Warranty', href: '/warranty', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Shield },
        { name: 'Careers', href: '/careers', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Briefcase },
        { name: 'Reviews', href: '/reviews', allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'], icon: Star },
      ],
    },
    { 
      name: 'Book Repair', 
      href: '/book-repair', 
      allowedRoles: ['PUBLIC', 'CUSTOMER', 'ADMIN', 'TECHNICIAN'],
      priorityOrder: 11
    },
  ],

  // Customer-specific navigation
  customerNavigation: [
    {
      name: 'Customer Portal',
      href: '/dashboard',
      allowedRoles: ['CUSTOMER', 'ADMIN'],
      priorityOrder: 2,
      dropdown: [
        { name: 'Dashboard', href: '/dashboard', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: Home },
        { name: 'Track Repair', href: '/track-repair', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: Clock },
        { name: 'Repair History', href: '/repair-history', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: FileText },
        { name: 'Invoices', href: '/invoices', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: FileText },
        { name: 'Appointments', href: '/appointments', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: Calendar },
        { name: 'Profile', href: '/profile', allowedRoles: ['CUSTOMER', 'ADMIN'], icon: User },
      ],
    },
  ],

  // Admin-specific navigation
  adminNavigation: [
    {
      name: 'Admin Dashboard',
      href: '/admin',
      allowedRoles: ['ADMIN'],
      priorityOrder: 2,
      dropdown: [
        { name: 'Dashboard', href: '/admin', allowedRoles: ['ADMIN'], icon: Home },
        { name: 'Analytics', href: '/admin/analytics', allowedRoles: ['ADMIN'], icon: BarChart3 },
        { name: 'Customer Management', href: '/admin/customers', allowedRoles: ['ADMIN'], icon: Users },
        { name: 'Repair Management', href: '/admin/repairs', allowedRoles: ['ADMIN'], icon: Wrench },
        { name: 'Staff Management', href: '/admin/staff', allowedRoles: ['ADMIN'], icon: Users },
        { name: 'Reports', href: '/admin/reports', allowedRoles: ['ADMIN'], icon: FileText },
        { name: 'Settings', href: '/admin/settings', allowedRoles: ['ADMIN'], icon: Settings },
      ],
    },
  ],

  // Technician-specific navigation
  technicianNavigation: [
    {
      name: 'Technician Dashboard',
      href: '/technician',
      allowedRoles: ['TECHNICIAN', 'ADMIN'],
      priorityOrder: 2,
      dropdown: [
        { name: 'Dashboard', href: '/technician', allowedRoles: ['TECHNICIAN', 'ADMIN'], icon: Home },
        { name: 'Repair Queue', href: '/technician/queue', allowedRoles: ['TECHNICIAN', 'ADMIN'], icon: Clock },
        { name: 'Work Schedule', href: '/technician/schedule', allowedRoles: ['TECHNICIAN', 'ADMIN'], icon: Calendar },
        { name: 'Completed Jobs', href: '/technician/completed', allowedRoles: ['TECHNICIAN', 'ADMIN'], icon: FileText },
        { name: 'Profile', href: '/profile', allowedRoles: ['TECHNICIAN', 'ADMIN'], icon: User },
      ],
    },
  ],
};

// Function to get navigation items for a specific role
export const getNavigationForRole = (role: UserRoleType): RoleBasedNavigationItem[] => {
  const baseNavigation = ROLE_BASED_NAVIGATION.publicNavigation;
  let roleSpecificNavigation: RoleBasedNavigationItem[] = [];

  // Add role-specific navigation
  switch (role) {
    case 'CUSTOMER':
      roleSpecificNavigation = ROLE_BASED_NAVIGATION.customerNavigation;
      break;
    case 'ADMIN':
      roleSpecificNavigation = [
        ...ROLE_BASED_NAVIGATION.adminNavigation,
        ...ROLE_BASED_NAVIGATION.customerNavigation,
        ...ROLE_BASED_NAVIGATION.technicianNavigation,
      ];
      break;
    case 'TECHNICIAN':
      roleSpecificNavigation = ROLE_BASED_NAVIGATION.technicianNavigation;
      break;
    default:
      roleSpecificNavigation = [];
  }

  // Combine and filter navigation items
  const allNavigation = [...baseNavigation, ...roleSpecificNavigation];
  
  // Filter items based on role access
  const filteredNavigation = allNavigation.filter(item => 
    item.allowedRoles.includes(role)
  );

  // Filter dropdown items
  const processedNavigation = filteredNavigation.map(item => {
    if (item.dropdown) {
      const filteredDropdown = item.dropdown.filter(dropdownItem => 
        dropdownItem.allowedRoles.includes(role)
      );
      return {
        ...item,
        dropdown: filteredDropdown.length > 0 ? filteredDropdown : undefined
      };
    }
    return item;
  });

  // Sort by priority order
  return processedNavigation.sort((a, b) => (a.priorityOrder || 999) - (b.priorityOrder || 999));
};

// Function to check if a user has access to a navigation item
export const hasNavigationAccess = (
  item: RoleBasedNavigationItem,
  userRole: UserRoleType,
  requiredPermissions?: string[]
): boolean => {
  // Check role access
  if (!item.allowedRoles.includes(userRole)) {
    return false;
  }

  // Check permissions if provided
  if (requiredPermissions && item.requiredPermissions) {
    return item.requiredPermissions.some(permission => 
      requiredPermissions.includes(permission)
    );
  }

  return true;
};

// Function to get priority navigation items for quick access
export const getPriorityNavigationForRole = (
  role: UserRoleType,
  limit: number = 5
): RoleBasedNavigationItem[] => {
  const navigation = getNavigationForRole(role);
  return navigation.slice(0, limit);
};

// Function to get contextual navigation based on current path
export const getContextualNavigation = (
  currentPath: string,
  role: UserRoleType
): RoleBasedNavigationItem[] => {
  const navigation = getNavigationForRole(role);
  
  // Find related navigation items based on current path
  const relatedItems = navigation.filter(item => {
    if (currentPath.startsWith(item.href) && item.href !== currentPath) {
      return true;
    }
    
    // Check dropdown items
    if (item.dropdown) {
      return item.dropdown.some(dropdownItem => 
        currentPath.startsWith(dropdownItem.href) && dropdownItem.href !== currentPath
      );
    }
    
    return false;
  });
  
  return relatedItems;
};

export default ROLE_BASED_NAVIGATION;