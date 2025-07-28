import { useState, useEffect, useCallback } from 'react';
import { contentLoader, ContentOptions } from '@/lib/content/loader';
import { ContentConfig } from '@/types/config';

interface UseContentReturn {
  content: ContentConfig | null;
  loading: boolean;
  error: Error | null;
  getText: (key: string, interpolations?: Record<string, string | number>) => string;
  getObject: (key: string) => any;
  getArray: (key: string) => any[];
  reload: () => Promise<void>;
}

interface UseContentOptions extends ContentOptions {
  autoLoad?: boolean;
}

export function useContent(
  namespace: string,
  options: UseContentOptions = {}
): UseContentReturn {
  const {
    locale = 'en',
    fallbackLocale = 'en',
    autoLoad = true,
    interpolations,
  } = options;

  const [content, setContent] = useState<ContentConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedContent = await contentLoader.getContent(namespace, {
        locale,
        fallbackLocale,
        interpolations,
      });
      
      setContent(loadedContent);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load content');
      setError(error);
      console.error('Content loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [namespace, locale, fallbackLocale, interpolations]);

  // Auto-load content on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadContent();
    }
  }, [loadContent, autoLoad]);

  // Helper function to get text with interpolation
  const getText = useCallback((
    key: string,
    textInterpolations?: Record<string, string | number>
  ): string => {
    if (!content) return key;
    
    const value = getNestedValue(content.content, key);
    if (typeof value !== 'string') return key;
    
    // Apply interpolations
    const allInterpolations = { ...interpolations, ...textInterpolations };
    if (allInterpolations && Object.keys(allInterpolations).length > 0) {
      return interpolateText(value, allInterpolations);
    }
    
    return value;
  }, [content, interpolations]);

  // Helper function to get object content
  const getObject = useCallback((key: string): any => {
    if (!content) return null;
    return getNestedValue(content.content, key);
  }, [content]);

  // Helper function to get array content
  const getArray = useCallback((key: string): any[] => {
    if (!content) return [];
    const value = getNestedValue(content.content, key);
    return Array.isArray(value) ? value : [];
  }, [content]);

  // Reload function
  const reload = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  return {
    content,
    loading,
    error,
    getText,
    getObject,
    getArray,
    reload,
  };
}

// Hook for getting text content directly
export function useText(
  namespace: string,
  key: string,
  options: UseContentOptions = {}
): {
  text: string;
  loading: boolean;
  error: Error | null;
} {
  const { content, loading, error, getText } = useContent(namespace, options);
  
  return {
    text: getText(key),
    loading,
    error,
  };
}

// Hook for getting multiple text values
export function useTexts(
  namespace: string,
  keys: string[],
  options: UseContentOptions = {}
): {
  texts: Record<string, string>;
  loading: boolean;
  error: Error | null;
} {
  const { content, loading, error, getText } = useContent(namespace, options);
  
  const texts = keys.reduce((acc, key) => {
    acc[key] = getText(key);
    return acc;
  }, {} as Record<string, string>);

  return {
    texts,
    loading,
    error,
  };
}

// Hook for preloading content
export function useContentPreloader() {
  const [preloadedLocales, setPreloadedLocales] = useState<Set<string>>(new Set());
  const [preloading, setPreloading] = useState<boolean>(false);

  const preloadLocale = useCallback(async (locale: string) => {
    if (preloadedLocales.has(locale)) return;
    
    try {
      setPreloading(true);
      await contentLoader.preloadLocale(locale);
      setPreloadedLocales(prev => new Set(prev).add(locale));
    } catch (error) {
      console.error(`Failed to preload locale ${locale}:`, error);
    } finally {
      setPreloading(false);
    }
  }, [preloadedLocales]);

  const isPreloaded = useCallback((locale: string) => {
    return preloadedLocales.has(locale);
  }, [preloadedLocales]);

  return {
    preloadLocale,
    isPreloaded,
    preloading,
    preloadedLocales: Array.from(preloadedLocales),
  };
}

// Utility functions
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function interpolateText(text: string, interpolations: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return interpolations[key]?.toString() || match;
  });
}