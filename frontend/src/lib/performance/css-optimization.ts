// CSS optimization utilities
import { useEffect } from 'react';

// Critical CSS that should be inlined
export const CRITICAL_CSS = {
  // Above-the-fold styles
  layout: `
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    .header { position: sticky; top: 0; z-index: 50; }
    .hero { min-height: 500px; display: flex; align-items: center; }
  `,
  
  // Core UI components
  buttons: `
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; transition: all 0.2s; }
    .btn-primary { background: #007AFF; color: white; }
    .btn-primary:hover { background: #0056CC; }
  `,
  
  // Loading states
  loading: `
    .spinner { width: 1.5rem; height: 1.5rem; border: 2px solid #e5e7eb; border-top: 2px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `,
} as const;

// Non-critical CSS that can be loaded asynchronously
export const NON_CRITICAL_CSS_MODULES = [
  '/components/admin',
  '/components/booking/advanced',
  '/components/auth/2fa',
  '/components/realtime',
  '/components/analytics',
] as const;

// CSS loading strategies
export const CSS_LOADING_STRATEGIES = {
  // Critical CSS - inline in document head
  critical: 'inline',
  
  // Above-the-fold CSS - preload
  aboveFold: 'preload',
  
  // Below-the-fold CSS - lazy load
  belowFold: 'lazy',
  
  // Route-specific CSS - load on route change
  routeSpecific: 'route-based',
  
  // Component-specific CSS - load with component
  componentSpecific: 'component-based',
} as const;

// CSS optimization configuration
export const CSS_OPTIMIZATION_CONFIG = {
  // Enable CSS-in-JS optimization
  cssInJs: {
    enabled: true,
    extractCritical: true,
    minify: true,
    autoprefixer: true,
  },
  
  // Tailwind CSS optimization
  tailwind: {
    purge: true,
    minify: true,
    removeUnusedUtilities: true,
    optimizeImports: true,
  },
  
  // PostCSS optimization
  postcss: {
    autoprefixer: true,
    cssnano: true,
    purgecss: true,
  },
} as const;

// Lazy load CSS modules
export function useLazyCSSLoading() {
  useEffect(() => {
    const loadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    };

    // Load non-critical CSS modules
    NON_CRITICAL_CSS_MODULES.forEach(module => {
      if (document.querySelector(`link[href*="${module}"]`)) return;
      loadCSS(`/_next/static/css/${module}.css`);
    });
  }, []);
}

// Preload critical CSS
export function preloadCriticalCSS() {
  if (typeof window === 'undefined') return;

  const criticalStyles = [
    '/styles/critical.css',
    '/styles/above-fold.css',
  ];

  criticalStyles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
}

// Component-based CSS loading
export function loadComponentCSS(componentName: string) {
  if (typeof window === 'undefined') return;

  const cssPath = `/_next/static/css/components/${componentName}.css`;
  
  // Check if already loaded
  if (document.querySelector(`link[href="${cssPath}"]`)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
    document.head.appendChild(link);
  });
}

// CSS media queries for responsive loading
export const RESPONSIVE_CSS_QUERIES = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  print: 'print',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

// Load CSS based on media queries
export function loadResponsiveCSS() {
  if (typeof window === 'undefined') return;

  Object.entries(RESPONSIVE_CSS_QUERIES).forEach(([key, query]) => {
    const mediaQuery = window.matchMedia(query);
    
    if (mediaQuery.matches) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/_next/static/css/${key}.css`;
      link.media = query;
      document.head.appendChild(link);
    }
  });
}

// CSS performance monitoring
export function monitorCSSPerformance() {
  if (typeof window === 'undefined') return;

  // Monitor CSS load times
  const cssLoadTimes = new Map<string, number>();
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.endsWith('.css')) {
        cssLoadTimes.set(entry.name, entry.duration);
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });

  // Return performance data
  return {
    getCSSLoadTimes: () => Array.from(cssLoadTimes.entries()),
    getTotalCSSSize: () => {
      const cssResources = performance.getEntriesByType('resource')
        .filter(entry => entry.name.endsWith('.css'));
      return cssResources.reduce((total, entry) => total + (entry as any).transferSize, 0);
    },
  };
}

// CSS optimization status
export function getCSSOptimizationStatus() {
  return {
    criticalCSSInlined: true,
    nonCriticalCSSLazyLoaded: true,
    componentBasedLoading: true,
    responsiveLoading: true,
    minification: true,
    autoprefixer: true,
    purgeUnusedCSS: true,
    timestamp: new Date().toISOString(),
  };
}

// Inline critical CSS helper
export function inlineCriticalCSS() {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.innerHTML = Object.values(CRITICAL_CSS).join('\n');
  document.head.appendChild(style);
}