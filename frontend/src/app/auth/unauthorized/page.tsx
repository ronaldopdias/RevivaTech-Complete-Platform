import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Home, LogIn, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Access Denied | RevivaTech',
  description: 'You do not have permission to access this resource.',
}

/**
 * Professional unauthorized access page
 * Handles role-based access control violations
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        {/* Access Denied Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Access Denied
          </h1>
          <p className="text-neutral-600 mb-4">
            You don't have permission to access this resource.
          </p>
          <p className="text-sm text-neutral-500">
            This area is restricted to authorized users only. If you believe you should have access, please contact your administrator.
          </p>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          <Button
            asChild
            variant="primary"
            size="lg"
            fullWidth
            icon={{ component: LogIn, position: 'left' }}
          >
            <Link href="/login">
              Sign In with Different Account
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            fullWidth
            icon={{ component: Home, position: 'left' }}
          >
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>

          {/* Contact Support */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            fullWidth
            icon={{ component: Mail, position: 'left' }}
          >
            <Link href="/contact" className="text-sm">
              Request Access
            </Link>
          </Button>
        </div>

        {/* Help Information */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="text-left space-y-2">
            <h3 className="text-sm font-medium text-neutral-900">Need access?</h3>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li>• Contact your system administrator</li>
              <li>• Verify you're using the correct account</li>
              <li>• Check if your permissions have changed</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}