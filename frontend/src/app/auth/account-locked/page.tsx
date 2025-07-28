import { Metadata } from 'next'
import Link from 'next/link'
import { Lock, Clock, Mail, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Account Locked | RevivaTech',
  description: 'Your account has been temporarily locked for security reasons.',
}

/**
 * Professional account locked page
 * Handles account security lockouts with recovery guidance
 */
export default function AccountLockedPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Account Temporarily Locked
          </h1>
          <p className="text-neutral-600 mb-4">
            Your account has been temporarily locked due to multiple failed login attempts.
          </p>
          <p className="text-sm text-neutral-500">
            This is a security measure to protect your account from unauthorized access.
          </p>
        </div>

        {/* Security Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-amber-600 mr-2" />
            <span className="text-sm font-medium text-amber-800">
              Security Lockout Active
            </span>
          </div>
          <p className="text-xs text-amber-700">
            Your account will be automatically unlocked in 15 minutes. You can also reset your password to regain immediate access.
          </p>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          <Button
            asChild
            variant="primary"
            size="lg"
            fullWidth
            icon={{ component: RefreshCw, position: 'left' }}
          >
            <Link href="/auth/forgot-password">
              Reset Password
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
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Help Information */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="text-left space-y-3">
            <h3 className="text-sm font-medium text-neutral-900">Security Tips:</h3>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li>• Use a strong, unique password</li>
              <li>• Don't share your login credentials</li>
              <li>• Consider using a password manager</li>
              <li>• Contact us if you suspect unauthorized access</li>
            </ul>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 p-3 bg-neutral-100 rounded-lg">
          <p className="text-xs text-neutral-600">
            <strong>Urgent Access Needed?</strong><br />
            Call our support team at <a href="tel:+442071234567" className="text-trust-600 hover:underline">+44 207 123 4567</a>
          </p>
        </div>
      </Card>
    </div>
  )
}