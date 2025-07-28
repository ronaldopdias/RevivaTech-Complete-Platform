import React, { forwardRef, HTMLAttributes } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import CardConfig from '../../../config/components/Card/config';

// Define card variants using cva
const cardVariants = cva(
  "relative overflow-hidden transition-all duration-200 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border border-border",
        elevated: "bg-card text-card-foreground",
        outlined: "bg-background text-foreground border-2 border-border",
        filled: "bg-muted text-muted-foreground border border-border",
        ghost: "bg-transparent text-foreground",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl",
      },
      border: {
        none: "border-0",
        thin: "border",
        medium: "border-2",
        thick: "border-4",
      },
      padding: {
        none: "p-0",
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      background: {
        default: "bg-card",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        muted: "bg-muted text-muted-foreground",
        transparent: "bg-transparent",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "md",
      shadow: "sm",
      border: "thin",
      padding: "md",
      background: "default",
      interactive: false,
    },
  }
);

// Props interface with slot support
export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
  VariantProps<typeof cardVariants>,
  WithSlotsProps {
  clickable?: boolean;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  ariaLabel?: string;
  role?: string;
  composition?: 'slots' | 'children';
  children?: React.ReactNode;
}

// Card header component
const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// Card title component
const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// Card description component
const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// Card content component
const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card footer component
const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Main Card component with slot composition
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant,
      size,
      rounded,
      shadow,
      border,
      padding,
      background,
      interactive,
      clickable = false,
      href,
      target = '_self',
      className,
      ariaLabel,
      role,
      onClick,
      slots = {},
      slotProps = {},
      composition = 'children',
      children,
      ...props
    },
    ref
  ) => {
    // Determine if card should be interactive
    const isInteractive = interactive || clickable || !!href;

    // Create card content based on composition method
    const content = composition === 'slots' ? (
      <SlotProvider initialSlots={slots}>
        {/* Card header slot */}
        <Slot name="header" className="card-header" />

        {/* Card media slot */}
        <Slot name="media" className="card-media" />

        {/* Card content slot */}
        <Slot name="content" className="card-content flex-1" />

        {/* Card aside slot */}
        <Slot name="aside" className="card-aside" />

        {/* Card actions slot */}
        <Slot name="actions" className="card-actions" />

        {/* Card footer slot */}
        <Slot name="footer" className="card-footer" />

        {/* Card overlay slot */}
        <Slot name="overlay" className="absolute inset-0 card-overlay" />

        {/* Children if provided */}
        {children}
      </SlotProvider>
    ) : (
      // Traditional children-based composition
      children
    );

    // Common props
    const commonProps = {
      ref,
      className: cn(
        cardVariants({
          variant,
          size,
          rounded,
          shadow,
          border,
          padding,
          background,
          interactive: isInteractive,
        }),
        className
      ),
      'aria-label': ariaLabel,
      role: role || (clickable ? 'button' : undefined),
      onClick: clickable ? onClick : undefined,
      ...props,
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
        <Link href={href} className={commonProps.className} aria-label={commonProps['aria-label']} title={commonProps.title}>
          {content}
        </Link>
      );
    }

    // Render as div
    return (
      <div {...commonProps}>
        {content}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Export all components and config
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants
};
export const config = CardConfig;
export default Card;