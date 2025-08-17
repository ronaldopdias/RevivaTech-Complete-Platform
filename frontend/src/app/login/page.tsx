'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { Shield, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/auth/types';
import { useRoleBasedErrorHandling } from '@/lib/auth/useRoleBasedErrorHandling';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, session, isLoading } = useAuth();
  const { handleAuthError, handleRedirectError } = useRoleBasedErrorHandling();
  const [redirecting, setRedirecting] = useState(false);

  // Enhanced redirect function with comprehensive error handling and auth state validation
  const handleLoginSuccess = async () => {
    if (redirecting) {
      console.log('[Login] Redirect already in progress, skipping...');
      return;
    }
    
    setRedirecting(true);
    console.log('[Login] Success handler called, checking auth state...');
    
    // Enhanced function to extract role with validation
    const getUserRole = () => {
      try {
        // Try multiple sources for role data
        const roleFromUser = user?.role;
        const roleFromSession = session?.user?.role;
        const directRole = session?.role;
        
        console.log('[Login] Role sources:', { 
          userRole: roleFromUser, 
          sessionUserRole: roleFromSession, 
          directRole: directRole,
          userExists: !!user,
          sessionExists: !!session
        });
        
        return roleFromUser || roleFromSession || directRole;
      } catch (error) {
        console.error('[Login] Error extracting user role:', error);
        return null;
      }
    };

    // Enhanced retry logic using session data directly from Better Auth
    const waitForSessionAndRole = async (maxAttempts = 8, initialDelay = 50) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[Login] Attempt ${attempt}: Checking session and role...`);
          
          // Use session data directly (more reliable than derived isAuthenticated)
          const currentSession = session;
          const sessionUser = currentSession?.user || currentSession;
          
          console.log(`[Login] Session check:`, {
            hasSession: !!currentSession,
            hasUser: !!sessionUser,
            sessionEmail: sessionUser?.email,
            isLoading,
            isAuthenticated
          });
          
          // If we have session data, proceed with role detection
          if (currentSession && sessionUser) {
            const role = getUserRole();
            
            if (role) {
              console.log(`[Login] Role detected on attempt ${attempt}:`, role);
              return { role, session: currentSession, user: sessionUser };
            }
            
            // If session exists but no role, try to extract it differently
            const fallbackRole = sessionUser.role || currentSession.role;
            if (fallbackRole) {
              console.log(`[Login] Fallback role detected on attempt ${attempt}:`, fallbackRole);
              return { role: fallbackRole, session: currentSession, user: sessionUser };
            }
          }
          
          // Only check isAuthenticated if session isn't available yet
          if (!currentSession && isAuthenticated && user) {
            const role = getUserRole();
            if (role) {
              console.log(`[Login] Role from auth state on attempt ${attempt}:`, role);
              return { role, user };
            }
          }
          
          console.log(`[Login] Attempt ${attempt}/${maxAttempts}: Session/role not ready, waiting...`);
          
          if (attempt < maxAttempts) {
            const delay = initialDelay * Math.pow(1.5, attempt - 1); // Gentler backoff
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          console.error(`[Login] Error on attempt ${attempt}:`, error);
          if (attempt === maxAttempts) {
            return { error: error.message };
          }
        }
      }
      
      console.warn('[Login] Failed to detect session and role after all attempts');
      return { error: 'Failed to detect session and role' };
    };

    try {
      // Wait for session and role detection with Better Auth compatible logic
      const result = await waitForSessionAndRole();
      
      // Handle errors from role detection with role-appropriate fallbacks
      if (result.error) {
        console.error('[Login] Role detection failed:', result.error);
        
        // Try one more time with auth state validation
        if (isAuthenticated && user) {
          console.log('[Login] User is authenticated, attempting role-based fallback');
          
          // Try to extract role from any available source for fallback
          const fallbackRole = user?.role || session?.user?.role || session?.role;
          
          if (fallbackRole === UserRole.ADMIN || fallbackRole === UserRole.SUPER_ADMIN) {
            console.log('[Login] Fallback to admin dashboard');
            router.push('/admin');
          } else if (fallbackRole === UserRole.TECHNICIAN) {
            console.log('[Login] Fallback to technician dashboard');
            router.push('/technician');
          } else {
            console.log('[Login] Fallback to customer dashboard');
            router.push('/dashboard');
          }
        } else {
          console.error('[Login] Auth state invalid, redirecting to login');
          router.push('/login?error=auth_state_invalid');
        }
        return;
      }
      
      const { role: detectedRole, session: detectedSession, user: detectedUser } = result;
      
      console.log('[Login] Detection result:', {
        role: detectedRole,
        hasSession: !!detectedSession,
        hasUser: !!detectedUser,
        userEmail: detectedUser?.email
      });
      
      // Validate the detected role
      const validRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICIAN, UserRole.CUSTOMER];
      if (!validRoles.includes(detectedRole)) {
        console.warn('[Login] Invalid role detected:', detectedRole);
        
        // Use intelligent fallback based on authentication state
        if (isAuthenticated && user) {
          console.log('[Login] Using customer fallback for invalid role');
          router.push('/dashboard'); // Customers are most common, safe fallback
        } else {
          console.log('[Login] Redirecting to login due to invalid role and auth state');
          router.push('/login?error=invalid_role');
        }
        return;
      }
      
      // Determine redirect path based on role with validation
      let redirectPath = '/dashboard'; // Default fallback
      
      try {
        if (detectedRole === UserRole.ADMIN || detectedRole === UserRole.SUPER_ADMIN) {
          redirectPath = '/admin';
          console.log('[Login] Redirecting admin to:', redirectPath);
        } else if (detectedRole === UserRole.TECHNICIAN) {
          redirectPath = '/technician';
          console.log('[Login] Redirecting technician to:', redirectPath);
        } else if (detectedRole === UserRole.CUSTOMER) {
          redirectPath = '/dashboard';
          console.log('[Login] Redirecting customer to:', redirectPath);
        }
        
        // Validate redirect path with role-aware fallback
        if (!redirectPath || redirectPath === '') {
          console.error('[Login] Invalid redirect path, using role-aware fallback');
          
          if (detectedRole === UserRole.ADMIN || detectedRole === UserRole.SUPER_ADMIN) {
            redirectPath = '/admin';
          } else if (detectedRole === UserRole.TECHNICIAN) {
            redirectPath = '/technician';
          } else {
            redirectPath = '/dashboard'; // Customer fallback
          }
        }

        // Perform the redirect with enhanced error handling
        console.log('[Login] Final redirect to:', redirectPath);
        try {
          router.push(redirectPath);
        } catch (routerError) {
          console.error('[Login] Router.push failed:', routerError);
          handleRedirectError(redirectPath, routerError as Error);
        }
        
      } catch (redirectError) {
        console.error('[Login] Error during redirect:', redirectError);
        handleRedirectError(redirectPath, redirectError as Error);
      }
      
    } catch (error) {
      console.error('[Login] Unexpected error during login success handling:', error);
      
      // Use enhanced role-based error handling
      try {
        handleAuthError(error as Error, {
          fallbackToLogin: !isAuthenticated,
          showErrorMessage: true,
          logError: true
        });
      } catch (finalError) {
        console.error('[Login] Critical error in final fallback:', finalError);
        // Force page reload as last resort
        window.location.href = '/login?error=critical_failure';
      }
    } finally {
      // Always reset redirecting state
      setTimeout(() => setRedirecting(false), 1000); // Small delay to prevent rapid retries
    }
  };

  // Enhanced error state monitoring
  useEffect(() => {
    if (isAuthenticated && user && !redirecting) {
      console.log('[Login] User already authenticated, checking for auto-redirect...');
      handleLoginSuccess();
    }
  }, [isAuthenticated, user]);

  // Enhanced loading state handling
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #082F49 0%, #0C4A6E 25%, #075985 50%, #0369A1 75%, #134E4A 100%)'
      }}>
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #082F49 0%, #0C4A6E 25%, #075985 50%, #0369A1 75%, #134E4A 100%)'
    }}>
      {/* Simple Gradient Background */}
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Brand Content */}
          <div className="text-center lg:text-left text-white space-y-8">
            {/* Back Link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            {/* Brand Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold">RevivaTech</h1>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Welcome Back to
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Your Tech Portal
                </span>
              </h2>
              
              <p className="text-xl text-white/80 font-body max-w-md mx-auto lg:mx-0">
                Access your repair dashboard, track your devices, and manage your account.
              </p>
            </div>
            
            {/* Trust Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/90">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-white/90">24/7 Support</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto lg:mx-0">
              <div className="glassmorphism rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">50k+</div>
                <div className="text-sm text-white/70">Happy Customers</div>
              </div>
              <div className="glassmorphism rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm text-white/70">Customer Rating</div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <LoginForm 
                className="bg-white shadow-2xl border border-gray-200" 
                onSuccess={handleLoginSuccess}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse" />
      <div className="absolute bottom-32 left-20 w-2 h-2 bg-green-400 rounded-full opacity-50 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-4 h-4 bg-blue-300 rounded-full opacity-30 animate-pulse" />
    </div>
  );
}