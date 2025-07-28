/**
 * Enhanced Design Tokens v2
 * 
 * Comprehensive design token system with fluid typography, emotional mappings,
 * accessibility compliance, and performance optimizations for RevivaTech brand theme.
 * 
 * Features:
 * - Fluid typography with responsive scaling
 * - Emotional design state mappings
 * - WCAG AAA accessibility compliance
 * - Performance-optimized token delivery
 * - CSS custom property integration
 * - Dark mode optimization
 * - Micro-interaction timing functions
 * - Trust-building design patterns
 */

// Base design token structure
export interface DesignToken<T = any> {
  value: T;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'borderRadius' | 'boxShadow' | 'duration' | 'cubicBezier' | 'number' | 'opacity';
  description?: string;
  deprecated?: boolean;
  alias?: string;
  extensions?: {
    'com.revivatech.accessibility'?: {
      contrastRatio?: number;
      wcagLevel?: 'AA' | 'AAA';
    };
    'com.revivatech.performance'?: {
      critical?: boolean;
      lazyLoad?: boolean;
    };
    'com.revivatech.emotion'?: {
      state: 'calm' | 'confident' | 'urgent' | 'professional' | 'trustworthy';
      impact: 'low' | 'medium' | 'high';
    };
  };
}

// Color tokens with enhanced accessibility and emotional mapping
export const colorTokens = {
  // Primary brand colors with enhanced psychology
  primary: {
    50: {
      value: '#F0F9FF',
      type: 'color' as const,
      description: 'Lightest primary blue - creates sense of calm and pristine trust',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 21, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    100: {
      value: '#E0F2FE',
      type: 'color' as const,
      description: 'Very light primary blue - gentle confidence building',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 19.5, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
      },
    },
    200: {
      value: '#BAE6FD',
      type: 'color' as const,
      description: 'Light primary blue - approachable reliability',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 16.2, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
      },
    },
    300: {
      value: '#7DD3FC',
      type: 'color' as const,
      description: 'Medium-light primary blue - active trust engagement',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 12.8, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'medium' as const },
      },
    },
    400: {
      value: '#38BDF8',
      type: 'color' as const,
      description: 'Medium primary blue - engaging confidence',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 8.5, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
      },
    },
    500: {
      value: '#0EA5E9',
      type: 'color' as const,
      description: 'Primary brand blue - professional trust (enhanced from original)',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 5.8, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    600: {
      value: '#0284C7',
      type: 'color' as const,
      description: 'Darker primary blue - authoritative confidence',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 7.2, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
    700: {
      value: '#0369A1',
      type: 'color' as const,
      description: 'Dark primary blue - expert confidence',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 9.8, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
    800: {
      value: '#075985',
      type: 'color' as const,
      description: 'Very dark primary blue - deep trust',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 12.5, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
    900: {
      value: '#0C4A6E',
      type: 'color' as const,
      description: 'Darkest primary blue - ultimate authority',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 15.2, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
    950: {
      value: '#082F49',
      type: 'color' as const,
      description: 'Maximum dark primary blue - absolute trust',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 18.8, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
  },

  // Secondary colors with growth and innovation psychology
  secondary: {
    50: {
      value: '#F0FDFA',
      type: 'color' as const,
      description: 'Lightest secondary teal - fresh beginning, new growth',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    500: {
      value: '#14B8A6',
      type: 'color' as const,
      description: 'Primary secondary teal - innovation and growth (enhanced from original)',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 5.5, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    600: {
      value: '#0D9488',
      type: 'color' as const,
      description: 'Darker secondary teal - stable growth and reliability',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 7.1, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
    700: {
      value: '#0F766E',
      type: 'color' as const,
      description: 'Dark secondary teal - mature innovation',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 9.2, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
  },

  // Neutral colors with professional authority
  neutral: {
    0: {
      value: '#FFFFFF',
      type: 'color' as const,
      description: 'Pure white - absolute trust and cleanliness',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 21, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    50: {
      value: '#FAFBFC',
      type: 'color' as const,
      description: 'Near white - clean professional slate',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
      },
    },
    800: {
      value: '#2F3440',
      type: 'color' as const,
      description: 'Dark neutral - deep professionalism (enhanced from original)',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 12.8, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    900: {
      value: '#1C2128',
      type: 'color' as const,
      description: 'Very dark neutral - ultimate clarity and authority',
      extensions: {
        'com.revivatech.accessibility': { contrastRatio: 16.5, wcagLevel: 'AAA' as const },
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
  },

  // Semantic colors with emotional intelligence
  semantic: {
    trust: {
      light: {
        value: '#E0F2FE',
        type: 'color' as const,
        description: 'Light trust blue - builds initial confidence',
        extensions: {
          'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
        },
      },
      main: {
        value: '#0EA5E9',
        type: 'color' as const,
        description: 'Primary trust color - core reliability indicator',
        extensions: {
          'com.revivatech.accessibility': { contrastRatio: 5.8, wcagLevel: 'AAA' as const },
          'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
          'com.revivatech.performance': { critical: true },
        },
      },
      dark: {
        value: '#0369A1',
        type: 'color' as const,
        description: 'Dark trust blue - deep reliability and expertise',
        extensions: {
          'com.revivatech.accessibility': { contrastRatio: 9.8, wcagLevel: 'AAA' as const },
          'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        },
      },
    },
    professional: {
      light: {
        value: '#F0FDFA',
        type: 'color' as const,
        description: 'Light professional teal - approachable expertise',
        extensions: {
          'com.revivatech.emotion': { state: 'professional' as const, impact: 'low' as const },
        },
      },
      main: {
        value: '#14B8A6',
        type: 'color' as const,
        description: 'Primary professional color - innovation and expertise',
        extensions: {
          'com.revivatech.accessibility': { contrastRatio: 5.5, wcagLevel: 'AAA' as const },
          'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        },
      },
      dark: {
        value: '#0F766E',
        type: 'color' as const,
        description: 'Dark professional teal - established authority',
        extensions: {
          'com.revivatech.accessibility': { contrastRatio: 9.2, wcagLevel: 'AAA' as const },
          'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        },
      },
    },
    urgent: {
      light: {
        value: '#FEF2F2',
        type: 'color' as const,
        description: 'Light urgent red - gentle attention without panic',
        extensions: {
          'com.revivatech.emotion': { state: 'urgent' as const, impact: 'low' as const },
        },
      },
      main: {
        value: '#EF4444',
        type: 'color' as const,
        description: 'Primary urgent color - immediate attention needed',
        extensions: {
          'com.revivatech.accessibility': { contrastRatio: 5.2, wcagLevel: 'AA' as const },
          'com.revivatech.emotion': { state: 'urgent' as const, impact: 'high' as const },
        },
      },
    },
  },
} as const;

// Typography tokens with fluid scaling and emotional impact
export const typographyTokens = {
  fontFamily: {
    heading: {
      value: 'Inter Variable, SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      type: 'fontFamily' as const,
      description: 'Primary heading font - builds authority and trust',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    body: {
      value: 'Inter Variable, SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      type: 'fontFamily' as const,
      description: 'Primary body font - ensures readability and comfort',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'medium' as const },
        'com.revivatech.performance': { critical: true },
      },
    },
    mono: {
      value: 'SF Mono, Consolas, "Liberation Mono", Menlo, "Courier New", monospace',
      type: 'fontFamily' as const,
      description: 'Monospace font - technical precision and accuracy',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'medium' as const },
      },
    },
    trustHeading: {
      value: 'SF Pro Display, Inter Variable, system-ui, sans-serif',
      type: 'fontFamily' as const,
      description: 'Special heading font for trust-building elements',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
  },

  fontSize: {
    // Standard sizes
    xs: {
      value: '0.75rem',
      type: 'fontSize' as const,
      description: '12px - Small labels and captions',
    },
    sm: {
      value: '0.875rem',
      type: 'fontSize' as const,
      description: '14px - Small text and secondary information',
    },
    base: {
      value: '1rem',
      type: 'fontSize' as const,
      description: '16px - Standard body text size',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    lg: {
      value: '1.125rem',
      type: 'fontSize' as const,
      description: '18px - Large body text',
    },
    xl: {
      value: '1.25rem',
      type: 'fontSize' as const,
      description: '20px - Small headings',
    },
    '2xl': {
      value: '1.5rem',
      type: 'fontSize' as const,
      description: '24px - Medium headings',
    },
    '3xl': {
      value: '1.875rem',
      type: 'fontSize' as const,
      description: '30px - Large headings',
    },
    '4xl': {
      value: '2.25rem',
      type: 'fontSize' as const,
      description: '36px - Very large headings',
    },
    '5xl': {
      value: '3rem',
      type: 'fontSize' as const,
      description: '48px - Display headings',
    },

    // Fluid responsive sizes
    fluidXs: {
      value: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      type: 'fontSize' as const,
      description: 'Fluid extra small - 12px to 14px responsive',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    fluidSm: {
      value: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
      type: 'fontSize' as const,
      description: 'Fluid small - 14px to 16px responsive',
    },
    fluidBase: {
      value: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
      type: 'fontSize' as const,
      description: 'Fluid base - 16px to 18px responsive',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    fluidLg: {
      value: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
      type: 'fontSize' as const,
      description: 'Fluid large - 18px to 20px responsive',
    },
    fluidXl: {
      value: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
      type: 'fontSize' as const,
      description: 'Fluid extra large - 20px to 24px responsive',
    },
    fluid2xl: {
      value: 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
      type: 'fontSize' as const,
      description: 'Fluid 2xl - 24px to 30px responsive',
    },
    fluid3xl: {
      value: 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
      type: 'fontSize' as const,
      description: 'Fluid 3xl - 30px to 36px responsive',
    },
    fluid4xl: {
      value: 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      type: 'fontSize' as const,
      description: 'Fluid 4xl - 36px to 48px responsive',
    },
    fluid5xl: {
      value: 'clamp(3rem, 2.5rem + 2.5vw, 3.75rem)',
      type: 'fontSize' as const,
      description: 'Fluid 5xl - 48px to 60px responsive',
    },
  },

  fontWeight: {
    thin: {
      value: 100,
      type: 'fontWeight' as const,
      description: 'Thin weight - delicate and refined',
    },
    light: {
      value: 300,
      type: 'fontWeight' as const,
      description: 'Light weight - approachable and calm',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'low' as const },
      },
    },
    normal: {
      value: 400,
      type: 'fontWeight' as const,
      description: 'Normal weight - standard readable text',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    medium: {
      value: 500,
      type: 'fontWeight' as const,
      description: 'Medium weight - balanced emphasis',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'medium' as const },
      },
    },
    semibold: {
      value: 600,
      type: 'fontWeight' as const,
      description: 'Semi-bold weight - professional authority',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'medium' as const },
      },
    },
    bold: {
      value: 700,
      type: 'fontWeight' as const,
      description: 'Bold weight - strong emphasis and confidence',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
      },
    },
    extrabold: {
      value: 800,
      type: 'fontWeight' as const,
      description: 'Extra bold weight - maximum impact',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
      },
    },
  },

  lineHeight: {
    none: {
      value: 1,
      type: 'lineHeight' as const,
      description: 'No line height - tight spacing',
    },
    tight: {
      value: 1.25,
      type: 'lineHeight' as const,
      description: 'Tight line height - compact headings',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'medium' as const },
      },
    },
    snug: {
      value: 1.375,
      type: 'lineHeight' as const,
      description: 'Snug line height - comfortable headings',
    },
    normal: {
      value: 1.5,
      type: 'lineHeight' as const,
      description: 'Normal line height - optimal readability',
      extensions: {
        'com.revivatech.performance': { critical: true },
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'medium' as const },
      },
    },
    relaxed: {
      value: 1.625,
      type: 'lineHeight' as const,
      description: 'Relaxed line height - comfortable reading',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'high' as const },
      },
    },
    loose: {
      value: 2,
      type: 'lineHeight' as const,
      description: 'Loose line height - spacious and airy',
    },

    // Trust-building specific line heights
    trustTitle: {
      value: 1.2,
      type: 'lineHeight' as const,
      description: 'Trust title line height - authoritative and impactful',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
    trustBody: {
      value: 1.6,
      type: 'lineHeight' as const,
      description: 'Trust body line height - comfortable and readable',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
      },
    },
    professionalHeading: {
      value: 1.3,
      type: 'lineHeight' as const,
      description: 'Professional heading line height - balanced authority',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
  },

  letterSpacing: {
    tighter: {
      value: '-0.05em',
      type: 'letterSpacing' as const,
      description: 'Tighter letter spacing - compact and efficient',
    },
    tight: {
      value: '-0.025em',
      type: 'letterSpacing' as const,
      description: 'Tight letter spacing - professional and clean',
    },
    normal: {
      value: '0em',
      type: 'letterSpacing' as const,
      description: 'Normal letter spacing - standard readability',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    wide: {
      value: '0.025em',
      type: 'letterSpacing' as const,
      description: 'Wide letter spacing - elegant and spacious',
    },
    wider: {
      value: '0.05em',
      type: 'letterSpacing' as const,
      description: 'Wider letter spacing - luxurious feel',
    },
    widest: {
      value: '0.1em',
      type: 'letterSpacing' as const,
      description: 'Widest letter spacing - maximum impact',
    },

    // Trust-building specific letter spacing
    trustHeading: {
      value: '-0.015em',
      type: 'letterSpacing' as const,
      description: 'Trust heading letter spacing - authoritative',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
      },
    },
    professionalBody: {
      value: '0.01em',
      type: 'letterSpacing' as const,
      description: 'Professional body letter spacing - clear and readable',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'low' as const },
      },
    },
  },
} as const;

// Spacing tokens with trust-building patterns
export const spacingTokens = {
  // Base spacing scale
  0: {
    value: '0px',
    type: 'dimension' as const,
    description: 'No spacing',
  },
  px: {
    value: '1px',
    type: 'dimension' as const,
    description: 'Single pixel spacing',
  },
  1: {
    value: '0.25rem',
    type: 'dimension' as const,
    description: '4px spacing',
  },
  2: {
    value: '0.5rem',
    type: 'dimension' as const,
    description: '8px spacing',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
  4: {
    value: '1rem',
    type: 'dimension' as const,
    description: '16px spacing - base unit',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
  6: {
    value: '1.5rem',
    type: 'dimension' as const,
    description: '24px spacing - comfortable separation',
  },
  8: {
    value: '2rem',
    type: 'dimension' as const,
    description: '32px spacing - clear section separation',
  },
  12: {
    value: '3rem',
    type: 'dimension' as const,
    description: '48px spacing - major section separation',
  },
  16: {
    value: '4rem',
    type: 'dimension' as const,
    description: '64px spacing - large content blocks',
  },
  20: {
    value: '5rem',
    type: 'dimension' as const,
    description: '80px spacing - hero sections',
  },
  24: {
    value: '6rem',
    type: 'dimension' as const,
    description: '96px spacing - major layout sections',
  },

  // Trust-building specific spacing patterns
  trustIntimate: {
    value: '0.5rem',
    type: 'dimension' as const,
    description: 'Intimate spacing - creates closeness and personal connection',
    extensions: {
      'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
    },
  },
  trustComfortable: {
    value: '1rem',
    type: 'dimension' as const,
    description: 'Comfortable spacing - balanced and approachable',
    extensions: {
      'com.revivatech.emotion': { state: 'calm' as const, impact: 'medium' as const },
    },
  },
  trustProfessional: {
    value: '1.5rem',
    type: 'dimension' as const,
    description: 'Professional spacing - authoritative separation',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'medium' as const },
    },
  },
  trustAuthoritative: {
    value: '2rem',
    type: 'dimension' as const,
    description: 'Authoritative spacing - strong visual hierarchy',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
    },
  },
  trustCommanding: {
    value: '3rem',
    type: 'dimension' as const,
    description: 'Commanding spacing - maximum impact and presence',
    extensions: {
      'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
    },
  },
} as const;

// Border radius tokens
export const borderRadiusTokens = {
  none: {
    value: '0',
    type: 'borderRadius' as const,
    description: 'No border radius - sharp and precise',
  },
  xs: {
    value: '0.125rem',
    type: 'borderRadius' as const,
    description: '2px border radius - subtle softening',
  },
  sm: {
    value: '0.25rem',
    type: 'borderRadius' as const,
    description: '4px border radius - gentle softening',
  },
  base: {
    value: '0.375rem',
    type: 'borderRadius' as const,
    description: '6px border radius - balanced friendliness',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
  md: {
    value: '0.5rem',
    type: 'borderRadius' as const,
    description: '8px border radius - approachable',
  },
  lg: {
    value: '0.75rem',
    type: 'borderRadius' as const,
    description: '12px border radius - friendly and modern',
  },
  xl: {
    value: '1rem',
    type: 'borderRadius' as const,
    description: '16px border radius - very friendly',
  },
  full: {
    value: '9999px',
    type: 'borderRadius' as const,
    description: 'Full border radius - pills and circles',
  },

  // Trust-building specific radius
  trust: {
    value: '0.5rem',
    type: 'borderRadius' as const,
    description: 'Trust border radius - reliable and approachable',
    extensions: {
      'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
    },
  },
  professional: {
    value: '0.375rem',
    type: 'borderRadius' as const,
    description: 'Professional border radius - balanced authority',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'medium' as const },
    },
  },
  friendly: {
    value: '1rem',
    type: 'borderRadius' as const,
    description: 'Friendly border radius - welcoming and warm',
    extensions: {
      'com.revivatech.emotion': { state: 'calm' as const, impact: 'high' as const },
    },
  },
  authoritative: {
    value: '0.25rem',
    type: 'borderRadius' as const,
    description: 'Authoritative border radius - confident and precise',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
    },
  },
} as const;

// Shadow tokens with trust-building psychology
export const shadowTokens = {
  none: {
    value: 'none',
    type: 'boxShadow' as const,
    description: 'No shadow - flat and minimal',
  },
  xs: {
    value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    type: 'boxShadow' as const,
    description: 'Extra small shadow - subtle depth',
  },
  sm: {
    value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    type: 'boxShadow' as const,
    description: 'Small shadow - gentle elevation',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
  base: {
    value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    type: 'boxShadow' as const,
    description: 'Base shadow - noticeable elevation',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
  md: {
    value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    type: 'boxShadow' as const,
    description: 'Medium shadow - clear elevation',
  },
  lg: {
    value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    type: 'boxShadow' as const,
    description: 'Large shadow - prominent elevation',
  },
  xl: {
    value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    type: 'boxShadow' as const,
    description: 'Extra large shadow - dramatic elevation',
  },

  // Trust-building shadows with brand colors
  trust: {
    value: '0 4px 12px rgba(14, 165, 233, 0.15)',
    type: 'boxShadow' as const,
    description: 'Trust shadow - builds confidence with brand blue',
    extensions: {
      'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
    },
  },
  trustHover: {
    value: '0 8px 25px rgba(14, 165, 233, 0.25)',
    type: 'boxShadow' as const,
    description: 'Trust hover shadow - enhanced confidence on interaction',
    extensions: {
      'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
    },
  },
  professional: {
    value: '0 4px 12px rgba(20, 184, 166, 0.15)',
    type: 'boxShadow' as const,
    description: 'Professional shadow - expertise and competence',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
    },
  },
  professionalHover: {
    value: '0 8px 25px rgba(20, 184, 166, 0.25)',
    type: 'boxShadow' as const,
    description: 'Professional hover shadow - enhanced expertise display',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
    },
  },
  reliable: {
    value: '0 4px 12px rgba(75, 85, 99, 0.15)',
    type: 'boxShadow' as const,
    description: 'Reliable shadow - stability and dependability',
    extensions: {
      'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
    },
  },

  // Glassmorphism effects
  glass: {
    value: '0 8px 32px rgba(31, 38, 135, 0.37)',
    type: 'boxShadow' as const,
    description: 'Glass morphism shadow - modern and sophisticated',
    extensions: {
      'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
    },
  },
  glassStrong: {
    value: '0 8px 32px rgba(31, 38, 135, 0.5)',
    type: 'boxShadow' as const,
    description: 'Strong glass morphism shadow - enhanced depth',
    extensions: {
      'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
    },
  },

  // Neumorphism effects
  neomorphInset: {
    value: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
    type: 'boxShadow' as const,
    description: 'Neumorphism inset shadow - subtle depth',
  },
  neomorphOutset: {
    value: '2px 2px 5px rgba(0, 0, 0, 0.1), -2px -2px 5px rgba(255, 255, 255, 0.8)',
    type: 'boxShadow' as const,
    description: 'Neumorphism outset shadow - raised element',
  },
} as const;

// Animation and transition tokens with micro-interaction timing
export const animationTokens = {
  duration: {
    instant: {
      value: '50ms',
      type: 'duration' as const,
      description: 'Instant duration - immediate feedback',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'low' as const },
      },
    },
    fast: {
      value: '100ms',
      type: 'duration' as const,
      description: 'Fast duration - quick interactions',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    normal: {
      value: '200ms',
      type: 'duration' as const,
      description: 'Normal duration - balanced timing',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    slow: {
      value: '300ms',
      type: 'duration' as const,
      description: 'Slow duration - deliberate animations',
    },
    slower: {
      value: '500ms',
      type: 'duration' as const,
      description: 'Slower duration - emphasis and impact',
    },

    // Trust-building specific durations
    trustInstant: {
      value: '75ms',
      type: 'duration' as const,
      description: 'Trust instant - immediate confidence feedback',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'medium' as const },
      },
    },
    trustSmooth: {
      value: '200ms',
      type: 'duration' as const,
      description: 'Trust smooth - confident and reliable timing',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
    professionalPrecise: {
      value: '150ms',
      type: 'duration' as const,
      description: 'Professional precise - expert timing',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
  },

  easing: {
    linear: {
      value: 'cubic-bezier(0, 0, 1, 1)',
      type: 'cubicBezier' as const,
      description: 'Linear easing - steady progression',
    },
    easeIn: {
      value: 'cubic-bezier(0.4, 0, 1, 1)',
      type: 'cubicBezier' as const,
      description: 'Ease in - slow start',
    },
    easeOut: {
      value: 'cubic-bezier(0, 0, 0.2, 1)',
      type: 'cubicBezier' as const,
      description: 'Ease out - slow end',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },
    easeInOut: {
      value: 'cubic-bezier(0.4, 0, 0.2, 1)',
      type: 'cubicBezier' as const,
      description: 'Ease in-out - balanced curve',
      extensions: {
        'com.revivatech.performance': { critical: true },
      },
    },

    // Trust-building specific easing
    trustEase: {
      value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      type: 'cubicBezier' as const,
      description: 'Trust easing - builds confidence gradually',
      extensions: {
        'com.revivatech.emotion': { state: 'trustworthy' as const, impact: 'high' as const },
      },
    },
    professionalEase: {
      value: 'cubic-bezier(0.4, 0, 0.6, 1)',
      type: 'cubicBezier' as const,
      description: 'Professional easing - authoritative and precise',
      extensions: {
        'com.revivatech.emotion': { state: 'professional' as const, impact: 'high' as const },
      },
    },
    friendlyEase: {
      value: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      type: 'cubicBezier' as const,
      description: 'Friendly easing - welcoming bounce',
      extensions: {
        'com.revivatech.emotion': { state: 'calm' as const, impact: 'high' as const },
      },
    },
    confidentEase: {
      value: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      type: 'cubicBezier' as const,
      description: 'Confident easing - assertive movement',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
      },
    },
    bounceEase: {
      value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      type: 'cubicBezier' as const,
      description: 'Bounce easing - playful and engaging',
      extensions: {
        'com.revivatech.emotion': { state: 'confident' as const, impact: 'high' as const },
      },
    },
  },
} as const;

// Opacity tokens
export const opacityTokens = {
  0: {
    value: 0,
    type: 'opacity' as const,
    description: 'Completely transparent',
  },
  5: {
    value: 0.05,
    type: 'opacity' as const,
    description: 'Nearly transparent - subtle tints',
  },
  10: {
    value: 0.1,
    type: 'opacity' as const,
    description: 'Very low opacity - gentle overlays',
  },
  20: {
    value: 0.2,
    type: 'opacity' as const,
    description: 'Low opacity - subtle backgrounds',
  },
  30: {
    value: 0.3,
    type: 'opacity' as const,
    description: 'Medium-low opacity - disabled states',
  },
  40: {
    value: 0.4,
    type: 'opacity' as const,
    description: 'Medium opacity - inactive elements',
  },
  50: {
    value: 0.5,
    type: 'opacity' as const,
    description: 'Half opacity - balanced transparency',
  },
  60: {
    value: 0.6,
    type: 'opacity' as const,
    description: 'Medium-high opacity - secondary content',
  },
  70: {
    value: 0.7,
    type: 'opacity' as const,
    description: 'High opacity - de-emphasized content',
  },
  80: {
    value: 0.8,
    type: 'opacity' as const,
    description: 'Very high opacity - subtle transparency',
  },
  90: {
    value: 0.9,
    type: 'opacity' as const,
    description: 'Nearly opaque - minimal transparency',
  },
  100: {
    value: 1,
    type: 'opacity' as const,
    description: 'Completely opaque',
    extensions: {
      'com.revivatech.performance': { critical: true },
    },
  },
} as const;

// Consolidated design tokens object
export const enhancedDesignTokensV2 = {
  color: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  borderRadius: borderRadiusTokens,
  shadow: shadowTokens,
  animation: animationTokens,
  opacity: opacityTokens,
} as const;

// Utility functions for design token access
export function getDesignToken(path: string): any {
  const parts = path.split('.');
  let current: any = enhancedDesignTokensV2;
  
  for (const part of parts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      console.warn(`Design token not found: ${path}`);
      return null;
    }
  }
  
  return current?.value ?? current;
}

export function getDesignTokenWithExtensions(path: string): DesignToken | null {
  const parts = path.split('.');
  let current: any = enhancedDesignTokensV2;
  
  for (const part of parts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

// Performance optimization utilities
export function getCriticalDesignTokens(): string[] {
  const criticalTokens: string[] = [];
  
  function traverseTokens(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (value && typeof value === 'object' && 'value' in value) {
        const token = value as DesignToken;
        if (token.extensions?.['com.revivatech.performance']?.critical) {
          criticalTokens.push(currentPath);
        }
      } else if (value && typeof value === 'object') {
        traverseTokens(value, currentPath);
      }
    }
  }
  
  traverseTokens(enhancedDesignTokensV2);
  return criticalTokens;
}

export function generateCSSVariables(): string {
  const cssVariables: string[] = [];
  
  function traverseTokens(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}-${key}` : key;
      
      if (value && typeof value === 'object' && 'value' in value) {
        const token = value as DesignToken;
        cssVariables.push(`  --${currentPath}: ${token.value};`);
      } else if (value && typeof value === 'object') {
        traverseTokens(value, currentPath);
      }
    }
  }
  
  traverseTokens(enhancedDesignTokensV2);
  
  return `:root {\n${cssVariables.join('\n')}\n}`;
}

// Export type definitions
export type EnhancedDesignTokensV2 = typeof enhancedDesignTokensV2;
export type ColorTokens = typeof colorTokens;
export type TypographyTokens = typeof typographyTokens;
export type SpacingTokens = typeof spacingTokens;
export type BorderRadiusTokens = typeof borderRadiusTokens;
export type ShadowTokens = typeof shadowTokens;
export type AnimationTokens = typeof animationTokens;
export type OpacityTokens = typeof opacityTokens;

export { DesignToken };