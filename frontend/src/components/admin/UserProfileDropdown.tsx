'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Bell, 
  HelpCircle,
  Activity,
  Moon,
  Sun,
  Keyboard
} from 'lucide-react';
import { useSession, authClient } from '@/lib/auth/better-auth-client';

interface UserProfileDropdownProps {
  className?: string;
  notificationCount?: number;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  className, 
  notificationCount = 0 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  // Enhanced click outside and keyboard handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      setIsOpen(false);
      // Use router for better navigation
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const menuItems = [
    {
      icon: User,
      label: 'Profile Settings',
      onClick: () => handleNavigation('/admin/profile'),
      shortcut: 'P'
    },
    {
      icon: Settings,
      label: 'Admin Settings',
      onClick: () => handleNavigation('/admin/settings'),
      shortcut: 'S'
    },
    {
      icon: Bell,
      label: 'Notifications',
      onClick: () => handleNavigation('/admin/notifications'),
      badge: notificationCount > 0 ? notificationCount.toString() : undefined,
      shortcut: 'N'
    },
    {
      icon: Activity,
      label: 'Activity Log',
      onClick: () => handleNavigation('/admin/activity'),
      shortcut: 'A'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => handleNavigation('/admin/help'),
      shortcut: 'H'
    }
  ];

  // Loading state with RevivaTech brand colors
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg", 
        "bg-gradient-to-r from-[#ADD8E6]/10 to-[#008080]/10 animate-pulse",
        className
      )}>
        <div className="w-8 h-8 bg-[#ADD8E6]/30 rounded-full"></div>
        <div className="w-20 h-4 bg-[#ADD8E6]/20 rounded"></div>
      </div>
    );
  }

  // Not authenticated state with RevivaTech styling
  if (!session?.user) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300",
        className
      )}>
        <User className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Not signed in</span>
      </div>
    );
  }

  const user = session.user;
  const userInitials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Enhanced Profile Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
          "hover:bg-gradient-to-r hover:from-[#ADD8E6]/20 hover:to-[#008080]/20",
          "hover:shadow-md hover:shadow-[#ADD8E6]/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9FCC]",
          "border border-transparent hover:border-[#ADD8E6]/30",
          "min-h-[48px] touch-manipulation", // Mobile touch target
          isOpen && "bg-gradient-to-r from-[#ADD8E6]/20 to-[#008080]/20 shadow-md border-[#ADD8E6]/30"
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${user.name || user.email}`}
      >
        {/* Enhanced Avatar with status indicator */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ADD8E6] to-[#4A9FCC] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
            {userInitials}
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          {/* Notification badge */}
          {notificationCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
              {notificationCount > 9 ? '9+' : notificationCount}
            </div>
          )}
        </div>
        
        {/* Enhanced User Info */}
        <div className="flex flex-col items-start text-left min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
            {user.name || 'User'}
          </span>
          <div className="flex items-center gap-1">
            {user.role && (
              <>
                <Shield className="w-3 h-3 text-[#008080]" />
                <span className="text-xs text-[#008080] font-medium capitalize">
                  {user.role.toLowerCase()}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Enhanced Dropdown Arrow */}
        <ChevronDown className={cn(
          "w-4 h-4 transition-all duration-200 text-gray-600",
          isOpen && "transform rotate-180 text-[#4A9FCC]"
        )} />
      </button>

      {/* Enhanced Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute right-0 top-full mt-3 w-72 z-50",
            "bg-white border border-gray-200 rounded-xl shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            "backdrop-blur-sm bg-white/95"
          )}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              buttonRef.current?.focus();
            }
          }}
        >
          {/* Enhanced User Info Header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-[#ADD8E6]/5 to-[#008080]/5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ADD8E6] to-[#4A9FCC] text-white flex items-center justify-center font-semibold text-lg shadow-md">
                  {userInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {user.email}
                </p>
                {user.role && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-[#008080]" />
                    <span className="text-xs text-[#008080] font-medium capitalize px-2 py-0.5 bg-[#008080]/10 rounded-full">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-sm",
                  "hover:bg-gradient-to-r hover:from-[#ADD8E6]/10 hover:to-[#008080]/10",
                  "transition-all duration-150 group"
                )}
                onClick={item.onClick}
                role="menuitem"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-600 group-hover:text-[#4A9FCC] transition-colors" />
                  <span className="font-medium text-gray-800 group-hover:text-gray-900">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      ⌘{item.shortcut}
                    </kbd>
                  )}
                  <Keyboard className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
            
            <div className="border-t border-gray-200 my-2" />
            
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm",
                "hover:bg-red-50 text-red-600 hover:text-red-700",
                "transition-all duration-150 group",
                isSigningOut && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleSignOut}
              disabled={isSigningOut}
              role="menuitem"
            >
              <LogOut className={cn(
                "w-4 h-4 transition-transform",
                isSigningOut && "animate-spin"
              )} />
              <span className="font-medium">
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
                ⌘Q
              </kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;