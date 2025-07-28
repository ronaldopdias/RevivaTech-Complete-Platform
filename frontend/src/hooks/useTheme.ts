import { useContext } from 'react';
import { useTheme as useThemeProvider, useThemeValue } from '@/providers/ThemeProvider';

// Re-export the theme hook for convenience
export { useTheme, useThemeValue } from '@/providers/ThemeProvider';

// Additional convenience hooks for common theme values
export function useColors() {
  const { themeConfig } = useThemeProvider();
  return themeConfig?.colors || {};
}

export function useTypography() {
  const { themeConfig } = useThemeProvider();
  return themeConfig?.typography || {};
}

export function useSpacing() {
  const { themeConfig } = useThemeProvider();
  return themeConfig?.spacing || {};
}

export function useEffects() {
  const { themeConfig } = useThemeProvider();
  return themeConfig?.effects || {};
}

export function useLayout() {
  const { themeConfig } = useThemeProvider();
  return themeConfig?.layout || {};
}

// Utility hook to get CSS variable values
export function useCSSVar(variableName: string): string {
  if (typeof window === 'undefined') return '';
  
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName);
  return value.trim();
}

// Hook to set CSS variables dynamically
export function useSetCSSVar() {
  const setCSSVar = (variableName: string, value: string) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    root.style.setProperty(variableName, value);
  };

  return setCSSVar;
}

// Hook for theme-aware styling
export function useThemeStyles() {
  const { resolvedTheme, themeConfig } = useThemeProvider();
  
  const getThemeStyle = (lightValue: any, darkValue: any) => {
    return resolvedTheme === 'dark' ? darkValue : lightValue;
  };

  const getColorByTheme = (colorPath: string) => {
    if (!themeConfig?.colors) return '';
    
    const keys = colorPath.split('.');
    let value: any = themeConfig.colors;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '';
      }
    }
    
    return typeof value === 'string' ? value : '';
  };

  return {
    getThemeStyle,
    getColorByTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}

export default useThemeProvider;