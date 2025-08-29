/**
 * Authentication Debugging Utilities
 * Comprehensive auth state monitoring and validation
 */

'use client'

export interface AuthDebugInfo {
  timestamp: string;
  session: any;
  user: any;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasValidSession: boolean;
  cookies: Record<string, string>;
  url: string;
}

export function captureAuthState(authHook: any): AuthDebugInfo {
  const timestamp = new Date().toISOString();
  const url = typeof window !== 'undefined' ? window.location.href : 'SSR';
  
  // Capture cookies
  const cookies: Record<string, string> = {};
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) cookies[name] = value || '';
    });
  }

  return {
    timestamp,
    session: authHook.session,
    user: authHook.user,
    role: authHook.role || authHook.currentRole,
    isAuthenticated: authHook.isAuthenticated,
    isLoading: authHook.isLoading,
    hasValidSession: authHook.hasValidSession,
    cookies,
    url
  };
}

export function logAuthState(authHook: any, context: string = 'Unknown') {
  const debugInfo = captureAuthState(authHook);
  
  console.group(`🔍 Auth Debug - ${context}`);
  console.log('Relevant cookies:', Object.keys(debugInfo.cookies).filter(k =>
    k.includes('auth') || k.includes('session') || k.includes('role')
  ).reduce((obj, key) => {
    obj[key] = debugInfo.cookies[key];
    return obj;
  }, {} as Record<string, string>));
  console.groupEnd();
  
  return debugInfo;
}

export function validateAuthState(authHook: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for basic auth consistency
  if (authHook.isAuthenticated && !authHook.user) {
    issues.push('Authenticated but no user data');
  }
  
  if (authHook.isAuthenticated && !authHook.session) {
    issues.push('Authenticated but no session');
  }
  
  if (authHook.user && !authHook.role) {
    issues.push('User exists but no role detected');
  }
  
  if (authHook.isAuthenticated && authHook.isLoading) {
    issues.push('Authenticated but still loading');
  }
  
  // Check for role consistency
  if (authHook.user?.role && authHook.role && authHook.user.role !== authHook.role) {
    issues.push('Role mismatch between user and auth hook');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

export function createAuthDebugger(interval: number = 5000) {
  let debugInterval: NodeJS.Timeout | null = null;
  
  return {
    start: (authHook: any, context: string = 'Auto Debug') => {
      if (debugInterval) return;
      
      
      debugInterval = setInterval(() => {
        const validation = validateAuthState(authHook);
        if (!validation.isValid) {
          console.warn(`⚠️ Auth State Issues Detected in ${context}:`, validation.issues);
          logAuthState(authHook, context);
        }
      }, interval);
    },
    
    stop: () => {
      if (debugInterval) {
        clearInterval(debugInterval);
        debugInterval = null;
      }
    },
    
    isRunning: () => !!debugInterval
  };
}

// Role validation utilities
export function validateRoleFormat(role: any): { valid: boolean; normalized: string | null } {
  if (!role) return { valid: false, normalized: null };
  
  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'CUSTOMER'];
  const normalizedRole = String(role).toUpperCase();
  
  return {
    valid: validRoles.includes(normalizedRole),
    normalized: validRoles.includes(normalizedRole) ? normalizedRole : null
  };
}

export function getExpectedRedirectPath(role: string | null): string {
  if (!role) return '/dashboard';
  
  const normalizedRole = String(role).toUpperCase();
  
  switch (normalizedRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'TECHNICIAN':
      return '/technician';
    case 'CUSTOMER':
    default:
      return '/dashboard';
  }
}

// Enhanced auth state summary
export function getAuthStateSummary(authHook: any): string {
  const status = authHook.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated';
  const loading = authHook.isLoading ? '⏳ Loading' : '✅ Loaded';
  const role = authHook.role ? `👤 ${authHook.role}` : '❓ No Role';
  const session = authHook.session ? '📋 Has Session' : '❌ No Session';
  
  return `${status} | ${loading} | ${role} | ${session}`;
}