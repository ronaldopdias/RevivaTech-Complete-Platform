/**
 * Performance-Optimized Theme Provider v2
 * 
 * Enhanced theme provider with performance monitoring integration,
 * CSS optimization, critical path rendering, and advanced theme management.
 * 
 * Features:
 * - Integration with existing performance monitoring
 * - CSS critical path optimization
 * - Runtime performance tracking
 * - Bundle size optimization
 * - Theme preloading and lazy loading
 * - Memory usage optimization
 * - Real-time performance metrics
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useRef,
  startTransition,
} from 'react';
import { nordicTheme } from '@/config/theme/nordic.theme';
import { revivaTechBrandTheme } from '@/config/theme/revivatech-brand.theme';
import { revivaTechBrandThemeV2 } from '@/config/theme/revivatech-brand-v2.theme';
import { ThemeProviderProps, ThemeContextType, ThemeMode } from '@/types/brand-theme';

// Performance monitoring integration
interface PerformanceMetrics {
  themeLoadTime: number;
  cssGenerationTime: number;
  renderTime: number;
  memoryUsage?: number;
  bundleImpact: number;
}

interface PerformanceThemeContextType extends ThemeContextType {
  metrics: PerformanceMetrics;
  preloadTheme: (theme: ThemeMode) => Promise<void>;
  optimizeCSS: () => void;
  getCriticalCSS: () => string;
}

// Extended theme modes
export type ExtendedThemeMode = 'nordic' | 'revivatech-brand' | 'revivatech-brand-v2';

// Theme context with performance tracking
const PerformanceThemeContext = createContext<PerformanceThemeContextType | undefined>(undefined);

// Theme configurations with lazy loading support
const themeConfigs = {
  nordic: nordicTheme,
  'revivatech-brand': revivaTechBrandTheme,
  'revivatech-brand-v2': revivaTechBrandThemeV2,
} as const;

// Critical CSS cache for performance
const criticalCSSCache = new Map<ExtendedThemeMode, string>();

// Performance metrics collector
class ThemePerformanceCollector {
  private metrics: PerformanceMetrics = {
    themeLoadTime: 0,
    cssGenerationTime: 0,
    renderTime: 0,
    bundleImpact: 0,
  };

  startTimer(operation: keyof PerformanceMetrics): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.metrics[operation] = endTime - startTime;
    };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateMetrics(updates: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }

  // Integration with existing performance monitoring
  reportToPerformanceMonitor(): void {
    if (typeof window !== 'undefined' && window.performance) {
      // Report to existing performance monitoring system
      try {
        // Custom performance marks for theme operations
        performance.mark('theme-load-start');
        performance.mark('theme-load-end');
        performance.measure('theme-load-duration', 'theme-load-start', 'theme-load-end');
        
        // Send metrics to performance monitoring dashboard
        if ('sendBeacon' in navigator) {
          const metricsData = JSON.stringify({
            type: 'theme-performance',
            metrics: this.metrics,
            timestamp: Date.now(),
          });
          
          navigator.sendBeacon('/api/performance/theme', metricsData);
        }
      } catch (error) {
        console.warn('Failed to report theme performance metrics:', error);
      }
    }
  }
}

// CSS optimization utilities
class CSSOptimizer {
  private static usedClasses = new Set<string>();
  private static criticalSelectors = new Set<string>();

  static trackUsage(className: string): void {
    this.usedClasses.add(className);
  }

  static markCritical(selector: string): void {
    this.criticalSelectors.add(selector);
  }

  static generateCriticalCSS(theme: ExtendedThemeMode): string {
    const cached = criticalCSSCache.get(theme);
    if (cached) return cached;

    const themeConfig = themeConfigs[theme];
    const criticalStyles = this.extractCriticalStyles(themeConfig);
    
    criticalCSSCache.set(theme, criticalStyles);
    return criticalStyles;
  }

  private static extractCriticalStyles(themeConfig: any): string {
    const styles: string[] = [];
    
    // Extract critical color variables
    if (themeConfig.colors) {
      styles.push(':root {');
      
      // Primary colors (critical for initial render)
      Object.entries(themeConfig.colors.primary).forEach(([shade, value]) => {
        styles.push(`  --primary-${shade}: ${value};`);
      });
      
      // Secondary colors
      Object.entries(themeConfig.colors.secondary).forEach(([shade, value]) => {
        styles.push(`  --secondary-${shade}: ${value};`);
      });
      
      // Neutral colors (critical for text and backgrounds)
      Object.entries(themeConfig.colors.neutral).forEach(([shade, value]) => {
        styles.push(`  --neutral-${shade}: ${value};`);
      });
      
      // Semantic colors
      Object.entries(themeConfig.colors.semantic).forEach(([name, colorConfig]) => {
        if (typeof colorConfig === 'object') {
          Object.entries(colorConfig).forEach(([variant, value]) => {
            if (typeof value === 'string') {
              styles.push(`  --${name}-${variant}: ${value};`);
            }
          });
        }
      });
      
      styles.push('}');
    }
    
    // Critical typography styles
    if (themeConfig.typography) {
      styles.push(`
        body {
          font-family: ${themeConfig.typography.fonts.body};
          line-height: ${themeConfig.typography.lineHeights.normal};
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: ${themeConfig.typography.fonts.heading};
          line-height: ${themeConfig.typography.lineHeights.tight};
        }
      `);
    }
    
    // Critical layout styles
    styles.push(`
      .container {
        max-width: ${themeConfig.layout?.container?.maxWidth || '1280px'};
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      @media (min-width: 640px) {
        .container {
          padding: 0 1.5rem;
        }
      }
      
      @media (min-width: 1024px) {
        .container {
          padding: 0 2rem;
        }
      }
    `);
    
    return styles.join('\n');
  }

  static removeUnusedCSS(): void {
    // Remove unused CSS classes from the document
    if (typeof document !== 'undefined') {
      const styleSheets = Array.from(document.styleSheets);
      
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          
          rules.forEach((rule, index) => {
            if (rule.type === CSSRule.STYLE_RULE) {
              const styleRule = rule as CSSStyleRule;
              const selector = styleRule.selectorText;
              
              // Check if selector is used
              const isUsed = Array.from(this.usedClasses).some(className => 
                selector.includes(className)
              );
              
              if (!isUsed && !this.criticalSelectors.has(selector)) {
                sheet.deleteRule(index);
              }
            }
          });
        } catch (error) {
          // Skip cross-origin stylesheets
          console.warn('Cannot access stylesheet rules:', error);
        }
      });
    }
  }
}

// Theme preloader for performance optimization
class ThemePreloader {
  private static preloadedThemes = new Set<ExtendedThemeMode>();
  private static preloadPromises = new Map<ExtendedThemeMode, Promise<void>>();

  static async preload(theme: ExtendedThemeMode): Promise<void> {
    if (this.preloadedThemes.has(theme)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(theme)) {
      return this.preloadPromises.get(theme)!;
    }

    const preloadPromise = this.doPreload(theme);
    this.preloadPromises.set(theme, preloadPromise);
    
    return preloadPromise;
  }

  private static async doPreload(theme: ExtendedThemeMode): Promise<void> {
    try {
      const startTime = performance.now();
      
      // Preload theme configuration
      const themeConfig = themeConfigs[theme];
      
      // Generate and cache critical CSS
      const criticalCSS = CSSOptimizer.generateCriticalCSS(theme);
      
      // Preload theme-specific assets if any
      await this.preloadThemeAssets(themeConfig);
      
      this.preloadedThemes.add(theme);
      
      const loadTime = performance.now() - startTime;
      console.debug(`Theme ${theme} preloaded in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error(`Failed to preload theme ${theme}:`, error);
    }
  }

  private static async preloadThemeAssets(themeConfig: any): Promise<void> {
    // Preload fonts if specified
    if (themeConfig.typography?.fonts) {
      const fontPromises = Object.values(themeConfig.typography.fonts).map(async (fontFamily: any) => {
        if (typeof fontFamily === 'string' && fontFamily.includes('url(')) {
          // Extract font URLs and preload them
          const fontUrls = fontFamily.match(/url\([^)]+\)/g);
          if (fontUrls) {
            return Promise.all(
              fontUrls.map(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'font';
                link.href = url.slice(4, -1); // Remove 'url(' and ')'
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
                
                return new Promise(resolve => {
                  link.onload = resolve;
                  link.onerror = resolve; // Continue even if font fails to load
                });
              })
            );
          }
        }
      });
      
      await Promise.all(fontPromises.filter(Boolean));
    }
  }
}

// Memory optimization utilities
class MemoryOptimizer {
  private static cleanupTasks: (() => void)[] = [];

  static addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
  }

  static optimizeMemory(): void {
    // Clear unused theme caches
    if (criticalCSSCache.size > 3) {
      const entries = Array.from(criticalCSSCache.entries());
      const leastUsed = entries.slice(0, entries.length - 2);
      leastUsed.forEach(([theme]) => criticalCSSCache.delete(theme));
    }

    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }
}

// Enhanced theme provider component
export function PerformanceThemeProvider({ 
  children, 
  defaultTheme = 'nordic',
  storageKey = 'revivatech-theme-v2',
  enablePerformanceTracking = true,
  enableCSSOptimization = true,
}: ThemeProviderProps & {
  enablePerformanceTracking?: boolean;
  enableCSSOptimization?: boolean;
}) {
  const [theme, setThemeState] = useState<ExtendedThemeMode>(defaultTheme as ExtendedThemeMode);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const performanceCollector = useRef(new ThemePerformanceCollector());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    themeLoadTime: 0,
    cssGenerationTime: 0,
    renderTime: 0,
    bundleImpact: 0,
  });

  // Performance monitoring integration
  useEffect(() => {
    if (enablePerformanceTracking && typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('theme')) {
            performanceCollector.current.updateMetrics({
              themeLoadTime: entry.duration,
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
      
      return () => observer.disconnect();
    }
  }, [enablePerformanceTracking]);

  // Memory usage monitoring
  useEffect(() => {
    if (enablePerformanceTracking && 'memory' in performance) {
      const updateMemoryMetrics = () => {
        const memInfo = (performance as any).memory;
        performanceCollector.current.updateMetrics({
          memoryUsage: memInfo.usedJSHeapSize,
        });
      };
      
      updateMemoryMetrics();
      const interval = setInterval(updateMemoryMetrics, 5000);
      
      return () => clearInterval(interval);
    }
  }, [enablePerformanceTracking]);

  // Initialize theme from localStorage
  useEffect(() => {
    const initTimer = performanceCollector.current.startTimer('themeLoadTime');
    
    setIsMounted(true);
    
    try {
      const savedTheme = localStorage.getItem(storageKey) as ExtendedThemeMode;
      const validThemes: ExtendedThemeMode[] = ['nordic', 'revivatech-brand', 'revivatech-brand-v2'];
      
      if (savedTheme && validThemes.includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    } finally {
      setIsLoading(false);
      initTimer();
    }
  }, [storageKey]);

  // Optimized CSS custom properties update
  const updateCSSVariables = useCallback((newTheme: ExtendedThemeMode) => {
    const cssTimer = performanceCollector.current.startTimer('cssGenerationTime');
    
    const themeConfig = themeConfigs[newTheme];
    const root = document.documentElement;

    // Use batch updates for better performance
    startTransition(() => {
      // Clear existing theme classes
      root.classList.remove('theme-nordic', 'theme-revivatech-brand', 'theme-revivatech-brand-v2');
      
      // Add new theme class
      root.classList.add(`theme-${newTheme}`);

      // Batch CSS custom property updates
      const updates: [string, string][] = [];

      // Colors
      const { colors, effects, typography, spacing } = themeConfig;

      // Primary colors
      Object.entries(colors.primary).forEach(([shade, value]) => {
        updates.push([`--primary-${shade}`, value]);
      });

      // Secondary colors
      Object.entries(colors.secondary).forEach(([shade, value]) => {
        updates.push([`--secondary-${shade}`, value]);
      });

      // Accent/neutral colors
      if (colors.accent) {
        Object.entries(colors.accent).forEach(([shade, value]) => {
          updates.push([`--accent-${shade}`, value]);
        });
      }

      if (colors.neutral) {
        Object.entries(colors.neutral).forEach(([shade, value]) => {
          updates.push([`--neutral-${shade}`, value]);
        });
      }

      // Semantic colors
      Object.entries(colors.semantic).forEach(([name, colorConfig]) => {
        if (typeof colorConfig === 'object') {
          Object.entries(colorConfig).forEach(([variant, value]) => {
            if (typeof value === 'string') {
              updates.push([`--${name}-${variant}`, value]);
            }
          });
        }
      });

      // Effects
      Object.entries(effects.shadows).forEach(([name, value]) => {
        updates.push([`--shadow-${name}`, value]);
      });

      Object.entries(effects.radii).forEach(([name, value]) => {
        updates.push([`--radius-${name}`, value]);
      });

      Object.entries(effects.transitions).forEach(([name, value]) => {
        updates.push([`--transition-${name}`, value]);
      });

      // Gradients (if available)
      if (effects.gradients) {
        Object.entries(effects.gradients).forEach(([name, value]) => {
          updates.push([`--gradient-${name}`, value]);
        });
      }

      // Typography
      updates.push(['--font-heading', typography.fonts.heading]);
      updates.push(['--font-body', typography.fonts.body]);
      updates.push(['--font-mono', typography.fonts.mono]);

      // Fluid typography (if available)
      if ('fluidSizes' in typography) {
        Object.entries(typography.fluidSizes).forEach(([size, value]) => {
          updates.push([`--text-${size}`, value]);
        });
      }

      // Spacing
      updates.push(['--spacing-base', `${spacing.base}px`]);

      // Apply all updates in a single batch
      requestAnimationFrame(() => {
        updates.forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
        
        cssTimer();
        
        // Track CSS usage if optimization is enabled
        if (enableCSSOptimization) {
          updates.forEach(([property]) => {
            CSSOptimizer.trackUsage(property);
          });
        }
      });
    });
  }, [enableCSSOptimization]);

  // Enhanced theme setting with performance tracking
  const setTheme = useCallback((newTheme: ExtendedThemeMode) => {
    const renderTimer = performanceCollector.current.startTimer('renderTime');
    
    startTransition(() => {
      setThemeState(newTheme);
      
      // Update CSS variables
      updateCSSVariables(newTheme);
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
      
      // Update metrics
      const currentMetrics = performanceCollector.current.getMetrics();
      setMetrics(currentMetrics);
      
      // Report to performance monitoring
      if (enablePerformanceTracking) {
        performanceCollector.current.reportToPerformanceMonitor();
      }
      
      renderTimer();
    });
  }, [storageKey, updateCSSVariables, enablePerformanceTracking]);

  // Theme toggling with smart cycling
  const toggleTheme = useCallback(() => {
    const themes: ExtendedThemeMode[] = ['nordic', 'revivatech-brand', 'revivatech-brand-v2'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // Theme preloading
  const preloadTheme = useCallback(async (targetTheme: ExtendedThemeMode) => {
    await ThemePreloader.preload(targetTheme);
  }, []);

  // CSS optimization
  const optimizeCSS = useCallback(() => {
    if (enableCSSOptimization) {
      CSSOptimizer.removeUnusedCSS();
      MemoryOptimizer.optimizeMemory();
    }
  }, [enableCSSOptimization]);

  // Get critical CSS for current theme
  const getCriticalCSS = useCallback(() => {
    return CSSOptimizer.generateCriticalCSS(theme);
  }, [theme]);

  // Apply theme on mount and changes
  useEffect(() => {
    if (isMounted) {
      updateCSSVariables(theme);
      
      // Preload adjacent themes for faster switching
      const themes: ExtendedThemeMode[] = ['nordic', 'revivatech-brand', 'revivatech-brand-v2'];
      const currentIndex = themes.indexOf(theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      
      ThemePreloader.preload(nextTheme).catch(console.warn);
    }
  }, [theme, isMounted, updateCSSVariables]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      MemoryOptimizer.cleanup();
    };
  }, []);

  // Memoized context value for performance
  const contextValue = useMemo<PerformanceThemeContextType>(() => ({
    theme: theme as ThemeMode,
    setTheme: setTheme as (theme: ThemeMode) => void,
    toggleTheme,
    isLoading,
    metrics,
    preloadTheme,
    optimizeCSS,
    getCriticalCSS,
  }), [theme, setTheme, toggleTheme, isLoading, metrics, preloadTheme, optimizeCSS, getCriticalCSS]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <PerformanceThemeContext.Provider value={contextValue}>
      {children}
    </PerformanceThemeContext.Provider>
  );
}

// Enhanced theme hook with performance features
export function usePerformanceTheme(): PerformanceThemeContextType {
  const context = useContext(PerformanceThemeContext);
  
  if (context === undefined) {
    throw new Error('usePerformanceTheme must be used within a PerformanceThemeProvider');
  }
  
  return context;
}

// Legacy compatibility hook
export function useTheme(): ThemeContextType {
  const context = usePerformanceTheme();
  
  return {
    theme: context.theme,
    setTheme: context.setTheme,
    toggleTheme: context.toggleTheme,
    isLoading: context.isLoading,
  };
}

// Hook to get current theme configuration with performance tracking
export function useThemeConfig() {
  const { theme } = usePerformanceTheme();
  
  return useMemo(() => {
    const config = themeConfigs[theme as ExtendedThemeMode];
    
    // Track theme config access for optimization
    CSSOptimizer.trackUsage(`theme-config-${theme}`);
    
    return config;
  }, [theme]);
}

// Enhanced utility functions with performance optimization
export function getColorValue(colorPath: string, themeMode?: ExtendedThemeMode): string {
  const currentTheme = themeMode || 'nordic';
  const themeConfig = themeConfigs[currentTheme];
  
  const parts = colorPath.split('.');
  let value: any = themeConfig.colors;
  
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return '#000000'; // Fallback color
    }
  }
  
  // Track color usage for optimization
  CSSOptimizer.trackUsage(`color-${colorPath}`);
  
  return typeof value === 'string' ? value : '#000000';
}

export function getComponentConfig(componentName: string, variant: string = 'default', themeMode?: ExtendedThemeMode): any {
  const currentTheme = themeMode || 'nordic';
  const themeConfig = themeConfigs[currentTheme];
  
  if (themeConfig.components && themeConfig.components[componentName]) {
    const componentConfig = themeConfig.components[componentName];
    const result = componentConfig.variants && componentConfig.variants[variant] 
      ? componentConfig.variants[variant]
      : componentConfig.variants?.default || {};
    
    // Track component config usage
    CSSOptimizer.trackUsage(`component-${componentName}-${variant}`);
    
    return result;
  }
  
  return {};
}

// Performance monitoring utilities
export const themePerformanceUtils = {
  // Get current performance metrics
  getMetrics: (): PerformanceMetrics => {
    const context = usePerformanceTheme();
    return context.metrics;
  },
  
  // Force CSS optimization
  optimizeNow: (): void => {
    CSSOptimizer.removeUnusedCSS();
    MemoryOptimizer.optimizeMemory();
  },
  
  // Get critical CSS for SSR
  getCriticalCSS: (theme: ExtendedThemeMode): string => {
    return CSSOptimizer.generateCriticalCSS(theme);
  },
  
  // Preload themes for faster switching
  preloadThemes: async (themes: ExtendedThemeMode[]): Promise<void> => {
    await Promise.all(themes.map(theme => ThemePreloader.preload(theme)));
  },
};

// Export theme configurations for external use
export { themeConfigs as performanceThemeConfigs };

// Export types
export type { ExtendedThemeMode, PerformanceMetrics, PerformanceThemeContextType };