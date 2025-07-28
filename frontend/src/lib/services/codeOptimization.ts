/**
 * Code Splitting and Lazy Loading Optimization Service
 * Dynamic imports, route-based splitting, and component lazy loading
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

export interface LazyComponentOptions {
  fallback?: ComponentType;
  retryDelay?: number;
  maxRetries?: number;
  preload?: boolean;
}

export interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

class CodeOptimizationService {
  private componentCache: Map<string, LazyExoticComponent<any>> = new Map();
  private preloadCache: Set<string> = new Set();
  private loadingStates: Map<string, Promise<any>> = new Map();

  /**
   * Create lazy component with retry logic
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): LazyExoticComponent<T> {
    const {
      retryDelay = 1000,
      maxRetries = 3,
      preload = false
    } = options;

    const componentKey = importFn.toString();
    
    if (this.componentCache.has(componentKey)) {
      return this.componentCache.get(componentKey);
    }

    const retryImport = async (retryCount = 0): Promise<{ default: T }> => {
      try {
        return await importFn();
      } catch (error) {
        if (retryCount < maxRetries) {
          console.warn(`Component import failed, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return retryImport(retryCount + 1);
        }
        throw error;
      }
    };

    const lazyComponent = lazy(retryImport);
    this.componentCache.set(componentKey, lazyComponent);

    if (preload) {
      this.preloadComponent(importFn);
    }

    return lazyComponent;
  }

  /**
   * Preload component for faster subsequent loads
   */
  async preloadComponent(importFn: () => Promise<any>): Promise<void> {
    const componentKey = importFn.toString();
    
    if (this.preloadCache.has(componentKey)) {
      return;
    }

    try {
      this.preloadCache.add(componentKey);
      await importFn();
    } catch (error) {
      console.error('Component preload failed:', error);
      this.preloadCache.delete(componentKey);
    }
  }

  /**
   * Intelligent route-based preloading
   */
  preloadRoutes(routes: RouteConfig[]): void {
    // Sort by priority
    const sortedRoutes = routes.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
    });

    // Preload high priority routes immediately
    const highPriorityRoutes = sortedRoutes.filter(r => r.priority === 'high' || r.preload);
    highPriorityRoutes.forEach(route => {
      this.preloadComponent(route.component);
    });

    // Preload medium priority routes after a delay
    setTimeout(() => {
      const mediumPriorityRoutes = sortedRoutes.filter(r => r.priority === 'medium');
      mediumPriorityRoutes.forEach(route => {
        this.preloadComponent(route.component);
      });
    }, 2000);

    // Preload low priority routes on idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        const lowPriorityRoutes = sortedRoutes.filter(r => r.priority === 'low');
        lowPriorityRoutes.forEach(route => {
          this.preloadComponent(route.component);
        });
      });
    }
  }

  /**
   * Intersection observer for lazy loading
   */
  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  /**
   * Adaptive loading based on network conditions
   */
  shouldLazyLoad(): boolean {
    if (typeof navigator === 'undefined') return true;

    const connection = (navigator as any).connection;
    if (!connection) return true;

    // Don't lazy load on slow connections
    const slowConnections = ['slow-2g', '2g'];
    return !slowConnections.includes(connection.effectiveType);
  }

  /**
   * Module federation for micro-frontends
   */
  async loadRemoteModule(
    remoteUrl: string,
    moduleName: string
  ): Promise<any> {
    const moduleKey = `${remoteUrl}:${moduleName}`;
    
    if (this.loadingStates.has(moduleKey)) {
      return this.loadingStates.get(moduleKey);
    }

    const loadPromise = this.loadRemoteModuleInternal(remoteUrl, moduleName);
    this.loadingStates.set(moduleKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingStates.delete(moduleKey);
    }
  }

  private async loadRemoteModuleInternal(
    remoteUrl: string,
    moduleName: string
  ): Promise<any> {
    // Dynamic script loading for module federation
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = remoteUrl;
      script.onload = () => {
        try {
          const remoteContainer = (window as any)[moduleName];
          if (!remoteContainer) {
            throw new Error(`Remote container ${moduleName} not found`);
          }
          resolve(remoteContainer);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Bundle splitting analytics
   */
  getBundleAnalytics(): {
    loadedChunks: string[];
    totalSize: number;
    loadTimes: Record<string, number>;
  } {
    const chunks: string[] = [];
    const loadTimes: Record<string, number> = {};
    let totalSize = 0;

    // Analyze performance entries for chunks
    if (typeof performance !== 'undefined') {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      for (const entry of resourceEntries) {
        if (entry.name.includes('chunk') || entry.name.includes('.js')) {
          chunks.push(entry.name);
          loadTimes[entry.name] = entry.duration;
          totalSize += entry.transferSize || 0;
        }
      }
    }

    return {
      loadedChunks: chunks,
      totalSize,
      loadTimes
    };
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.componentCache.clear();
    this.preloadCache.clear();
    this.loadingStates.clear();
  }
}

// Export singleton instance
export const codeOptimization = new CodeOptimizationService();

// Common lazy components
export const LazyComponents = {
  Dashboard: codeOptimization.createLazyComponent(
    () => import('@/pages/dashboard'),
    { preload: true }
  ),
  BookRepair: codeOptimization.createLazyComponent(
    () => import('@/pages/book-repair'),
    { preload: true }
  ),
  Profile: codeOptimization.createLazyComponent(
    () => import('@/pages/profile')
  ),
  Admin: codeOptimization.createLazyComponent(
    () => import('@/pages/admin'),
    { priority: 'low' }
  )
};

// Route configuration
export const ROUTE_CONFIG: RouteConfig[] = [
  {
    path: '/',
    component: () => import('@/pages/index'),
    priority: 'high',
    preload: true
  },
  {
    path: '/book-repair',
    component: () => import('@/pages/book-repair'),
    priority: 'high',
    preload: true
  },
  {
    path: '/dashboard',
    component: () => import('@/pages/dashboard'),
    priority: 'medium'
  },
  {
    path: '/profile',
    component: () => import('@/pages/profile'),
    priority: 'medium'
  },
  {
    path: '/admin',
    component: () => import('@/pages/admin'),
    priority: 'low'
  }
];