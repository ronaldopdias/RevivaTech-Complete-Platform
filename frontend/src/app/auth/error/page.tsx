import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Authentication Error | RevivaTech',
  description: 'Authentication error - please try signing in again.',
}

interface AuthErrorPageProps {
  searchParams: {
    error?: string
    callbackUrl?: string
  }
}

/**
 * Professional NextAuth.js error page
 * Handles all authentication error scenarios with recovery options
 */
export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error, callbackUrl } = searchParams
  const returnUrl = callbackUrl || '/dashboard'

  // Map NextAuth.js error codes to user-friendly messages
  const getErrorContent = (errorCode?: string) => {
    switch (errorCode) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration.',
          action: 'Please contact our support team for assistance.',
          recoverable: false
        }

      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          action: 'Please contact your administrator if you believe this is an error.',
          recoverable: false
        }

      case 'Verification':
        return {
          title: 'Email Verification Required',
          message: 'Please verify your email address before signing in.',
          action: 'Check your email for a verification link, or request a new one.',
          recoverable: true
        }

      case 'CredentialsSignin':
        return {
          title: 'Sign In Failed',
          message: 'The email or password you entered is incorrect.',
          action: 'Please check your credentials and try again.',
          recoverable: true
        }

      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'You must be signed in to access this page.',
          action: 'Please sign in to continue.',
          recoverable: true
        }

      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          title: 'Sign In Error',
          message: 'There was a problem signing you in.',
          action: 'Please try again or use a different sign-in method.',
          recoverable: true
        }

      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This account is already associated with another sign-in method.',
          action: 'Please sign in with the original method you used to create this account.',
          recoverable: true
        }

      case 'EmailSignin':
        return {
          title: 'Email Sign In Error',
          message: 'The sign-in link is no longer valid.',
          action: 'Please request a new sign-in link.',
          recoverable: true
        }

      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          action: 'Please try signing in again. If the problem persists, contact support.',
          recoverable: true
        }
    }
  }

  const errorContent = getErrorContent(error)

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            {errorContent.title}
          </h1>
          <p className="text-neutral-600 mb-4">
            {errorContent.message}
          </p>
          <p className="text-sm text-neutral-500">
            {errorContent.action}
          </p>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          {errorContent.recoverable && (
            <Button
              asChild
              variant="primary"
              size="lg"
              fullWidth
              icon={{ component: RefreshCw, position: 'left' }}
            >
              <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}>
                Try Again
              </Link>
            </Button>
          )}

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
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Error Code for Debugging */}
        {error && (
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-400">
              Error Code: {error}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}