/**
 * Breadcrumb Navigation Component
 * Provides contextual navigation breadcrumbs for all pages
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  name: string;
  href: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isClickable?: boolean;
}

interface BreadcrumbNavigationProps {
  className?: string;
  showHome?: boolean;
  showIcons?: boolean;
  maxItems?: number;
  separator?: 'chevron' | 'slash' | 'dot';
  customBreadcrumbs?: BreadcrumbItem[];
}

// Breadcrumb mapping configuration
const BREADCRUMB_MAPPING: Record<string, BreadcrumbItem[]> = {
  '/': [
    { name: 'Home', href: '/', icon: Home, isActive: true }
  ],
  '/apple': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple', isActive: true }
  ],
  '/apple/mac-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple' },
    { name: 'Mac Repair', href: '/apple/mac-repair', isActive: true }
  ],
  '/apple/macbook-screen-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple' },
    { name: 'MacBook Screen Repair', href: '/apple/macbook-screen-repair', isActive: true }
  ],
  '/apple/mac-battery-replacement': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple' },
    { name: 'Battery Replacement', href: '/apple/mac-battery-replacement', isActive: true }
  ],
  '/apple/iphone-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple' },
    { name: 'iPhone Repair', href: '/apple/iphone-repair', isActive: true }
  ],
  '/apple/ipad-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Apple Repair', href: '/apple' },
    { name: 'iPad Repair', href: '/apple/ipad-repair', isActive: true }
  ],
  '/laptop-pc': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc', isActive: true }
  ],
  '/laptop-pc/repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'Laptop Repair', href: '/laptop-pc/repair', isActive: true }
  ],
  '/laptop-pc/screen-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'Screen Repair', href: '/laptop-pc/screen-repair', isActive: true }
  ],
  '/laptop-pc/virus-removal': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'Virus Removal', href: '/laptop-pc/virus-removal', isActive: true }
  ],
  '/laptop-pc/custom-builds': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'Custom PCs', href: '/laptop-pc/custom-builds', isActive: true }
  ],
  '/laptop-pc/data-recovery': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'Data Recovery', href: '/laptop-pc/data-recovery', isActive: true }
  ],
  '/laptop-pc/it-recycling': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'PC Repair', href: '/laptop-pc' },
    { name: 'IT Recycling', href: '/laptop-pc/it-recycling', isActive: true }
  ],
  '/consoles': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Gaming Consoles', href: '/consoles', isActive: true }
  ],
  '/data-recovery': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Data Recovery', href: '/data-recovery', isActive: true }
  ],
  '/pricing': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Pricing', href: '/pricing', isActive: true }
  ],
  '/testimonials': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Testimonials', href: '/testimonials', isActive: true }
  ],
  '/about': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', isActive: true }
  ],
  '/contact': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Contact', href: '/contact', isActive: true }
  ],
  '/faq': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Support', href: '/faq' },
    { name: 'FAQ', href: '/faq', isActive: true }
  ],
  '/warranty': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Support', href: '/faq' },
    { name: 'Warranty', href: '/warranty', isActive: true }
  ],
  '/careers': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Support', href: '/faq' },
    { name: 'Careers', href: '/careers', isActive: true }
  ],
  '/reviews': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Support', href: '/faq' },
    { name: 'Reviews', href: '/reviews', isActive: true }
  ],
  '/dashboard': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard', isActive: true }
  ],
  '/track-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard' },
    { name: 'Track Repair', href: '/track-repair', isActive: true }
  ],
  '/repair-history': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard' },
    { name: 'Repair History', href: '/repair-history', isActive: true }
  ],
  '/profile': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard' },
    { name: 'Profile', href: '/profile', isActive: true }
  ],
  '/invoices': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard' },
    { name: 'Invoices', href: '/invoices', isActive: true }
  ],
  '/appointments': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customer Portal', href: '/dashboard' },
    { name: 'Appointments', href: '/appointments', isActive: true }
  ],
  '/admin': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin', isActive: true }
  ],
  '/admin/analytics': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Analytics', href: '/admin/analytics', isActive: true }
  ],
  '/admin/customers': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Customer Management', href: '/admin/customers', isActive: true }
  ],
  '/admin/repairs': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Repair Management', href: '/admin/repairs', isActive: true }
  ],
  '/admin/staff': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Staff Management', href: '/admin/staff', isActive: true }
  ],
  '/admin/reports': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Reports', href: '/admin/reports', isActive: true }
  ],
  '/admin/settings': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Settings', href: '/admin/settings', isActive: true }
  ],
  '/technician': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Technician Dashboard', href: '/technician', isActive: true }
  ],
  '/technician/queue': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Technician Dashboard', href: '/technician' },
    { name: 'Repair Queue', href: '/technician/queue', isActive: true }
  ],
  '/technician/schedule': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Technician Dashboard', href: '/technician' },
    { name: 'Work Schedule', href: '/technician/schedule', isActive: true }
  ],
  '/technician/completed': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Technician Dashboard', href: '/technician' },
    { name: 'Completed Jobs', href: '/technician/completed', isActive: true }
  ],
  '/book-repair': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Book Repair', href: '/book-repair', isActive: true }
  ],
  '/login': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Login', href: '/login', isActive: true }
  ],
  '/register': [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Register', href: '/register', isActive: true }
  ],
};

// Function to generate breadcrumbs from path
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Check for exact match first
  if (BREADCRUMB_MAPPING[pathname]) {
    return BREADCRUMB_MAPPING[pathname];
  }

  // Dynamic breadcrumb generation for unmapped paths
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', icon: Home }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Convert segment to readable name
    const segmentName = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      name: segmentName,
      href: currentPath,
      isActive: isLast
    });
  });

  return breadcrumbs;
};

// Function to truncate breadcrumbs if too many
const truncateBreadcrumbs = (breadcrumbs: BreadcrumbItem[], maxItems: number): BreadcrumbItem[] => {
  if (breadcrumbs.length <= maxItems) return breadcrumbs;

  const firstItem = breadcrumbs[0];
  const lastItems = breadcrumbs.slice(-(maxItems - 2));
  const ellipsisItem: BreadcrumbItem = {
    name: '...',
    href: '#',
    isClickable: false
  };

  return [firstItem, ellipsisItem, ...lastItems];
};

// Separator component
const Separator: React.FC<{ type: 'chevron' | 'slash' | 'dot' }> = ({ type }) => {
  switch (type) {
    case 'slash':
      return <span className="text-gray-400 mx-2">/</span>;
    case 'dot':
      return <span className="text-gray-400 mx-2">•</span>;
    default:
      return <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />;
  }
};

// Main breadcrumb navigation component
const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  className = '',
  showHome = true,
  showIcons = true,
  maxItems = 6,
  separator = 'chevron',
  customBreadcrumbs
}) => {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }
    
    const generated = generateBreadcrumbs(pathname);
    
    // Filter out home if not shown
    const filtered = showHome ? generated : generated.slice(1);
    
    // Truncate if necessary
    return truncateBreadcrumbs(filtered, maxItems);
  }, [pathname, customBreadcrumbs, showHome, maxItems]);

  // Don't show breadcrumbs on home page unless there are custom breadcrumbs
  if (pathname === '/' && !customBreadcrumbs) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center space-x-1 text-sm font-medium overflow-x-auto scrollbar-hide",
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isClickable = item.isClickable !== false && !item.isActive;
          
          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && <Separator type={separator} />}
              
              <motion.div
                whileHover={isClickable ? { scale: 1.05 } : undefined}
                className={cn(
                  "flex items-center space-x-2 px-2 py-1 rounded-lg transition-colors duration-200",
                  item.isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : isClickable
                    ? "text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    : "text-gray-400 cursor-default"
                )}
              >
                {/* Icon */}
                {showIcons && item.icon && (
                  <item.icon className="w-4 h-4" />
                )}
                
                {/* Breadcrumb item */}
                {isClickable ? (
                  <Link
                    href={item.href}
                    className="hover:underline"
                    aria-current={item.isActive ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current={item.isActive ? 'page' : undefined}>
                    {item.name}
                  </span>
                )}
              </motion.div>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
};

// Export types for external use
export type { BreadcrumbItem, BreadcrumbNavigationProps };

// Export utility functions
export { generateBreadcrumbs, truncateBreadcrumbs };

export default BreadcrumbNavigation;