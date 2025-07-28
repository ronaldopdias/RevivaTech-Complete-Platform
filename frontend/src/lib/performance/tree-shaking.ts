// Tree shaking optimizations
// This file helps webpack eliminate unused code

// Explicitly mark pure functions for tree shaking
export const PURE_FUNCTIONS = {
  // Utility functions that don't have side effects
  formatPrice: '/*#__PURE__*/',
  formatDate: '/*#__PURE__*/',
  cn: '/*#__PURE__*/', // clsx function
} as const;

// Conditional imports based on environment
export function getEnvironmentOptimizedImports() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Only include in development builds
  if (isDevelopment) {
    return {
      devtools: () => import('@/lib/utils/dev-tools'),
      debugPanel: () => import('@/components/DebugPanel'),
      mockServices: () => import('@/lib/services/mockServices'),
    };
  }

  // Only include in production builds
  if (isProduction) {
    return {
      analytics: () => import('@/lib/analytics/production'),
      monitoring: () => import('@/lib/monitoring/performance'),
      errorTracking: () => import('@/lib/monitoring/error-tracking'),
    };
  }

  return {};
}

// Feature flag based imports
export function getFeatureFlagImports() {
  const features = {
    AI_DIAGNOSTICS: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    REAL_TIME_UPDATES: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
    ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    TWO_FACTOR_AUTH: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
  };

  const conditionalImports: Record<string, () => Promise<any>> = {};

  if (features.AI_DIAGNOSTICS) {
    conditionalImports.aiDiagnostics = () => import('@/components/booking/AIDeviceDiagnostics');
  }

  if (features.REAL_TIME_UPDATES) {
    conditionalImports.realtimeComponents = () => import('@/components/realtime');
    conditionalImports.websocketService = () => import('@/services/websocket.service');
  }

  if (features.ADVANCED_ANALYTICS) {
    conditionalImports.analytics = () => import('@/components/admin/AdvancedAnalytics');
    conditionalImports.businessIntelligence = () => import('@/components/admin/BusinessIntelligence');
  }

  if (features.TWO_FACTOR_AUTH) {
    conditionalImports.twoFactorAuth = () => import('@/components/auth/2fa');
  }

  return conditionalImports;
}

// Library-specific optimizations
export const LIBRARY_OPTIMIZATIONS = {
  // Only import specific parts of large libraries
  radixUI: {
    // Instead of importing entire @radix-ui/react-* packages
    dialog: () => import('@radix-ui/react-dialog'),
    dropdown: () => import('@radix-ui/react-dropdown-menu'),
    select: () => import('@radix-ui/react-select'),
  },

  lucideReact: {
    // Tree-shakeable icon imports
    icons: [
      'Check',
      'X',
      'ChevronDown',
      'Menu',
      'User',
      'Settings',
      'Search',
      'Plus',
      'Trash2',
      'Edit',
    ],
  },

  dateFns: {
    // Only import needed date functions
    functions: [
      'format',
      'parseISO',
      'isValid',
      'addDays',
      'subDays',
    ],
  },
} as const;

// Unused code elimination markers
export const UNUSED_CODE_MARKERS = {
  // Mark functions that should be eliminated in production
  debugOnly: (fn: Function) => {
    if (process.env.NODE_ENV !== 'development') {
      return () => {}; // Return empty function in production
    }
    return fn;
  },

  testOnly: (fn: Function) => {
    if (process.env.NODE_ENV !== 'test') {
      return () => {}; // Return empty function in non-test environments
    }
    return fn;
  },

  featureFlag: (flag: string, fn: Function) => {
    if (!process.env[`NEXT_PUBLIC_ENABLE_${flag.toUpperCase()}`]) {
      return () => {}; // Return empty function if feature is disabled
    }
    return fn;
  },
} as const;

// Optimized re-exports to enable tree shaking
export { Button } from '@/components/ui/Button';
export { Card } from '@/components/ui/Card';
export { Input } from '@/components/ui/Input';
export { Select } from '@/components/ui/Select';
export { Textarea } from '@/components/ui/Textarea';

// Conditional exports based on environment
if (process.env.NODE_ENV === 'development') {
  // Export development utilities
  export { default as DebugPanel } from '@/components/DebugPanel';
}

if (process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true') {
  // Export admin components only if admin is enabled
  export { AdminDashboard } from '@/lib/performance/dynamic-imports';
  export { AdvancedAnalytics } from '@/lib/performance/dynamic-imports';
}

// Helper to check if code should be included
export function shouldIncludeCode(condition: keyof typeof UNUSED_CODE_MARKERS): boolean {
  switch (condition) {
    case 'debugOnly':
      return process.env.NODE_ENV === 'development';
    case 'testOnly':
      return process.env.NODE_ENV === 'test';
    default:
      return true;
  }
}

// Bundle size analysis helper
export function getBundleAnalysis() {
  return {
    environment: process.env.NODE_ENV,
    features: {
      ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
      realtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      admin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
    },
    optimizations: {
      treeshaking: true,
      codeSplitting: true,
      dynamicImports: true,
      conditionalLoading: true,
    },
    timestamp: new Date().toISOString(),
  };
}