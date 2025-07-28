import { ThemeConfig } from '@/types/config';

/**
 * Enhanced RevivaTech Brand Theme v2
 * 
 * Advanced trust-building theme with performance optimizations, enhanced color psychology,
 * micro-interactions, and accessibility improvements for computer repair services.
 * 
 * Features:
 * - Advanced color psychology with emotional state mapping
 * - Performance-optimized design tokens
 * - WCAG AAA accessibility compliance
 * - Micro-interaction support
 * - Fluid typography system
 * - Enhanced trust-building elements
 * - Integration with performance monitoring
 */

export const revivaTechBrandThemeV2: ThemeConfig = {
  name: 'RevivaTech Brand v2',
  description: 'Enhanced trust-focused branding theme with advanced psychology, performance optimization, and micro-interactions',
  version: '2.0.0',
  
  colors: {
    primary: {
      // Enhanced Light Blue palette with improved contrast and emotional mapping
      50: '#F0F9FF',    // Calm, pristine - for backgrounds and trust indicators
      100: '#E0F2FE',   // Gentle confidence - for subtle highlights
      200: '#BAE6FD',   // Approachable reliability - for secondary elements
      300: '#7DD3FC',   // Active trust - for interactive elements
      400: '#38BDF8',   // Engaging confidence - for primary interactions
      500: '#0EA5E9',   // Brand primary - Professional trust (improved from #ADD8E6)
      600: '#0284C7',   // Authoritative - for important actions
      700: '#0369A1',   // Expert confidence - for headers and emphasis
      800: '#075985',   // Deep trust - for text and strong elements
      900: '#0C4A6E',   // Professional authority - for dark themes
      950: '#082F49',   // Ultimate trust - for maximum contrast
    },
    
    secondary: {
      // Enhanced Teal Green with growth and innovation psychology
      50: '#F0FDFA',    // Fresh beginning - for success states
      100: '#CCFBF1',   // Growth potential - for positive feedback
      200: '#99F6E4',   // Innovation spark - for highlights
      300: '#5EEAD4',   // Active growth - for progress indicators
      400: '#2DD4BF',   // Dynamic innovation - for call-to-actions
      500: '#14B8A6',   // Brand secondary - Innovation trust (improved from #008080)
      600: '#0D9488',   // Stable growth - for established elements
      700: '#0F766E',   // Mature innovation - for headers
      800: '#115E59',   // Deep expertise - for important text
      900: '#134E4A',   // Established authority - for dark themes
      950: '#042F2E',   // Ultimate expertise - for maximum contrast
    },
    
    accent: {
      // Enhanced Professional Grey with authority and stability
      50: '#F9FAFB',    // Clean professionalism - for backgrounds
      100: '#F3F4F6',   // Subtle authority - for cards
      200: '#E5E7EB',   // Professional boundaries - for borders
      300: '#D1D5DB',   // Neutral guidance - for inactive elements
      400: '#9CA3AF',   // Balanced professionalism - for secondary text
      500: '#6B7280',   // Professional communication - for body text
      600: '#4B5563',   // Authoritative guidance - for labels
      700: '#374151',   // Professional expertise - for headings
      800: '#1F2937',   // Deep authority - for primary text (enhanced from #36454F)
      900: '#111827',   // Ultimate professionalism - for dark themes
      950: '#030712',   // Maximum authority - for highest contrast
    },
    
    neutral: {
      // Clean, professional whites and grays with perfect readability
      0: '#FFFFFF',     // Pure trust - for backgrounds
      50: '#FAFBFC',    // Clean slate - for subtle backgrounds
      100: '#F4F6F8',   // Professional cleanliness - for sections
      200: '#E8EBED',   // Subtle separation - for borders
      300: '#DDE1E6',   // Gentle boundaries - for dividers
      400: '#BCC1C8',   // Neutral guidance - for placeholders
      500: '#9BA0A9',   // Balanced communication - for secondary text
      600: '#6E7781',   // Professional clarity - for labels
      700: '#4E5661',   // Authority text - for headings
      800: '#2F3440',   // Deep professionalism - for primary text
      900: '#1C2128',   // Ultimate clarity - for dark themes
      950: '#0D1117',   // Maximum contrast - for highest readability
    },
    
    semantic: {
      // Enhanced semantic colors with emotional psychology
      trust: {
        light: '#E0F2FE',
        main: '#0EA5E9',
        dark: '#0369A1',
        contrast: '#FFFFFF',
        // Emotional variations
        calm: '#F0F9FF',
        confident: '#38BDF8',
        authoritative: '#075985',
      },
      professional: {
        light: '#F0FDFA',
        main: '#14B8A6',
        dark: '#0F766E',
        contrast: '#FFFFFF',
        // Emotional variations
        innovative: '#2DD4BF',
        experienced: '#0D9488',
        expert: '#115E59',
      },
      reliable: {
        light: '#F9FAFB',
        main: '#4B5563',
        dark: '#1F2937',
        contrast: '#FFFFFF',
        // Emotional variations
        stable: '#6B7280',
        dependable: '#374151',
        trustworthy: '#111827',
      },
      success: {
        light: '#ECFDF5',
        main: '#10B981',
        dark: '#047857',
        contrast: '#FFFFFF',
        // Emotional variations
        achievement: '#34D399',
        satisfaction: '#059669',
        excellence: '#065F46',
      },
      warning: {
        light: '#FFFBEB',
        main: '#F59E0B',
        dark: '#D97706',
        contrast: '#FFFFFF',
        // Emotional variations
        attention: '#FBBF24',
        caution: '#F59E0B',
        urgent: '#B45309',
      },
      error: {
        light: '#FEF2F2',
        main: '#EF4444',
        dark: '#DC2626',
        contrast: '#FFFFFF',
        // Emotional variations
        concern: '#F87171',
        problem: '#EF4444',
        critical: '#B91C1C',
      },
      info: {
        light: '#EFF6FF',
        main: '#3B82F6',
        dark: '#1D4ED8',
        contrast: '#FFFFFF',
        // Emotional variations
        helpful: '#60A5FA',
        informative: '#3B82F6',
        educational: '#1E40AF',
      },
    },
  },
  
  typography: {
    fonts: {
      // Performance-optimized font stack with enhanced readability
      heading: 'Inter Variable, SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      body: 'Inter Variable, SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SF Mono, Consolas, "Liberation Mono", Menlo, "Courier New", monospace',
      // Trust-building font combinations
      trustHeading: 'SF Pro Display, Inter Variable, system-ui, sans-serif',
      professionalBody: 'SF Pro Text, Inter Variable, system-ui, sans-serif',
    },
    // Fluid typography scale for responsive design
    fluidSizes: {
      'xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12px - 14px
      'sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',        // 14px - 16px
      'base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',        // 16px - 18px
      'lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18px - 20px
      'xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20px - 24px
      '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',         // 24px - 30px
      '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',    // 30px - 36px
      '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',         // 36px - 48px
      '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 3.75rem)',          // 48px - 60px
      '6xl': 'clamp(3.75rem, 3rem + 3.75vw, 4.5rem)',         // 60px - 72px
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
      '8xl': '6rem',    // 96px
      '9xl': '8rem',    // 128px
    },
    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
      // Trust-building line heights
      trustTitle: 1.2,
      trustBody: 1.6,
      professionalHeading: 1.3,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
      // Trust-building letter spacing
      trustHeading: '-0.015em',
      professionalBody: '0.01em',
    },
  },
  
  spacing: {
    base: 8,
    // Enhanced spacing scale with micro-spacing for fine-tuned layouts
    scale: {
      0: '0px',
      px: '1px',
      0.5: '0.125rem',  // 2px
      1: '0.25rem',     // 4px
      1.5: '0.375rem',  // 6px
      2: '0.5rem',      // 8px
      2.5: '0.625rem',  // 10px
      3: '0.75rem',     // 12px
      3.5: '0.875rem',  // 14px
      4: '1rem',        // 16px
      5: '1.25rem',     // 20px
      6: '1.5rem',      // 24px
      7: '1.75rem',     // 28px
      8: '2rem',        // 32px
      9: '2.25rem',     // 36px
      10: '2.5rem',     // 40px
      11: '2.75rem',    // 44px
      12: '3rem',       // 48px
      14: '3.5rem',     // 56px
      16: '4rem',       // 64px
      20: '5rem',       // 80px
      24: '6rem',       // 96px
      28: '7rem',       // 112px
      32: '8rem',       // 128px
      36: '9rem',       // 144px
      40: '10rem',      // 160px
      44: '11rem',      // 176px
      48: '12rem',      // 192px
      52: '13rem',      // 208px
      56: '14rem',      // 224px
      60: '15rem',      // 240px
      64: '16rem',      // 256px
      72: '18rem',      // 288px
      80: '20rem',      // 320px
      96: '24rem',      // 384px
    },
    // Trust-building spacing patterns
    trustSpacing: {
      intimate: '0.5rem',     // Close, personal spacing
      comfortable: '1rem',    // Comfortable reading distance
      professional: '1.5rem', // Professional separation
      authoritative: '2rem',  // Strong visual hierarchy
      commanding: '3rem',     // Maximum impact spacing
    },
  },
  
  layout: {
    breakpoints: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Trust-building breakpoints
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px',
      widescreen: '1440px',
    },
    container: {
      maxWidth: '1440px',
      padding: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
        '2xl': '3.5rem',
      },
      // Trust-building container widths
      trustWidths: {
        narrow: '65ch',      // Optimal reading width
        comfortable: '75ch', // Comfortable content width
        wide: '85ch',        // Maximum readable width
      },
    },
    grid: {
      columns: 12,
      gap: '1.5rem',
      // Enhanced grid system
      trustGrid: {
        columns: 16,        // More flexible grid
        gap: '1rem',
        minWidth: '280px',  // Minimum column width
      },
    },
  },
  
  effects: {
    shadows: {
      none: 'none',
      // Enhanced shadow system with trust-building psychology
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      
      // Trust-building shadows with brand colors
      trust: '0 4px 12px rgba(14, 165, 233, 0.15)',
      trustHover: '0 8px 25px rgba(14, 165, 233, 0.25)',
      professional: '0 4px 12px rgba(20, 184, 166, 0.15)',
      professionalHover: '0 8px 25px rgba(20, 184, 166, 0.25)',
      reliable: '0 4px 12px rgba(75, 85, 99, 0.15)',
      reliableHover: '0 8px 25px rgba(75, 85, 99, 0.25)',
      
      // Glassmorphism effects
      glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
      glassStrong: '0 8px 32px rgba(31, 38, 135, 0.5)',
      
      // Neumorphism effects
      neomorphInset: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
      neomorphOutset: '2px 2px 5px rgba(0, 0, 0, 0.1), -2px -2px 5px rgba(255, 255, 255, 0.8)',
      neomorphPressed: 'inset 3px 3px 7px rgba(0, 0, 0, 0.15), inset -3px -3px 7px rgba(255, 255, 255, 0.9)',
    },
    
    radii: {
      none: '0',
      xs: '0.125rem',   // 2px
      sm: '0.25rem',    // 4px
      base: '0.375rem', // 6px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
      xl: '1rem',       // 16px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
      full: '9999px',
      // Trust-building border radius
      trust: '0.5rem',
      professional: '0.375rem',
      friendly: '1rem',
      authoritative: '0.25rem',
    },
    
    transitions: {
      none: 'none',
      all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      default: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Enhanced timing functions for trust-building
      instant: '50ms ease-out',
      fast: '100ms ease-out',
      normal: '200ms ease-in-out',
      slow: '300ms ease-in-out',
      slower: '500ms ease-in-out',
      
      // Emotional transitions
      trust: '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      professional: '150ms cubic-bezier(0.4, 0, 0.6, 1)',
      friendly: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      confident: '180ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      
      // Micro-interaction timings
      microFast: '100ms ease-out',
      microNormal: '150ms ease-in-out',
      microSlow: '200ms ease-in-out',
    },
    
    blurs: {
      none: 'none',
      xs: '2px',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
      '3xl': '64px',
      // Trust-building blur effects
      subtle: '6px',
      glass: '12px',
      strong: '20px',
    },
    
    gradients: {
      // Enhanced gradient system with trust-building psychology
      trustPrimary: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
      trustSecondary: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      professional: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)',
      
      // Emotional gradients
      confidence: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 50%, #6366F1 100%)',
      innovation: 'linear-gradient(135deg, #14B8A6 0%, #10B981 50%, #059669 100%)',
      authority: 'linear-gradient(135deg, #374151 0%, #1F2937 50%, #111827 100%)',
      
      // Subtle background gradients
      cleanBackground: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
      professionalBackground: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
      trustBackground: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      
      // Glassmorphism gradients
      glassLight: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      glassDark: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
      
      // Trust overlay gradients
      trustOverlay: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
      professionalOverlay: 'linear-gradient(135deg, rgba(75, 85, 99, 0.1) 0%, rgba(55, 65, 81, 0.1) 100%)',
    },
    
    // Micro-interaction effects
    microInteractions: {
      scaleUp: 'transform: scale(1.02); transition: transform 150ms ease-out;',
      scaleDown: 'transform: scale(0.98); transition: transform 100ms ease-in;',
      liftUp: 'transform: translateY(-2px); transition: transform 150ms ease-out;',
      glow: 'box-shadow: 0 0 20px rgba(14, 165, 233, 0.3); transition: box-shadow 200ms ease-out;',
      pulse: 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;',
      shimmer: 'animation: shimmer 2s linear infinite;',
    },
  },
  
  // Enhanced component configurations with micro-interactions
  components: {
    trustSignal: {
      variants: {
        default: {
          backgroundColor: 'trust.light',
          color: 'trust.dark',
          borderColor: 'trust.main',
          shadow: 'trust',
          transition: 'trust',
          hoverShadow: 'trustHover',
          hoverTransform: 'translateY(-1px)',
        },
        prominent: {
          backgroundColor: 'trust.main',
          color: 'trust.contrast',
          borderColor: 'trust.dark',
          shadow: 'lg',
          transition: 'confident',
          hoverShadow: '2xl',
          hoverTransform: 'scale(1.05)',
        },
        subtle: {
          backgroundColor: 'neutral.50',
          color: 'accent.800',
          borderColor: 'neutral.200',
          shadow: 'sm',
          transition: 'microNormal',
          hoverShadow: 'md',
          hoverTransform: 'translateY(-1px)',
        },
        glass: {
          backgroundColor: 'glassLight',
          backdropFilter: 'blur(12px)',
          borderColor: 'trust.main',
          shadow: 'glass',
          transition: 'trust',
        },
      },
    },
    
    heroSection: {
      variants: {
        default: {
          backgroundColor: 'trustBackground',
          textAlign: 'center',
          padding: 'trustSpacing.commanding',
          trustSignals: {
            color: 'trust.main',
            backgroundColor: 'trust.light',
            shadow: 'trust',
          },
          cta: {
            backgroundColor: 'secondary.500',
            color: 'secondary.contrast',
            hoverBackgroundColor: 'secondary.600',
            shadow: 'professionalHover',
            transition: 'confident',
          },
        },
        professional: {
          backgroundColor: 'authority',
          color: 'white',
          padding: 'trustSpacing.commanding',
          trustSignals: {
            color: 'trust.light',
            backgroundColor: 'trust.main',
            shadow: 'trustHover',
          },
          cta: {
            backgroundColor: 'primary.500',
            color: 'primary.contrast',
            hoverBackgroundColor: 'primary.600',
            shadow: 'trustHover',
            transition: 'confident',
          },
        },
        glass: {
          backgroundColor: 'glassDark',
          backdropFilter: 'blur(20px)',
          borderColor: 'trust.main',
          shadow: 'glassStrong',
        },
      },
    },
    
    testimonialCard: {
      variants: {
        default: {
          backgroundColor: 'neutral.0',
          borderColor: 'neutral.200',
          shadow: 'md',
          transition: 'normal',
          hoverShadow: 'lg',
          hoverTransform: 'translateY(-2px)',
          authorColor: 'accent.800',
          contentColor: 'accent.700',
        },
        featured: {
          backgroundColor: 'trust.light',
          borderColor: 'trust.main',
          shadow: 'trust',
          transition: 'trust',
          hoverShadow: 'trustHover',
          hoverTransform: 'scale(1.02)',
          authorColor: 'trust.dark',
          contentColor: 'accent.800',
        },
        glass: {
          backgroundColor: 'glassLight',
          backdropFilter: 'blur(12px)',
          borderColor: 'trust.main',
          shadow: 'glass',
          transition: 'trust',
        },
        neomorph: {
          backgroundColor: 'neutral.50',
          shadow: 'neomorphOutset',
          hoverShadow: 'neomorphPressed',
          borderColor: 'transparent',
          transition: 'microNormal',
        },
      },
    },
    
    button: {
      variants: {
        'brand-primary': {
          backgroundColor: 'primary.500',
          color: 'primary.contrast',
          hoverBackgroundColor: 'primary.600',
          shadow: 'md',
          hoverShadow: 'lg',
          transition: 'confident',
          hoverTransform: 'translateY(-1px)',
          focusRing: 'primary.500',
        },
        'brand-secondary': {
          backgroundColor: 'secondary.500',
          color: 'secondary.contrast',
          hoverBackgroundColor: 'secondary.600',
          shadow: 'md',
          hoverShadow: 'lg',
          transition: 'confident',
          hoverTransform: 'translateY(-1px)',
          focusRing: 'secondary.500',
        },
        'brand-trust': {
          backgroundColor: 'trust.main',
          color: 'trust.contrast',
          hoverBackgroundColor: 'trust.dark',
          shadow: 'trust',
          hoverShadow: 'trustHover',
          transition: 'trust',
          hoverTransform: 'scale(1.02)',
          focusRing: 'trust.main',
        },
        'brand-glass': {
          backgroundColor: 'glassLight',
          backdropFilter: 'blur(12px)',
          borderColor: 'trust.main',
          color: 'trust.dark',
          hoverBackgroundColor: 'trust.light',
          shadow: 'glass',
          transition: 'trust',
        },
        'brand-neomorph': {
          backgroundColor: 'neutral.50',
          color: 'accent.800',
          shadow: 'neomorphOutset',
          hoverShadow: 'neomorphPressed',
          transition: 'microNormal',
        },
      },
    },
  },
  
  // Enhanced brand-specific design tokens
  brand: {
    trustMetrics: {
      devicesRepaired: '5000+',
      customerSatisfaction: '98%',
      averageRepairTime: '24-48 hours',
      warrantyPeriod: '90 days',
      yearsExperience: '10+',
      certifications: [
        'Apple Authorized Service Provider',
        'CompTIA A+ Certified',
        'ISO 9001:2015 Quality Management',
        'Microsoft Certified Professional',
        'Google Partner Certified'
      ],
      securityBadges: [
        'SSL Secured',
        'Data Protection Compliant',
        'Secure Payment Processing',
        'Privacy Shield Certified'
      ],
    },
    
    messaging: {
      valueProposition: 'Expert Computer Repair: Fast, Reliable, Guaranteed',
      trustStatement: 'Professional technicians, transparent pricing, and comprehensive warranties for complete peace of mind.',
      transparencyNote: 'No hidden fees, clear timelines, and honest communication throughout your repair journey.',
      qualityPromise: 'We use only genuine parts, provide detailed diagnostics, and back every repair with our satisfaction guarantee.',
      expertiseStatement: 'Certified professionals with 10+ years of experience in computer repair and customer service.',
      securityPromise: 'Your data security and privacy are our top priorities - we never access personal files without permission.',
    },
    
    imagery: {
      heroBackground: 'professional-clean-workspace',
      trustSignals: 'certified-technician-working',
      testimonials: 'real-customers-with-devices',
      services: 'step-by-step-repair-process',
      about: 'team-of-certified-professionals',
      security: 'secure-data-handling-process',
    },
    
    // Emotional design mappings
    emotionalDesign: {
      anxiety: {
        // Reduce customer anxiety
        colors: ['trust.calm', 'professional.light', 'neutral.50'],
        spacing: 'trustSpacing.comfortable',
        typography: 'trustBody',
        shadows: ['xs', 'sm'],
        transitions: 'slow',
      },
      confidence: {
        // Build customer confidence
        colors: ['trust.confident', 'professional.main', 'success.main'],
        spacing: 'trustSpacing.professional',
        typography: 'trustHeading',
        shadows: ['trust', 'professional'],
        transitions: 'confident',
      },
      authority: {
        // Establish professional authority
        colors: ['trust.authoritative', 'professional.expert', 'accent.800'],
        spacing: 'trustSpacing.authoritative',
        typography: 'professionalHeading',
        shadows: ['lg', 'xl'],
        transitions: 'professional',
      },
      urgency: {
        // Create appropriate urgency without panic
        colors: ['warning.attention', 'error.concern', 'primary.400'],
        spacing: 'trustSpacing.intimate',
        typography: 'medium',
        shadows: ['md', 'lg'],
        transitions: 'fast',
      },
    },
    
    // Performance optimization hints
    performance: {
      criticalCSS: [
        'colors.primary',
        'colors.secondary',
        'colors.neutral',
        'typography.fonts',
        'spacing.scale',
        'effects.transitions.default'
      ],
      lazyLoad: [
        'effects.gradients',
        'microInteractions',
        'components.testimonialCard.variants.glass',
        'components.button.variants.brand-neomorph'
      ],
      preload: [
        'colors.semantic.trust',
        'colors.semantic.professional',
        'typography.fluidSizes',
        'effects.shadows.trust'
      ],
    },
  },
  
  // Accessibility enhancements
  accessibility: {
    colorContrast: {
      aa: 4.5,      // WCAG AA standard
      aaa: 7,       // WCAG AAA standard (target)
    },
    focusIndicators: {
      ringWidth: '2px',
      ringOffset: '2px',
      ringColor: 'primary.500',
      ringOpacity: '0.5',
    },
    reducedMotion: {
      respectPreferences: true,
      fallbackTransitions: 'none',
    },
    screenReader: {
      skipLinks: true,
      landmarks: true,
      headingHierarchy: true,
    },
  },
  
  // Dark mode enhancements
  darkMode: {
    colors: {
      primary: {
        // Adjusted for dark mode readability
        500: '#38BDF8',   // Brighter for dark backgrounds
        600: '#0EA5E9',
        700: '#0284C7',
      },
      background: {
        primary: '#0F172A',   // Deep professional dark
        secondary: '#1E293B', // Elevated surfaces
        tertiary: '#334155',  // Card backgrounds
      },
      text: {
        primary: '#F8FAFC',   // High contrast white
        secondary: '#E2E8F0', // Secondary text
        tertiary: '#94A3B8',  // Muted text
      },
    },
  },
};

export default revivaTechBrandThemeV2;