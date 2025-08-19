/**
 * React Performance Optimizations
 * Phase 3: Performance Excellence - Component-level optimizations
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { debounce, throttle } from 'lodash';

// Higher-order component for performance optimization
export function withPerformanceOptimizations<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: {
    shouldMemo?: boolean;
    shouldTrackRender?: boolean;
    propsToCompare?: (keyof T)[];
    displayName?: string;
  } = {}
) {
  const {
    shouldMemo = true,
    shouldTrackRender = false,
    propsToCompare,
    displayName = Component.displayName || Component.name || 'Component'
  } = options;

  // Custom comparison function for memo
  const areEqual = (prevProps: T, nextProps: T) => {
    if (propsToCompare) {
      return propsToCompare.every(key => 
        prevProps[key] === nextProps[key]
      );
    }
    
    // Deep comparison for objects
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    return prevKeys.every(key => {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];
      
      if (typeof prevValue === 'object' && typeof nextValue === 'object') {
        return JSON.stringify(prevValue) === JSON.stringify(nextValue);
      }
      
      return prevValue === nextValue;
    });
  };

  // Wrap component with performance tracking
  const WrappedComponent = (props: T) => {
    const renderCount = useRef(0);
    const startTime = useRef(0);

    if (shouldTrackRender) {
      renderCount.current++;
      startTime.current = performance.now();
    }

    useEffect(() => {
      if (shouldTrackRender) {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;
        
        console.log(`${displayName} - Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      }
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceOptimizations(${displayName})`;

  return shouldMemo ? memo(WrappedComponent, areEqual) : WrappedComponent;
}

// Optimized hooks for common patterns
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    debounceMs?: number;
    throttleMs?: number;
  } = {}
): T {
  const { debounceMs, throttleMs } = options;

  const optimizedCallback = useCallback(
    debounceMs ? debounce(callback, debounceMs) :
    throttleMs ? throttle(callback, throttleMs) :
    callback,
    deps
  );

  return optimizedCallback as T;
}

export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    deep?: boolean;
    maxAge?: number;
  } = {}
): T {
  const { deep = false, maxAge } = options;
  const cacheRef = useRef<{ value: T; timestamp: number; deps: React.DependencyList } | null>(null);

  return useMemo(() => {
    // Check if we have cached value
    if (cacheRef.current) {
      const { value, timestamp, deps: cachedDeps } = cacheRef.current;
      
      // Check if cache is still valid
      if (maxAge && Date.now() - timestamp > maxAge) {
        cacheRef.current = null;
      } else {
        // Check if dependencies have changed
        const depsChanged = deps.length !== cachedDeps.length || 
          deps.some((dep, index) => {
            const cachedDep = cachedDeps[index];
            
            if (deep && typeof dep === 'object' && typeof cachedDep === 'object') {
              return JSON.stringify(dep) !== JSON.stringify(cachedDep);
            }
            
            return dep !== cachedDep;
          });

        if (!depsChanged) {
          return value;
        }
      }
    }

    // Calculate new value
    const newValue = factory();
    
    // Cache the result
    cacheRef.current = {
      value: newValue,
      timestamp: Date.now(),
      deps: [...deps]
    };

    return newValue;
  }, deps);
}

// Virtualization hook for large lists
export function useVirtualization<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length
  );

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(start, end);

  const totalHeight = items.length * itemHeight;
  const offsetY = start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    start,
    end,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// Debounced state hook
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue];
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Performance monitoring hook
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  // Track render start
  renderCount.current++;
  startTime.current = performance.now();

  useEffect(() => {
    // Track render end
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 16) { // 60 FPS threshold
      console.warn(`${componentName} - Slow render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
    markRenderStart: () => {
      startTime.current = performance.now();
    },
    markRenderEnd: () => {
      const endTime = performance.now();
      return endTime - startTime.current;
    }
  };
}

// Preloading utility
export function usePreloader(urls: string[], priority: 'high' | 'low' = 'low') {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadPromises = urls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'image';
        
        if (priority === 'high') {
          link.setAttribute('fetchpriority', 'high');
        }
        
        link.onload = () => {
          setLoadedUrls(prev => new Set([...prev, url]));
          resolve(url);
        };
        
        link.onerror = () => reject(new Error(`Failed to preload ${url}`));
        
        document.head.appendChild(link);
      });
    });

    Promise.allSettled(preloadPromises);
  }, [urls, priority]);

  return loadedUrls;
}

// Bundle size analyzer
export function useBundleAnalyzer() {
  const [bundleStats, setBundleStats] = useState<{
    totalSize: number;
    chunkCount: number;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const analyzeBundle = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.endsWith('.js'));
      
      const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const chunkCount = jsResources.length;
      const loadTime = jsResources.reduce((sum, r) => sum + r.duration, 0);

      setBundleStats({
        totalSize,
        chunkCount,
        loadTime
      });
    };

    // Analyze after page load
    if (document.readyState === 'complete') {
      analyzeBundle();
    } else {
      window.addEventListener('load', analyzeBundle);
    }

    return () => {
      window.removeEventListener('load', analyzeBundle);
    };
  }, []);

  return bundleStats;
}