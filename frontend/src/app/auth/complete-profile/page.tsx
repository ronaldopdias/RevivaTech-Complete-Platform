'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth';
import { ProfileCompletionForm } from '@/components/auth/ProfileCompletionForm';
import Card from '@/components/ui/Card';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!session?.user?.id) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/profile-completion/status?userId=${session.user.id}`);
        const data = await response.json();

        if (data.success) {
          setNeedsCompletion(data.needsCompletion);
          
          // If profile is already complete, redirect
          if (!data.needsCompletion) {
            router.push(redirectTo);
            return;
          }
        } else {
          setError(data.error || 'Failed to check profile status');
        }
      } catch (err) {
        setError('Failed to check profile status');
        console.error('Profile status check error:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    if (!isPending) {
      checkProfileStatus();
    }
  }, [session, isPending, router, redirectTo]);

  const handleProfileComplete = () => {
    // Show success message and redirect
    router.push(`${redirectTo}?profile_completed=true`);
  };

  const handleSkip = () => {
    // Allow skipping for testing purposes
    router.push(redirectTo);
  };

  // Loading state while checking session or profile status
  if (isPending || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile...</p>
        </Card>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!session?.user) {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Unable to Load Profile</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  // Profile already complete - should have redirected, but show success message
  if (!needsCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Profile Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Your profile is already complete. You'll be redirected shortly.
          </p>
          <button 
            onClick={() => router.push(redirectTo)}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center mx-auto"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </Card>
      </div>
    );
  }

  // Main profile completion form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="w-12 h-0.5 bg-primary mx-2"></div>
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="w-12 h-0.5 bg-muted mx-2"></div>
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Step 2 of 3: Complete Your Profile
          </p>
        </div>

        <ProfileCompletionForm
          userId={session.user.id}
          onSuccess={handleProfileComplete}
          onSkip={process.env.NODE_ENV === 'development' ? handleSkip : undefined}
        />

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Need help?{' '}
            <a href="/contact" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}