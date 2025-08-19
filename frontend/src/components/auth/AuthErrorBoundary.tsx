'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/auth/types';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userRole?: UserRole;
  enableRoleBasedFallback?: boolean;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Authentication Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Enhanced error reporting for auth issues
    if (error.message.includes('auth') || error.message.includes('session') || error.message.includes('token')) {
      console.error('[Auth Error Boundary] Authentication-related error detected:', {
        error: error.message,
        stack: error.stack,
        errorInfo,
        userRole: this.props.userRole
      });
    }
  }

  private getRoleBasedFallbackPath = (): string => {
    const { userRole } = this.props;
    
    switch (userRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return '/admin';
      case UserRole.TECHNICIAN:
        return '/technician';
      case UserRole.CUSTOMER:
        return '/dashboard';
      default:
        return '/login';
    }
  };

  private handleRoleBasedRetry = () => {
    const fallbackPath = this.getRoleBasedFallbackPath();
    console.log(`[Auth Error Boundary] Redirecting to role-based fallback: ${fallbackPath}`);
    window.location.href = fallbackPath;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { enableRoleBasedFallback, userRole } = this.props;
      const { error } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-6 max-w-md mx-auto p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication Error</h2>
            <p className="text-sm text-gray-600">
              {error?.message.includes('auth') || error?.message.includes('session') 
                ? 'There was an issue with your authentication session. This might be due to an expired session or network connectivity issues.'
                : 'Something went wrong with the authentication system. Please try refreshing the page.'}
            </p>
            
            {userRole && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                Role: {userRole}
              </div>
            )}
            
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              
              {enableRoleBasedFallback && userRole && (
                <button
                  onClick={this.handleRoleBasedRetry}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to {userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN ? 'Admin' : 
                         userRole === UserRole.TECHNICIAN ? 'Technician' : 'Customer'} Dashboard
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;