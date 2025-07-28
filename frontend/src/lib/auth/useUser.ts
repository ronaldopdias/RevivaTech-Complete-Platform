/**
 * useUser Hook
 * Simple user authentication hook for analytics
 */

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'customer' | 'technician';
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate user loading
    const timer = setTimeout(() => {
      // Mock user for demo
      setUser({
        id: 'demo-user-001',
        email: 'demo@revivatech.co.uk',
        name: 'Demo User',
        role: 'admin'
      });
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
}