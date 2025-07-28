import React, { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import ButtonConfig from '../../../config/components/Button/config';

// Define button variants using cva (same as original Button)
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 py-2",
        lg: "h-10 px-6 text-lg",
        xl: "h-12 px-8 text-xl",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      shadow: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: "md", 
      shadow: "sm",
      fullWidth: false,
    },
  }
);

// Props interface with slot support
export interface ButtonComposedProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    VariantProps<typeof buttonVariants>,
    WithSlotsProps {
  text?: string;
  loading?: boolean;
  icon?: {
    name?: string;
    position?: 'left' | 'right';
    component?: React.ComponentType<any>;
  };
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  tooltip?: string;
  asChild?: boolean;
  composition?: 'slots' | 'props'; // Choose composition method
}

// Forward ref component with slot composition
const ButtonComposed = forwardRef<HTMLButtonElement, ButtonComposedProps>(
  (
    {
      text,
      variant,
      size,
      rounded,
      shadow,
      fullWidth,
      loading = false,
      disabled = false,
      icon,
      href,
      target = '_self',
      type = 'button',
      className,
      ariaLabel,
      tooltip,
      onClick,
      slots = {},
      slotProps = {},
      composition = 'props',
      children,
      ...props
    },
    ref
  ) => {
    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Create button content based on composition method
    const content = composition === 'slots' ? (
      // Slot-based composition
      <SlotProvider initialSlots={slots}>
        {/* Prefix slot */}
        <Slot name="prefix" className="flex-shrink-0" />
        
        {/* Start icon slot or loading */}
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
        ) : (
          <Slot name="startIcon" className="mr-2 flex-shrink-0" />
        )}
        
        {/* Content slot or text */}
        <Slot name="content" fallback={<span>{text}</span>} className="flex-1" />
        
        {/* End icon slot */}
        {!loading && (
          <Slot name="endIcon" className="ml-2 flex-shrink-0" />
        )}
        
        {/* Suffix slot */}
        <Slot name="suffix" className="flex-shrink-0" />
        
        {/* Children if provided */}
        {children}
      </SlotProvider>
    ) : (
      // Traditional props-based composition (fallback to original Button behavior)
      <>
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        
        {/* Left icon */}
        {icon && icon.position === 'left' && !loading && (
          <span className="mr-2">
            {icon.component ? (
              <icon.component className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4">{icon.name}</span>
            )}
          </span>
        )}
        
        {/* Button text */}
        {text && <span>{text}</span>}
        {children}
        
        {/* Right icon */}
        {icon && icon.position === 'right' && !loading && (
          <span className="ml-2">
            {icon.component ? (
              <icon.component className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4">{icon.name}</span>
            )}
          </span>
        )}
      </>
    );

    // Common props
    const commonProps = {
      className: cn(
        buttonVariants({ 
          variant, 
          size, 
          rounded, 
          shadow, 
          fullWidth 
        }), 
        className
      ),
      'aria-label': ariaLabel || text,
      title: tooltip,
      disabled: isDisabled,
    };

    // Render as link if href is provided
    if (href) {
      // External link
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return (
          <a
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            className={commonProps.className}
            aria-label={commonProps['aria-label']}
            title={commonProps.title}
          >
            {content}
          </a>
        );
      }
      
      // Internal link using Next.js Link
      return (
        <Link
          href={href}
          {...(commonProps as any)}
          {...props}
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
        onClick={onClick}
        {...commonProps}
        {...props}
      >
        {content}
      </button>
    );
  }
);

ButtonComposed.displayName = 'ButtonComposed';

// Export component with config
export { ButtonComposed, buttonVariants };
export const config = ButtonConfig;
export default ButtonComposed;