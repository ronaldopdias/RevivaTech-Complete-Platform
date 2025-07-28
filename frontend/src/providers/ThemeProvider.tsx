'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig } from '@/types/config';
import { clientConfigLoader } from '@/lib/config/clientLoader';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig | null;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  loading: boolean;
  error: Error | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  themeName?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  attribute?: string;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  themeName = 'nordic',
  defaultTheme = 'system',
  enableSystem = true,
  attribute = 'data-theme',
  storageKey = 'revivatech-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme configuration
  useEffect(() => {
    const loadThemeConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = await clientConfigLoader.loadThemeConfig(themeName);
        setThemeConfig(config);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load theme');
        setError(error);
        console.error('Theme loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThemeConfig();
  }, [themeName]);

  // Initialize theme from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setTheme(stored as Theme);
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
  }, [storageKey]);

  // Resolve system theme
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    // Set initial resolved theme
    handleChange();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, enableSystem]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (!themeConfig) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(resolvedTheme);
    
    // Set data attribute
    root.setAttribute(attribute, resolvedTheme);

    // Generate and apply CSS variables
    applyCSSVariables(themeConfig, resolvedTheme);
  }, [themeConfig, resolvedTheme, attribute]);

  // Handle theme change
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeConfig,
    resolvedTheme,
    setTheme: handleSetTheme,
    loading,
    error,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to apply CSS variables
function applyCSSVariables(config: ThemeConfig, resolvedTheme: 'light' | 'dark') {
  const root = document.documentElement;
  const isDark = resolvedTheme === 'dark';

  // Colors
  if (config.colors) {
    // Primary colors
    if (config.colors.primary) {
      Object.entries(config.colors.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value);
      });
      root.style.setProperty('--color-primary', config.colors.primary[500]);
    }

    // Secondary colors
    if (config.colors.secondary) {
      Object.entries(config.colors.secondary).forEach(([key, value]) => {
        root.style.setProperty(`--color-secondary-${key}`, value);
      });
      root.style.setProperty('--color-secondary', config.colors.secondary[500]);
    }

    // Neutral colors with theme adaptation
    if (config.colors.neutral) {
      Object.entries(config.colors.neutral).forEach(([key, value]) => {
        root.style.setProperty(`--color-neutral-${key}`, value);
      });

      // Theme-specific neutral assignments
      if (isDark) {
        root.style.setProperty('--color-background', config.colors.neutral[950] || config.colors.neutral[900] || '#1D1D1F');
        root.style.setProperty('--color-foreground', config.colors.neutral[50] || config.colors.neutral[100] || '#F3F4F6');
        root.style.setProperty('--color-muted', config.colors.neutral[800] || config.colors.neutral[900] || '#1F2937');
        root.style.setProperty('--color-muted-foreground', config.colors.neutral[400] || config.colors.neutral[500] || '#9CA3AF');
        root.style.setProperty('--color-border', config.colors.neutral[800] || config.colors.neutral[700] || '#374151');
        root.style.setProperty('--color-input', config.colors.neutral[800] || config.colors.neutral[900] || '#1F2937');
      } else {
        root.style.setProperty('--color-background', config.colors.neutral[50] || '#FFFFFF');
        root.style.setProperty('--color-foreground', config.colors.neutral[900] || config.colors.neutral[800] || '#1D1D1F');
        root.style.setProperty('--color-muted', config.colors.neutral[50] || config.colors.neutral[100] || '#F9FAFB');
        root.style.setProperty('--color-muted-foreground', config.colors.neutral[500] || config.colors.neutral[600] || '#6B7280');
        root.style.setProperty('--color-border', config.colors.neutral[200] || config.colors.neutral[300] || '#E5E7EB');
        root.style.setProperty('--color-input', config.colors.neutral[50] || '#FFFFFF');
      }
    }

    // Semantic colors
    if (config.colors.semantic) {
      Object.entries(config.colors.semantic).forEach(([type, colors]) => {
        Object.entries(colors).forEach(([variant, value]) => {
          root.style.setProperty(`--color-${type}-${variant}`, value as string);
        });
        root.style.setProperty(`--color-${type}`, colors.main);
      });
    }
  }

  // Typography
  if (config.typography) {
    if (config.typography.fonts) {
      Object.entries(config.typography.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value);
      });
    }

    if (config.typography.sizes) {
      Object.entries(config.typography.sizes).forEach(([key, value]) => {
        root.style.setProperty(`--text-${key}`, value);
      });
    }

    if (config.typography.weights) {
      Object.entries(config.typography.weights).forEach(([key, value]) => {
        root.style.setProperty(`--font-weight-${key}`, value.toString());
      });
    }

    if (config.typography.lineHeights) {
      Object.entries(config.typography.lineHeights).forEach(([key, value]) => {
        root.style.setProperty(`--line-height-${key}`, value.toString());
      });
    }

    if (config.typography.letterSpacing) {
      Object.entries(config.typography.letterSpacing).forEach(([key, value]) => {
        root.style.setProperty(`--letter-spacing-${key}`, value);
      });
    }
  }

  // Spacing
  if (config.spacing?.scale) {
    Object.entries(config.spacing.scale).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
  }

  // Effects
  if (config.effects) {
    if (config.effects.shadows) {
      Object.entries(config.effects.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--shadow-${key}`, value);
      });
    }

    if (config.effects.radii) {
      Object.entries(config.effects.radii).forEach(([key, value]) => {
        root.style.setProperty(`--radius-${key}`, value);
      });
    }

    if (config.effects.transitions) {
      Object.entries(config.effects.transitions).forEach(([key, value]) => {
        root.style.setProperty(`--transition-${key}`, value);
      });
    }

    if (config.effects.blurs) {
      Object.entries(config.effects.blurs).forEach(([key, value]) => {
        root.style.setProperty(`--blur-${key}`, value);
      });
    }
  }

  // Layout
  if (config.layout) {
    if (config.layout.breakpoints) {
      Object.entries(config.layout.breakpoints).forEach(([key, value]) => {
        root.style.setProperty(`--breakpoint-${key}`, value);
      });
    }

    if (config.layout.container) {
      root.style.setProperty('--container-max-width', config.layout.container.maxWidth);
      
      if (config.layout.container.padding) {
        Object.entries(config.layout.container.padding).forEach(([key, value]) => {
          root.style.setProperty(`--container-padding-${key}`, value);
        });
      }
    }

    if (config.layout.grid) {
      root.style.setProperty('--grid-columns', config.layout.grid.columns.toString());
      root.style.setProperty('--grid-gap', config.layout.grid.gap);
    }
  }
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get specific theme values
export function useThemeValue<T = string>(path: string): T | undefined {
  const { themeConfig } = useTheme();
  if (!themeConfig) return undefined;

  const keys = path.split('.');
  let value: any = themeConfig;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value as T;
}

export default ThemeProvider;