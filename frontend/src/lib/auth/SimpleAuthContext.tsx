'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthTokens, UserRole } from './types';
import { authApiClient, LoginRequest, RegisterRequest } from './apiClient';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  isRole: (role: UserRole) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  checkPermission: (resource: string, action: string) => boolean;
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

const TOKEN_STORAGE_KEY = 'revivatech_tokens';
const USER_STORAGE_KEY = 'revivatech_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (savedTokens && savedUser) {
          const tokens: AuthTokens = JSON.parse(savedTokens);
          const user: User = JSON.parse(savedUser);

          // Verify the token is still valid by fetching user data
          try {
            const response = await authApiClient.getMe(tokens.accessToken);
            setState({
              user: response.user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            // Update stored user data
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
          } catch (error) {
            // Token is invalid, try to refresh
            try {
              const refreshResponse = await authApiClient.refreshToken(tokens.refreshToken);
              const userResponse = await authApiClient.getMe(refreshResponse.tokens.accessToken);
              
              const newTokens = refreshResponse.tokens;
              setState({
                user: userResponse.user,
                tokens: newTokens,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              
              // Update stored data
              localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userResponse.user));
            } catch (refreshError) {
              // Refresh failed, clear auth state
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(USER_STORAGE_KEY);
              setState({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          }
        } else {
          // No saved auth, set loading to false
          setState({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApiClient.login(credentials);
      
      const newState = {
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      setState(newState);

      // Store auth data
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(response.tokens));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApiClient.register(data);
      
      const newState = {
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      setState(newState);

      // Store auth data
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(response.tokens));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (state.tokens) {
        await authApiClient.logout(state.tokens.accessToken, state.tokens.refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    // Clear local auth state
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, [state.tokens]);

  const refreshTokens = useCallback(async () => {
    if (!state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApiClient.refreshToken(state.tokens.refreshToken);
      const userResponse = await authApiClient.getMe(response.tokens.accessToken);
      
      const newTokens = response.tokens;
      setState(prev => ({
        ...prev,
        user: userResponse.user,
        tokens: newTokens,
      }));

      // Update stored data
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userResponse.user));
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  }, [state.tokens, logout]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const isRole = useCallback((role: UserRole): boolean => {
    return state.user?.role === role;
  }, [state.user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  }, [state.user]);

  const checkPermission = useCallback((resource: string, action: string): boolean => {
    if (!state.user) return false;
    
    // Super admin has all permissions
    if (state.user.role === UserRole.SUPER_ADMIN) return true;
    
    // Basic permission checking - can be expanded later
    switch (state.user.role) {
      case UserRole.ADMIN:
        return true; // Admin has most permissions
      case UserRole.TECHNICIAN:
        return resource === 'repairs' || resource === 'inventory' || resource === 'customers';
      case UserRole.CUSTOMER:
        return resource === 'bookings' || resource === 'profile' || resource === 'quotes';
      default:
        return false;
    }
  }, [state.user]);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshTokens,
    clearError,
    isRole,
    hasRole,
    checkPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};