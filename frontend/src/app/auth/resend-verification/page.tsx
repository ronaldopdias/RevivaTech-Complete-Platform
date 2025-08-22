'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    
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
        setStatus('success');
        setMessage('Verification email sent! Please check your inbox and spam folder.');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred. Please try again.');
      console.error('Resend verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
              Resend Verification Email
            </CardTitle>
            <CardDescription>
              Enter your email address to receive a new verification link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'success' ? (
              <div className="text-center space-y-4">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  Verification Email Sent!
                </h3>
                <p className="text-muted-foreground">{message}</p>
                
                <div className="space-y-3 pt-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Check your email:</strong> We've sent a verification link to {email}. 
                      The link will expire in 24 hours.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Can't find the email?</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li>Check your spam/junk folder</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>Wait a few minutes for delivery</li>
                      <li>Try resending if needed</li>
                    </ul>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatus('idle');
                      setMessage('');
                    }}
                    className="w-full"
                  >
                    Send to Different Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                {status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email || !isValidEmail(email)}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending Verification Email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Verification Email
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                </div>
              </form>
            )}

            {/* Help Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Need Help?</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>If you continue to have issues with email verification:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Contact our support team</li>
                  <li>Check your email provider's security settings</li>
                  <li>Try using a different email address</li>
                </ul>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:support@revivatech.co.uk" className="text-blue-600 hover:underline">
                    support@revivatech.co.uk
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>📞</span>
                  <span>+44 207 123 4567</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already verified your email?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}