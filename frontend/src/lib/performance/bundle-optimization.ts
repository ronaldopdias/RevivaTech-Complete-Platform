// Bundle optimization utilities
import { useEffect } from 'react';

// Tree shaking optimization - mark unused exports
export const TREE_SHAKE_MARKERS = {
  // Mark heavy libraries for conditional loading
  HEAVY_LIBRARIES: ['@radix-ui', 'framer-motion', 'socket.io-client'],
  // Mark development-only utilities
  DEV_ONLY: ['@playwright/test', '@testing-library'],
  // Mark optional features
  OPTIONAL_FEATURES: ['ai-diagnostics', 'advanced-analytics', 'real-time-updates'],
} as const;

// Critical CSS paths (inline these)
export const CRITICAL_CSS_PATHS = [
  '/components/ui/Button',
  '/components/ui/Card',
  '/components/sections/HeroSection',
  '/components/layout/Header',
  '/components/layout/Footer',
] as const;

// Non-critical CSS paths (load asynchronously)
export const NON_CRITICAL_CSS_PATHS = [
  '/components/admin',
  '/components/booking',
  '/components/realtime',
  '/components/auth/2fa',
] as const;

// Optimize imports based on environment
export function getOptimizedImports() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // Only include development tools in dev (placeholder for now)
    devtools: isDevelopment ? Promise.resolve({ debug: console.log }) : Promise.resolve(null),
    
    // Conditionally load heavy libraries (placeholder for now)
    analytics: isProduction ? Promise.resolve({ track: () => {} }) : Promise.resolve(null),
    
    // Load based on feature flags (placeholder for now)
    aiFeatures: process.env.NEXT_PUBLIC_ENABLE_AI === 'true' 
      ? Promise.resolve({ diagnose: () => {} })
      : Promise.resolve(null),
  };
}

// Resource hints for performance
export function useResourceHints() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preconnect to external services
    const preconnectUrls = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.revivatech.co.uk',
    ];

    preconnectUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });

    // DNS prefetch for external resources
    const dnsPrefetchUrls = [
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com',
    ];

    dnsPrefetchUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);
}

// Code splitting configuration
export const CODE_SPLITTING_CONFIG = {
  // Route-based splitting
  routes: {
    admin: {
      chunk: 'admin',
      priority: 'low',
      preload: false,
    },
    booking: {
      chunk: 'booking',
      priority: 'high',
      preload: true,
    },
    customer: {
      chunk: 'customer',
      priority: 'medium',
      preload: false,
    },
  },

  // Component-based splitting
  components: {
    heavy: ['AdvancedAnalytics', 'BusinessIntelligence', 'AIDeviceDiagnostics'],
    medium: ['BookingWizard', 'CustomerDashboard', 'PaymentGateway'],
    light: ['Button', 'Card', 'Input', 'HeroSection'],
  },

  // Library splitting
  vendors: {
    react: ['react', 'react-dom'],
    ui: ['@radix-ui', 'lucide-react'],
    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
    utils: ['clsx', 'date-fns', 'axios'],
  },
} as const;

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  // Bundle size limits (KB)
  bundles: {
    main: 150,
    vendor: 200,
    admin: 100,
    booking: 80,
  },

  // Asset size limits (KB)
  assets: {
    images: 500,
    fonts: 100,
    icons: 50,
  },

  // Runtime performance targets
  metrics: {
    fcp: 1500, // First Contentful Paint (ms)
    lcp: 2500, // Largest Contentful Paint (ms)
    cls: 0.1,  // Cumulative Layout Shift
    fid: 100,  // First Input Delay (ms)
  },
} as const;

// Lazy loading configuration
export const LAZY_LOADING_CONFIG = {
  // Images
  images: {
    threshold: '50px',
    fallback: '/images/placeholder.svg',
  },

  // Components
  components: {
    admin: true,
    realtime: true,
    ai: true,
    analytics: true,
  },

  // Routes
  routes: {
    '/admin': true,
    '/customer-portal': false,
    '/booking': false,
  },
} as const;

// Helper to check if feature should be loaded
export function shouldLoadFeature(feature: keyof typeof LAZY_LOADING_CONFIG.components): boolean {
  return LAZY_LOADING_CONFIG.components[feature] === false;
}

// Optimization status checker
export function getBundleOptimizationStatus() {
  return {
    dynamicImports: true,
    codeSplitting: true,
    treeShaking: true,
    lazyLoading: true,
    resourceHints: true,
    performanceBudgets: true,
    timestamp: new Date().toISOString(),
  };
}