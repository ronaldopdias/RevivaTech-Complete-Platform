/**
 * Design System V2 - Color Token System
 * Enhanced color palette with comprehensive theming and accessibility
 */

export interface ColorScale {
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

export interface SemanticColor {
  light: string;
  main: string;
  dark: string;
  contrast: string;
}

export interface ColorTokens {
  // Brand Colors
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  
  // Neutral Colors
  neutral: ColorScale & {
    white: string;
    black: string;
  };
  
  // Semantic Colors
  semantic: {
    success: SemanticColor;
    warning: SemanticColor;
    error: SemanticColor;
    info: SemanticColor;
  };
  
  // Surface Colors
  surface: {
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
  };
  
  // Interactive Colors
  interactive: {
    hover: string;
    active: string;
    focus: string;
    disabled: string;
    disabledForeground: string;
  };
  
  // Gradients
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    hero: string;
    glass: string;
  };
}

// Light theme colors
export const lightColors: ColorTokens = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
    white: '#ffffff',
    black: '#000000',
  },
  semantic: {
    success: {
      light: '#dcfce7',
      main: '#16a34a',
      dark: '#15803d',
      contrast: '#ffffff',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
      contrast: '#ffffff',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
      contrast: '#ffffff',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#2563eb',
      contrast: '#ffffff',
    },
  },
  surface: {
    background: '#ffffff',
    foreground: '#1c1917',
    muted: '#fafaf9',
    mutedForeground: '#57534e',
    border: '#e7e5e4',
    input: '#ffffff',
    ring: '#6366f1',
    card: '#ffffff',
    cardForeground: '#1c1917',
    popover: '#ffffff',
    popoverForeground: '#1c1917',
  },
  interactive: {
    hover: '#f5f5f4',
    active: '#e7e5e4',
    focus: '#6366f1',
    disabled: '#d6d3d1',
    disabledForeground: '#a8a29e',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    accent: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    success: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  },
};

// Dark theme colors
export const darkColors: ColorTokens = {
  primary: {
    50: '#1e1b4b',
    100: '#312e81',
    200: '#3730a3',
    300: '#4338ca',
    400: '#4f46e5',
    500: '#6366f1',
    600: '#818cf8',
    700: '#a5b4fc',
    800: '#c7d2fe',
    900: '#e0e7ff',
    950: '#eef2ff',
  },
  secondary: {
    50: '#3b0764',
    100: '#581c87',
    200: '#6b21a8',
    300: '#7c3aed',
    400: '#9333ea',
    500: '#a855f7',
    600: '#c084fc',
    700: '#d8b4fe',
    800: '#e9d5ff',
    900: '#f3e8ff',
    950: '#faf5ff',
  },
  accent: {
    50: '#500724',
    100: '#831843',
    200: '#9d174d',
    300: '#be185d',
    400: '#db2777',
    500: '#ec4899',
    600: '#f472b6',
    700: '#f9a8d4',
    800: '#fbcfe8',
    900: '#fce7f3',
    950: '#fdf2f8',
  },
  neutral: {
    50: '#0c0a09',
    100: '#1c1917',
    200: '#292524',
    300: '#44403c',
    400: '#57534e',
    500: '#78716c',
    600: '#a8a29e',
    700: '#d6d3d1',
    800: '#e7e5e4',
    900: '#f5f5f4',
    950: '#fafaf9',
    white: '#ffffff',
    black: '#000000',
  },
  semantic: {
    success: {
      light: '#052e16',
      main: '#16a34a',
      dark: '#dcfce7',
      contrast: '#ffffff',
    },
    warning: {
      light: '#451a03',
      main: '#f59e0b',
      dark: '#fef3c7',
      contrast: '#ffffff',
    },
    error: {
      light: '#450a0a',
      main: '#ef4444',
      dark: '#fee2e2',
      contrast: '#ffffff',
    },
    info: {
      light: '#172554',
      main: '#3b82f6',
      dark: '#dbeafe',
      contrast: '#ffffff',
    },
  },
  surface: {
    background: '#0c0a09',
    foreground: '#fafaf9',
    muted: '#1c1917',
    mutedForeground: '#a8a29e',
    border: '#292524',
    input: '#1c1917',
    ring: '#6366f1',
    card: '#1c1917',
    cardForeground: '#fafaf9',
    popover: '#1c1917',
    popoverForeground: '#fafaf9',
  },
  interactive: {
    hover: '#292524',
    active: '#44403c',
    focus: '#6366f1',
    disabled: '#57534e',
    disabledForeground: '#78716c',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    accent: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    success: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glass: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%)',
  },
};

// Color utility functions
export const colorUtils = {
  // Get color with opacity
  alpha: (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Check if color is light or dark
  isLight: (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  },
  
  // Get contrasting color
  getContrastColor: (color: string) => {
    return colorUtils.isLight(color) ? '#000000' : '#ffffff';
  },
  
  // Get accessible color combination
  getAccessiblePair: (bg: string, fg: string) => {
    const bgLuminance = colorUtils.getLuminance(bg);
    const fgLuminance = colorUtils.getLuminance(fg);
    const contrast = (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);
    
    return {
      background: bg,
      foreground: fg,
      contrast,
      isAccessible: contrast >= 4.5, // WCAG AA standard
    };
  },
  
  // Get luminance for contrast calculation
  getLuminance: (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
  },
};

// Export default color system
export const colorSystem = {
  light: lightColors,
  dark: darkColors,
  utils: colorUtils,
};

export default colorSystem;