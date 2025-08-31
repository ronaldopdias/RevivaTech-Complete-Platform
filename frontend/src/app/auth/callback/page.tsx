'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth/better-auth-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isLoading } = useSession()

  useEffect(() => {
    const handleCallback = async () => {
      // Get error from URL params (if any)
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        console.error('[Auth Callback] OAuth error:', error, errorDescription)
        // Redirect to login with error
        router.push('/auth/signin?error=' + encodeURIComponent(errorDescription || error))
        return
      }

      // Wait a moment for Better Auth to process the callback
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (isLoading) return // Still loading

      if (!session?.user) {
        console.error('[Auth Callback] No session found after callback')
        router.push('/auth/signin?error=' + encodeURIComponent('Authentication failed'))
        return
      }

      console.log('[Auth Callback] Authentication successful:', session.user)

      // Check if user needs profile completion
      try {
        const response = await fetch(`/api/profile-completion/status?userId=${session.user.id}`)
        const data = await response.json()

        if (data.success && data.needsCompletion) {
          console.log('[Auth Callback] Profile completion required')
          router.push('/auth/complete-profile')
        } else {
          console.log('[Auth Callback] Profile complete, redirecting to dashboard')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('[Auth Callback] Profile status check failed:', err)
        // Default to dashboard if status check fails
        router.push('/dashboard')
      }
    }

    // Small delay to ensure Better Auth has processed the callback
    const timer = setTimeout(handleCallback, 500)
    return () => clearTimeout(timer)
  }, [session, isLoading, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing Authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}