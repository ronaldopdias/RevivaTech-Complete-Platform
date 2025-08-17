/**
 * Authenticated API Hook
 * Provides authenticated fetch functionality for API calls
 */

'use client'

import { useSession } from './better-auth-client'
import { useCallback } from 'react'

export interface AuthenticatedApiOptions {
  baseURL?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export function useAuthenticatedApi(options: AuthenticatedApiOptions = {}) {
  const { data: session } = useSession()
  const baseURL = options.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

  const authenticatedFetch = useCallback(async (
    endpoint: string,
    init: RequestInit = {}
  ): Promise<ApiResponse> => {
    try {
      const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : endpoint
      
      const headers = {
        'Content-Type': 'application/json',
        ...init.headers,
      }

      // Add session token if available
      if (session?.session?.token) {
        headers['Authorization'] = `Bearer ${session.session.token}`
      }

      const response = await fetch(url, {
        ...init,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API request failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }, [session, baseURL])

  const get = useCallback((endpoint: string) => {
    return authenticatedFetch(endpoint, { method: 'GET' })
  }, [authenticatedFetch])

  const post = useCallback((endpoint: string, data?: any) => {
    return authenticatedFetch(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }, [authenticatedFetch])

  const put = useCallback((endpoint: string, data?: any) => {
    return authenticatedFetch(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }, [authenticatedFetch])

  const del = useCallback((endpoint: string) => {
    return authenticatedFetch(endpoint, { method: 'DELETE' })
  }, [authenticatedFetch])

  return {
    fetch: authenticatedFetch,
    get,
    post,
    put,
    delete: del,
    isAuthenticated: !!session,
    session,
  }
}

export type AuthenticatedApi = ReturnType<typeof useAuthenticatedApi>