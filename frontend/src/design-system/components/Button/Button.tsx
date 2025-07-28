/**
 * Design System V2 - Enhanced Button Component
 * Advanced button component with comprehensive design tokens and accessibility
 */

import React, { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react';

// Button variants using enhanced design tokens
const buttonVariants = cva(
  [
    // Base styles
    'relative inline-flex items-center justify-center gap-2',
    'font-medium text-center whitespace-nowrap',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none touch-manipulation',
    
    // Accessibility
    'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    
    // Default interaction states
    'hover:scale-[1.02] active:scale-[0.98]',
    'transform-gpu will-change-transform',
  ],
  {
    variants: {
      variant: {
        // Primary variants
        primary: [
          'bg-gradient-to-r from-primary-500 to-primary-600',
          'text-white shadow-lg shadow-primary-500/25',
          'hover:shadow-xl hover:shadow-primary-500/30',
          'active:shadow-md active:shadow-primary-500/20',
          'border border-primary-500',
        ],
        
        // Secondary variants
        secondary: [
          'bg-gradient-to-r from-secondary-500 to-secondary-600',
          'text-white shadow-lg shadow-secondary-500/25',
          'hover:shadow-xl hover:shadow-secondary-500/30',
          'active:shadow-md active:shadow-secondary-500/20',
          'border border-secondary-500',
        ],
        
        // Accent variants
        accent: [
          'bg-gradient-to-r from-accent-500 to-accent-600',
          'text-white shadow-lg shadow-accent-500/25',
          'hover:shadow-xl hover:shadow-accent-500/30',
          'active:shadow-md active:shadow-accent-500/20',
          'border border-accent-500',
        ],
        
        // Outline variants
        outline: [
          'border-2 border-primary-500 bg-transparent',
          'text-primary-600 hover:text-primary-700',
          'hover:bg-primary-50 active:bg-primary-100',
          'shadow-sm hover:shadow-md',
        ],
        
        // Ghost variants
        ghost: [
          'bg-transparent text-primary-600',
          'hover:bg-primary-50 active:bg-primary-100',
          'hover:text-primary-700 active:text-primary-800',
        ],
        
        // Subtle variants
        subtle: [
          'bg-primary-50 text-primary-700 border border-primary-200',
          'hover:bg-primary-100 hover:border-primary-300',
          'active:bg-primary-200 active:border-primary-400',
        ],
        
        // Danger variants
        danger: [
          'bg-gradient-to-r from-red-500 to-red-600',
          'text-white shadow-lg shadow-red-500/25',
          'hover:shadow-xl hover:shadow-red-500/30',
          'active:shadow-md active:shadow-red-500/20',
          'border border-red-500',
        ],
        
        // Success variants
        success: [
          'bg-gradient-to-r from-green-500 to-green-600',
          'text-white shadow-lg shadow-green-500/25',
          'hover:shadow-xl hover:shadow-green-500/30',
          'active:shadow-md active:shadow-green-500/20',
          'border border-green-500',
        ],
        
        // Warning variants
        warning: [
          'bg-gradient-to-r from-yellow-500 to-yellow-600',
          'text-white shadow-lg shadow-yellow-500/25',
          'hover:shadow-xl hover:shadow-yellow-500/30',
          'active:shadow-md active:shadow-yellow-500/20',
          'border border-yellow-500',
        ],
        
        // Link variant
        link: [
          'text-primary-600 underline-offset-4 hover:underline',
          'hover:text-primary-700 active:text-primary-800',
          'p-0 h-auto font-normal',
        ],
      },
      
      size: {
        xs: 'h-7 px-2 text-xs rounded-md gap-1',
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-12 px-6 text-base rounded-lg gap-2',
        xl: 'h-14 px-8 text-lg rounded-xl gap-2.5',
        '2xl': 'h-16 px-10 text-xl rounded-xl gap-3',
      },
      
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        full: 'rounded-full',
      },
      
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        '2xl': 'shadow-2xl',
      },
      
      animation: {
        none: '',
        subtle: 'hover:animate-pulse',
        bounce: 'hover:animate-bounce',
        wiggle: 'hover:animate-wiggle',
        float: 'animate-float',
        shimmer: 'animate-shimmer',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      
      loading: {
        true: 'pointer-events-none',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      radius: 'lg',
      shadow: 'md',
      animation: 'none',
      fullWidth: false,
      loading: false,
    },
  }
);

// Enhanced props interface
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled'>,
    VariantProps<typeof buttonVariants> {
  
  // Content props
  children?: React.ReactNode;
  
  // Icon props
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  
  // Loading props
  loading?: boolean;
  loadingText?: string;
  
  // Link props
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  external?: boolean;
  
  // Button props
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  
  // Advanced props
  tooltip?: string;
  badge?: string | number;
  confirmation?: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
  
  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  
  // Styling
  className?: string;
}

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('animate-spin', className)} />
);

// Badge component
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn(
    'absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white',
    'flex items-center justify-center text-xs font-medium',
    'ring-2 ring-white',
    className
  )}>
    {children}
  </span>
);

// Enhanced Button component
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant,
      size,
      radius,
      shadow,
      animation,
      fullWidth,
      loading = false,
      loadingText,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      href,
      target = '_self',
      external = false,
      type = 'button',
      tooltip,
      badge,
      confirmation,
      className,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      ...props
    },
    ref
  ) => {
    // Determine if button should be disabled
    const isDisabled = disabled || loading;
    
    // Handle click with confirmation
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (confirmation) {
        // In a real implementation, this would show a modal
        const confirmed = window.confirm(`${confirmation.title}\n\n${confirmation.message}`);
        if (!confirmed) return;
      }
      
      onClick?.(event);
    };
    
    // Create button content
    const content = (
      <>
        {/* Loading spinner */}
        {loading && (
          <LoadingSpinner className="h-4 w-4" />
        )}
        
        {/* Left icon */}
        {LeftIcon && !loading && (
          <LeftIcon className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* Button content */}
        <span className="flex-1 truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {RightIcon && !loading && (
          <RightIcon className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* External link icon */}
        {href && (external || target === '_blank') && !loading && (
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* Arrow icon for navigation */}
        {href && !external && target === '_self' && !loading && (
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* Badge */}
        {badge && <Badge>{badge}</Badge>}
      </>
    );
    
    // Common props
    const commonProps = {
      className: cn(
        buttonVariants({
          variant,
          size,
          radius,
          shadow,
          animation,
          fullWidth,
          loading,
        }),
        className
      ),
      disabled: isDisabled,
      title: tooltip,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
    };
    
    // Render as link if href is provided
    if (href) {
      // External link
      if (external || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return (
          <a
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            {...commonProps}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
          >
            {content}
          </a>
        );
      }
      
      // Internal link using Next.js Link
      return (
        <Link
          href={href}
          {...commonProps}
          role="button"
          tabIndex={isDisabled ? -1 : 0}
        >
          {content}
        </Link>
      );
    }
    
    // Render as button
    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        {...commonProps}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button group component
export const ButtonGroup = ({
  children,
  className,
  orientation = 'horizontal',
  size = 'md',
  variant = 'primary',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        'rounded-lg overflow-hidden border border-gray-200',
        '[&>*]:rounded-none [&>*]:border-0',
        orientation === 'horizontal' ? '[&>*:not(:last-child)]:border-r' : '[&>*:not(:last-child)]:border-b',
        '[&>*:not(:last-child)]:border-gray-200',
        className
      )}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            size: child.props.size || size,
            variant: child.props.variant || variant,
            radius: 'none',
            shadow: 'none',
          });
        }
        return child;
      })}
    </div>
  );
};

// Icon button component
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> & {
  icon: React.ComponentType<{ className?: string }>;
  'aria-label': string;
}>(
  ({ icon: Icon, size = 'md', variant = 'ghost', radius = 'lg', className, ...props }, ref) => {
    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
      '2xl': 'h-8 w-8',
    };
    
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        radius={radius}
        className={cn('aspect-square p-0', className)}
        {...props}
      >
        <Icon className={iconSizes[size!]} />
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Floating action button component
export const FloatingActionButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size' | 'variant' | 'radius'> & {
  icon: React.ComponentType<{ className?: string }>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}>(
  ({ icon: Icon, position = 'bottom-right', className, ...props }, ref) => {
    const positions = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6',
    };
    
    return (
      <Button
        ref={ref}
        variant="primary"
        size="lg"
        radius="full"
        shadow="2xl"
        animation="float"
        className={cn(
          'aspect-square p-0 z-50',
          positions[position],
          'hover:scale-110 active:scale-95',
          className
        )}
        {...props}
      >
        <Icon className="h-6 w-6" />
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

// Export all components
export { Button, ButtonGroup, IconButton, FloatingActionButton, buttonVariants };
export type { ButtonProps };
export default Button;