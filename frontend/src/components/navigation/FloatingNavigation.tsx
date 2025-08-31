'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  HardDrive,
  Shield,
  Wrench,
  Cpu,
  Battery,
  ChevronDown,
  User,
  Settings,
  LucideIcon,
  UserCheck,
  Crown,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/lib/auth/useUserRole';
import { getNavigationForRole } from '@/lib/navigation/roleBasedNavigation';
import { UserRoleType } from '@/types/roles';
import { useAuth } from '@/lib/auth';

// Types
interface NavigationItem {
  name: string;
  href: string;
  dropdown?: {
    name: string;
    href: string;
    icon?: LucideIcon;
  }[];
}

interface NavigationState {
  isOpen: boolean;
  scrolled: boolean;
}

interface RoleDisplayConfig {
  role: UserRoleType;
  displayName: string;
  icon: LucideIcon;
  color: string;
}

// Role display configuration
const ROLE_DISPLAY_CONFIG: Record<UserRoleType, RoleDisplayConfig> = {
  PUBLIC: {
    role: 'PUBLIC',
    displayName: 'Public',
    icon: User,
    color: 'text-gray-600'
  },
  CUSTOMER: {
    role: 'CUSTOMER',
    displayName: 'Customer',
    icon: UserCheck,
    color: 'text-blue-600'
  },
  ADMIN: {
    role: 'ADMIN',
    displayName: 'Admin',
    icon: Crown,
    color: 'text-purple-600'
  },
  TECHNICIAN: {
    role: 'TECHNICIAN',
    displayName: 'Technician',
    icon: Briefcase,
    color: 'text-green-600'
  }
};

// Convert role-based navigation to standard navigation format
const convertRoleNavigation = (roleNavigation: any[]): NavigationItem[] => {
  return roleNavigation.map(item => ({
    name: item.name,
    href: item.href,
    dropdown: item.dropdown?.map((dropdownItem: any) => ({
      name: dropdownItem.name,
      href: dropdownItem.href,
      icon: dropdownItem.icon
    }))
  }));
};

// Enhanced FloatingNavigation component with role-based access
const FloatingNavigation: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, switchRole, availableRoles, isLoading } = useUserRole();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  // Enhanced state management with proper typing
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isOpen: false,
    scrolled: false,
  });

  // Memoized navigation items based on user role with proper authentication detection
  const navigation = useMemo(() => {
    console.log('FloatingNavigation: Generating navigation for current role:', {
      isAuthenticated,
      currentRole,
      authLoading,
      isLoading: isLoading
    });
    
    // Show minimal navigation while loading authentication state
    if (authLoading || isLoading) {
      console.log('FloatingNavigation: Showing loading navigation');
      return [
        { name: 'Home', href: '/' },
        { name: 'Services', href: '/services' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' }
      ];
    }
    
    try {
      // Use actual user role - PUBLIC for unauthenticated, user role when authenticated
      const userRole = isAuthenticated ? currentRole : 'PUBLIC';
      console.log('FloatingNavigation: Using role for navigation:', userRole);
      
      const roleNavigation = getNavigationForRole(userRole);
      const convertedNavigation = convertRoleNavigation(roleNavigation);
      
      console.log('FloatingNavigation: Generated navigation:', {
        role: userRole,
        count: convertedNavigation.length,
        items: convertedNavigation.map(item => item.name)
      });
      
      if (convertedNavigation.length > 0) {
        return convertedNavigation;
      }
    } catch (error) {
      console.error('FloatingNavigation: Error generating role-based navigation:', error);
    }
    
    // Fallback navigation only if role-based generation fails
    console.warn('FloatingNavigation: Using fallback navigation due to error');
    return [
      { name: 'Home', href: '/' },
      { name: 'Apple Repair', href: '/apple' },
      { name: 'PC Repair', href: '/laptop-pc' },
      { name: 'Gaming Consoles', href: '/consoles' },
      { name: 'Data Recovery', href: '/data-recovery' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' }
    ];
  }, [isAuthenticated, currentRole, authLoading, isLoading]); // Proper dependencies

  // Get current role display config
  const currentRoleConfig = ROLE_DISPLAY_CONFIG[currentRole];

  // Enhanced scroll effect with useCallback optimization
  useEffect(() => {
    const handleScroll = (): void => {
      setNavigationState(prev => ({
        ...prev,
        scrolled: window.scrollY > 100,
      }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced helper functions with proper typing
  const isActive = useCallback((href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) || false;
  }, [pathname]);

  const toggleMobileMenu = useCallback((): void => {
    setNavigationState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  // Custom Navigation Item Component with proper dropdown positioning
  const NavigationItemComponent: React.FC<{
    item: NavigationItem;
    isMobile?: boolean;
    isActive: (href: string) => boolean;
    toggleMobileMenu?: () => void;
  }> = React.memo(({ item, isMobile = false, isActive, toggleMobileMenu }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const hasDropdown = item.dropdown && item.dropdown.length > 0;
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleItemClick = () => {
      if (isMobile && toggleMobileMenu) {
        toggleMobileMenu();
      }
    };

    const handleMouseEnter = () => {
      if (!isMobile && hasDropdown) {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        setIsDropdownOpen(true);
      }
    };

    const handleMouseLeave = () => {
      if (!isMobile && hasDropdown) {
        // Add small delay before closing to prevent flicker
        hoverTimeoutRef.current = setTimeout(() => {
          setIsDropdownOpen(false);
        }, 100);
      }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

    if (!hasDropdown) {
      return (
        <NavigationMenu.Item>
          <Link
            href={item.href}
            onClick={handleItemClick}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium transition-all duration-300 block",
              isActive(item.href)
                ? "text-blue-600 font-semibold"
                : "text-gray-700 hover:text-blue-600",
              isMobile ? "w-full text-left px-4 py-2 text-sm" : ""
            )}
          >
            <span>{item.name}</span>
          </Link>
        </NavigationMenu.Item>
      );
    }

    return (
      <NavigationMenu.Item 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-all duration-300 flex items-center space-x-1",
            isActive(item.href)
              ? "text-blue-600 font-semibold"
              : "text-gray-700 hover:text-blue-600",
            isMobile ? "w-full text-left px-4 py-2 text-sm space-x-2" : ""
          )}
        >
          <span>{item.name}</span>
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform duration-300",
            isDropdownOpen && "rotate-180",
            isMobile && "w-4 h-4"
          )} />
        </button>

        {isDropdownOpen && (
          <div className={cn(
            "absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50",
            isMobile && "relative mt-2 left-0 transform-none"
          )}>
            <div className="space-y-1">
              {item.dropdown?.map((dropdownItem) => (
                <Link
                  key={dropdownItem.href}
                  href={dropdownItem.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200"
                  onClick={handleItemClick}
                >
                  {dropdownItem.icon && (
                    <dropdownItem.icon className="w-4 h-5" />
                  )}
                  <span className="font-medium">{dropdownItem.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </NavigationMenu.Item>
    );
  });

  return (
    <>
      {/* Desktop Floating Navigation - Following PRD specifications */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`hidden lg:flex fixed top-6 left-0 right-0 z-50 transition-all duration-500 gap-2 items-center px-6 ${
          navigationState.scrolled ? 'top-4 scale-95' : 'top-6 scale-100'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo Container - Far Left */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3" aria-label="ReViva Tech home">
            <span className="text-gray-900 font-bold text-base">RT</span>
            <span className="text-gray-900 font-bold text-xs">
              ReViva Tech
            </span>
          </Link>
          
        </div>

        {/* Main Navigation Menu Container - Center */}
        <motion.div
          className="flex-1 flex justify-center"
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl shadow-2xl px-6 py-1.5"
            whileHover={{
              scale: 1.02,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            transition={{ duration: 0.3 }}
            role="menubar"
            aria-label="Main navigation menu"
          >
            <NavigationMenu.Root className="relative">
              <NavigationMenu.List className="flex items-center justify-center space-x-2">
                {navigation.map((item) => (
                  <NavigationItemComponent
                    key={item.name}
                    item={item}
                    isActive={isActive}
                  />
                ))}
              </NavigationMenu.List>
            </NavigationMenu.Root>
          </motion.div>
        </motion.div>

        {/* Action Buttons - Right */}
        <motion.div className="flex items-center space-x-4">
          {!authLoading && (
            isAuthenticated && user ? (
              /* User Dropdown */
              <div className="relative group">
                <button className="flex items-center space-x-1.5 text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300">
                  <User className="w-3 h-3" />
                  <span>{user.firstName || user.email}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">{user.role}</div>
                  </div>
                  <div className="py-1">
                    {/* Role-based navigation - Admins see only dashboard, others see both dashboard and profile */}
                    {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        {user.role === 'CUSTOMER' && (
                          <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Customer Dashboard
                          </Link>
                        )}
                        {user.role === 'TECHNICIAN' && (
                          <Link href="/technician" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Technician Dashboard
                          </Link>
                        )}
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Profile
                        </Link>
                      </>
                    )}
                    <button 
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Login Button */
              <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300">
                Login
              </Link>
            )
          )}
          
          <Link href="/book-repair" className="bg-blue-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 block" style={{ color: 'white' }}>
            Book Repair
          </Link>
        </motion.div>
      </motion.div>

      {/* Mobile Navigation Toggle */}
      <div className="lg:hidden fixed top-6 right-6 z-50">
        <button
          onClick={toggleMobileMenu}
          className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-3 shadow-lg"
          aria-label="Toggle mobile menu"
        >
          {navigationState.isOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {navigationState.isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col h-full pt-20 px-6 pb-6 overflow-y-auto">
              <NavigationMenu.Root className="w-full">
                <NavigationMenu.List className="flex flex-col space-y-4">
                  {navigation.map((item) => (
                    <NavigationItemComponent
                      key={item.name}
                      item={item}
                      isMobile={true}
                      isActive={isActive}
                      toggleMobileMenu={toggleMobileMenu}
                    />
                  ))}
                </NavigationMenu.List>
              </NavigationMenu.Root>

              {/* Mobile Action Buttons */}
              <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                {!authLoading && (
                  isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="text-xs text-blue-600 font-medium mt-1">{user.role}</div>
                      </div>
                      
                      {/* Role-based Dashboard Links - Admins see only dashboard, others see both dashboard and profile */}
                      {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                        <Link href="/admin" className="w-full border border-blue-500 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 block text-center">
                          Admin Dashboard
                        </Link>
                      ) : (
                        <>
                          {user.role === 'CUSTOMER' && (
                            <Link href="/dashboard" className="w-full border border-blue-500 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 block text-center">
                              Customer Dashboard
                            </Link>
                          )}
                          {user.role === 'TECHNICIAN' && (
                            <Link href="/technician" className="w-full border border-blue-500 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 block text-center">
                              Technician Dashboard
                            </Link>
                          )}
                          <Link href="/profile" className="w-full border border-gray-300 text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 block text-center">
                            Profile
                          </Link>
                        </>
                      )}
                      
                      <button 
                        onClick={() => signOut()}
                        className="w-full border border-red-500 text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 block text-center"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link href="/login" className="w-full border border-blue-500 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 block text-center">
                      Login
                    </Link>
                  )
                )}
                
                <Link href="/book-repair" className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 block text-center" style={{ color: 'white' }}>
                  Book Repair
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(FloatingNavigation); 