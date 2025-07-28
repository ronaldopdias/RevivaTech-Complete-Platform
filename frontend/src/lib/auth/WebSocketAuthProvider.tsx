'use client';

/**
 * WebSocket Auth Provider
 * 
 * Integrates authentication with WebSocket connections:
 * - Automatic WebSocket connection on login
 * - Token refresh for WebSocket authentication
 * - Connection management based on auth state
 * - Real-time auth status updates
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import useSocketIO from '@/hooks/useSocketIO'; // Will be enabled when socket.io-client is working

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
}

interface WebSocketAuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshTokens: () => Promise<void>;
  isWebSocketConnected: boolean;
  webSocketConnectionState: string;
  subscribeToRepairUpdates: () => string | null;
  subscribeToNotifications: () => string | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const WebSocketAuthContext = createContext<WebSocketAuthContextType | undefined>(undefined);

// Dynamic API URL detection - consistent with main auth system
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3011';
  const hostname = window.location.hostname;
  
  if (hostname.includes('revivatech.co.uk')) return 'https://revivatech.co.uk';
  return 'http://localhost:3011';
};

export function useWebSocketAuth() {
  const context = useContext(WebSocketAuthContext);
  if (context === undefined) {
    throw new Error('useWebSocketAuth must be used within a WebSocketAuthProvider');
  }
  return context;
}

interface WebSocketAuthProviderProps {
  children: React.ReactNode;
}

export function WebSocketAuthProvider({ children }: WebSocketAuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
    refreshToken: null,
  });

  // Mock WebSocket hook (will be replaced with real implementation)
  const mockWebSocket = {
    isConnected: false,
    connectionState: 'disconnected' as const,
    connect: async () => {},
    disconnect: () => {},
    subscribe: (event: string, callback: Function) => 'mock-sub-id',
    subscribeToBookings: () => 'booking-sub-id',
    unsubscribe: (id: string) => true,
    setAuthToken: (token: string) => {},
  };

  // Initialize auth state from localStorage - UNIFIED STORAGE KEYS
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use consistent storage keys with main auth system
        const storedTokens = localStorage.getItem('revivatech_auth_tokens');
        const userData = localStorage.getItem('revivatech_auth_user');
        
        let token = null;
        let refreshToken = null;
        
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          token = tokens.accessToken;
          refreshToken = tokens.refreshToken;
        }

        if (token && userData) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token,
            refreshToken,
          });

          // Set WebSocket auth token
          mockWebSocket.setAuthToken(token);
          
          // Auto-connect to WebSocket if token exists
          try {
            await mockWebSocket.connect();
          } catch (error) {
            console.warn('WebSocket auto-connect failed:', error);
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh tokens before expiry
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) return;

    // JWT tokens expire in 15 minutes, refresh after 14 minutes
    const refreshInterval = setInterval(() => {
      refreshTokens().catch(console.error);
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, authState.token]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const { user, accessToken, refreshToken } = data;

      // Store tokens and user data - UNIFIED STORAGE KEYS
      localStorage.setItem('revivatech_auth_tokens', JSON.stringify({
        accessToken,
        refreshToken
      }));
      localStorage.setItem('revivatech_auth_user', JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token: accessToken,
        refreshToken,
      });

      // Connect to WebSocket with auth token
      mockWebSocket.setAuthToken(accessToken);
      await mockWebSocket.connect();

    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Disconnect WebSocket
    mockWebSocket.disconnect();

    // Clear localStorage - UNIFIED STORAGE KEYS
    localStorage.removeItem('revivatech_auth_tokens');
    localStorage.removeItem('revivatech_auth_user');

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
    });
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Auto-login after successful registration
      if (data.autoLogin) {
        await login(userData.email, userData.password);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }

    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [login]);

  const refreshTokens = useCallback(async (): Promise<void> => {
    try {
      // Use unified storage for refresh token
      const storedTokens = localStorage.getItem('revivatech_auth_tokens');
      const currentRefreshToken = authState.refreshToken || 
        (storedTokens ? JSON.parse(storedTokens).refreshToken : null);
      
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;

      // Update tokens - UNIFIED STORAGE KEYS
      localStorage.setItem('revivatech_auth_tokens', JSON.stringify({
        accessToken,
        refreshToken: newRefreshToken || currentRefreshToken
      }));

      setAuthState(prev => ({
        ...prev,
        token: accessToken,
        refreshToken: newRefreshToken || prev.refreshToken,
      }));

      // Update WebSocket auth token
      mockWebSocket.setAuthToken(accessToken);

    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  }, [authState.refreshToken, logout]);

  const subscribeToRepairUpdates = useCallback((): string | null => {
    if (!mockWebSocket.isConnected || !authState.isAuthenticated) {
      return null;
    }

    return mockWebSocket.subscribeToBookings();
  }, [authState.isAuthenticated]);

  const subscribeToNotifications = useCallback((): string | null => {
    if (!mockWebSocket.isConnected || !authState.isAuthenticated) {
      return null;
    }

    return mockWebSocket.subscribe('notification', (data: any) => {
      console.log('Notification received:', data);
      // Handle notification display logic here
    });
  }, [authState.isAuthenticated]);

  const contextValue: WebSocketAuthContextType = {
    ...authState,
    login,
    logout,
    register,
    refreshTokens,
    isWebSocketConnected: mockWebSocket.isConnected,
    webSocketConnectionState: mockWebSocket.connectionState,
    subscribeToRepairUpdates,
    subscribeToNotifications,
  };

  return (
    <WebSocketAuthContext.Provider value={contextValue}>
      {children}
    </WebSocketAuthContext.Provider>
  );
}

export default WebSocketAuthProvider;