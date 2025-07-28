# Building the Login Component from Scratch - Complete Guide

## 📋 Overview

This guide provides step-by-step instructions for building a complete, production-ready login component for the RevivaTech platform from scratch. The component integrates with NextAuth.js, includes comprehensive error handling, and follows the established design system.

## 🎯 Learning Objectives

After following this guide, you will understand:
- How to build a secure login form with NextAuth.js
- Proper error handling and user feedback
- Form validation and state management
- Integration with the RevivaTech design system
- Accessibility best practices
- Responsive design implementation

## 🏗️ Architecture Overview

### Component Structure
```
LoginComponent
├── LoginForm (Main Form)
├── ErrorDisplay (Error Handling)
├── LoadingState (Loading Indicators)
├── SuccessRedirect (Post-login)
└── FormValidation (Client-side Validation)
```

### Dependencies Required
- Next.js 14+ with App Router
- NextAuth.js v5
- React Hook Form
- Zod for validation
- Tailwind CSS for styling
- Lucide React for icons

## 🚀 Step 1: Project Setup and Dependencies

### Install Required Dependencies
```bash
# Navigate to frontend directory
cd /opt/webapps/revivatech/frontend

# Install form dependencies
npm install react-hook-form @hookform/resolvers zod

# Install UI dependencies (if not already installed)
npm install lucide-react clsx class-variance-authority

# Install NextAuth.js (if not already installed)
npm install next-auth@beta
```

### TypeScript Types Setup
Create types file: `/frontend/src/types/auth.ts`
```typescript
// Authentication types for the login component
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface AuthError {
  code: string
  message: string
  field?: string
}

export interface LoginResponse {
  success: boolean
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
  }
  error?: AuthError
  redirect?: string
}

export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'SUPER_ADMIN'

export interface AuthState {
  isLoading: boolean
  error: AuthError | null
  isAuthenticated: boolean
  user: User | null
}
```

## 🎨 Step 2: Design System Components

### Create Base Input Component
File: `/frontend/src/components/ui/FormInput.tsx`
```typescript
'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  onRightIconClick?: () => void
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    leftIcon: LeftIcon, 
    rightIcon: RightIcon,
    onRightIconClick,
    ...props 
  }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LeftIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
              "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              LeftIcon && "pl-10",
              RightIcon && "pr-10",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {RightIcon && (
            <div 
              className={cn(
                "absolute inset-y-0 right-0 pr-3 flex items-center",
                onRightIconClick ? "cursor-pointer" : "pointer-events-none"
              )}
              onClick={onRightIconClick}
            >
              <RightIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="w-4 h-4">⚠️</span>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = "FormInput"

export { FormInput }
```

### Create Loading Button Component
File: `/frontend/src/components/ui/LoadingButton.tsx`
```typescript
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, LucideIcon } from 'lucide-react'

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500"
  }
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm h-9",
    md: "px-4 py-2 text-sm h-10",
    lg: "px-6 py-3 text-base h-12"
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {children}
        </>
      )}
    </button>
  )
}

export { LoadingButton }
```

## 🔐 Step 3: Form Validation Schema

### Create Validation Schema
File: `/frontend/src/lib/validations/auth.ts`
```typescript
import { z } from 'zod'

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  
  rememberMe: z.boolean().default(false)
})

export type LoginFormData = z.infer<typeof loginSchema>

// Error message mapping for better UX
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  
  // NextAuth error mapping
  switch (error?.code || error?.type) {
    case 'CredentialsSignin':
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password. Please check your credentials and try again.'
    
    case 'ACCOUNT_LOCKED':
      return 'Your account has been temporarily locked due to too many failed attempts. Please try again later.'
    
    case 'TOO_MANY_ATTEMPTS':
      return 'Too many login attempts. Please wait a few minutes before trying again.'
    
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.'
    
    case 'SERVER_ERROR':
      return 'Server error occurred. Please try again later.'
    
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.'
    
    case 'Configuration':
      return 'Authentication service is temporarily unavailable. Please try again later.'
    
    default:
      return error?.message || 'An unexpected error occurred. Please try again.'
  }
}
```

## 🎯 Step 4: Main Login Component

### Create the Login Form Component
File: `/frontend/src/components/auth/LoginForm.tsx`
```typescript
'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

import { FormInput } from '@/components/ui/FormInput'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useAuth } from '@/lib/auth/client'
import { loginSchema, LoginFormData, getErrorMessage } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  className?: string
  onSuccess?: (user: any) => void
  redirectUrl?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  className,
  onSuccess,
  redirectUrl: propRedirectUrl
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
  // Get redirect URL from props or search params
  const redirectUrl = propRedirectUrl || searchParams.get('returnUrl') || '/admin'

  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setError: setFieldError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Handle form submission
  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('=== LOGIN FORM SUBMISSION ===')
      console.log('Email:', data.email)
      console.log('Remember Me:', data.rememberMe)
      
      // Attempt login
      const result = await login({
        email: data.email,
        password: data.password
      })
      
      console.log('Login result:', result)
      
      if (result?.ok) {
        // Success - handle redirect
        console.log('Login successful, redirecting to:', redirectUrl)
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result)
        }
        
        // Clear form
        reset()
        
        // Redirect to appropriate page
        router.push(redirectUrl)
        
      } else if (result?.error) {
        // Handle login errors
        const errorMessage = getErrorMessage(result.error)
        setError(errorMessage)
        
        // Set field-specific errors if applicable
        if (result.error.includes('email')) {
          setFieldError('email', { message: errorMessage })
        } else if (result.error.includes('password')) {
          setFieldError('password', { message: errorMessage })
        }
      } else {
        setError('Login failed. Please try again.')
      }
      
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [login, redirectUrl, onSuccess, router, reset, setFieldError])

  // Handle form errors
  const handleFormError = useCallback((errors: any) => {
    console.error('Form validation errors:', errors)
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      setError(firstError.message)
    }
  }, [])

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600">
          Sign in to your RevivaTech account
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        {/* Email Field */}
        <FormInput
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={Mail}
          error={errors.email?.message}
          required
          autoComplete="email"
          autoFocus
        />

        {/* Password Field */}
        <FormInput
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter your password"
          leftIcon={Lock}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={togglePasswordVisibility}
          error={errors.password?.message}
          required
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Remember me</span>
          </label>
          
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <LoadingButton
          type="submit"
          loading={isLoading}
          loadingText="Signing in..."
          icon={LogIn}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!isValid}
        >
          Sign In
        </LoadingButton>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            href="/register" 
            className="text-blue-600 hover:text-blue-500 font-medium hover:underline"
          >
            Create one now
          </Link>
        </p>
      </div>

      {/* Support Link */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Need help?{' '}
          <Link 
            href="/contact" 
            className="text-blue-600 hover:text-blue-500 hover:underline"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
```

## 📄 Step 5: Create the Login Page

### Main Login Page Component
File: `/frontend/src/app/login/page.tsx`
```typescript
import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In | RevivaTech',
  description: 'Sign in to your RevivaTech account to manage your device repairs and bookings.',
  robots: 'noindex, nofollow', // Prevent indexing of login page
}

/**
 * Login Page - Unified authentication entry point
 * Replaces both /login and /auth/login routes for consistency
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Suspense wrapper for useSearchParams */}
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
```

### Login Page Layout (Optional)
File: `/frontend/src/app/login/layout.tsx`
```typescript
import { ReactNode } from 'react'

interface LoginLayoutProps {
  children: ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Trust Indicators */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-sm text-gray-600">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span>Secure SSL Connection</span>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        © 2025 RevivaTech. All rights reserved.
      </div>
    </div>
  )
}
```

## 🧪 Step 6: Testing and Validation

### Create Test File
File: `/frontend/src/components/auth/__tests__/LoginForm.test.tsx`
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { useAuth } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/auth/client')
jest.mock('next/navigation')

const mockLogin = jest.fn()
const mockPush = jest.fn()

beforeEach(() => {
  (useAuth as jest.Mock).mockReturnValue({
    login: mockLogin
  });
  
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush
  })
})

describe('LoginForm', () => {
  it('renders login form correctly', () => {
    render(<LoginForm />)
    
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ ok: true })
    
    render(<LoginForm />)
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ 
      ok: false, 
      error: 'Invalid credentials' 
    })
    
    render(<LoginForm />)
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
```

### Manual Testing Checklist
```markdown
## Login Component Testing Checklist

### Visual Testing
- [ ] Form renders correctly on desktop
- [ ] Form renders correctly on mobile
- [ ] Icons display properly
- [ ] Loading states work
- [ ] Error states display correctly
- [ ] Focus states are visible

### Functionality Testing
- [ ] Email validation works
- [ ] Password validation works
- [ ] Password visibility toggle works
- [ ] Remember me checkbox works
- [ ] Form submission works
- [ ] Error handling works
- [ ] Success redirect works

### Accessibility Testing
- [ ] Form is keyboard navigable
- [ ] Screen reader friendly
- [ ] Proper ARIA labels
- [ ] Focus management
- [ ] Error announcements

### Integration Testing
- [ ] NextAuth integration works
- [ ] Backend API integration works
- [ ] Route handling works
- [ ] State management works
```

## 🎨 Step 7: Styling and Responsive Design

### Mobile-First CSS Enhancements
File: `/frontend/src/components/auth/LoginForm.module.css`
```css
/* Enhanced styles for the login form */
.loginContainer {
  @apply w-full max-w-md mx-auto;
}

.loginForm {
  @apply space-y-6;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .loginContainer {
    @apply px-4;
  }
  
  .loginForm {
    @apply space-y-4;
  }
}

/* Focus and interaction states */
.formInput:focus-within {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

.submitButton {
  @apply transform transition-transform duration-150 ease-in-out;
}

.submitButton:active {
  @apply scale-95;
}

/* Loading animations */
.loadingSpinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Error shake animation */
.errorShake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}
```

### Dark Mode Support (Optional)
```typescript
// Add to LoginForm component
const [isDarkMode, setIsDarkMode] = useState(false)

// Update className with dark mode support
className={cn(
  "w-full max-w-md mx-auto",
  isDarkMode ? "dark" : "",
  className
)}

// Dark mode styles
const darkModeClasses = {
  container: "dark:bg-gray-900 dark:text-white",
  form: "dark:bg-gray-800 dark:border-gray-700",
  input: "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
  button: "dark:bg-blue-700 dark:hover:bg-blue-800"
}
```

## 🔒 Step 8: Security Enhancements

### Rate Limiting Protection
```typescript
// Add to LoginForm component
const [attemptCount, setAttemptCount] = useState(0)
const [lockoutTime, setLockoutTime] = useState<Date | null>(null)

const isLockedOut = lockoutTime && new Date() < lockoutTime

const handleFailedAttempt = useCallback(() => {
  const newAttemptCount = attemptCount + 1
  setAttemptCount(newAttemptCount)
  
  if (newAttemptCount >= 5) {
    // Lock out for 15 minutes after 5 failed attempts
    setLockoutTime(new Date(Date.now() + 15 * 60 * 1000))
    setError('Too many failed attempts. Please try again in 15 minutes.')
  }
}, [attemptCount])
```

### CSRF Protection
```typescript
// Add CSRF token to form submission
const [csrfToken, setCsrfToken] = useState('')

useEffect(() => {
  // Get CSRF token from NextAuth
  fetch('/api/auth/csrf')
    .then(res => res.json())
    .then(data => setCsrfToken(data.csrfToken))
}, [])

// Include in form submission
const onSubmit = async (data: LoginFormData) => {
  const result = await login({
    ...data,
    csrfToken
  })
  // ... rest of submission logic
}
```

## 📊 Step 9: Analytics and Monitoring

### Login Analytics Integration
```typescript
// Add analytics tracking
import { useAnalytics } from '@/lib/analytics'

const LoginForm = () => {
  const { trackEvent } = useAnalytics()
  
  const onSubmit = async (data: LoginFormData) => {
    // Track login attempt
    trackEvent('login_attempt', {
      method: 'email',
      timestamp: new Date().toISOString()
    })
    
    try {
      const result = await login(data)
      
      if (result?.ok) {
        // Track successful login
        trackEvent('login_success', {
          method: 'email',
          user_role: result.user?.role,
          timestamp: new Date().toISOString()
        })
      } else {
        // Track failed login
        trackEvent('login_failure', {
          method: 'email',
          error_type: result?.error,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      // Track login error
      trackEvent('login_error', {
        method: 'email',
        error_message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }
}
```

## 🚀 Step 10: Deployment and Optimization

### Performance Optimizations
```typescript
// Lazy load heavy dependencies
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Memoize expensive calculations
const memoizedValidation = useMemo(() => {
  return loginSchema
}, [])

// Debounce form validation
import { useDebouncedCallback } from 'use-debounce'

const debouncedValidation = useDebouncedCallback(
  (value) => {
    // Perform validation
  },
  300
)
```

### Bundle Size Optimization
```typescript
// Use dynamic imports for icons
const getIcon = async (iconName: string) => {
  const icons = await import('lucide-react')
  return icons[iconName]
}

// Tree-shake unused utilities
import { cn } from '@/lib/utils'
// Instead of: import * as utils from '@/lib/utils'
```

## 📚 Step 11: Documentation and Maintenance

### Component Documentation
```typescript
/**
 * LoginForm Component
 * 
 * A comprehensive login form component with the following features:
 * - Email and password validation using Zod
 * - NextAuth.js integration for authentication
 * - Comprehensive error handling and user feedback
 * - Responsive design with mobile-first approach
 * - Accessibility features and keyboard navigation
 * - Security features including rate limiting
 * 
 * @param className - Additional CSS classes
 * @param onSuccess - Callback function on successful login
 * @param redirectUrl - URL to redirect after successful login
 * 
 * @example
 * ```tsx
 * <LoginForm 
 *   onSuccess={(user) => console.log('User logged in:', user)}
 *   redirectUrl="/dashboard"
 * />
 * ```
 */
```

### Usage Examples
```typescript
// Basic usage
<LoginForm />

// With custom redirect
<LoginForm redirectUrl="/custom-dashboard" />

// With success callback
<LoginForm 
  onSuccess={(user) => {
    console.log('User logged in:', user)
    // Custom post-login logic
  }}
/>

// With custom styling
<LoginForm className="my-custom-styles" />
```

## 🎯 Success Criteria

### Functional Requirements ✅
- [ ] Form validates email and password correctly
- [ ] Integrates with NextAuth.js authentication
- [ ] Handles errors gracefully with user-friendly messages
- [ ] Redirects appropriately after successful login
- [ ] Supports "Remember Me" functionality
- [ ] Password visibility toggle works

### UX Requirements ✅
- [ ] Responsive design works on all devices
- [ ] Loading states provide clear feedback
- [ ] Error states are clear and actionable
- [ ] Form is accessible via keyboard navigation
- [ ] Focus management works properly

### Security Requirements ✅
- [ ] No sensitive data stored in client state
- [ ] CSRF protection implemented
- [ ] Rate limiting prevents brute force attacks
- [ ] Proper error messages don't leak information
- [ ] Form data is properly sanitized

### Performance Requirements ✅
- [ ] Component loads quickly (< 1s)
- [ ] Form submission is responsive (< 2s)
- [ ] Bundle size is optimized
- [ ] No unnecessary re-renders

## 🛠️ Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Configuration" Error
**Cause**: NextAuth secret not properly configured
**Solution**: Ensure `NEXTAUTH_SECRET` is set in environment variables

#### Issue: Form Not Submitting
**Cause**: Validation errors or missing dependencies
**Solution**: Check browser console for errors and verify all dependencies are installed

#### Issue: Styling Issues
**Cause**: Tailwind CSS not configured properly
**Solution**: Verify Tailwind CSS is installed and configured correctly

#### Issue: Authentication Not Working
**Cause**: Backend API not responding or misconfigured
**Solution**: Test backend API endpoints directly and check configuration

## 📋 Maintenance Checklist

### Weekly Maintenance
- [ ] Test login functionality with different user roles
- [ ] Check for console errors
- [ ] Verify responsive design on different devices
- [ ] Test accessibility features

### Monthly Maintenance
- [ ] Update dependencies
- [ ] Review error logs
- [ ] Performance audit
- [ ] Security review

### Quarterly Maintenance
- [ ] Full security audit
- [ ] UX review and improvements
- [ ] Update documentation
- [ ] Review analytics data

---

**Document Version**: 1.0  
**Last Updated**: July 26, 2025  
**Author**: Claude (Anthropic)  
**Status**: Production Ready  

*This guide provides complete implementation details for building a production-ready login component. Follow all steps carefully and refer to the troubleshooting section for common issues.*