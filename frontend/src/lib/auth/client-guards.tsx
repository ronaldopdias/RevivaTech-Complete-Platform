'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { UserRole } from "./types"

/**
 * Professional client-side authentication guards for RevivaTech
 * Enterprise-grade component protection with NextAuth.js
 */

interface ClientAuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
}

// Role checking utility (client-side compatible)
function hasRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

export function ClientAuthGuard({
  children,
  requiredRole,
  fallback = <AccessDenied />,
  redirectTo = '/login'
}: ClientAuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push(redirectTo)
      return
    }

    if (requiredRole && !hasRole(session.user.role, requiredRole)) {
      // For client-side, we don't redirect on role mismatch, just show fallback
      return
    }
  }, [session, status, requiredRole, redirectTo, router])

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-trust-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-neutral-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-sm text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Role check failed
  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Professional access denied component
 */
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center space-y-4 max-w-md mx-auto p-8">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-neutral-900">Access Denied</h2>
        <p className="text-sm text-neutral-600">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex space-x-4 justify-center mt-6">
          <a
            href="/dashboard"
            className="px-4 py-2 bg-trust-500 text-white rounded-md hover:bg-trust-600 transition-colors text-sm"
          >
            Go to Dashboard
          </a>
          <a
            href="/login"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors text-sm"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  )
}