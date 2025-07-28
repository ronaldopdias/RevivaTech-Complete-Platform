'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  AuthTokens, 
  AuthState, 
  LoginCredentials, 
  RegisterData,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  ChangePasswordData,
  AuthResponse,
  UserRole,
} from './types';
import { authService } from './authService';
import { useRouter } from 'next/navigation';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse<{ user: User; tokens: AuthTokens; }>>;
  register: (data: RegisterData) => Promise<AuthResponse<{ user: User; tokens: AuthTokens; }>>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<AuthResponse>;
  confirmResetPassword: (data: ResetPasswordConfirm) => Promise<AuthResponse>;
  changePassword: (data: ChangePasswordData) => Promise<AuthResponse>;
  refreshToken: () => Promise<AuthResponse<{tokens: AuthTokens; user?: User}>>;
  updateUser: (updates: Partial<User>) => Promise<AuthResponse<User>>;
  checkPermission: (resource: string, action: string) => boolean;
  isAdmin: () => boolean;
  isTechnician: () => boolean;
  isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state - COOKIE-BASED SESSION PERSISTENCE (like website project)
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 AuthContext: Initializing authentication state...');
      console.log('🚨 CACHE BUST VERSION: 2025-07-26-12:00:00');
      console.log('✅ COOKIE-BASED AUTH CODE LOADED - SESSION PERSISTENCE ACTIVE');
      
      try {
        // Check for session cookies first (like website project)
        const hasSessionCookie = typeof window !== 'undefined' && (
          document.cookie.includes('refreshToken') || 
          document.cookie.includes('connect.sid') ||
          document.cookie.includes('session')
        );
        
        // Also check for persistent login flag to prevent re-initialization clearing session
        const hasPersistentLogin = typeof window !== 'undefined' && 
          sessionStorage.getItem('revivatech_auth_persistent') === 'true';
        
        console.log('🍪 Session cookie check:', { 
          hasSessionCookie,
          hasPersistentLogin,
          allCookies: typeof window !== 'undefined' ? document.cookie : 'SSR'
        });

        const storedTokens = authService.getStoredTokens();
        const storedUser = authService.getStoredUser();
        
        console.log('🔍 AuthContext: Storage check:', { 
          hasTokens: !!storedTokens, 
          hasUser: !!storedUser,
          hasSessionCookie,
          tokenKeys: storedTokens ? Object.keys(storedTokens) : [],
          userEmail: storedUser?.email 
        });
        
        // Only proceed if we have session cookies OR persistent login flag (indicating httpOnly refresh token exists)
        if ((hasSessionCookie || hasPersistentLogin) && storedUser) {
          console.log('✅ AuthContext: Found session cookie and user data, setting authenticated state');
          
          // Set authenticated state with stored user and token (if available)
          setState({
            user: storedUser,
            tokens: storedTokens || { accessToken: '', refreshToken: '', expiresIn: '15m', tokenType: 'Bearer' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('🔐 AuthContext: User authenticated from session cookie:', storedUser.email);

          // Background validation - NEVER change isAuthenticated unless definitively invalid
          setTimeout(async () => {
            try {
              const response = await authService.validateSession();
              if (response.success && response.data) {
                // Session valid - update user data but maintain authentication
                setState(prev => ({
                  ...prev,
                  user: response.data,
                  isAuthenticated: true, // Always maintain
                  error: null,
                }));
                console.log('✅ Session validation successful');
              } else {
                // Validation failed - try refresh but don't logout yet
                console.log('⚠️ Session validation failed, attempting refresh...');
                try {
                  const refreshResponse = await authService.refreshToken();
                  if (refreshResponse.success && refreshResponse.data) {
                    setState(prev => ({
                      ...prev,
                      tokens: refreshResponse.data.tokens || null,
                      user: refreshResponse.data.user || prev.user,
                      isAuthenticated: true, // Keep authenticated
                    }));
                    console.log('✅ Token refresh successful');
                  } else {
                    // Only logout for definitive auth errors with specific codes
                    const isDefinitiveAuthFailure = 
                      refreshResponse.error?.code === 'INVALID_REFRESH_TOKEN' ||
                      refreshResponse.error?.code === 'TOKEN_EXPIRED' ||
                      refreshResponse.error?.code === 'UNAUTHORIZED';
                    
                    if (isDefinitiveAuthFailure) {
                      console.log('❌ Definitive auth failure, logging out');
                      authService.clearStorage();
                      setState({
                        user: null,
                        tokens: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                      });
                    } else {
                      // Network error or temporary issue - maintain session
                      console.log('⚠️ Temporary error, maintaining session');
                      // No state change - user stays logged in
                    }
                  }
                } catch (refreshError) {
                  console.log('⚠️ Refresh error, maintaining session for resilience');
                  // Network/temporary error - maintain session
                }
              }
            } catch (validationError) {
              console.log('⚠️ Validation network error, maintaining session');
              // Network error - maintain session for better UX
            }
          }, 100); // Small delay to avoid race conditions
          
        } else if ((hasSessionCookie || hasPersistentLogin) && !storedUser) {
          console.log('🔄 AuthContext: Session cookie found but no user data - attempting refresh');
          // Try to refresh to get user data from session cookie
          try {
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.success && refreshResponse.data) {
              setState({
                user: refreshResponse.data.user || null,
                tokens: refreshResponse.data.tokens || null,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              console.log('✅ Session restored from cookie refresh');
            } else {
              setState(prev => ({ 
                ...prev, 
                isAuthenticated: false,
                isLoading: false 
              }));
            }
          } catch (error) {
            console.log('❌ Session refresh failed');
            setState(prev => ({ 
              ...prev, 
              isAuthenticated: false,
              isLoading: false 
            }));
          }
        } else {
          console.log('❌ AuthContext: No session cookie or user data found, user not authenticated');
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false,
            isLoading: false 
          }));
        }
      } catch (error) {
        console.error('🔥 Auth initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false,
          user: null,
          tokens: null 
        }));
      }
    };

    initializeAuth();
  }, []);

  // Smart token refresh - less aggressive, more resilient
  useEffect(() => {
    if (!state.tokens?.accessToken || !state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await authService.refreshToken();
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            tokens: response.data || null,
            isAuthenticated: true, // Maintain authentication
          }));
          console.log('🔄 Automatic token refresh successful');
        } else {
          // Refresh failed - but don't logout unless it's a definitive auth error
          const isDefinitiveFailure = 
            response.error?.code === 'INVALID_REFRESH_TOKEN' ||
            response.error?.code === 'TOKEN_EXPIRED';
          
          if (!isDefinitiveFailure) {
            console.log('⚠️ Token refresh failed (temporary), maintaining session');
            // Keep user logged in for temporary failures
          }
        }
      } catch (error) {
        console.log('⚠️ Token refresh network error, maintaining session');
        // Network error - maintain session
      }
    }, 55 * 60 * 1000); // Refresh every 55 minutes (less frequent)

    return () => clearInterval(refreshInterval);
  }, [state.tokens?.accessToken, state.isAuthenticated]);

  // Session heartbeat - keep session alive with lightweight checks
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens?.accessToken) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        // Lightweight session validation
        const response = await authService.validateSession();
        if (response.success && response.data) {
          // Session is healthy - update user data if needed
          setState(prev => ({
            ...prev,
            user: response.data,
            isAuthenticated: true,
          }));
        } else {
          // Session validation failed - try refresh
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success && refreshResponse.data) {
            setState(prev => ({
              ...prev,
              tokens: refreshResponse.data.tokens || null,
              user: refreshResponse.data.user || prev.user,
              isAuthenticated: true,
            }));
          } else {
            // Only logout for definitive auth failures
            const isDefinitiveFailure = 
              refreshResponse.error?.code === 'INVALID_REFRESH_TOKEN' ||
              refreshResponse.error?.code === 'TOKEN_EXPIRED' ||
              refreshResponse.error?.code === 'UNAUTHORIZED';
            
            if (isDefinitiveFailure) {
              console.log('💔 Session heartbeat: definitive auth failure, logging out');
              authService.clearStorage();
              setState({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
            // For network errors, maintain session
          }
        }
      } catch (error) {
        // Network error during heartbeat - maintain session
        console.log('💓 Session heartbeat: network error, maintaining session');
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(heartbeatInterval);
  }, [state.isAuthenticated, state.tokens?.accessToken]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse<{ user: User; tokens: AuthTokens; }>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        // Set persistent login flag to prevent session loss during navigation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('revivatech_auth_persistent', 'true');
        }
        
        setState({
          user: response.data.user,
          tokens: response.data.tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect based on role - debug role comparison
        // Login successful, redirecting based on role
        
        // Use string comparison instead of enum comparison for safety
        if (response.data.user.role === 'ADMIN' || response.data.user.role === 'SUPER_ADMIN') {
          // Redirecting admin user to /admin
          router.push('/admin');
        } else if (response.data.user.role === 'TECHNICIAN') {
          // Technicians don't need a dashboard - redirect to home or specific page
          // Redirecting technician user to /
          router.push('/');
        } else {
          // Customers go to general dashboard
          // Redirecting customer user to /dashboard
          router.push('/dashboard');
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error?.message || 'Login failed',
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: { code: 'LOGIN_ERROR', message: errorMessage } };
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData): Promise<AuthResponse<{ user: User; tokens: AuthTokens; }>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.register(data);
      
      if (response.success && response.data) {
        setState({
          user: response.data.user,
          tokens: response.data.tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        router.push('/dashboard');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error?.message || 'Registration failed',
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: { code: 'REGISTER_ERROR', message: errorMessage } };
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Logout error occurred
    } finally {
      authService.clearStorage();
      // Clear persistent login flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('revivatech_auth_persistent');
      }
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      router.push('/login');
    }
  }, [router]);

  const resetPassword = useCallback(async (data: ResetPasswordRequest): Promise<AuthResponse> => {
    try {
      return await authService.resetPassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: { code: 'RESET_ERROR', message: errorMessage } };
    }
  }, []);

  const confirmResetPassword = useCallback(async (data: ResetPasswordConfirm): Promise<AuthResponse> => {
    try {
      return await authService.confirmResetPassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset confirmation failed';
      return { success: false, error: { code: 'CONFIRM_RESET_ERROR', message: errorMessage } };
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData): Promise<AuthResponse> => {
    try {
      return await authService.changePassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      return { success: false, error: { code: 'CHANGE_PASSWORD_ERROR', message: errorMessage } };
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<AuthResponse<AuthTokens>> => {
    try {
      const response = await authService.refreshToken();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          tokens: response.data || null,
        }));
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      return { success: false, error: { code: 'REFRESH_ERROR', message: errorMessage } };
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<AuthResponse<User>> => {
    try {
      const response = await authService.updateUser(updates);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data || null,
        }));
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'User update failed';
      return { success: false, error: { code: 'UPDATE_ERROR', message: errorMessage } };
    }
  }, []);

  const checkPermission = useCallback((resource: string, action: string): boolean => {
    try {
      if (!state.user) return false;
      return authService.checkPermission(state.user.role, resource, action);
    } catch (error) {
      // Error checking permission - access denied
      return false;
    }
  }, [state.user]);

  const isAdmin = useCallback((): boolean => {
    return state.user?.role === UserRole.ADMIN || state.user?.role === UserRole.SUPER_ADMIN;
  }, [state.user]);

  const isTechnician = useCallback((): boolean => {
    return state.user?.role === UserRole.TECHNICIAN;
  }, [state.user]);

  const isCustomer = useCallback((): boolean => {
    return state.user?.role === UserRole.CUSTOMER;
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    confirmResetPassword,
    changePassword,
    refreshToken,
    updateUser,
    checkPermission,
    isAdmin,
    isTechnician,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;