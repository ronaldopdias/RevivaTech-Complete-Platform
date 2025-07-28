import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

// Icon size variants
const iconVariants = cva(
  "inline-flex items-center justify-center flex-shrink-0",
  {
    variants: {
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4", 
        md: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
        "2xl": "w-10 h-10",
        "3xl": "w-12 h-12",
      },
      variant: {
        default: "",
        primary: "text-primary",
        secondary: "text-secondary", 
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
        warning: "text-yellow-600",
        info: "text-blue-600",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface IconProps extends VariantProps<typeof iconVariants> {
  name?: string;
  className?: string;
  children?: React.ReactNode;
  // For custom SVG paths
  viewBox?: string;
  path?: string;
  // For Lucide icons
  lucideIcon?: keyof typeof LucideIcons;
}

export const Icon: React.FC<IconProps> = ({
  size,
  variant,
  name,
  className,
  children,
  viewBox = "0 0 24 24",
  path,
  lucideIcon,
  ...props
}) => {
  const iconClasses = cn(iconVariants({ size, variant }), className);

  // If lucideIcon is specified, render the Lucide icon
  if (lucideIcon) {
    const LucideIcon = LucideIcons[lucideIcon] as React.ComponentType<{
      className?: string;
      size?: number;
    }>;
    
    if (LucideIcon) {
      // Convert Tailwind size classes to pixel sizes for Lucide
      const sizeMap = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
        "2xl": 40,
        "3xl": 48,
      };
      
      return (
        <LucideIcon
          className={iconClasses}
          size={sizeMap[size || 'md']}
          {...props}
        />
      );
    }
  }

  // If path is provided, render custom SVG
  if (path) {
    return (
      <svg
        className={iconClasses}
        viewBox={viewBox}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={path} />
      </svg>
    );
  }

  // If children are provided, render them with proper sizing
  if (children) {
    return (
      <span className={iconClasses} {...props}>
        {children}
      </span>
    );
  }

  // Fallback for emoji or text icons
  if (name) {
    return (
      <span className={iconClasses} {...props}>
        {name}
      </span>
    );
  }

  return null;
};

// Predefined common icons with proper paths
export const CheckIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
  />
);

export const XIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
  />
);

export const ChevronDownIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
  />
);

export const ChevronUpIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
  />
);

export const ChevronLeftIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
  />
);

export const ChevronRightIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
  />
);

export const LoadingIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    className={cn("animate-spin", props.className)}
    path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  />
);

export const MenuIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M3 12h18m-9-9v18"
    viewBox="0 0 24 24"
  />
);

export const SearchIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    viewBox="0 0 24 24"
  />
);

export const UserIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  />
);

export const HomeIcon: React.FC<Omit<IconProps, 'path'>> = (props) => (
  <Icon
    {...props}
    path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    viewBox="0 0 24 24"
  />
);

export default Icon;