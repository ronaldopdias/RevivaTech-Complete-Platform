/**
 * Design System V2 - Master Token System
 * Comprehensive token management and generation system
 */

import { colorSystem, type ColorTokens } from './colors';
import { typographySystem, type TypographyTokens, generateTypographyCSS } from './typography';
import { spacingSystem, type SpacingTokens, generateSpacingCSS } from './spacing';

// Export all token systems
export { colorSystem, typographySystem, spacingSystem };
export type { ColorTokens, TypographyTokens, SpacingTokens };

// Master token interface
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  effects: {
    shadows: {
      none: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      inner: string;
      focus: string;
    };
    radii: {
      none: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      full: string;
    };
    transitions: {
      none: string;
      fast: string;
      normal: string;
      slow: string;
      slowest: string;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      bounce: string;
      elastic: string;
    };
    blur: {
      none: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  animation: {
    duration: {
      instant: string;
      fast: string;
      normal: string;
      slow: string;
      slowest: string;
    };
    keyframes: {
      fadeIn: string;
      fadeOut: string;
      slideUp: string;
      slideDown: string;
      slideLeft: string;
      slideRight: string;
      scaleIn: string;
      scaleOut: string;
      bounce: string;
      pulse: string;
      spin: string;
      wiggle: string;
      float: string;
      shimmer: string;
    };
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  zIndex: {
    hide: number;
    base: number;
    elevated: number;
    sticky: number;
    dropdown: number;
    modal: number;
    popover: number;
    tooltip: number;
    toast: number;
    overlay: number;
    max: number;
  };
}

// Effects system
const effectsSystem = {
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  radii: {
    none: '0',
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  transitions: {
    none: 'none',
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    slowest: '500ms ease-out',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  blur: {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '40px',
  },
};

// Animation system
const animationSystem = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slowest: '500ms',
  },
  keyframes: {
    fadeIn: 'fadeIn 200ms ease-out',
    fadeOut: 'fadeOut 200ms ease-out',
    slideUp: 'slideUp 300ms ease-out',
    slideDown: 'slideDown 300ms ease-out',
    slideLeft: 'slideLeft 300ms ease-out',
    slideRight: 'slideRight 300ms ease-out',
    scaleIn: 'scaleIn 200ms ease-out',
    scaleOut: 'scaleOut 200ms ease-out',
    bounce: 'bounce 1s ease-in-out',
    pulse: 'pulse 2s ease-in-out infinite',
    spin: 'spin 1s linear infinite',
    wiggle: 'wiggle 1s ease-in-out',
    float: 'float 3s ease-in-out infinite',
    shimmer: 'shimmer 2s ease-in-out infinite',
  },
};

// Z-index system
const zIndexSystem = {
  hide: -1,
  base: 0,
  elevated: 10,
  sticky: 20,
  dropdown: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
  overlay: 80,
  max: 9999,
};

// Master design tokens
export const designTokens: DesignTokens = {
  colors: colorSystem.light,
  typography: typographySystem,
  spacing: spacingSystem,
  effects: effectsSystem,
  animation: animationSystem,
  breakpoints: spacingSystem.breakpoints,
  zIndex: zIndexSystem,
};

// Token generation utilities
export const tokenGenerator = {
  // Generate complete CSS custom properties
  generateCSS: (theme: 'light' | 'dark' = 'light') => {
    const colors = theme === 'light' ? colorSystem.light : colorSystem.dark;
    
    let css = ':root {\n';
    
    // Color tokens
    css += '  /* Colors */\n';
    
    // Primary colors
    Object.entries(colors.primary).forEach(([key, value]) => {
      css += `  --color-primary-${key}: ${value};\n`;
    });
    
    // Secondary colors
    Object.entries(colors.secondary).forEach(([key, value]) => {
      css += `  --color-secondary-${key}: ${value};\n`;
    });
    
    // Accent colors
    Object.entries(colors.accent).forEach(([key, value]) => {
      css += `  --color-accent-${key}: ${value};\n`;
    });
    
    // Neutral colors
    Object.entries(colors.neutral).forEach(([key, value]) => {
      css += `  --color-neutral-${key}: ${value};\n`;
    });
    
    // Semantic colors
    Object.entries(colors.semantic).forEach(([category, colorSet]) => {
      Object.entries(colorSet).forEach(([key, value]) => {
        css += `  --color-${category}-${key}: ${value};\n`;
      });
    });
    
    // Surface colors
    Object.entries(colors.surface).forEach(([key, value]) => {
      css += `  --color-surface-${key}: ${value};\n`;
    });
    
    // Interactive colors
    Object.entries(colors.interactive).forEach(([key, value]) => {
      css += `  --color-interactive-${key}: ${value};\n`;
    });
    
    // Gradients
    Object.entries(colors.gradients).forEach(([key, value]) => {
      css += `  --gradient-${key}: ${value};\n`;
    });
    
    // Typography tokens
    css += '\n' + generateTypographyCSS(theme);
    
    // Spacing tokens
    css += '\n' + generateSpacingCSS();
    
    // Effects tokens
    css += '\n  /* Effects */\n';
    
    // Shadows
    Object.entries(effectsSystem.shadows).forEach(([key, value]) => {
      css += `  --shadow-${key}: ${value};\n`;
    });
    
    // Radii
    Object.entries(effectsSystem.radii).forEach(([key, value]) => {
      css += `  --radius-${key}: ${value};\n`;
    });
    
    // Transitions
    Object.entries(effectsSystem.transitions).forEach(([key, value]) => {
      css += `  --transition-${key}: ${value};\n`;
    });
    
    // Easing
    Object.entries(effectsSystem.easing).forEach(([key, value]) => {
      css += `  --easing-${key}: ${value};\n`;
    });
    
    // Blur
    Object.entries(effectsSystem.blur).forEach(([key, value]) => {
      css += `  --blur-${key}: ${value};\n`;
    });
    
    // Animation tokens
    css += '\n  /* Animation */\n';
    
    // Duration
    Object.entries(animationSystem.duration).forEach(([key, value]) => {
      css += `  --duration-${key}: ${value};\n`;
    });
    
    // Z-index tokens
    css += '\n  /* Z-Index */\n';
    Object.entries(zIndexSystem).forEach(([key, value]) => {
      css += `  --z-${key}: ${value};\n`;
    });
    
    css += '}\n';
    
    // Add keyframes
    css += '\n/* Keyframes */\n';
    css += `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideLeft {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideRight {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes scaleOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
  40%, 43% { transform: translate3d(0, -30px, 0); }
  70% { transform: translate3d(0, -15px, 0); }
  90% { transform: translate3d(0, -4px, 0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes wiggle {
  0%, 7%, 14%, 21%, 28%, 35%, 42%, 49%, 56%, 63%, 70%, 77%, 84%, 91%, 98%, 100% {
    transform: translate3d(0, 0, 0);
  }
  3.5%, 10.5%, 17.5%, 24.5%, 31.5%, 38.5%, 45.5%, 52.5%, 59.5%, 66.5%, 73.5%, 80.5%, 87.5%, 94.5% {
    transform: translate3d(-1px, 0, 0) rotate(-1deg);
  }
  7%, 14%, 21%, 28%, 35%, 42%, 49%, 56%, 63%, 70%, 77%, 84%, 91%, 98% {
    transform: translate3d(1px, 0, 0) rotate(1deg);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
`;
    
    return css;
  },
  
  // Generate JavaScript token object
  generateJS: (theme: 'light' | 'dark' = 'light') => {
    const colors = theme === 'light' ? colorSystem.light : colorSystem.dark;
    
    return {
      colors,
      typography: typographySystem,
      spacing: spacingSystem,
      effects: effectsSystem,
      animation: animationSystem,
      breakpoints: spacingSystem.breakpoints,
      zIndex: zIndexSystem,
    };
  },
  
  // Generate TypeScript types
  generateTypes: () => {
    return `
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  effects: EffectsTokens;
  animation: AnimationTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
}

export interface ColorTokens {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale & { white: string; black: string };
  semantic: {
    success: SemanticColor;
    warning: SemanticColor;
    error: SemanticColor;
    info: SemanticColor;
  };
  surface: SurfaceColors;
  interactive: InteractiveColors;
  gradients: GradientColors;
}

// ... other interfaces
`;
  },
  
  // Generate Tailwind CSS configuration
  generateTailwindConfig: (theme: 'light' | 'dark' = 'light') => {
    const colors = theme === 'light' ? colorSystem.light : colorSystem.dark;
    
    return {
      theme: {
        extend: {
          colors: {
            primary: {
              50: `var(--color-primary-50, ${colors.primary[50]})`,
              100: `var(--color-primary-100, ${colors.primary[100]})`,
              200: `var(--color-primary-200, ${colors.primary[200]})`,
              300: `var(--color-primary-300, ${colors.primary[300]})`,
              400: `var(--color-primary-400, ${colors.primary[400]})`,
              500: `var(--color-primary-500, ${colors.primary[500]})`,
              600: `var(--color-primary-600, ${colors.primary[600]})`,
              700: `var(--color-primary-700, ${colors.primary[700]})`,
              800: `var(--color-primary-800, ${colors.primary[800]})`,
              900: `var(--color-primary-900, ${colors.primary[900]})`,
              950: `var(--color-primary-950, ${colors.primary[950]})`,
            },
            secondary: {
              50: `var(--color-secondary-50, ${colors.secondary[50]})`,
              100: `var(--color-secondary-100, ${colors.secondary[100]})`,
              200: `var(--color-secondary-200, ${colors.secondary[200]})`,
              300: `var(--color-secondary-300, ${colors.secondary[300]})`,
              400: `var(--color-secondary-400, ${colors.secondary[400]})`,
              500: `var(--color-secondary-500, ${colors.secondary[500]})`,
              600: `var(--color-secondary-600, ${colors.secondary[600]})`,
              700: `var(--color-secondary-700, ${colors.secondary[700]})`,
              800: `var(--color-secondary-800, ${colors.secondary[800]})`,
              900: `var(--color-secondary-900, ${colors.secondary[900]})`,
              950: `var(--color-secondary-950, ${colors.secondary[950]})`,
            },
            // ... other color scales
          },
          fontFamily: {
            display: typographySystem.fontFamily.display.split(', '),
            body: typographySystem.fontFamily.body.split(', '),
            mono: typographySystem.fontFamily.mono.split(', '),
          },
          fontSize: typographySystem.fontSize,
          spacing: spacingSystem.scale,
          borderRadius: effectsSystem.radii,
          boxShadow: effectsSystem.shadows,
          transitionDuration: animationSystem.duration,
          zIndex: zIndexSystem,
        },
      },
    };
  },
  
  // Validate tokens
  validateTokens: () => {
    const errors: string[] = [];
    
    // Validate color contrast
    const checkContrast = (bg: string, fg: string, context: string) => {
      // Implementation would check WCAG contrast ratios
      // This is a placeholder
      return true;
    };
    
    // Validate typography scales
    const checkTypographyScale = () => {
      // Implementation would check for proper scale ratios
      return true;
    };
    
    // Validate spacing consistency
    const checkSpacingConsistency = () => {
      // Implementation would check for proper spacing relationships
      return true;
    };
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Export token utilities
export const tokenUtils = {
  // Get token value by path
  getToken: (path: string, tokens = designTokens) => {
    return path.split('.').reduce((obj, key) => obj?.[key], tokens);
  },
  
  // Set token value by path
  setToken: (path: string, value: any, tokens = designTokens) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], tokens);
    if (target && lastKey) {
      target[lastKey] = value;
    }
  },
  
  // Create theme variant
  createThemeVariant: (overrides: Partial<DesignTokens>) => {
    return {
      ...designTokens,
      ...overrides,
    };
  },
  
  // Convert tokens to CSS variables
  toCSSVariables: (tokens: any, prefix = '--') => {
    const result: { [key: string]: string } = {};
    
    const traverse = (obj: any, path: string[] = []) => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, currentPath);
        } else {
          const varName = prefix + currentPath.join('-');
          result[varName] = String(value);
        }
      });
    };
    
    traverse(tokens);
    return result;
  },
};

// Export all
export { tokenGenerator, tokenUtils };
export default designTokens;