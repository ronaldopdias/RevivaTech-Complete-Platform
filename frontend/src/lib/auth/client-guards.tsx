'use client'

import { useSession } from "./better-auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { User } from "better-auth/types"
import { UserRole, hasRole } from "./better-auth-client"

/**
 * Client-side authentication guards using official Better Auth patterns
 */

interface ClientAuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  )
}

export function ClientAuthGuard({
  children,
  requiredRole,
  fallback = <AccessDenied />,
  redirectTo = '/login'
}: ClientAuthGuardProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push(redirectTo)
    }
  }, [session, isPending, router, redirectTo])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  // Check role requirements
  if (requiredRole && requiredRole.length > 0) {
    const userRole = session.user.role as UserRole
    const hasRequiredRole = requiredRole.some(role => hasRole(userRole, [role]))
    
    if (!hasRequiredRole) {
      return fallback
    }
  }

  return <>{children}</>
}