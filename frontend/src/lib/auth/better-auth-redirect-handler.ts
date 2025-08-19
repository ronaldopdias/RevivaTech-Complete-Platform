/**
 * Better Auth Client-Side Redirect Handler
 * 
 * Listens for Better Auth plugin redirect headers and performs client-side navigation
 * Integrates with Better Auth's hook system for proper role-based redirection
 */

'use client'

import { authLogger } from '@/lib/utils/logger'

/**
 * Handles Better Auth response headers for redirection
 * Should be called after Better Auth operations that might trigger redirects
 */
export function handleBetterAuthRedirect(response?: Response): boolean {
  if (!response?.headers) {
    return false
  }

  try {
    // Check for redirect headers set by Better Auth hooks
    const redirectPath = response.headers.get('X-Auth-Redirect')
    const userRole = response.headers.get('X-Auth-Role')

    if (redirectPath) {
      authLogger.info('Better Auth redirect header detected', {
        redirectPath,
        userRole,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      })

      // Perform client-side navigation
      if (typeof window !== 'undefined') {
        authLogger.debug('Executing Better Auth client-side redirect', { redirectPath })
        window.location.href = redirectPath
        return true
      }
    }

    // Check for role information without redirect (for existing sessions)
    const currentRole = response.headers.get('X-Current-User-Role')
    const suggestedPath = response.headers.get('X-Suggested-Path')

    if (currentRole && suggestedPath) {
      authLogger.debug('Better Auth role information received', {
        currentRole,
        suggestedPath,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      })

      // Only redirect if user is on wrong page for their role
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const shouldRedirect = 
          (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') && !currentPath.startsWith('/admin') ||
          (currentRole === 'TECHNICIAN') && !currentPath.startsWith('/technician') ||
          (currentRole === 'CUSTOMER') && !currentPath.startsWith('/dashboard')

        if (shouldRedirect && currentPath !== suggestedPath) {
          authLogger.info('Better Auth role-based correction needed', {
            currentRole,
            currentPath,
            suggestedPath
          })
          
          window.location.href = suggestedPath
          return true
        }
      }
    }

  } catch (error) {
    authLogger.error('Better Auth redirect handler failed', error)
  }

  return false
}

/**
 * Creates a wrapper for Better Auth API calls that handles redirects
 */
export function withBetterAuthRedirect<T extends (...args: any[]) => Promise<any>>(
  authFunction: T
): T {
  return (async (...args: any[]) => {
    try {
      const result = await authFunction(...args)
      
      // Check if the result has response headers (fetch response)
      if (result && typeof result === 'object' && 'headers' in result) {
        handleBetterAuthRedirect(result as Response)
      }
      
      return result
    } catch (error) {
      authLogger.error('Better Auth wrapped function failed', error)
      throw error
    }
  }) as T
}