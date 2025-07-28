'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Configuration interface for FloatingNav component
export interface FloatingNavConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  alignment: 'start' | 'center' | 'end';
  showOnScroll: boolean;
  hideDelay: number; // milliseconds
  theme: 'light' | 'dark' | 'auto';
  blur: boolean;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  rounded: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'tight' | 'normal' | 'relaxed';
  animations: {
    enabled: boolean;
    duration: number;
    type: 'slide' | 'fade' | 'scale';
  };
  responsive: {
    mobile: { visible: boolean; position?: 'top' | 'bottom' | 'left' | 'right' };
    tablet: { visible: boolean; position?: 'top' | 'bottom' | 'left' | 'right' };
    desktop: { visible: boolean; position?: 'top' | 'bottom' | 'left' | 'right' };
  };
}

// Navigation item interface
export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: {
    content: string | number;
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  };
  tooltip?: string;
}

// Default configuration
const defaultConfig: FloatingNavConfig = {
  position: 'bottom',
  alignment: 'center',
  showOnScroll: true,
  hideDelay: 3000,
  theme: 'auto',
  blur: true,
  shadow: 'lg',
  rounded: 'full',
  spacing: 'normal',
  animations: {
    enabled: true,
    duration: 0.3,
    type: 'slide'
  },
  responsive: {
    mobile: { visible: true, position: 'bottom' },
    tablet: { visible: true, position: 'bottom' },
    desktop: { visible: true, position: 'bottom' }
  }
};

// Component props
export interface FloatingNavProps {
  items: NavItem[];
  config?: Partial<FloatingNavConfig>;
  className?: string;
  onItemClick?: (item: NavItem) => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  items,
  config: userConfig = {},
  className,
  onItemClick
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const [isVisible, setIsVisible] = useState(!config.showOnScroll);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle scroll behavior
  useEffect(() => {
    if (!config.showOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
        
        // Clear existing timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
        
        // Set new timeout to hide
        if (config.hideDelay > 0) {
          const timeout = setTimeout(() => {
            setIsVisible(false);
          }, config.hideDelay);
          setHideTimeout(timeout);
        }
      } else {
        // Hide when scrolling down
        setIsVisible(false);
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [lastScrollY, config.showOnScroll, config.hideDelay, hideTimeout]);

  // Handle mouse enter/leave for persistent visibility
  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (config.hideDelay > 0 && config.showOnScroll) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, config.hideDelay);
      setHideTimeout(timeout);
    }
  };

  // Handle item click
  const handleItemClick = (item: NavItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
    
    onItemClick?.(item);
  };

  // Animation variants
  const getAnimationVariants = () => {
    const { position, animations } = config;
    
    if (!animations.enabled) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 }
      };
    }

    switch (animations.type) {
      case 'slide':
        return {
          hidden: {
            opacity: 0,
            x: position === 'left' ? -100 : position === 'right' ? 100 : 0,
            y: position === 'top' ? -100 : position === 'bottom' ? 100 : 0
          },
          visible: {
            opacity: 1,
            x: 0,
            y: 0
          }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  // Position classes
  const getPositionClasses = () => {
    const { position, alignment } = config;
    
    const base = 'fixed z-50';
    
    const positionClasses = {
      top: 'top-4',
      bottom: 'bottom-4',
      left: 'left-4 top-1/2 -translate-y-1/2',
      right: 'right-4 top-1/2 -translate-y-1/2'
    };

    const alignmentClasses = {
      start: position === 'top' || position === 'bottom' ? 'left-4' : 'top-4',
      center: position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
      end: position === 'top' || position === 'bottom' ? 'right-4' : 'bottom-4'
    };

    return cn(base, positionClasses[position], alignmentClasses[alignment]);
  };

  // Container classes
  const getContainerClasses = () => {
    const { theme, blur, shadow, rounded, spacing, position } = config;
    
    const themeClasses = {
      light: 'bg-white/90 text-gray-900 border-gray-200',
      dark: 'bg-gray-900/90 text-white border-gray-700',
      auto: 'bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };

    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    };

    const spacingClasses = {
      tight: 'p-2 gap-1',
      normal: 'p-3 gap-2',
      relaxed: 'p-4 gap-3'
    };

    const layoutClasses = position === 'left' || position === 'right' 
      ? 'flex-col items-center' 
      : 'flex-row items-center';

    return cn(
      'flex border backdrop-blur-sm',
      themeClasses[theme],
      blur && 'backdrop-blur-md',
      shadowClasses[shadow],
      roundedClasses[rounded],
      spacingClasses[spacing],
      layoutClasses
    );
  };

  // Item classes
  const getItemClasses = (item: NavItem) => {
    const { rounded, spacing } = config;
    
    const base = 'relative flex items-center justify-center transition-all duration-200';
    
    const sizeClasses = {
      tight: 'h-8 w-8 text-sm',
      normal: 'h-10 w-10 text-base',
      relaxed: 'h-12 w-12 text-lg'
    };

    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    };

    const stateClasses = item.active
      ? 'bg-primary text-primary-foreground'
      : item.disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95';

    return cn(
      base,
      sizeClasses[spacing],
      roundedClasses[rounded],
      stateClasses
    );
  };

  const variants = getAnimationVariants();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          transition={{ duration: config.animations.duration }}
          className={cn(getPositionClasses(), className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={getContainerClasses()}>
            {items.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={getItemClasses(item)}
                  title={item.tooltip || item.label}
                  aria-label={item.label}
                >
                  {item.icon ? (
                    <span className="flex items-center justify-center">
                      {item.icon}
                    </span>
                  ) : (
                    <span className="text-xs font-medium">
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className={cn(
                      'absolute -top-1 -right-1 min-w-[1.2rem] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1',
                      {
                        'bg-primary text-primary-foreground': item.badge.variant === 'primary',
                        'bg-secondary text-secondary-foreground': item.badge.variant === 'secondary',
                        'bg-green-500 text-white': item.badge.variant === 'success',
                        'bg-yellow-500 text-white': item.badge.variant === 'warning',
                        'bg-red-500 text-white': item.badge.variant === 'error'
                      }
                    )}>
                      {item.badge.content}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

// Preset configurations
export const FloatingNavPresets = {
  // Mobile-first bottom navigation
  mobileBottom: {
    position: 'bottom' as const,
    alignment: 'center' as const,
    showOnScroll: false,
    theme: 'auto' as const,
    rounded: 'lg' as const,
    spacing: 'normal' as const,
    responsive: {
      mobile: { visible: true, position: 'bottom' as const },
      tablet: { visible: false },
      desktop: { visible: false }
    }
  },

  // Desktop floating sidebar
  desktopSide: {
    position: 'right' as const,
    alignment: 'center' as const,
    showOnScroll: true,
    hideDelay: 2000,
    theme: 'auto' as const,
    rounded: 'full' as const,
    spacing: 'tight' as const,
    responsive: {
      mobile: { visible: false },
      tablet: { visible: false },
      desktop: { visible: true, position: 'right' as const }
    }
  },

  // Quick actions top
  quickActions: {
    position: 'top' as const,
    alignment: 'end' as const,
    showOnScroll: false,
    theme: 'light' as const,
    rounded: 'md' as const,
    spacing: 'tight' as const,
    shadow: 'md' as const
  },

  // Minimal center bottom
  minimal: {
    position: 'bottom' as const,
    alignment: 'center' as const,
    showOnScroll: true,
    hideDelay: 4000,
    theme: 'auto' as const,
    blur: true,
    rounded: 'full' as const,
    spacing: 'tight' as const,
    animations: {
      enabled: true,
      duration: 0.2,
      type: 'scale' as const
    }
  }
};

export default FloatingNav;