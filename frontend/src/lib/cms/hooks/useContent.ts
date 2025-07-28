/**
 * Content Hooks for React Components
 * Phase 4: Content Management System - React hooks for content consumption
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContentFilters } from '../contentProvider';
import { translationManager } from '../translationManager';

// Content hook options
export interface UseContentOptions {
  locale?: string;
  fallback?: boolean;
  cache?: boolean;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
  provider?: string;
}

// Content hook result
export interface UseContentResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (data: T | null) => void;
}

// Content list hook result
export interface UseContentListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (data: T[]) => void;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  total: number;
}

// Cache for content data
const contentCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Hook to fetch single content item
 */
export function useContent<T = any>(
  type: string,
  id: string,
  options: UseContentOptions = {}
): UseContentResult<T> {
  const {
    locale = 'en',
    fallback = true,
    cache = true,
    revalidateOnFocus = true,
    refreshInterval,
    provider
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(
    () => `content:${type}:${id}:${locale}:${provider || 'default'}`,
    [type, id, locale, provider]
  );

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (cache) {
        const cached = contentCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const url = new URL(`/api/cms/${type}/${id}`, window.location.origin);
      url.searchParams.set('locale', locale);
      if (provider) {
        url.searchParams.set('provider', provider);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 404 && fallback && locale !== 'en') {
          // Try fallback locale
          const fallbackUrl = new URL(`/api/cms/${type}/${id}`, window.location.origin);
          fallbackUrl.searchParams.set('locale', 'en');
          
          const fallbackResponse = await fetch(fallbackUrl.toString());
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            const fallbackData = fallbackResult.data;
            
            setData(fallbackData);
            
            // Cache fallback data
            if (cache) {
              contentCache.set(cacheKey, {
                data: fallbackData,
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000 // 5 minutes
              });
            }
            
            return;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const contentData = result.data;
      
      setData(contentData);

      // Cache the result
      if (cache) {
        contentCache.set(cacheKey, {
          data: contentData,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 minutes
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
      console.error('Content fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, id, locale, fallback, cache, provider, cacheKey]);

  const mutate = useCallback((newData: T | null) => {
    setData(newData);
    
    // Update cache
    if (cache && newData) {
      contentCache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000
      });
    }
  }, [cache, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchContent, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchContent, refreshInterval]);

  // Revalidate on window focus
  useEffect(() => {
    if (revalidateOnFocus) {
      const handleFocus = () => {
        // Only refetch if data is older than 1 minute
        const cached = contentCache.get(cacheKey);
        if (!cached || Date.now() - cached.timestamp > 60 * 1000) {
          fetchContent();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [fetchContent, revalidateOnFocus, cacheKey]);

  return {
    data,
    loading,
    error,
    refetch: fetchContent,
    mutate
  };
}

/**
 * Hook to fetch content by slug
 */
export function useContentBySlug<T = any>(
  type: string,
  slug: string,
  options: UseContentOptions = {}
): UseContentResult<T> {
  const {
    locale = 'en',
    fallback = true,
    cache = true,
    revalidateOnFocus = true,
    refreshInterval,
    provider
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(
    () => `content:${type}:slug:${slug}:${locale}:${provider || 'default'}`,
    [type, slug, locale, provider]
  );

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (cache) {
        const cached = contentCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const url = new URL(`/api/cms/${type}/slug/${slug}`, window.location.origin);
      url.searchParams.set('locale', locale);
      if (provider) {
        url.searchParams.set('provider', provider);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 404 && fallback && locale !== 'en') {
          // Try fallback locale
          const fallbackUrl = new URL(`/api/cms/${type}/slug/${slug}`, window.location.origin);
          fallbackUrl.searchParams.set('locale', 'en');
          
          const fallbackResponse = await fetch(fallbackUrl.toString());
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            const fallbackData = fallbackResult.data;
            
            setData(fallbackData);
            
            // Cache fallback data
            if (cache) {
              contentCache.set(cacheKey, {
                data: fallbackData,
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000
              });
            }
            
            return;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const contentData = result.data;
      
      setData(contentData);

      // Cache the result
      if (cache) {
        contentCache.set(cacheKey, {
          data: contentData,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
      console.error('Content fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, slug, locale, fallback, cache, provider, cacheKey]);

  const mutate = useCallback((newData: T | null) => {
    setData(newData);
    
    // Update cache
    if (cache && newData) {
      contentCache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000
      });
    }
  }, [cache, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    data,
    loading,
    error,
    refetch: fetchContent,
    mutate
  };
}

/**
 * Hook to fetch content list with pagination
 */
export function useContentList<T = any>(
  type: string,
  filters: ContentFilters & { locale?: string } = {},
  options: UseContentOptions = {}
): UseContentListResult<T> {
  const {
    cache = true,
    revalidateOnFocus = true,
    refreshInterval,
    provider
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const locale = filters.locale || 'en';
  const limit = filters.limit || 10;
  const offset = filters.offset || 0;

  const cacheKey = useMemo(() => {
    const filterString = JSON.stringify({ ...filters, provider });
    return `content-list:${type}:${filterString}`;
  }, [type, filters, provider]);

  const fetchContent = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      // Check cache for initial load
      if (cache && !append && offset === 0) {
        const cached = contentCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          setData(cached.data.items || []);
          setTotal(cached.data.total || 0);
          setHasMore(cached.data.hasMore || false);
          setLoading(false);
          return;
        }
      }

      // Build query parameters
      const url = new URL(`/api/cms/${type}`, window.location.origin);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, v.toString()));
          } else {
            url.searchParams.set(key, value.toString());
          }
        }
      });

      if (provider) {
        url.searchParams.set('provider', provider);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const contentData = result.data || [];
      
      if (append) {
        setData(prev => [...prev, ...contentData]);
      } else {
        setData(contentData);
      }

      // Update pagination info
      const totalItems = result.meta?.total || contentData.length;
      setTotal(totalItems);
      
      const currentTotal = append ? data.length + contentData.length : contentData.length;
      setHasMore(currentTotal < totalItems);

      // Cache the result (only for initial load)
      if (cache && !append && offset === 0) {
        contentCache.set(cacheKey, {
          data: {
            items: contentData,
            total: totalItems,
            hasMore: currentTotal < totalItems
          },
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content list';
      setError(errorMessage);
      console.error('Content list fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, filters, cache, provider, cacheKey, offset, data.length]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const newFilters = {
      ...filters,
      offset: data.length,
      limit
    };

    // Create a new fetch function for load more
    const loadMoreFilters = { ...newFilters };
    const url = new URL(`/api/cms/${type}`, window.location.origin);
    
    Object.entries(loadMoreFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v.toString()));
        } else {
          url.searchParams.set(key, value.toString());
        }
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const newData = result.data || [];
      
      setData(prev => [...prev, ...newData]);
      
      const totalItems = result.meta?.total || total;
      setTotal(totalItems);
      
      const newTotal = data.length + newData.length;
      setHasMore(newTotal < totalItems);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more content';
      setError(errorMessage);
      console.error('Load more error:', err);
    }
  }, [type, filters, data.length, hasMore, loading, limit, total]);

  const mutate = useCallback((newData: T[]) => {
    setData(newData);
    
    // Update cache
    if (cache) {
      contentCache.set(cacheKey, {
        data: {
          items: newData,
          total: newData.length,
          hasMore: false
        },
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000
      });
    }
  }, [cache, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchContent(false),
    mutate,
    hasMore,
    loadMore,
    total
  };
}

/**
 * Hook for translation management
 */
export function useTranslation(locale: string) {
  const [currentLocale, setCurrentLocale] = useState(locale);

  const getLocalizedContent = useCallback(async <T>(
    type: string,
    id: string
  ): Promise<T | null> => {
    return translationManager.getLocalizedContent<T>(type, id, currentLocale);
  }, [currentLocale]);

  const getTranslationCompleteness = useCallback(async (
    type: string,
    id: string
  ) => {
    return translationManager.getTranslationCompleteness(type, id);
  }, []);

  return {
    locale: currentLocale,
    setLocale: setCurrentLocale,
    getLocalizedContent,
    getTranslationCompleteness
  };
}

/**
 * Clear content cache
 */
export function clearContentCache(pattern?: string): void {
  if (pattern) {
    // Clear specific pattern
    for (const [key] of contentCache) {
      if (key.includes(pattern)) {
        contentCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    contentCache.clear();
  }
}