/**
 * Advanced Lazy Loading and Code Splitting
 * Phase 3: Performance Excellence - Dynamic imports optimization
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

export interface LazyLoadOptions {
  fallback?: ComponentType;
  retryDelay?: number;
  maxRetries?: number;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface ComponentCache {
  [key: string]: LazyExoticComponent<any>;
}

class LazyLoader {
  private static instance: LazyLoader;
  private cache: ComponentCache = {};
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private retryCount: Map<string, number> = new Map();

  static getInstance(): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader();
    }
    return LazyLoader.instance;
  }

  /**
   * Create optimized lazy-loaded component with retry logic
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyLoadOptions = {}
  ): LazyExoticComponent<T> {
    const {
      retryDelay = 1000,
      maxRetries = 3,
      preload = false,
      priority = 'medium'
    } = options;

    const componentKey = importFn.toString();

    // Return cached component if available
    if (this.cache[componentKey]) {
      return this.cache[componentKey];
    }

    // Create lazy component with retry logic
    const lazyComponent = lazy(async () => {
      return this.loadWithRetry(importFn, componentKey, retryDelay, maxRetries);
    });

    // Cache the component
    this.cache[componentKey] = lazyComponent;

    // Preload if requested
    if (preload) {
      this.preloadComponent(importFn, componentKey, priority);
    }

    return lazyComponent;
  }

  /**
   * Load component with retry logic
   */
  private async loadWithRetry<T>(
    importFn: () => Promise<{ default: T }>,
    componentKey: string,
    retryDelay: number,
    maxRetries: number
  ): Promise<{ default: T }> {
    const currentRetries = this.retryCount.get(componentKey) || 0;

    try {
      const result = await importFn();
      // Reset retry count on success
      this.retryCount.set(componentKey, 0);
      return result;
    } catch (error) {
      console.error(`Failed to load component (attempt ${currentRetries + 1}):`, error);

      if (currentRetries < maxRetries) {
        this.retryCount.set(componentKey, currentRetries + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return this.loadWithRetry(importFn, componentKey, retryDelay, maxRetries);
      }

      // Max retries reached
      console.error(`Max retries (${maxRetries}) reached for component`);
      throw error;
    }
  }

  /**
   * Preload component for better performance
   */
  preloadComponent<T>(
    importFn: () => Promise<{ default: T }>,
    componentKey: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    if (this.preloadPromises.has(componentKey)) {
      return; // Already preloading
    }

    const preloadPromise = importFn().catch(error => {
      console.warn('Failed to preload component:', error);
    });

    this.preloadPromises.set(componentKey, preloadPromise);

    // Set priority hint if supported
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const priorityTimeout = {
        high: 100,
        medium: 1000,
        low: 5000
      }[priority];

      window.requestIdleCallback(() => {
        preloadPromise;
      }, { timeout: priorityTimeout });
    }
  }

  /**
   * Batch preload multiple components
   */
  batchPreload(imports: Array<{
    importFn: () => Promise<any>;
    priority?: 'high' | 'medium' | 'low';
  }>): void {
    imports.forEach(({ importFn, priority = 'medium' }) => {
      const componentKey = importFn.toString();
      this.preloadComponent(importFn, componentKey, priority);
    });
  }

  /**
   * Get preload status
   */
  getPreloadStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.preloadPromises.forEach((promise, key) => {
      status[key] = promise !== undefined;
    });

    return status;
  }

  /**
   * Clear cache and preload promises
   */
  clearCache(): void {
    this.cache = {};
    this.preloadPromises.clear();
    this.retryCount.clear();
  }
}

// Export singleton instance
export const lazyLoader = LazyLoader.getInstance();

// Convenience functions for common use cases
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): LazyExoticComponent<T> => {
  return lazyLoader.createLazyComponent(importFn, options);
};

// Pre-configured lazy loaders for different scenarios
export const createAdminLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return createLazyComponent(importFn, {
    priority: 'low', // Admin components can load later
    preload: false,
    maxRetries: 2
  });
};

export const createCriticalLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return createLazyComponent(importFn, {
    priority: 'high',
    preload: true,
    maxRetries: 5
  });
};

// Route-based lazy loading
export const createRouteLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routePriority: 'critical' | 'important' | 'optional' = 'important'
): LazyExoticComponent<T> => {
  const options: LazyLoadOptions = {
    critical: { priority: 'high', preload: true, maxRetries: 5 },
    important: { priority: 'medium', preload: false, maxRetries: 3 },
    optional: { priority: 'low', preload: false, maxRetries: 2 }
  }[routePriority];

  return createLazyComponent(importFn, options);
};