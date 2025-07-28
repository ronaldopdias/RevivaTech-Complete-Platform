/**
 * Design System V2 - Enhanced Card Component
 * Advanced card component with comprehensive design tokens and variants
 */

import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Card variants using design tokens
const cardVariants = cva(
  [
    // Base styles
    'relative flex flex-col',
    'bg-white border border-gray-200',
    'transition-all duration-200 ease-out',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border-gray-200',
          'shadow-sm hover:shadow-md',
        ],
        elevated: [
          'bg-white border-gray-200',
          'shadow-lg hover:shadow-xl',
          'hover:-translate-y-1',
        ],
        outlined: [
          'bg-white border-2 border-gray-200',
          'hover:border-gray-300',
          'shadow-none hover:shadow-sm',
        ],
        filled: [
          'bg-gray-50 border-gray-200',
          'hover:bg-gray-100',
          'shadow-none',
        ],
        gradient: [
          'bg-gradient-to-br from-white to-gray-50',
          'border-gray-200',
          'shadow-sm hover:shadow-md',
        ],
        glass: [
          'bg-white/80 backdrop-blur-sm',
          'border-white/20',
          'shadow-xl',
        ],
        interactive: [
          'bg-white border-gray-200',
          'shadow-sm hover:shadow-lg',
          'hover:-translate-y-1 hover:scale-[1.02]',
          'cursor-pointer',
          'active:scale-[0.98]',
        ],
      },
      
      size: {
        xs: 'p-3 gap-2',
        sm: 'p-4 gap-3',
        md: 'p-6 gap-4',
        lg: 'p-8 gap-6',
        xl: 'p-10 gap-8',
      },
      
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
      },
      
      border: {
        none: 'border-0',
        sm: 'border',
        md: 'border-2',
        lg: 'border-4',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      
      fullHeight: {
        true: 'h-full',
        false: 'h-auto',
      },
      
      clickable: {
        true: 'cursor-pointer hover:shadow-lg active:scale-[0.98]',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      radius: 'lg',
      border: 'sm',
      fullWidth: false,
      fullHeight: false,
      clickable: false,
    },
  }
);

// Card component props
export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  
  // Content props
  children?: React.ReactNode;
  
  // Header props
  header?: React.ReactNode;
  title?: string;
  subtitle?: string;
  
  // Footer props
  footer?: React.ReactNode;
  
  // Action props
  actions?: React.ReactNode;
  
  // Loading props
  loading?: boolean;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  
  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  
  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

// Card header component
const CardHeader = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}>(({ children, title, subtitle, actions, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start justify-between',
      'pb-4 border-b border-gray-200',
      className
    )}
    {...props}
  >
    <div className="flex-1">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-600">
          {subtitle}
        </p>
      )}
      {children}
    </div>
    {actions && (
      <div className="flex items-center gap-2 ml-4">
        {actions}
      </div>
    )}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card content component
const CardContent = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
}>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Card footer component
const CardFooter = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
}>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between',
      'pt-4 border-t border-gray-200',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// Card actions component
const CardActions = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}>(({ children, className, align = 'right', ...props }, ref) => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2',
        alignments[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CardActions.displayName = 'CardActions';

// Loading skeleton component
const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-20 bg-gray-200 rounded mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
);

// Main Card component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant,
      size,
      radius,
      border,
      fullWidth,
      fullHeight,
      clickable,
      header,
      title,
      subtitle,
      footer,
      actions,
      loading = false,
      className,
      contentClassName,
      headerClassName,
      footerClassName,
      onClick,
      onMouseEnter,
      onMouseLeave,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      ...props
    },
    ref
  ) => {
    // Determine if card should be clickable
    const isClickable = clickable || !!onClick;
    
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({
            variant,
            size,
            radius,
            border,
            fullWidth,
            fullHeight,
            clickable: isClickable,
          }),
          className
        )}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        {...props}
      >
        {/* Header */}
        {(header || title || subtitle) && (
          <CardHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            className={headerClassName}
          >
            {header}
          </CardHeader>
        )}
        
        {/* Content */}
        <CardContent className={contentClassName}>
          {loading ? <CardSkeleton /> : children}
        </CardContent>
        
        {/* Footer */}
        {footer && (
          <CardFooter className={footerClassName}>
            {footer}
          </CardFooter>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card grid component
export const CardGrid = ({
  children,
  className,
  columns = 3,
  gap = 'md',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
} & HTMLAttributes<HTMLDivElement>) => {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6',
  };
  
  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };
  
  return (
    <div
      className={cn(
        'grid',
        gridColumns[columns],
        gaps[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card masonry component
export const CardMasonry = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'columns-1 md:columns-2 lg:columns-3 xl:columns-4',
        'gap-6 space-y-6',
        '[&>*]:break-inside-avoid [&>*]:mb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Export all components
export { Card, CardHeader, CardContent, CardFooter, CardActions, CardSkeleton, CardGrid, CardMasonry, cardVariants };
export type { CardProps };
export default Card;