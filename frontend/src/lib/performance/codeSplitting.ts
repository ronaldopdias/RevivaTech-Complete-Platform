// Advanced Code Splitting and Dynamic Loading Utilities
// Handles component lazy loading, route-based splitting, and performance optimization

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';
import { LoaderFunction } from 'next/router';

// Loading component interface
interface LoadingComponentProps {
  className?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Error component interface
interface ErrorComponentProps {
  error: Error;
  retry?: () => void;
  className?: string;
}

// Dynamic import options
interface DynamicImportOptions {
  loading?: ComponentType<LoadingComponentProps>;
  error?: ComponentType<ErrorComponentProps>;
  ssr?: boolean;
  suspense?: boolean;
  preload?: boolean;
  retry?: number;
  timeout?: number;
}

// Code splitting configuration
interface CodeSplittingConfig {
  chunkSize: number;
  maxChunks: number;
  preloadThreshold: number;
  cacheStrategy: 'memory' | 'sessionStorage' | 'localStorage';
  enablePrefetch: boolean;
  enablePreload: boolean;
}

// Default loading component
const DefaultLoading: ComponentType<LoadingComponentProps> = ({ 
  className = '', 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`} />
      <span className="ml-2 text-muted-foreground">{message}</span>
    </div>
  );
};

// Default error component
const DefaultError: ComponentType<ErrorComponentProps> = ({ error, retry, className = '' }) => (
  <div className={`p-4 text-center ${className}`}>
    <div className="text-destructive mb-2">Failed to load component</div>
    <div className="text-sm text-muted-foreground mb-4">{error.message}</div>
    {retry && (
      <button 
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Retry
      </button>
    )}
  </div>
);

class CodeSplittingManager {
  private config: CodeSplittingConfig;
  private componentCache = new Map<string, any>();
  private preloadQueue = new Set<string>();
  private loadingComponents = new Map<string, Promise<any>>();

  constructor(config: Partial<CodeSplittingConfig> = {}) {
    this.config = {
      chunkSize: 200000, // 200KB
      maxChunks: 10,
      preloadThreshold: 0.8, // 80% viewport visibility
      cacheStrategy: 'memory',
      enablePrefetch: true,
      enablePreload: true,
      ...config
    };
  }

  // Create lazy-loaded component with enhanced options
  createLazyComponent<T = any>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options: DynamicImportOptions = {}
  ): ComponentType<T> {
    const {
      loading = DefaultLoading,
      error = DefaultError,
      ssr = false,
      suspense = false,
      preload = false,
      retry = 3,
      timeout = 10000
    } = options;

    const componentKey = importFn.toString();

    // Create dynamic component with retry logic
    const DynamicComponent = dynamic(
      () => this.loadWithRetry(importFn, retry, timeout),
      {
        loading: loading as any,
        ssr,
        suspense
      }
    );

    // Preload if requested
    if (preload) {
      this.preloadComponent(componentKey, importFn);
    }

    return DynamicComponent as ComponentType<T>;
  }

  // Load component with retry mechanism
  private async loadWithRetry<T>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    maxRetries: number,
    timeout: number
  ): Promise<{ default: ComponentType<T> }> {
    const componentKey = importFn.toString();

    // Check cache first
    if (this.componentCache.has(componentKey)) {
      return this.componentCache.get(componentKey);
    }

    // Check if already loading
    if (this.loadingComponents.has(componentKey)) {
      return this.loadingComponents.get(componentKey);
    }

    const loadPromise = this.executeLoadWithRetry(importFn, maxRetries, timeout);
    this.loadingComponents.set(componentKey, loadPromise);

    try {
      const result = await loadPromise;
      this.componentCache.set(componentKey, result);
      this.loadingComponents.delete(componentKey);
      return result;
    } catch (error) {
      this.loadingComponents.delete(componentKey);
      throw error;
    }
  }

  private async executeLoadWithRetry<T>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    maxRetries: number,
    timeout: number
  ): Promise<{ default: ComponentType<T> }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Component load timeout')), timeout);
        });

        const result = await Promise.race([
          importFn(),
          timeoutPromise
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Component load failed');
  }

  // Preload component for better performance
  async preloadComponent(
    componentKey: string,
    importFn: () => Promise<any>
  ): Promise<void> {
    if (this.preloadQueue.has(componentKey) || this.componentCache.has(componentKey)) {
      return;
    }

    this.preloadQueue.add(componentKey);

    try {
      const result = await importFn();
      this.componentCache.set(componentKey, result);
    } catch (error) {
      console.warn('Component preload failed:', error);
    } finally {
      this.preloadQueue.delete(componentKey);
    }
  }

  // Create route-based code splitting
  createRouteComponent(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    routeName: string,
    options: DynamicImportOptions = {}
  ) {
    const enhancedOptions = {
      ...options,
      loading: options.loading || (() => (
        <DefaultLoading message={`Loading ${routeName}...`} size="lg" />
      ))
    };

    return this.createLazyComponent(importFn, enhancedOptions);
  }

  // Bundle size analysis
  getBundleAnalysis(): {
    cacheSize: number;
    loadingComponents: number;
    preloadQueue: number;
    estimatedMemoryUsage: number;
  } {
    return {
      cacheSize: this.componentCache.size,
      loadingComponents: this.loadingComponents.size,
      preloadQueue: this.preloadQueue.size,
      estimatedMemoryUsage: this.componentCache.size * this.config.chunkSize
    };
  }

  // Clear component cache
  clearCache(selective = false): void {
    if (selective) {
      // Keep frequently used components
      const entries = Array.from(this.componentCache.entries());
      this.componentCache.clear();
      
      // Keep last 5 components (simple LRU simulation)
      entries.slice(-5).forEach(([key, value]) => {
        this.componentCache.set(key, value);
      });
    } else {
      this.componentCache.clear();
    }
  }

  // Prefetch components based on user interaction
  setupIntelligentPrefetch(): void {
    if (!this.config.enablePrefetch) return;

    // Prefetch on hover
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const prefetchAttr = target.getAttribute('data-prefetch');
      
      if (prefetchAttr) {
        this.handlePrefetch(prefetchAttr);
      }
    });

    // Prefetch on intersection (when elements come into view)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const prefetchAttr = (entry.target as HTMLElement).getAttribute('data-prefetch');
              if (prefetchAttr) {
                this.handlePrefetch(prefetchAttr);
              }
            }
          });
        },
        { threshold: this.config.preloadThreshold }
      );

      // Observe elements with prefetch attributes
      document.querySelectorAll('[data-prefetch]').forEach((el) => {
        observer.observe(el);
      });
    }
  }

  private handlePrefetch(componentName: string): void {
    // This would map component names to their import functions
    // In a real implementation, you'd maintain a registry
    console.log(`Prefetching component: ${componentName}`);
  }
}

// Create singleton instance
export const codeSplittingManager = new CodeSplittingManager();

// Utility functions for common patterns
export const createAdminComponent = (importFn: () => Promise<any>) => 
  codeSplittingManager.createLazyComponent(importFn, {
    loading: ({ message }) => <DefaultLoading message={message || "Loading admin..."} size="lg" />,
    ssr: false, // Admin components don't need SSR
    preload: false
  });

export const createCustomerComponent = (importFn: () => Promise<any>) =>
  codeSplittingManager.createLazyComponent(importFn, {
    loading: ({ message }) => <DefaultLoading message={message || "Loading..."} />,
    ssr: true, // Customer-facing components benefit from SSR
    preload: true
  });

export const createModalComponent = (importFn: () => Promise<any>) =>
  codeSplittingManager.createLazyComponent(importFn, {
    loading: ({ message }) => <DefaultLoading message={message || "Loading modal..."} size="sm" />,
    ssr: false, // Modals don't need SSR
    suspense: true
  });

export const createDashboardWidget = (importFn: () => Promise<any>) =>
  codeSplittingManager.createLazyComponent(importFn, {
    loading: ({ message }) => (
      <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
        <DefaultLoading message={message || "Loading widget..."} />
      </div>
    ),
    ssr: false,
    preload: false
  });

// Route-based splitting helpers
export const createPageComponent = (routeName: string) => (importFn: () => Promise<any>) =>
  codeSplittingManager.createRouteComponent(importFn, routeName, {
    ssr: true,
    preload: true
  });

// HOC for adding code splitting to existing components
export function withCodeSplitting<P = {}>(
  WrappedComponent: ComponentType<P>,
  options: DynamicImportOptions = {}
): ComponentType<P> {
  const componentImport = () => Promise.resolve({ default: WrappedComponent });
  return codeSplittingManager.createLazyComponent(componentImport, options);
}

// Performance monitoring
export function trackComponentLoad(componentName: string, loadTime: number): void {
  // Track component loading performance
  fetch('/api/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'track-api',
      data: {
        endpoint: `/component/${componentName}`,
        responseTime: loadTime,
        statusCode: 200,
        metadata: {
          type: 'component-load',
          componentName
        }
      }
    })
  }).catch(error => console.warn('Failed to track component load:', error));
}

// Export types
export type {
  LoadingComponentProps,
  ErrorComponentProps,
  DynamicImportOptions,
  CodeSplittingConfig
};

export default codeSplittingManager;