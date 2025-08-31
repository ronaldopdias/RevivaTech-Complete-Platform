'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth';
import { useProfileCompletion } from '@/lib/auth/useProfileCompletion';
import Card from '@/components/ui/Card';
import { CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';

export interface OAuthHandlerProps {
  /** Redirect URL after successful authentication */
  redirectTo?: string;
  /** Show loading messages */
  showMessages?: boolean;
}

/**
 * OAuth Handler Component
 * 
 * Handles the post-OAuth redirect flow and determines if user needs
 * to complete their profile before proceeding to the main application.
 * 
 * Flow:
 * 1. User completes OAuth with Google
 * 2. This component checks if profile is complete
 * 3. If incomplete (missing phone), redirect to profile completion
 * 4. If complete, redirect to intended destination
 */
export const OAuthHandler: React.FC<OAuthHandlerProps> = ({
  redirectTo = '/dashboard',
  showMessages = true,
}) => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { needsProfileCompletion, status, isLoading } = useProfileCompletion();
  const [message, setMessage] = useState('Completing sign-in...');
  const [step, setStep] = useState<'checking' | 'redirecting' | 'complete' | 'error'>('checking');

  useEffect(() => {
    const handleOAuthComplete = async () => {
      // Wait for session to load
      if (isPending) {
        setMessage('Verifying authentication...');
        return;
      }

      // Not authenticated - redirect to login
      if (!session?.user) {
        setStep('error');
        setMessage('Authentication failed. Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      setMessage('Checking profile status...');

      // Wait for profile completion status to load
      if (isLoading) {
        return;
      }

      // Profile needs completion
      if (needsProfileCompletion) {
        setStep('redirecting');
        setMessage('Profile incomplete. Redirecting to complete registration...');
        
        // Small delay for better UX
        setTimeout(() => {
          router.push(`/auth/complete-profile?redirect=${encodeURIComponent(redirectTo)}`);
        }, 1500);
        return;
      }

      // Profile is complete - redirect to intended destination
      setStep('complete');
      setMessage('Welcome! Redirecting to your dashboard...');
      
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
    };

    handleOAuthComplete();
  }, [session, isPending, needsProfileCompletion, isLoading, router, redirectTo]);

  if (!showMessages) {
    return null;
  }

  const renderIcon = () => {
    switch (step) {
      case 'checking':
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>;
      case 'redirecting':
        return <ArrowRight className="h-12 w-12 text-blue-500 mx-auto mb-4" />;
      case 'complete':
        return <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />;
      default:
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>;
    }
  };

  const getMessageColor = () => {
    switch (step) {
      case 'error':
        return 'text-red-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {renderIcon()}
        
        <h1 className="text-xl font-semibold mb-2">
          {step === 'error' ? 'Authentication Error' : 'Completing Sign In'}
        </h1>
        
        <p className={`${getMessageColor()}`}>
          {message}
        </p>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-xs space-y-1">
            <div><strong>Debug Info:</strong></div>
            <div>Session: {session?.user ? 'Loaded' : 'Loading...'}</div>
            <div>User ID: {session?.user?.id || 'N/A'}</div>
            <div>Profile Status: {status?.registrationStatus || 'Loading...'}</div>
            <div>Needs Completion: {needsProfileCompletion ? 'Yes' : 'No'}</div>
            <div>Step: {step}</div>
          </div>
        )}

        {/* Manual continue button for errors */}
        {step === 'error' && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/login')}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Return to Login
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * Higher-order component to wrap pages that might need OAuth handling
 */
export function withOAuthHandler<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string }
) {
  return function WrappedComponent(props: P) {
    const { needsProfileCompletion, isLoading } = useProfileCompletion();
    const { data: session, isPending } = useSession();
    
    // Show OAuth handler if we're still determining auth status
    if (isPending || isLoading) {
      return <OAuthHandler redirectTo={options?.redirectTo} />;
    }
    
    // Show OAuth handler if user needs profile completion
    if (session?.user && needsProfileCompletion) {
      return <OAuthHandler redirectTo={options?.redirectTo} />;
    }
    
    // Render the wrapped component
    return <Component {...props} />;
  };
}