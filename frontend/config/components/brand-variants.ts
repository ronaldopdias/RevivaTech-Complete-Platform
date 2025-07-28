/**
 * Brand Component Variants Configuration
 * 
 * This file contains configuration for brand-specific component variants,
 * extending the base component system with trust-building and professional styling.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants with brand-specific options
export const brandButtonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Existing variants (maintaining compatibility)
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Brand-specific variants
        'brand-primary': "bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg transition-all duration-200",
        'brand-secondary': "bg-secondary-500 text-white hover:bg-secondary-600 shadow-md hover:shadow-lg transition-all duration-200",
        'brand-trust': "bg-trust-main text-trust-contrast hover:bg-trust-dark shadow-trust hover:shadow-lg transition-all duration-200",
        'brand-professional': "bg-professional-main text-professional-contrast hover:bg-professional-dark shadow-professional hover:shadow-lg transition-all duration-200",
        'brand-outline': "border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-500 hover:text-white transition-all duration-200",
        'brand-ghost': "text-accent-800 hover:bg-neutral-100 transition-all duration-150",
        'brand-cta': "bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg hover:shadow-xl font-semibold transition-all duration-200 transform hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Brand-specific sizes
        'brand-hero': "h-12 px-8 py-3 text-lg font-semibold",
        'brand-compact': "h-8 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Card variants with brand-specific styling
export const brandCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        // Brand-specific variants
        'brand-default': "border-neutral-200 bg-neutral-50 shadow-md hover:shadow-lg transition-all duration-200",
        'brand-trust': "border-trust-main bg-trust-light shadow-trust hover:shadow-lg transition-all duration-200",
        'brand-professional': "border-professional-main bg-professional-light shadow-professional hover:shadow-lg transition-all duration-200",
        'brand-elevated': "border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-all duration-200",
        'brand-subtle': "border-neutral-200 bg-neutral-50 shadow-sm hover:shadow-md transition-all duration-200",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

// Trust signal variants
export const trustSignalVariants = cva(
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-trust-light text-trust-dark border border-trust-main",
        prominent: "bg-trust-main text-trust-contrast shadow-trust",
        subtle: "bg-neutral-50 text-accent-800 border border-neutral-200",
        professional: "bg-professional-light text-professional-dark border border-professional-main",
        success: "bg-success-light text-success-dark border border-success-main",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Testimonial card variants
export const testimonialCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-neutral-50 shadow-md",
        featured: "border-trust-main bg-trust-light shadow-trust",
        compact: "border-neutral-200 bg-neutral-50 shadow-sm",
        professional: "border-professional-main bg-professional-light shadow-professional",
      },
      size: {
        default: "p-6",
        compact: "p-4",
        featured: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Pricing display variants
export const pricingDisplayVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-neutral-50",
        transparent: "border-trust-main bg-neutral-50",
        featured: "border-secondary-500 bg-secondary-50 shadow-lg",
        professional: "border-professional-main bg-professional-light",
      },
      size: {
        default: "p-6",
        compact: "p-4",
        featured: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Service card variants
export const serviceCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-neutral-50 shadow-md hover:shadow-lg",
        professional: "border-professional-main bg-professional-light shadow-professional hover:shadow-lg",
        trust: "border-trust-main bg-trust-light shadow-trust hover:shadow-lg",
        elevated: "border-neutral-200 bg-white shadow-lg hover:shadow-xl",
      },
      size: {
        default: "p-6",
        compact: "p-4",
        expanded: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Hero section variants
export const heroSectionVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-neutral-50",
        professional: "bg-gradient-to-br from-professional-main to-professional-dark text-white",
        trust: "bg-gradient-to-br from-trust-main to-trust-dark text-white",
        clean: "bg-white",
        gradient: "bg-gradient-to-br from-primary-500 to-secondary-500 text-white",
      },
      size: {
        default: "py-24",
        compact: "py-16",
        expanded: "py-32",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Badge variants with brand styling
export const brandBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Brand-specific variants
        'brand-trust': "border-transparent bg-trust-main text-trust-contrast hover:bg-trust-dark",
        'brand-professional': "border-transparent bg-professional-main text-professional-contrast hover:bg-professional-dark",
        'brand-success': "border-transparent bg-success-main text-success-contrast hover:bg-success-dark",
        'brand-warning': "border-transparent bg-warning-main text-warning-contrast hover:bg-warning-dark",
        'brand-outline': "border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white",
        'brand-subtle': "border-neutral-200 bg-neutral-50 text-accent-800 hover:bg-neutral-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Input variants with brand styling
export const brandInputVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        // Brand-specific variants
        'brand-trust': "border-trust-main focus-visible:ring-trust-main",
        'brand-professional': "border-professional-main focus-visible:ring-professional-main",
        'brand-error': "border-error-main focus-visible:ring-error-main",
        'brand-clean': "border-neutral-200 focus-visible:ring-primary-500",
      },
      size: {
        default: "h-10",
        sm: "h-9",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Alert variants with brand styling
export const brandAlertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        // Brand-specific variants
        'brand-trust': "border-trust-main bg-trust-light text-trust-dark [&>svg]:text-trust-main",
        'brand-professional': "border-professional-main bg-professional-light text-professional-dark [&>svg]:text-professional-main",
        'brand-success': "border-success-main bg-success-light text-success-dark [&>svg]:text-success-main",
        'brand-warning': "border-warning-main bg-warning-light text-warning-dark [&>svg]:text-warning-main",
        'brand-info': "border-info-main bg-info-light text-info-dark [&>svg]:text-info-main",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Export variant types
export type BrandButtonVariants = VariantProps<typeof brandButtonVariants>;
export type BrandCardVariants = VariantProps<typeof brandCardVariants>;
export type TrustSignalVariants = VariantProps<typeof trustSignalVariants>;
export type TestimonialCardVariants = VariantProps<typeof testimonialCardVariants>;
export type PricingDisplayVariants = VariantProps<typeof pricingDisplayVariants>;
export type ServiceCardVariants = VariantProps<typeof serviceCardVariants>;
export type HeroSectionVariants = VariantProps<typeof heroSectionVariants>;
export type BrandBadgeVariants = VariantProps<typeof brandBadgeVariants>;
export type BrandInputVariants = VariantProps<typeof brandInputVariants>;
export type BrandAlertVariants = VariantProps<typeof brandAlertVariants>;

// Component configuration objects
export const brandComponentConfigs = {
  button: {
    variants: brandButtonVariants,
    defaultProps: {
      variant: 'brand-primary' as const,
      size: 'default' as const,
    },
  },
  card: {
    variants: brandCardVariants,
    defaultProps: {
      variant: 'brand-default' as const,
      padding: 'default' as const,
    },
  },
  trustSignal: {
    variants: trustSignalVariants,
    defaultProps: {
      variant: 'default' as const,
      size: 'default' as const,
    },
  },
  testimonialCard: {
    variants: testimonialCardVariants,
    defaultProps: {
      variant: 'default' as const,
      size: 'default' as const,
    },
  },
  pricingDisplay: {
    variants: pricingDisplayVariants,
    defaultProps: {
      variant: 'default' as const,
      size: 'default' as const,
    },
  },
  serviceCard: {
    variants: serviceCardVariants,
    defaultProps: {
      variant: 'default' as const,
      size: 'default' as const,
    },
  },
  heroSection: {
    variants: heroSectionVariants,
    defaultProps: {
      variant: 'default' as const,
      size: 'default' as const,
    },
  },
  badge: {
    variants: brandBadgeVariants,
    defaultProps: {
      variant: 'brand-trust' as const,
    },
  },
  input: {
    variants: brandInputVariants,
    defaultProps: {
      variant: 'brand-clean' as const,
      size: 'default' as const,
    },
  },
  alert: {
    variants: brandAlertVariants,
    defaultProps: {
      variant: 'brand-info' as const,
    },
  },
};

// Utility function to get brand component class
export function getBrandComponentClass(
  component: keyof typeof brandComponentConfigs,
  variant?: string,
  size?: string,
  className?: string
): string {
  const config = brandComponentConfigs[component];
  if (!config) return className || '';
  
  const variantClass = config.variants({
    variant: variant || config.defaultProps.variant,
    size: size || (config.defaultProps as any).size,
  });
  
  return cn(variantClass, className);
}

// Brand color utilities
export const brandColors = {
  primary: {
    50: 'hsl(var(--primary-50))',
    100: 'hsl(var(--primary-100))',
    200: 'hsl(var(--primary-200))',
    300: 'hsl(var(--primary-300))',
    400: 'hsl(var(--primary-400))',
    500: 'hsl(var(--primary-500))',
    600: 'hsl(var(--primary-600))',
    700: 'hsl(var(--primary-700))',
    800: 'hsl(var(--primary-800))',
    900: 'hsl(var(--primary-900))',
    950: 'hsl(var(--primary-950))',
  },
  secondary: {
    50: 'hsl(var(--secondary-50))',
    100: 'hsl(var(--secondary-100))',
    200: 'hsl(var(--secondary-200))',
    300: 'hsl(var(--secondary-300))',
    400: 'hsl(var(--secondary-400))',
    500: 'hsl(var(--secondary-500))',
    600: 'hsl(var(--secondary-600))',
    700: 'hsl(var(--secondary-700))',
    800: 'hsl(var(--secondary-800))',
    900: 'hsl(var(--secondary-900))',
    950: 'hsl(var(--secondary-950))',
  },
  trust: {
    light: 'hsl(var(--trust-light))',
    main: 'hsl(var(--trust-main))',
    dark: 'hsl(var(--trust-dark))',
    contrast: 'hsl(var(--trust-contrast))',
  },
  professional: {
    light: 'hsl(var(--professional-light))',
    main: 'hsl(var(--professional-main))',
    dark: 'hsl(var(--professional-dark))',
    contrast: 'hsl(var(--professional-contrast))',
  },
  success: {
    light: 'hsl(var(--success-light))',
    main: 'hsl(var(--success-main))',
    dark: 'hsl(var(--success-dark))',
    contrast: 'hsl(var(--success-contrast))',
  },
  warning: {
    light: 'hsl(var(--warning-light))',
    main: 'hsl(var(--warning-main))',
    dark: 'hsl(var(--warning-dark))',
    contrast: 'hsl(var(--warning-contrast))',
  },
  error: {
    light: 'hsl(var(--error-light))',
    main: 'hsl(var(--error-main))',
    dark: 'hsl(var(--error-dark))',
    contrast: 'hsl(var(--error-contrast))',
  },
  info: {
    light: 'hsl(var(--info-light))',
    main: 'hsl(var(--info-main))',
    dark: 'hsl(var(--info-dark))',
    contrast: 'hsl(var(--info-contrast))',
  },
};

// Brand spacing utilities
export const brandSpacing = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
  '3xl': 'var(--spacing-3xl)',
  '4xl': 'var(--spacing-4xl)',
};

// Brand shadow utilities
export const brandShadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  trust: 'var(--shadow-trust)',
  professional: 'var(--shadow-professional)',
  glass: 'var(--shadow-glass)',
};

// Brand transition utilities
export const brandTransitions = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
  trust: 'var(--transition-trust)',
  professional: 'var(--transition-professional)',
  bounce: 'var(--transition-bounce)',
};

// Export all utilities
export const brandUtils = {
  colors: brandColors,
  spacing: brandSpacing,
  shadows: brandShadows,
  transitions: brandTransitions,
  getComponentClass: getBrandComponentClass,
};