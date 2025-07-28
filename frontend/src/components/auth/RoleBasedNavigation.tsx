'use client';

import React, { useMemo } from 'react';
import { Navigation, NavigationItem, NavigationProps } from '@/components/navigation/Navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/lib/auth/types';
import { 
  Home, 
  Calendar, 
  Wrench, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings, 
  UserCog,
  Shield,
  MessageSquare,
  Briefcase,
  Clock,
  BookOpen,
  Archive,
  Smartphone,
  Laptop,
  Monitor,
  Gamepad2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Star,
  Trophy,
  Activity
} from 'lucide-react';

// Role-based navigation configuration
const navigationConfig: Record<UserRole, NavigationItem[]> = {
  [UserRole.CUSTOMER]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      href: '/bookings',
      icon: Calendar,
      children: [
        {
          id: 'new-booking',
          label: 'Book Repair',
          href: '/book-repair',
          icon: Calendar,
        },
        {
          id: 'booking-history',
          label: 'Booking History',
          href: '/bookings/history',
          icon: Clock,
        },
      ],
    },
    {
      id: 'repairs',
      label: 'My Repairs',
      href: '/repairs',
      icon: Wrench,
      children: [
        {
          id: 'active-repairs',
          label: 'Active Repairs',
          href: '/repairs/active',
          icon: Activity,
        },
        {
          id: 'completed-repairs',
          label: 'Completed Repairs',
          href: '/repairs/completed',
          icon: CheckCircle,
        },
      ],
    },
    {
      id: 'quotes',
      label: 'Quotes',
      href: '/quotes',
      icon: FileText,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      href: '/invoices',
      icon: Receipt,
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
    },
    {
      id: 'help',
      label: 'Help & Support',
      href: '/help',
      icon: HelpCircle,
    },
  ],

  [UserRole.TECHNICIAN]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/technician/dashboard',
      icon: Home,
    },
    {
      id: 'assigned-repairs',
      label: 'My Repairs',
      href: '/technician/repairs',
      icon: Wrench,
      children: [
        {
          id: 'pending-repairs',
          label: 'Pending',
          href: '/technician/repairs/pending',
          icon: Clock,
        },
        {
          id: 'in-progress-repairs',
          label: 'In Progress',
          href: '/technician/repairs/in-progress',
          icon: Activity,
        },
        {
          id: 'completed-repairs',
          label: 'Completed',
          href: '/technician/repairs/completed',
          icon: CheckCircle,
        },
      ],
    },
    {
      id: 'schedule',
      label: 'Schedule',
      href: '/technician/schedule',
      icon: Calendar,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      href: '/technician/inventory',
      icon: Package,
      children: [
        {
          id: 'parts-available',
          label: 'Available Parts',
          href: '/technician/inventory/available',
          icon: Package,
        },
        {
          id: 'parts-requests',
          label: 'Part Requests',
          href: '/technician/inventory/requests',
          icon: AlertCircle,
        },
      ],
    },
    {
      id: 'customers',
      label: 'Customers',
      href: '/technician/customers',
      icon: Users,
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/technician/messages',
      icon: MessageSquare,
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      href: '/technician/knowledge-base',
      icon: BookOpen,
    },
  ],

  [UserRole.ADMIN]: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: Home,
    },
    {
      id: 'repairs',
      label: 'Repairs',
      href: '/admin/repairs',
      icon: Wrench,
      children: [
        {
          id: 'all-repairs',
          label: 'All Repairs',
          href: '/admin/repairs/all',
          icon: Wrench,
        },
        {
          id: 'queue-management',
          label: 'Queue Management',
          href: '/admin/repairs/queue',
          icon: Clock,
        },
        {
          id: 'device-categories',
          label: 'Device Categories',
          href: '/admin/repairs/categories',
          icon: Archive,
          children: [
            {
              id: 'smartphones',
              label: 'Smartphones',
              href: '/admin/repairs/categories/smartphones',
              icon: Smartphone,
            },
            {
              id: 'laptops',
              label: 'Laptops',
              href: '/admin/repairs/categories/laptops',
              icon: Laptop,
            },
            {
              id: 'desktops',
              label: 'Desktops',
              href: '/admin/repairs/categories/desktops',
              icon: Monitor,
            },
            {
              id: 'gaming',
              label: 'Gaming Consoles',
              href: '/admin/repairs/categories/gaming',
              icon: Gamepad2,
            },
          ],
        },
      ],
    },
    {
      id: 'customers',
      label: 'Customers',
      href: '/admin/customers',
      icon: Users,
      children: [
        {
          id: 'customer-list',
          label: 'Customer List',
          href: '/admin/customers/list',
          icon: Users,
        },
        {
          id: 'customer-segments',
          label: 'Customer Segments',
          href: '/admin/customers/segments',
          icon: TrendingUp,
        },
      ],
    },
    {
      id: 'technicians',
      label: 'Technicians',
      href: '/admin/technicians',
      icon: UserCog,
      children: [
        {
          id: 'technician-list',
          label: 'Technician List',
          href: '/admin/technicians/list',
          icon: UserCog,
        },
        {
          id: 'performance',
          label: 'Performance',
          href: '/admin/technicians/performance',
          icon: Trophy,
        },
        {
          id: 'schedules',
          label: 'Schedules',
          href: '/admin/technicians/schedules',
          icon: Calendar,
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      href: '/admin/inventory',
      icon: Package,
      children: [
        {
          id: 'parts-management',
          label: 'Parts Management',
          href: '/admin/inventory/parts',
          icon: Package,
        },
        {
          id: 'suppliers',
          label: 'Suppliers',
          href: '/admin/inventory/suppliers',
          icon: Briefcase,
        },
        {
          id: 'stock-alerts',
          label: 'Stock Alerts',
          href: '/admin/inventory/alerts',
          icon: AlertCircle,
        },
      ],
    },
    {
      id: 'financial',
      label: 'Financial',
      href: '/admin/financial',
      icon: DollarSign,
      children: [
        {
          id: 'quotes',
          label: 'Quotes',
          href: '/admin/financial/quotes',
          icon: FileText,
        },
        {
          id: 'invoices',
          label: 'Invoices',
          href: '/admin/financial/invoices',
          icon: Receipt,
        },
        {
          id: 'payments',
          label: 'Payments',
          href: '/admin/financial/payments',
          icon: DollarSign,
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      children: [
        {
          id: 'business-intelligence',
          label: 'Business Intelligence',
          href: '/admin/analytics/business',
          icon: TrendingUp,
        },
        {
          id: 'reports',
          label: 'Reports',
          href: '/admin/analytics/reports',
          icon: FileText,
        },
        {
          id: 'performance-metrics',
          label: 'Performance Metrics',
          href: '/admin/analytics/performance',
          icon: Activity,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      children: [
        {
          id: 'general-settings',
          label: 'General',
          href: '/admin/settings/general',
          icon: Settings,
        },
        {
          id: 'pricing-settings',
          label: 'Pricing',
          href: '/admin/settings/pricing',
          icon: DollarSign,
        },
        {
          id: 'notification-settings',
          label: 'Notifications',
          href: '/admin/settings/notifications',
          icon: MessageSquare,
        },
      ],
    },
  ],

  [UserRole.SUPER_ADMIN]: [
    {
      id: 'dashboard',
      label: 'Super Admin Dashboard',
      href: '/super-admin/dashboard',
      icon: Home,
    },
    {
      id: 'user-management',
      label: 'User Management',
      href: '/super-admin/users',
      icon: UserCog,
      children: [
        {
          id: 'all-users',
          label: 'All Users',
          href: '/super-admin/users/all',
          icon: Users,
        },
        {
          id: 'role-management',
          label: 'Role Management',
          href: '/super-admin/users/roles',
          icon: Shield,
        },
        {
          id: 'permissions',
          label: 'Permissions',
          href: '/super-admin/users/permissions',
          icon: Shield,
        },
      ],
    },
    {
      id: 'system-security',
      label: 'Security',
      href: '/super-admin/security',
      icon: Shield,
      children: [
        {
          id: 'audit-logs',
          label: 'Audit Logs',
          href: '/super-admin/security/audit',
          icon: FileText,
        },
        {
          id: 'security-events',
          label: 'Security Events',
          href: '/super-admin/security/events',
          icon: AlertCircle,
        },
        {
          id: 'active-sessions',
          label: 'Active Sessions',
          href: '/super-admin/security/sessions',
          icon: Activity,
        },
      ],
    },
    {
      id: 'system-health',
      label: 'System Health',
      href: '/super-admin/system',
      icon: Activity,
      children: [
        {
          id: 'performance-monitoring',
          label: 'Performance',
          href: '/super-admin/system/performance',
          icon: TrendingUp,
        },
        {
          id: 'system-logs',
          label: 'System Logs',
          href: '/super-admin/system/logs',
          icon: FileText,
        },
        {
          id: 'database-health',
          label: 'Database Health',
          href: '/super-admin/system/database',
          icon: Archive,
        },
      ],
    },
    {
      id: 'global-settings',
      label: 'Global Settings',
      href: '/super-admin/settings',
      icon: Settings,
      children: [
        {
          id: 'system-configuration',
          label: 'System Configuration',
          href: '/super-admin/settings/system',
          icon: Settings,
        },
        {
          id: 'feature-flags',
          label: 'Feature Flags',
          href: '/super-admin/settings/features',
          icon: Star,
        },
        {
          id: 'backup-settings',
          label: 'Backup Settings',
          href: '/super-admin/settings/backup',
          icon: Archive,
        },
      ],
    },
    // Include all admin features
    ...navigationConfig[UserRole.ADMIN].filter(item => 
      !['dashboard', 'settings'].includes(item.id)
    ).map(item => ({
      ...item,
      href: item.href?.replace('/admin/', '/super-admin/admin/'),
      children: item.children?.map(child => ({
        ...child,
        href: child.href?.replace('/admin/', '/super-admin/admin/'),
      })),
    })),
  ],
};

// Badge configuration for navigation items
const getBadgeForItem = (itemId: string, permissions: any): string | number | undefined => {
  // This would typically come from real-time data
  switch (itemId) {
    case 'pending-repairs':
      return 5; // Mock pending repairs count
    case 'messages':
      return 3; // Mock unread messages
    case 'stock-alerts':
      return 2; // Mock stock alerts
    case 'security-events':
      return 1; // Mock security events
    default:
      return undefined;
  }
};

// Filter navigation items based on permissions
const filterNavigationItems = (items: NavigationItem[], permissions: any): NavigationItem[] => {
  return items.filter(item => {
    // Check if user has permission to access this item
    let hasPermission = true;
    
    // Map navigation IDs to permission checks
    switch (item.id) {
      case 'bookings':
        hasPermission = permissions.bookings.canView;
        break;
      case 'repairs':
        hasPermission = permissions.repairs.canView;
        break;
      case 'customers':
        hasPermission = permissions.customers.canView;
        break;
      case 'inventory':
        hasPermission = permissions.inventory.canView;
        break;
      case 'quotes':
        hasPermission = permissions.quotes.canView;
        break;
      case 'invoices':
        hasPermission = permissions.invoices.canView;
        break;
      case 'analytics':
        hasPermission = permissions.reports.canView;
        break;
      case 'settings':
        hasPermission = permissions.settings.canView;
        break;
      case 'user-management':
        hasPermission = permissions.users.canView;
        break;
      case 'system-security':
        hasPermission = permissions.hasRole([UserRole.SUPER_ADMIN]);
        break;
      default:
        hasPermission = true; // Allow dashboard and other basic items
    }

    if (!hasPermission) return false;

    // Filter children recursively
    if (item.children) {
      item.children = filterNavigationItems(item.children, permissions);
    }

    return true;
  }).map(item => ({
    ...item,
    badge: getBadgeForItem(item.id, permissions),
  }));
};

interface RoleBasedNavigationProps extends Omit<NavigationProps, 'items'> {
  showRoleIndicator?: boolean;
  customItems?: NavigationItem[];
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  showRoleIndicator = true,
  customItems,
  ...navigationProps
}) => {
  const permissions = usePermissions();

  // Get navigation items based on user role
  const navigationItems = useMemo(() => {
    if (customItems) return customItems;
    if (!permissions.user) return [];

    const roleItems = navigationConfig[permissions.user.role] || [];
    return filterNavigationItems(roleItems, permissions);
  }, [permissions, customItems]);

  // Role indicator in brand
  const brandWithRole = useMemo(() => {
    if (!showRoleIndicator || !permissions.user) {
      return navigationProps.brand;
    }

    const roleLabels = {
      [UserRole.CUSTOMER]: 'Customer Portal',
      [UserRole.TECHNICIAN]: 'Technician Portal',
      [UserRole.ADMIN]: 'Admin Portal',
      [UserRole.SUPER_ADMIN]: 'Super Admin Portal',
    };

    return {
      ...navigationProps.brand,
      text: `${navigationProps.brand?.text || 'RevivaTech'} - ${roleLabels[permissions.user.role]}`,
    };
  }, [navigationProps.brand, permissions.user, showRoleIndicator]);

  // Don't render if not authenticated
  if (!permissions.isAuthenticated || !permissions.user) {
    return null;
  }

  return (
    <Navigation
      {...navigationProps}
      brand={brandWithRole}
      items={navigationItems}
    />
  );
};

// Convenience components for specific roles
export const CustomerNavigation: React.FC<Omit<NavigationProps, 'items'>> = (props) => (
  <RoleBasedNavigation {...props} customItems={navigationConfig[UserRole.CUSTOMER]} />
);

export const TechnicianNavigation: React.FC<Omit<NavigationProps, 'items'>> = (props) => (
  <RoleBasedNavigation {...props} customItems={navigationConfig[UserRole.TECHNICIAN]} />
);

export const AdminNavigation: React.FC<Omit<NavigationProps, 'items'>> = (props) => (
  <RoleBasedNavigation {...props} customItems={navigationConfig[UserRole.ADMIN]} />
);

export const SuperAdminNavigation: React.FC<Omit<NavigationProps, 'items'>> = (props) => (
  <RoleBasedNavigation {...props} customItems={navigationConfig[UserRole.SUPER_ADMIN]} />
);

export default RoleBasedNavigation;