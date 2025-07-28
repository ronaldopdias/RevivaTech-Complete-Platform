/**
 * Enhanced Theme Provider
 * 
 * This component provides theme management capabilities for RevivaTech,
 * supporting both Nordic and Brand themes with smooth transitions and persistence.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { nordicTheme } from '@/config/theme/nordic.theme';
import { revivaTechBrandTheme } from '@/config/theme/revivatech-brand.theme';
import { ThemeProviderProps, ThemeContextType, ThemeMode } from '@/types/brand-theme';

// Theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme configurations
const themes = {
  nordic: nordicTheme,
  'revivatech-brand': revivaTechBrandTheme,
} as const;

// Theme provider component
export function ThemeProvider({ 
  children, 
  defaultTheme = 'nordic',
  storageKey = 'revivatech-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    
    try {
      const savedTheme = localStorage.getItem(storageKey) as ThemeMode;
      if (savedTheme && (savedTheme === 'nordic' || savedTheme === 'revivatech-brand')) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Update CSS custom properties when theme changes
  const updateCSSVariables = useCallback((newTheme: ThemeMode) => {
    const themeConfig = themes[newTheme];
    const root = document.documentElement;

    // Clear existing theme variables
    root.classList.remove('theme-nordic', 'theme-revivatech-brand');
    
    // Add new theme class
    root.classList.add(`theme-${newTheme}`);

    // Update CSS custom properties
    const { colors, effects, spacing, typography } = themeConfig;

    // Primary colors
    Object.entries(colors.primary).forEach(([shade, value]) => {
      root.style.setProperty(`--primary-${shade}`, value);
    });

    // Secondary colors
    Object.entries(colors.secondary).forEach(([shade, value]) => {
      root.style.setProperty(`--secondary-${shade}`, value);
    });

    // Accent colors
    if (colors.accent) {
      Object.entries(colors.accent).forEach(([shade, value]) => {
        root.style.setProperty(`--accent-${shade}`, value);
      });
    }

    // Neutral colors
    Object.entries(colors.neutral).forEach(([shade, value]) => {
      root.style.setProperty(`--neutral-${shade}`, value);
    });

    // Semantic colors
    Object.entries(colors.semantic).forEach(([name, colorConfig]) => {
      root.style.setProperty(`--${name}-light`, colorConfig.light);
      root.style.setProperty(`--${name}-main`, colorConfig.main);
      root.style.setProperty(`--${name}-dark`, colorConfig.dark);
      root.style.setProperty(`--${name}-contrast`, colorConfig.contrast);
    });

    // Shadows
    Object.entries(effects.shadows).forEach(([name, value]) => {
      root.style.setProperty(`--shadow-${name}`, value);
    });

    // Border radius
    Object.entries(effects.radii).forEach(([name, value]) => {
      root.style.setProperty(`--radius-${name}`, value);
    });

    // Transitions
    Object.entries(effects.transitions).forEach(([name, value]) => {
      root.style.setProperty(`--transition-${name}`, value);
    });

    // Gradients (if available)
    if (effects.gradients) {
      Object.entries(effects.gradients).forEach(([name, value]) => {
        root.style.setProperty(`--gradient-${name}`, value);
      });
    }

    // Typography
    root.style.setProperty('--font-heading', typography.fonts.heading);
    root.style.setProperty('--font-body', typography.fonts.body);
    root.style.setProperty('--font-mono', typography.fonts.mono);

    // Spacing base
    root.style.setProperty('--spacing-base', `${spacing.base}px`);

    // Trigger CSS transition
    root.style.setProperty('--theme-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  }, []);

  // Set theme with persistence and CSS updates
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    
    // Update CSS variables
    updateCSSVariables(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [storageKey, updateCSSVariables]);

  // Toggle between themes
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'nordic' ? 'revivatech-brand' : 'nordic';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Apply theme on mount and changes
  useEffect(() => {
    if (isMounted) {
      updateCSSVariables(theme);
    }
  }, [theme, isMounted, updateCSSVariables]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Hook to get current theme configuration
export function useThemeConfig() {
  const { theme } = useTheme();
  return themes[theme];
}

// Utility function to get color value from theme
export function getColorValue(colorPath: string, themeMode?: ThemeMode): string {
  const currentTheme = themeMode || 'nordic';
  const themeConfig = themes[currentTheme];
  
  const parts = colorPath.split('.');
  let value: any = themeConfig.colors;
  
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return '#000000'; // Fallback color
    }
  }
  
  return typeof value === 'string' ? value : '#000000';
}

// Utility function to get component configuration
export function getComponentConfig(componentName: string, variant: string = 'default', themeMode?: ThemeMode): any {
  const currentTheme = themeMode || 'nordic';
  const themeConfig = themes[currentTheme];
  
  if (themeConfig.components && themeConfig.components[componentName]) {
    const componentConfig = themeConfig.components[componentName];
    return componentConfig.variants && componentConfig.variants[variant] 
      ? componentConfig.variants[variant]
      : componentConfig.variants?.default || {};
  }
  
  return {};
}

// Utility function to validate theme
export function validateTheme(theme: any): boolean {
  const requiredKeys = ['name', 'colors', 'typography', 'spacing', 'layout', 'effects'];
  
  for (const key of requiredKeys) {
    if (!theme[key]) {
      console.warn(`Theme validation failed: missing required key '${key}'`);
      return false;
    }
  }
  
  // Validate colors structure
  const requiredColorKeys = ['primary', 'secondary', 'neutral', 'semantic'];
  for (const key of requiredColorKeys) {
    if (!theme.colors[key]) {
      console.warn(`Theme validation failed: missing required color key '${key}'`);
      return false;
    }
  }
  
  return true;
}

// Utility function to generate CSS variables
export function generateCSSVariables(theme: any): string {
  const variables: string[] = [];
  
  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([colorName, colorConfig]: [string, any]) => {
      if (typeof colorConfig === 'object' && colorConfig !== null) {
        Object.entries(colorConfig).forEach(([shade, value]) => {
          if (typeof value === 'string') {
            variables.push(`--${colorName}-${shade}: ${value};`);
          } else if (typeof value === 'object' && value !== null) {
            // Handle semantic colors
            Object.entries(value).forEach(([semanticKey, semanticValue]) => {
              if (typeof semanticValue === 'string') {
                variables.push(`--${colorName}-${shade}-${semanticKey}: ${semanticValue};`);
              }
            });
          }
        });
      }
    });
  }
  
  // Effects
  if (theme.effects) {
    Object.entries(theme.effects).forEach(([effectType, effectConfig]: [string, any]) => {
      if (typeof effectConfig === 'object' && effectConfig !== null) {
        Object.entries(effectConfig).forEach(([effectName, effectValue]) => {
          if (typeof effectValue === 'string') {
            variables.push(`--${effectType}-${effectName}: ${effectValue};`);
          }
        });
      }
    });
  }
  
  // Typography
  if (theme.typography) {
    Object.entries(theme.typography.fonts).forEach(([fontType, fontValue]) => {
      if (typeof fontValue === 'string') {
        variables.push(`--font-${fontType}: ${fontValue};`);
      }
    });
  }
  
  // Spacing
  if (theme.spacing) {
    variables.push(`--spacing-base: ${theme.spacing.base}px;`);
  }
  
  return `:root {\n  ${variables.join('\n  ')}\n}`;
}

// Theme utilities object
export const themeUtils = {
  getColorValue,
  getComponentConfig,
  validateTheme,
  generateCSSVariables,
};

// Export theme configurations
export { themes };

// Export types
export type { ThemeMode, ThemeContextType, ThemeProviderProps };