'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import { useAuth, signIn, signInSocial } from '@/lib/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
  className?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectUrl,
  className,
}) => {
  const { signIn, isLoading } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setGeneralError('');
    
    try {
      await signIn({
        email: credentials.email,
        password: credentials.password,
      });
      
      // Clear any previous errors
      setValidationErrors({});
      setGeneralError('');
      onSuccess?.();
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError('Invalid email or password. Please try again.');
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError('');
    }
  };

  return (
    <Card className={cn('w-full max-w-md p-8 text-gray-900 bg-white border-0', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#000000' }}>Welcome Back</h2>
          <p className="text-base mt-2 font-medium" style={{ color: '#333333' }}>
            Sign in to access your repair dashboard
          </p>
        </div>

        {/* General Error Message */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{generalError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: '#000000' }}>
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              className={cn(
                'text-black placeholder:text-gray-500 bg-white border-gray-300 focus:border-gray-400',
                validationErrors.email ? 'border-red-500' : ''
              )}
              autoComplete="email"
            />
            {validationErrors.email && (
              <p className="text-xs text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#000000' }}>
                Password
              </label>
              <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                className={cn(
                  'text-black placeholder:text-gray-500 bg-white border-gray-300 focus:border-gray-400',
                  validationErrors.password ? 'border-red-500' : ''
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-xs text-red-600">{validationErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={credentials.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: '#444444' }}>
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 border-0"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">⏳</span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2" style={{ color: '#666666' }}>Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setGeneralError('');
                await signInSocial({
                  provider: "google",
                });
                // The redirect will be handled by Better Auth automatically
                onSuccess?.();
              } catch (error) {
                console.error('Google sign-in failed:', error);
                setGeneralError('Failed to sign in with Google. Please try again.');
              }
            }}
            disabled={isLoading}
            className="text-black border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              <path fill="none" d="M1 1h22v22H1z"/>
            </svg>
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Apple login')}
            disabled={isLoading}
            className="text-black border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span style={{ color: '#444444' }}>Don't have an account? </span>
          <a href="/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </a>
        </div>

        {/* Demo Accounts */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <p className="text-xs font-bold mb-2" style={{ color: '#000000' }}>✅ Working Demo Accounts:</p>
            <div className="space-y-1 text-xs" style={{ color: '#000000' }}>
              <div className="flex justify-between items-center">
                <span>Super Admin: admin@revivatech.co.uk / AdminPass123</span>
                <span className="text-purple-600 text-xs">SUPER_ADMIN</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Technician: tech@revivatech.co.uk / TechPass123</span>
                <span className="text-green-600 text-xs">TECHNICIAN</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Customer: customer@revivatech.co.uk / CustomerPass123</span>
                <span className="text-blue-600 text-xs">CUSTOMER</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LoginForm;