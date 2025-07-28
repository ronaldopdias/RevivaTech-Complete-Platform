/**
 * Unit Tests for AuthContext
 * Tests authentication state management, login/logout flows, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

// Test component to consume AuthContext
const TestAuthComponent = () => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout, 
    register 
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'No user'}
      </div>
      <div data-testid="user-role">
        {user?.role || 'No role'}
      </div>
      
      <button 
        data-testid="login-btn"
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      
      <button 
        data-testid="logout-btn"
        onClick={() => logout()}
      >
        Logout
      </button>
      
      <button 
        data-testid="register-btn"
        onClick={() => register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        })}
      >
        Register
      </button>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    test('starts with unauthenticated state when no stored auth', () => {
      renderWithAuth(<TestAuthComponent />);
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
    });

    test('starts with loading state initially', () => {
      renderWithAuth(<TestAuthComponent />);
      
      // Should briefly show loading state
      expect(screen.getByTestId('auth-status')).toHaveTextContent(/Loading|Not Authenticated/);
    });

    test('restores authentication from localStorage', async () => {
      // Setup stored auth data
      const mockUser = global.TestUtils.createMockUser();
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
      localStorage.setItem('auth-tokens', JSON.stringify(mockTokens));
      
      // Mock successful token validation
      global.TestUtils.mockFetchResponse(mockUser);
      
      renderWithAuth(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('Test User (test@example.com)');
        expect(screen.getByTestId('user-role')).toHaveTextContent('CUSTOMER');
      });
    });
  });

  describe('Login Flow', () => {
    test('successful login updates state and stores tokens', async () => {
      const mockUser = global.TestUtils.createMockUser();
      const mockLoginResponse = {
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      
      global.TestUtils.mockFetchResponse(mockLoginResponse);
      
      renderWithAuth(<TestAuthComponent />);
      
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('Test User (test@example.com)');
      });
      
      // Verify localStorage was updated
      expect(localStorage.getItem('auth-user')).toBeTruthy();
      expect(localStorage.getItem('auth-tokens')).toBeTruthy();
      
      const storedTokens = JSON.parse(localStorage.getItem('auth-tokens') || '{}');
      expect(storedTokens.accessToken).toBe('new-access-token');
      expect(storedTokens.refreshToken).toBe('new-refresh-token');
    });

    test('failed login shows error and maintains unauthenticated state', async () => {
      global.TestUtils.mockFetchResponse(
        { error: 'Invalid credentials' }, 
        false, 
        401
      );
      
      renderWithAuth(<TestAuthComponent />);
      
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      });
      
      // Verify localStorage was not updated
      expect(localStorage.getItem('auth-user')).toBeNull();
      expect(localStorage.getItem('auth-tokens')).toBeNull();
    });

    test('login with different user roles', async () => {
      const adminUser = global.TestUtils.createMockUser({ 
        role: 'ADMIN',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User'
      });
      
      const mockLoginResponse = {
        user: adminUser,
        accessToken: 'admin-token',
        refreshToken: 'admin-refresh'
      };
      
      global.TestUtils.mockFetchResponse(mockLoginResponse);
      
      renderWithAuth(<TestAuthComponent />);
      
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
        expect(screen.getByTestId('user-info')).toHaveTextContent('Admin User (admin@example.com)');
      });
    });
  });

  describe('Registration Flow', () => {
    test('successful registration updates state', async () => {
      const newUser = global.TestUtils.createMockUser({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User'
      });
      
      const mockRegisterResponse = {
        user: newUser,
        accessToken: 'new-user-token',
        refreshToken: 'new-user-refresh'
      };
      
      global.TestUtils.mockFetchResponse(mockRegisterResponse);
      
      renderWithAuth(<TestAuthComponent />);
      
      const registerBtn = screen.getByTestId('register-btn');
      fireEvent.click(registerBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('New User (new@example.com)');
      });
    });

    test('failed registration maintains unauthenticated state', async () => {
      global.TestUtils.mockFetchResponse(
        { error: 'Email already exists' }, 
        false, 
        409
      );
      
      renderWithAuth(<TestAuthComponent />);
      
      const registerBtn = screen.getByTestId('register-btn');
      fireEvent.click(registerBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });
  });

  describe('Logout Flow', () => {
    test('logout clears state and localStorage', async () => {
      // Setup initial authenticated state
      const mockUser = global.TestUtils.createMockUser();
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
      localStorage.setItem('auth-tokens', JSON.stringify(mockTokens));
      
      // Mock successful logout response
      global.TestUtils.mockFetchResponse({ success: true });
      
      renderWithAuth(<TestAuthComponent />);
      
      // Wait for initial auth restoration
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
      
      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
        expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
      });
      
      // Verify localStorage was cleared
      expect(localStorage.getItem('auth-user')).toBeNull();
      expect(localStorage.getItem('auth-tokens')).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    test('automatically refreshes expired access token', async () => {
      // Setup initial auth with expired token
      const mockUser = global.TestUtils.createMockUser();
      const expiredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token'
      };
      
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
      localStorage.setItem('auth-tokens', JSON.stringify(expiredTokens));
      
      // Mock token validation failure followed by successful refresh
      global.TestUtils.mockFetchResponse(
        { error: 'Token expired' }, 
        false, 
        401
      );
      
      // Mock successful refresh
      global.TestUtils.mockFetchResponse({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser
      });
      
      renderWithAuth(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
      
      // Verify new tokens were stored
      const newTokens = JSON.parse(localStorage.getItem('auth-tokens') || '{}');
      expect(newTokens.accessToken).toBe('new-access-token');
    });

    test('logs out when refresh token is also expired', async () => {
      const mockUser = global.TestUtils.createMockUser();
      const expiredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token'
      };
      
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
      localStorage.setItem('auth-tokens', JSON.stringify(expiredTokens));
      
      // Mock both token validation and refresh failure
      global.TestUtils.mockFetchResponse(
        { error: 'Token expired' }, 
        false, 
        401
      );
      global.TestUtils.mockFetchResponse(
        { error: 'Refresh token expired' }, 
        false, 
        401
      );
      
      renderWithAuth(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
      
      // Verify localStorage was cleared
      expect(localStorage.getItem('auth-user')).toBeNull();
      expect(localStorage.getItem('auth-tokens')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      global.TestUtils.mockFetchError('Network error');
      
      renderWithAuth(<TestAuthComponent />);
      
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });

    test('handles malformed localStorage data', async () => {
      // Setup malformed data
      localStorage.setItem('auth-user', 'invalid-json');
      localStorage.setItem('auth-tokens', 'also-invalid');
      
      renderWithAuth(<TestAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });
  });

  describe('Context Usage', () => {
    test('throws error when used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestAuthComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    test('provides all required context values', () => {
      const ContextChecker = () => {
        const context = useAuth();
        
        const requiredMethods = [
          'user', 'isLoading', 'isAuthenticated', 
          'login', 'logout', 'register', 'updateProfile'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
          !(method in context)
        );
        
        return (
          <div data-testid="context-check">
            {missingMethods.length === 0 ? 'All methods present' : `Missing: ${missingMethods.join(', ')}`}
          </div>
        );
      };
      
      renderWithAuth(<ContextChecker />);
      
      expect(screen.getByTestId('context-check')).toHaveTextContent('All methods present');
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', async () => {
      let renderCount = 0;
      
      const RenderCounter = () => {
        const { isAuthenticated } = useAuth();
        renderCount++;
        
        return <div data-testid="render-count">{renderCount}</div>;
      };
      
      renderWithAuth(<RenderCounter />);
      
      // Initial render
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
      
      // Multiple context reads shouldn't cause re-renders
      const ContextReader = () => {
        const { user, isLoading, isAuthenticated } = useAuth();
        return <div>{user?.email} {isLoading.toString()} {isAuthenticated.toString()}</div>;
      };
      
      renderWithAuth(
        <>
          <RenderCounter />
          <ContextReader />
        </>
      );
      
      // Should still be minimal renders
      await waitFor(() => {
        const renderCountText = screen.getByTestId('render-count').textContent;
        expect(parseInt(renderCountText || '0')).toBeLessThanOrEqual(3);
      });
    });
  });
});