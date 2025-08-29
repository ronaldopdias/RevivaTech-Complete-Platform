'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Navigation, { NavigationProps } from '@/components/navigation/Navigation';
import { useAuth } from '@/lib/auth/useAuthCompat';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';

// Header component props
export interface HeaderProps {
  navigation?: NavigationProps;
  className?: string;
  children?: React.ReactNode;
}

// Header component
export const Header: React.FC<HeaderProps> = ({
  navigation,
  className,
  children,
}) => {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  // Default navigation configuration for RevivaTech
  const defaultNavigation: NavigationProps = {
    variant: 'transparent',
    position: 'sticky',
    size: 'lg',
    blurBackground: true,
    stickyOnScroll: true,
    brand: {
      text: 'RevivaTech',
      href: '/',
      logo: {
        src: '/revivatech-logo.svg',
        alt: 'RevivaTech Logo',
        width: 40,
        height: 40,
      },
    },
    items: [
      {
        id: 'home',
        label: 'Home',
        href: '/',
      },
      {
        id: 'services',
        label: 'Services',
        children: [
          {
            id: 'mac-repair',
            label: 'Mac Repair',
            href: '/apple/mac-repair',
          },
          {
            id: 'pc-repair',
            label: 'PC & Laptop Repair',
            href: '/laptop-pc/repair',
          },
          {
            id: 'data-recovery',
            label: 'Data Recovery',
            href: '/laptop-pc/data-recovery',
          },
          {
            id: 'custom-builds',
            label: 'Custom PC Builds',
            href: '/laptop-pc/custom-builds',
          },
          {
            id: 'virus-removal',
            label: 'Virus Removal',
            href: '/laptop-pc/virus-removal',
          },
          {
            id: 'all-services',
            label: 'All Services',
            href: '/services',
          },
        ],
      },
      {
        id: 'booking',
        label: 'Book Repair',
        href: '/book-repair',
      },
      // Conditionally show account/admin menu based on auth status
      ...(isAuthenticated ? [
        {
          id: 'customer',
          label: 'My Account',
          children: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              href: '/dashboard',
            },
            {
              id: 'track-repair',
              label: 'Track Repair',
              href: '/track-repair',
            },
            {
              id: 'repair-history',
              label: 'Repair History',
              href: '/repair-history',
            },
            {
              id: 'video-consultation',
              label: 'Video Consultation',
              href: '/video-consultation',
            },
            {
              id: 'profile',
              label: 'My Profile',
              href: '/profile',
            },
            {
              id: 'notifications',
              label: 'Notifications',
              href: '/notifications',
            },
          ],
        },
        // Show admin menu only for admin users
        ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? [{
          id: 'admin',
          label: 'Admin',
          children: [
            {
              id: 'admin-dashboard',
              label: 'Dashboard',
              href: '/admin',
            },
            {
              id: 'repair-queue',
              label: 'Repair Queue',
              href: '/admin/repair-queue',
            },
            {
              id: 'analytics',
              label: 'Analytics',
              href: '/admin/analytics',
            },
            {
              id: 'customers',
              label: 'Customers',
              href: '/admin/customers',
            },
            {
              id: 'inventory',
              label: 'Inventory',
              href: '/admin/inventory',
            },
            {
              id: 'ai-diagnostics',
              label: 'AI Diagnostics',
              href: '/ai-diagnostics',
            },
            {
              id: 'settings',
              label: 'Settings',
              href: '/admin/settings',
            },
          ],
        }] : [])
      ] : []),
      {
        id: 'about',
        label: 'About',
        href: '/about',
      },
      {
        id: 'contact',
        label: 'Contact',
        href: '/contact',
      },
    ],
    actions: isAuthenticated ? [
      // Book Repair button for authenticated users
      {
        id: 'book-repair',
        component: 'Button',
        props: {
          text: 'Book Repair',
          variant: 'primary',
          size: 'md',
          href: '/book-repair',
        },
      },
    ] : [
      // Guest user actions
      {
        id: 'login',
        component: 'Button',
        props: {
          text: 'Login',
          variant: 'ghost',
          size: 'sm',
          href: '/login',
        },
      },
      {
        id: 'book-repair',
        component: 'Button',
        props: {
          text: 'Book Repair',
          variant: 'primary',
          size: 'md',
          href: '/book-repair',
        },
      },
    ],
    showSearch: false,
    mobileBreakpoint: 'lg',
  };

  // Merge provided navigation with defaults
  const finalNavigation = navigation 
    ? { ...defaultNavigation, ...navigation }
    : defaultNavigation;

  return (
    <header className={cn("w-full", className)}>
      <div className="relative">
        <Navigation {...finalNavigation} />
        {/* Render UserMenu for authenticated users */}
        {isAuthenticated && (
          <div className="absolute top-4 right-4 z-10">
            <UserMenu user={user} onSignOut={signOut} />
          </div>
        )}
      </div>
      {children}
    </header>
  );
};

export default Header;