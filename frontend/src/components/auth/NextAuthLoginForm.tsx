'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { getAuthErrorMessage, extractErrorCode } from '@/lib/auth/error-messages'
import type { LoginCredentials } from '@/lib/auth/types'
import type { AuthError } from '@/lib/auth/error-messages'

/**
 * Professional login form using NextAuth.js
 * Enterprise-grade authentication with proper error handling
 */
export function NextAuthLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({})

  const validateForm = (): boolean => {
    const errors: {email?: string, password?: string} = {}
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 3) {
      errors.password = 'Password must be at least 3 characters'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Client-side validation
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // Extract error code and get user-friendly message
        const errorCode = extractErrorCode(result.error)
        const errorMessage = getAuthErrorMessage(errorCode)
        setError(errorMessage)
        return
      }

      if (result?.ok) {
        // Professional redirect handling with role-based routing
        router.push(returnUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorCode = extractErrorCode(error)
      const errorMessage = getAuthErrorMessage(errorCode)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setFieldErrors({})
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear errors when user starts typing
    if (error) setError(null)
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto p-8 shadow-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-trust-500 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">RT</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
        <p className="text-neutral-600">Sign in to access your RevivaTech account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onRetry={error.recoverable ? handleRetry : undefined}
            className="mb-4"
          />
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              className={fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              disabled={isLoading}
              className="w-full"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className={`w-full ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-4 w-4 text-trust-500 border-neutral-300 rounded focus:ring-trust-500"
              />
              <span className="ml-2 text-sm text-neutral-700">Remember me</span>
            </label>

            <a
              href="/auth/forgot-password"
              className="text-sm text-trust-600 hover:text-trust-700 transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          icon={isLoading ? { component: () => (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ), position: 'left' } : undefined}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{' '}
          <a
            href="/auth/register"
            className="text-trust-600 hover:text-trust-700 font-medium transition-colors"
          >
            Create one here
          </a>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 text-center">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-trust-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-trust-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </Card>
  )
}

export default NextAuthLoginForm