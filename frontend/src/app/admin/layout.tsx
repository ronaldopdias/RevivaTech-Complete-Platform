'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';
import { ClientAuthGuard } from '@/lib/auth/client-guards';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserRole } from '@/lib/auth/types';
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';
import { DiagnosticPanel } from '@/components/admin/DiagnosticPanel';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Calculator,
  BarChart3,
  Settings,
  Package,
  Mail,
  Shield,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  HelpCircle,
  Database,
  FileText,
  Image,
  MessageSquare,
  Brain,
  CreditCard,
  Calendar,
  GraduationCap,
  BarChart4,
  Globe,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: { resource: string; action: string };
  badge?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, checkPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin login is now handled by the unified /login page
  const isLoginPage = false;

  // Navigation items with role-based filtering
  const navigationItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/database',
      label: 'Database',
      icon: Database,
      permission: { resource: 'database', action: 'read' },
    },
    {
      href: '/admin/procedures',
      label: 'Procedures',
      icon: FileText,
      permission: { resource: 'procedures', action: 'read' },
    },
    {
      href: '/admin/repair-queue',
      label: 'Repair Queue',
      icon: Wrench,
      permission: { resource: 'repairs', action: 'read' },
    },
    {
      href: '/admin/customers',
      label: 'Customers',
      icon: Users,
      permission: { resource: 'customers', action: 'read' },
    },
    {
      href: '/admin/inventory',
      label: 'Inventory',
      icon: Package,
      permission: { resource: 'inventory', action: 'read' },
    },
    {
      href: '/admin/pricing',
      label: 'Pricing',
      icon: Calculator,
      permission: { resource: 'pricing', action: 'read' },
    },
    {
      href: '/admin/payments',
      label: 'Payments',
      icon: CreditCard,
      permission: { resource: 'payments', action: 'read' },
    },
    {
      href: '/admin/schedule',
      label: 'Schedule',
      icon: Calendar,
      permission: { resource: 'schedule', action: 'read' },
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3,
      permission: { resource: 'reports', action: 'read' },
    },
    {
      href: '/admin/ml-analytics',
      label: 'ML Analytics',
      icon: Brain,
      permission: { resource: 'analytics', action: 'read' },
      badge: 'AI',
    },
    {
      href: '/admin/reports',
      label: 'Reports',
      icon: BarChart4,
      permission: { resource: 'reports', action: 'read' },
    },
    {
      href: '/admin/cms',
      label: 'Content Management',
      icon: Globe,
      permission: { resource: 'cms', action: 'read' },
    },
    {
      href: '/admin/media',
      label: 'Media',
      icon: Image,
      permission: { resource: 'media', action: 'read' },
    },
    {
      href: '/admin/templates',
      label: 'Email Templates',
      icon: Mail,
      permission: { resource: 'templates', action: 'read' },
    },
    {
      href: '/admin/email-setup',
      label: 'Email Setup',
      icon: Settings,
      permission: { resource: 'email', action: 'read' },
    },
    {
      href: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare,
      permission: { resource: 'messages', action: 'read' },
    },
    {
      href: '/admin/training',
      label: 'Training',
      icon: GraduationCap,
      permission: { resource: 'training', action: 'read' },
      badge: 'New',
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: Shield,
      permission: { resource: 'users', action: 'read' },
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      permission: { resource: 'settings', action: 'read' },
    },
  ];

  // Filter navigation items based on permissions
  const allowedNavItems = navigationItems.filter(item => {
    if (!item.permission) return true;
    return checkPermission(item.permission.resource, item.permission.action);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // Loading state fallback
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trust-500 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading admin panel...</p>
      </div>
    </div>
  );


  // If it's the login page, don't apply AdminOnly guard
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {children}
      </div>
    );
  }

  return (
    <ClientAuthGuard 
      requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      redirectTo="/login"
    >
      <div className="h-screen flex bg-neutral-50">
        {/* Mobile menu overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-trust-500 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-trust-100 text-trust-700 border-l-4 border-trust-500' 
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-neutral-200 p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-professional-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-professional-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.name || user?.email}
                </p>
                <Badge 
                  variant={user?.role === UserRole.SUPER_ADMIN ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {user?.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleLogout}
              icon={{ component: LogOut, position: 'left' }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen lg:ml-64">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-semibold text-neutral-900">
                  RevivaTech Admin
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  All Systems Operational
                </Badge>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Admin-only diagnostic components */}
        <PerformanceOptimizer showDebugPanel={true} />
        <PerformanceMonitor />
        <DiagnosticPanel />
      </div>
    </ClientAuthGuard>
  );
};

export default AdminLayout;