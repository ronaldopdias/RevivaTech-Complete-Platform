'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for making authenticated API requests
 * Automatically includes auth tokens and handles 401 responses
 */
export const useAuthenticatedApi = <T = any>(initialData: T | null = null) => {
  const { tokens, isAuthenticated, refreshToken, logout } = useAuth();
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(async (
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    if (!isAuthenticated || !tokens?.accessToken) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
        ...options.headers,
      };

      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
      };

      if (options.body) {
        requestOptions.body = typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body);
      }

      let response = await fetch(url, requestOptions);

      // Handle 401 - attempt token refresh
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        const refreshResult = await refreshToken();
        if (refreshResult.success) {
          // Retry with new token
          headers.Authorization = `Bearer ${refreshResult.data?.accessToken}`;
          response = await fetch(url, {
            ...requestOptions,
            headers,
          });
        } else {
          // Refresh failed, logout user
          await logout();
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Session expired. Please login again.' 
          }));
          return {
            success: false,
            error: {
              code: 'SESSION_EXPIRED',
              message: 'Session expired. Please login again.',
            },
          };
        }
      }

      const responseData = await response.json();

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          data: responseData.data || responseData, 
          loading: false, 
          error: null 
        }));
        
        return {
          success: true,
          data: responseData.data || responseData,
        };
      } else {
        const errorMessage = responseData.error || responseData.message || 'Request failed';
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage 
        }));
        
        return {
          success: false,
          error: {
            code: responseData.code,
            message: errorMessage,
            details: responseData,
          },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
        },
      };
    }
  }, [isAuthenticated, tokens, refreshToken, logout]);

  // Convenience methods for common HTTP verbs
  const get = useCallback((endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) => 
    makeRequest(endpoint, { ...options, method: 'GET' }), [makeRequest]);

  const post = useCallback((endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) => 
    makeRequest(endpoint, { ...options, method: 'POST', body: data }), [makeRequest]);

  const put = useCallback((endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) => 
    makeRequest(endpoint, { ...options, method: 'PUT', body: data }), [makeRequest]);

  const del = useCallback((endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) => 
    makeRequest(endpoint, { ...options, method: 'DELETE' }), [makeRequest]);

  // Clear error manually
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    makeRequest,
    get,
    post,
    put,
    delete: del,
    clearError,
    reset,
    isAuthenticated,
  };
};

export default useAuthenticatedApi;