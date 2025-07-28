/**
 * Brand Theme TypeScript Interfaces
 * 
 * This file contains TypeScript interfaces for the RevivaTech brand theme system,
 * extending the base theme configuration with brand-specific types and structures.
 */

// Base color palette interface
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// Semantic color interface for trust-building elements
export interface SemanticColor {
  light: string;
  main: string;
  dark: string;
  contrast: string;
}

// Brand-specific semantic colors
export interface BrandSemanticColors {
  trust: SemanticColor;
  professional: SemanticColor;
  reliable: SemanticColor;
  success: SemanticColor;
  warning: SemanticColor;
  error: SemanticColor;
  info: SemanticColor;
}

// Typography configuration
export interface TypographyConfig {
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
  };
  weights: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

// Spacing configuration
export interface SpacingConfig {
  base: number;
  scale: {
    0: string;
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
  };
}

// Layout configuration
export interface LayoutConfig {
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  container: {
    maxWidth: string;
    padding: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  grid: {
    columns: number;
    gap: string;
  };
}

// Effects configuration
export interface EffectsConfig {
  shadows: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    glass: string;
    trust: string;
    professional: string;
  };
  radii: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  transitions: {
    none: string;
    all: string;
    default: string;
    colors: string;
    opacity: string;
    shadow: string;
    transform: string;
    fast: string;
    normal: string;
    slow: string;
    bounce: string;
    trust: string;
    professional: string;
  };
  blurs: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  gradients: {
    trustPrimary: string;
    trustSecondary: string;
    professional: string;
    trustOverlay: string;
    cleanBackground: string;
  };
}

// Trust signal component configuration
export interface TrustSignalConfig {
  variants: {
    default: {
      backgroundColor: string;
      color: string;
      borderColor: string;
      shadow: string;
    };
    prominent: {
      backgroundColor: string;
      color: string;
      borderColor: string;
      shadow: string;
    };
    subtle: {
      backgroundColor: string;
      color: string;
      borderColor: string;
      shadow: string;
    };
  };
}

// Hero section component configuration
export interface HeroSectionConfig {
  variants: {
    default: {
      backgroundColor: string;
      gradient: string;
      trustSignals: {
        color: string;
        backgroundColor: string;
      };
      cta: {
        backgroundColor: string;
        color: string;
        hoverBackgroundColor: string;
      };
    };
    professional: {
      backgroundColor: string;
      gradient: string;
      trustSignals: {
        color: string;
        backgroundColor: string;
      };
      cta: {
        backgroundColor: string;
        color: string;
        hoverBackgroundColor: string;
      };
    };
  };
}

// Testimonial card component configuration
export interface TestimonialCardConfig {
  variants: {
    default: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      authorColor: string;
      contentColor: string;
    };
    featured: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      authorColor: string;
      contentColor: string;
    };
    compact: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      authorColor: string;
      contentColor: string;
    };
  };
}

// Pricing display component configuration
export interface PricingDisplayConfig {
  variants: {
    default: {
      backgroundColor: string;
      borderColor: string;
      priceColor: string;
      descriptionColor: string;
    };
    transparent: {
      backgroundColor: string;
      borderColor: string;
      priceColor: string;
      descriptionColor: string;
      badge: {
        backgroundColor: string;
        color: string;
      };
    };
    featured: {
      backgroundColor: string;
      borderColor: string;
      priceColor: string;
      descriptionColor: string;
      badge: {
        backgroundColor: string;
        color: string;
      };
    };
  };
}

// Service card component configuration
export interface ServiceCardConfig {
  variants: {
    default: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      hoverShadow: string;
      titleColor: string;
      descriptionColor: string;
    };
    professional: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      hoverShadow: string;
      titleColor: string;
      descriptionColor: string;
    };
    trust: {
      backgroundColor: string;
      borderColor: string;
      shadow: string;
      hoverShadow: string;
      titleColor: string;
      descriptionColor: string;
    };
  };
}

// Button component configuration
export interface ButtonConfig {
  variants: {
    'brand-primary': {
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      shadow: string;
      transition: string;
    };
    'brand-secondary': {
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      shadow: string;
      transition: string;
    };
    'brand-trust': {
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      shadow: string;
      transition: string;
    };
    'brand-professional': {
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      shadow: string;
      transition: string;
    };
    'brand-outline': {
      backgroundColor: string;
      color: string;
      borderColor: string;
      hoverBackgroundColor: string;
      hoverColor: string;
      transition: string;
    };
    'brand-ghost': {
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      transition: string;
    };
  };
}

// Component configurations interface
export interface ComponentConfigs {
  trustSignal: TrustSignalConfig;
  heroSection: HeroSectionConfig;
  testimonialCard: TestimonialCardConfig;
  pricingDisplay: PricingDisplayConfig;
  serviceCard: ServiceCardConfig;
  button: ButtonConfig;
}

// Brand metrics and content
export interface BrandMetrics {
  devicesRepaired: string;
  customerSatisfaction: string;
  averageRepairTime: string;
  warrantyPeriod: string;
  certifications: string[];
}

export interface BrandMessaging {
  valueProposition: string;
  trustStatement: string;
  transparencyNote: string;
  qualityPromise: string;
}

export interface BrandImagery {
  heroBackground: string;
  trustSignals: string;
  testimonials: string;
  services: string;
}

export interface BrandConfig {
  trustMetrics: BrandMetrics;
  messaging: BrandMessaging;
  imagery: BrandImagery;
}

// Main theme configuration interface
export interface BrandThemeConfig {
  name: string;
  description: string;
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
    neutral: ColorPalette;
    semantic: BrandSemanticColors;
  };
  typography: TypographyConfig;
  spacing: SpacingConfig;
  layout: LayoutConfig;
  effects: EffectsConfig;
  components: ComponentConfigs;
  brand: BrandConfig;
}

// Theme provider props
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'nordic' | 'revivatech-brand';
  storageKey?: string;
}

// Theme context interface
export interface ThemeContextType {
  theme: 'nordic' | 'revivatech-brand';
  setTheme: (theme: 'nordic' | 'revivatech-brand') => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

// Trust signal component props
export interface TrustSignalProps {
  metric: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'prominent' | 'subtle';
  className?: string;
}

// Professional testimonial component props
export interface TestimonialCardProps {
  name: string;
  role?: string;
  company?: string;
  photo: string;
  content: string;
  rating: number;
  verified?: boolean;
  date: string;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

// Pricing display component props
export interface PricingDisplayProps {
  service: string;
  price: {
    from?: number;
    fixed?: number;
    estimate?: boolean;
  };
  includes: string[];
  warranty?: string;
  transparent?: boolean;
  variant?: 'default' | 'transparent' | 'featured';
  className?: string;
}

// Service card component props
export interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  price?: {
    from?: number;
    fixed?: number;
  };
  features?: string[];
  cta?: {
    text: string;
    href: string;
  };
  variant?: 'default' | 'professional' | 'trust';
  className?: string;
}

// Hero section component props
export interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  trustSignals?: TrustSignalProps[];
  cta?: {
    primary: {
      text: string;
      href: string;
    };
    secondary?: {
      text: string;
      href: string;
    };
  };
  backgroundImage?: string;
  variant?: 'default' | 'professional';
  className?: string;
}

// Brand button component props
export interface BrandButtonProps {
  children: React.ReactNode;
  variant?: 'brand-primary' | 'brand-secondary' | 'brand-trust' | 'brand-professional' | 'brand-outline' | 'brand-ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}

// Theme utilities
export type ThemeMode = 'nordic' | 'revivatech-brand';

export interface ThemeUtils {
  getColorValue: (colorPath: string, theme: ThemeMode) => string;
  getComponentConfig: (componentName: string, variant: string, theme: ThemeMode) => any;
  validateTheme: (theme: BrandThemeConfig) => boolean;
  generateCSSVariables: (theme: BrandThemeConfig) => string;
}

// Export all types
export type {
  ColorPalette,
  SemanticColor,
  BrandSemanticColors,
  TypographyConfig,
  SpacingConfig,
  LayoutConfig,
  EffectsConfig,
  ComponentConfigs,
  BrandConfig,
  BrandThemeConfig,
  ThemeProviderProps,
  ThemeContextType,
  TrustSignalProps,
  TestimonialCardProps,
  PricingDisplayProps,
  ServiceCardProps,
  HeroSectionProps,
  BrandButtonProps,
  ThemeMode,
  ThemeUtils,
};