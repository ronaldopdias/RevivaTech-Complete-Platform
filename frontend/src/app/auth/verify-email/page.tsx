'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmailToken = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationToken })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        setEmail(result.email || '');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push(redirectUrl);
        }, 3000);
      } else {
        if (result.error?.includes('expired')) {
          setStatus('expired');
          setEmail(result.email || '');
        } else {
          setStatus('error');
        }
        setMessage(result.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred');
      console.error('Verification error:', error);
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage('Failed to resend verification email');
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <h2 className="text-xl font-semibold">Verifying Your Email</h2>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">Email Verified Successfully!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting you to your dashboard in 3 seconds...</p>
            
            <div className="space-y-3 pt-4">
              <Button onClick={() => router.push(redirectUrl)} className="w-full">
                Continue to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Go to Homepage
              </Button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400">Verification Link Expired</h2>
            <p className="text-muted-foreground">{message}</p>
            
            {email && (
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Would you like us to send a new verification email to <strong>{email}</strong>?
                </p>
                <Button 
                  onClick={resendVerification} 
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center space-y-4">
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The verification link may be invalid, expired, or already used. 
                Please try requesting a new verification email.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-4">
              <Button variant="outline" onClick={() => router.push('/auth/resend-verification')} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Request New Verification Email
              </Button>
              <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Homepage
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-blue-600">RevivaTech</h1>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5" />
              Email Verification
            </CardTitle>
            <CardDescription>
              Verifying your email address to complete registration
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@revivatech.co.uk" className="text-blue-600 hover:underline">
              support@revivatech.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}