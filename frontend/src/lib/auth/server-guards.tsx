import { redirect } from "next/navigation"
import { auth, hasRole, checkPermission } from "./server"
import type { UserRole, AuthGuardProps } from "./types"

/**
 * Professional server-side authentication guards for RevivaTech
 * Enterprise-grade route protection and access control
 */

/**
 * Server-side authentication guard for app router
 * Professional route protection with role-based access control
 */
export async function AuthGuard({ 
  children, 
  requiredRole,
  requiredPermissions,
  fallback = <AccessDenied />,
  redirectTo = '/login'
}: AuthGuardProps) {
  const session = await auth()
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect(redirectTo)
  }
  
  // Check role requirements
  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    return fallback
  }
  
  // Check permission requirements
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      checkPermission(session.user.role, resource, action)
    )
    
    if (!hasAllPermissions) {
      return fallback
    }
  }
  
  return <>{children}</>
}

/**
 * Professional admin-only guard
 */
export async function AdminGuard({ 
  children, 
  fallback = <AccessDenied /> 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <AuthGuard 
      requiredRole={['ADMIN', 'SUPER_ADMIN']}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  )
}

/**
 * Professional technician-only guard
 */
export async function TechnicianGuard({ 
  children, 
  fallback = <AccessDenied /> 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <AuthGuard 
      requiredRole={['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN']}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  )
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

/**
 * Professional permission-based guard
 */
export async function PermissionGuard({
  children,
  resource,
  action,
  fallback = <AccessDenied />
}: {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
}) {
  return (
    <AuthGuard
      requiredPermissions={[{ resource, action }]}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  )
}