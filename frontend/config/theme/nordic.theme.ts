import { ThemeConfig } from '@/types/config';

export const nordicTheme: ThemeConfig = {
  name: 'Nordic',
  description: 'Apple-inspired minimalist design theme with Nordic aesthetics',
  
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#007AFF', // Apple Blue
      600: '#0051D5',
      700: '#003FA3',
      800: '#002E73',
      900: '#002651',
      950: '#001B3D',
    },
    
    secondary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#1D1D1F', // Deep charcoal
      950: '#0F0F10',
    },
    
    semantic: {
      success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#059669',
        contrast: '#FFFFFF',
      },
      warning: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
        contrast: '#FFFFFF',
      },
      error: {
        light: '#FEE2E2',
        main: '#EF4444',
        dark: '#DC2626',
        contrast: '#FFFFFF',
      },
      info: {
        light: '#DBEAFE',
        main: '#007AFF',
        dark: '#0051D5',
        contrast: '#FFFFFF',
      },
    },
  },
  
  typography: {
    fonts: {
      heading: '-apple-system, SF Pro Display, Inter, system-ui, sans-serif',
      body: '-apple-system, SF Pro Text, Inter, system-ui, sans-serif',
      mono: 'SF Mono, Monaco, Consolas, monospace',
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
    },
    weights: {
      thin: 100,
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
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  spacing: {
    base: 8,
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
    },
  },
  
  layout: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      maxWidth: '1280px',
      padding: {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
      },
    },
    grid: {
      columns: 12,
      gap: '1.5rem',
    },
  },
  
  effects: {
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    radii: {
      none: '0',
      sm: '0.25rem',
      base: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      full: '9999px',
    },
    transitions: {
      none: 'none',
      all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      default: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      fast: '100ms ease-in-out',
      normal: '200ms ease-in-out',
      slow: '300ms ease-in-out',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    blurs: {
      none: 'none',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
      '3xl': '64px',
    },
  },
};

export default nordicTheme;