/**
 * Design System V2 - Main Export Index
 * Central export point for all design system components and utilities
 */

// Design Tokens
export * from './tokens';
export { default as designTokens } from './tokens';

// Components
export * from './components/Button/Button';
export * from './components/Card/Card';
export * from './components/Modal/Modal';
export * from './components/Input/Input';
export * from './components/Form/Form';
export * from './components/Icon/Icon';
export * from './components/Animation/Animation';

// Accessibility utilities
export * from './accessibility';

// Re-export commonly used components as default
export { default as Button } from './components/Button/Button';
export { default as Card } from './components/Card/Card';
export { default as Modal } from './components/Modal/Modal';
export { default as Input } from './components/Input/Input';
export { default as Form } from './components/Form/Form';
export { default as Icon } from './components/Icon/Icon';
export { default as Animation } from './components/Animation/Animation';

// Version information
export const DESIGN_SYSTEM_VERSION = '2.0.0';
export const DESIGN_SYSTEM_NAME = 'RevivaTech Design System V2';

// Design system configuration
export const designSystemConfig = {
  name: DESIGN_SYSTEM_NAME,
  version: DESIGN_SYSTEM_VERSION,
  theme: {
    defaultTheme: 'light',
    supportedThemes: ['light', 'dark'],
  },
  components: {
    Button: {
      variants: ['primary', 'secondary', 'accent', 'outline', 'ghost', 'subtle', 'danger', 'success', 'warning', 'link'],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      defaultVariant: 'primary',
      defaultSize: 'md',
    },
    Card: {
      variants: ['default', 'elevated', 'outlined', 'filled', 'gradient', 'glass', 'interactive'],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      defaultVariant: 'default',
      defaultSize: 'md',
    },
    Modal: {
      sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full'],
      variants: ['default', 'success', 'warning', 'error', 'info'],
      defaultSize: 'md',
      defaultVariant: 'default',
    },
    Input: {
      variants: ['default', 'filled', 'outline', 'ghost', 'success', 'warning', 'error'],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      defaultVariant: 'default',
      defaultSize: 'md',
    },
    Icon: {
      sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'],
      colors: ['default', 'primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info', 'muted', 'inverse', 'current'],
      defaultSize: 'md',
      defaultColor: 'default',
    },
    Animation: {
      animations: [
        'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-in', 'scale-out',
        'bounce', 'pulse', 'spin', 'wiggle', 'float', 'shimmer', 'tada', 'shake', 'flip'
      ],
      durations: ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest'],
      easings: ['linear', 'in', 'out', 'in-out'],
      defaultAnimation: 'fade',
      defaultDuration: 'normal',
      defaultEasing: 'out',
    },
  },
  accessibility: {
    colorContrastRatio: 4.5, // WCAG AA standard
    focusRingColor: 'primary-500',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
  },
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
};

// Utility functions
export const designSystemUtils = {
  // Get component configuration
  getComponentConfig: (componentName: keyof typeof designSystemConfig.components) => {
    return designSystemConfig.components[componentName];
  },
  
  // Get all available variants for a component
  getComponentVariants: (componentName: keyof typeof designSystemConfig.components) => {
    return designSystemConfig.components[componentName]?.variants || [];
  },
  
  // Get all available sizes for a component
  getComponentSizes: (componentName: keyof typeof designSystemConfig.components) => {
    return designSystemConfig.components[componentName]?.sizes || [];
  },
  
  // Get default variant for a component
  getDefaultVariant: (componentName: keyof typeof designSystemConfig.components) => {
    return designSystemConfig.components[componentName]?.defaultVariant;
  },
  
  // Get default size for a component
  getDefaultSize: (componentName: keyof typeof designSystemConfig.components) => {
    return designSystemConfig.components[componentName]?.defaultSize;
  },
  
  // Validate component props
  validateComponentProps: (componentName: keyof typeof designSystemConfig.components, props: any) => {
    const config = designSystemConfig.components[componentName];
    const errors: string[] = [];
    
    if (props.variant && config.variants && !config.variants.includes(props.variant)) {
      errors.push(`Invalid variant "${props.variant}" for ${componentName}. Valid variants: ${config.variants.join(', ')}`);
    }
    
    if (props.size && config.sizes && !config.sizes.includes(props.size)) {
      errors.push(`Invalid size "${props.size}" for ${componentName}. Valid sizes: ${config.sizes.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
  
  // Get theme configuration
  getThemeConfig: () => {
    return designSystemConfig.theme;
  },
  
  // Get accessibility configuration
  getAccessibilityConfig: () => {
    return designSystemConfig.accessibility;
  },
  
  // Get breakpoint configuration
  getBreakpoints: () => {
    return designSystemConfig.breakpoints;
  },
  
  // Get design system info
  getSystemInfo: () => {
    return {
      name: DESIGN_SYSTEM_NAME,
      version: DESIGN_SYSTEM_VERSION,
      componentsCount: Object.keys(designSystemConfig.components).length,
      lastUpdated: new Date().toISOString(),
    };
  },
};

// Design system provider configuration
export const designSystemProvider = {
  // Initialize design system
  init: (config?: Partial<typeof designSystemConfig>) => {
    if (config) {
      Object.assign(designSystemConfig, config);
    }
    
    // Add design system info to window (for debugging)
    if (typeof window !== 'undefined') {
      (window as any).__DESIGN_SYSTEM__ = {
        name: DESIGN_SYSTEM_NAME,
        version: DESIGN_SYSTEM_VERSION,
        config: designSystemConfig,
        utils: designSystemUtils,
      };
    }
  },
  
  // Get design system context
  getContext: () => ({
    config: designSystemConfig,
    utils: designSystemUtils,
  }),
  
  // Update design system configuration
  updateConfig: (updates: Partial<typeof designSystemConfig>) => {
    Object.assign(designSystemConfig, updates);
  },
  
  // Reset to default configuration
  reset: () => {
    // This would restore the original configuration
    // Implementation depends on how you want to handle this
  },
};

// Export design system as default
export default {
  name: DESIGN_SYSTEM_NAME,
  version: DESIGN_SYSTEM_VERSION,
  config: designSystemConfig,
  utils: designSystemUtils,
  provider: designSystemProvider,
};

// Type definitions for better TypeScript support
export type DesignSystemComponent = keyof typeof designSystemConfig.components;
export type DesignSystemTheme = 'light' | 'dark';
export type DesignSystemBreakpoint = keyof typeof designSystemConfig.breakpoints;

// Common prop types that can be reused
export type CommonProps = {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
};

export type ResponsiveValue<T> = T | { [K in DesignSystemBreakpoint]?: T };

export type VariantProps<T> = T extends (args: infer P) => any ? P : never;

// Design system status
export const DESIGN_SYSTEM_STATUS = {
  PHASE_1: 'COMPLETED', // Design Token System & Accessibility Foundation
  PHASE_2: 'IN_PROGRESS', // Advanced UI Components & Visual Design Enhancement
  PHASE_3: 'PENDING', // Design System Tools & Testing
  OVERALL_PROGRESS: '70%',
  LAST_UPDATED: '2025-07-16',
} as const;