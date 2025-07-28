'use client'

import { useSession as useNextAuthSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { getAuthErrorMessage, extractErrorCode } from "./error-messages"
import type { UserRole, LoginCredentials, SessionUtils } from "./types"
import type { AuthError } from "./error-messages"
// Role checking utilities (client-side compatible)
function hasRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

function checkPermission(userRole: UserRole, resource: string, action: string): boolean {
  // Client-side permission checking (simplified)
  const ROLE_HIERARCHY = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    TECHNICIAN: 2,
    CUSTOMER: 1
  }
  
  // Super admin has all permissions
  if (userRole === 'SUPER_ADMIN') return true
  
  // Basic role-based access
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  
  // Admin-only resources
  if (['users', 'settings', 'reports', 'database', 'procedures', 'cms', 'email', 'templates', 'messages', 'training', 'analytics', 'media', 'payments', 'schedule'].includes(resource)) {
    return userLevel >= 3 // ADMIN or above
  }
  
  // Technician-level resources
  if (['repairs', 'inventory', 'customers', 'pricing'].includes(resource)) {
    return userLevel >= 2 // TECHNICIAN or above
  }
  
  // Customer resources (own data only)
  if (['profile', 'bookings'].includes(resource)) {
    return userLevel >= 1 // Any authenticated user
  }
  
  return false
}

/**
 * Professional client-side authentication hooks for RevivaTech
 * Enterprise-grade session management and utilities
 */

/**
 * Enhanced useSession hook with professional utilities
 */
export function useSession() {
  const { data: session, status, update } = useNextAuthSession()
  
  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status,
    update,
    // Professional session utilities
    session,
  }
}

/**
 * Professional authentication actions hook
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, update } = useSession()
  const router = useRouter()
  const [authError, setAuthError] = useState<AuthError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const login = useCallback(async (credentials: LoginCredentials, retryCount = 0) => {
    try {
      setAuthError(null)
      console.log('=== CLIENT LOGIN ATTEMPT ===')
      console.log('Email:', credentials.email)
      console.log('Retry count:', retryCount)
      
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      console.log('SignIn result:', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      })

      if (result?.error) {
        const errorCode = extractErrorCode(result.error)
        const errorMessage = getAuthErrorMessage(errorCode)
        setAuthError(errorMessage)
        
        console.error('Login error:', {
          errorCode,
          errorMessage,
          originalError: result.error
        })
        
        // Auto-retry for network errors (max 2 retries)
        if (errorCode === 'NETWORK_ERROR' && retryCount < 2) {
          console.log('Retrying login due to network error...')
          setIsRetrying(true)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          setIsRetrying(false)
          return login(credentials, retryCount + 1)
        }
        
        throw new Error(errorCode)
      }

      if (result?.ok) {
        setAuthError(null)
        console.log('Login successful, updating session...')
        
        // Professional role-based redirection
        const updatedSession = await update()
        const userRole = updatedSession?.user?.role
        
        console.log('Updated session:', {
          hasUser: !!updatedSession?.user,
          userEmail: updatedSession?.user?.email,
          userRole
        })

        switch (userRole) {
          case 'ADMIN':
          case 'SUPER_ADMIN':
            console.log('Redirecting to admin dashboard')
            router.push('/admin')
            break
          case 'TECHNICIAN':
            console.log('Redirecting to technician dashboard')
            router.push('/technician')
            break
          default:
            console.log('Redirecting to customer dashboard')
            router.push('/dashboard')
        }
      }

      return result
    } catch (error) {
      const errorCode = extractErrorCode(error)
      const errorMessage = getAuthErrorMessage(errorCode)
      setAuthError(errorMessage)
      console.error('Login error caught:', {
        errorCode,
        errorMessage,
        originalError: error
      })
      throw error
    }
  }, [router, update])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [router])

  // Professional role checking utilities
  const checkRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user?.role) return false
    return hasRole(user.role, role)
  }, [user?.role])

  const checkPermissionCallback = useCallback((resource: string, action: string) => {
    if (!user?.role) return false
    return checkPermission(user.role, resource, action)
  }, [user?.role])

  const isAdmin = useCallback(() => {
    return checkRole(['ADMIN', 'SUPER_ADMIN'])
  }, [checkRole])

  const isTechnician = useCallback(() => {
    return checkRole('TECHNICIAN')
  }, [checkRole])

  const isCustomer = useCallback(() => {
    return checkRole('CUSTOMER')
  }, [checkRole])

  return {
    // Core auth state
    user,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    logout,
    
    // Error handling
    authError,
    clearError,
    isRetrying,
    
    // Professional utilities
    checkRole,
    checkPermission: checkPermissionCallback,
    isAdmin,
    isTechnician,
    isCustomer,
    
    // Session management
    update,
  }
}

/**
 * Professional session utilities hook
 */
export function useSessionUtils(): SessionUtils {
  const { user } = useSession()

  const checkRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user?.role) return false
    return hasRole(user.role, role)
  }, [user?.role])

  const checkPermissionCallback = useCallback((resource: string, action: string) => {
    if (!user?.role) return false
    return checkPermission(user.role, resource, action)
  }, [user?.role])

  const isAdmin = useCallback(() => {
    return checkRole(['ADMIN', 'SUPER_ADMIN'])
  }, [checkRole])

  const isTechnician = useCallback(() => {
    return checkRole('TECHNICIAN')
  }, [checkRole])

  const isCustomer = useCallback(() => {
    return checkRole('CUSTOMER')
  }, [checkRole])

  return {
    checkRole,
    checkPermission: checkPermissionCallback,
    isAdmin,
    isTechnician,
    isCustomer,
  }
}

/**
 * Professional redirect hook for protected routes
 */
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useSession()
  const router = useRouter()

  const redirectToLogin = useCallback((returnUrl?: string) => {
    const url = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
    router.push(url)
  }, [router])

  const redirectToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const redirectToAdmin = useCallback(() => {
    router.push('/admin')
  }, [router])

  return {
    isAuthenticated,
    isLoading,
    redirectToLogin,
    redirectToDashboard,
    redirectToAdmin,
  }
}

/**
 * Professional authentication state provider utilities
 */
export function useAuthState() {
  const { user, isAuthenticated, isLoading } = useSession()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error: null, // NextAuth.js handles errors differently
  }
}