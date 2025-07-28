import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, UserProvider } from '@auth0/nextjs-auth0';

interface Auth0ContextType {
  user: any;
  isLoading: boolean;
  error?: Error;
  loginWithRedirect: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const Auth0Context = createContext<Auth0ContextType | null>(null);

export const useAuth0 = () => {
  const context = useContext(Auth0Context);
  if (!context) {
    throw new Error('useAuth0 must be used within an Auth0Provider');
  }
  return context;
};

interface Auth0ProviderProps {
  children: ReactNode;
}

const Auth0ContextProvider: React.FC<Auth0ProviderProps> = ({ children }) => {
  const { user, error, isLoading } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const loginWithRedirect = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  const value: Auth0ContextType = {
    user,
    isLoading,
    error,
    loginWithRedirect,
    logout,
    isAuthenticated,
  };

  return (
    <Auth0Context.Provider value={value}>
      {children}
    </Auth0Context.Provider>
  );
};

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <Auth0ContextProvider>
        {children}
      </Auth0ContextProvider>
    </UserProvider>
  );
};