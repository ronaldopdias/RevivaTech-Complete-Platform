import {
  AuthService,
  AuthUser,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LoginResponse,
  PermissionCheck,
  ServiceConfig,
  BaseService,
} from './types';
import { ApiClient } from './apiClient';

export class AuthServiceImpl extends BaseService implements AuthService {
  private apiClient: ApiClient;
  private tokenKey = 'revivatech_access_token';
  private refreshTokenKey = 'revivatech_refresh_token';

  constructor(config: ServiceConfig) {
    super(config);
    this.apiClient = new ApiClient(config);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse<LoginResponse>> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        user: AuthUser;
        tokens: AuthTokens;
        message: string;
      }>('/login', credentials);

      if (response.data.success) {
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, response.data.tokens.accessToken);
          localStorage.setItem(this.refreshTokenKey, response.data.tokens.refreshToken);
        }

        // Update API client with new token
        this.apiClient.setAuthToken(response.data.tokens.accessToken);

        return {
          success: true,
          data: {
            user: response.data.user,
            tokens: response.data.tokens,
          },
          message: response.data.message || 'Login successful',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse<LoginResponse>> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        user: AuthUser;
        tokens: AuthTokens;
        message: string;
      }>('/register', data);

      if (response.data.success) {
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, response.data.tokens.accessToken);
          localStorage.setItem(this.refreshTokenKey, response.data.tokens.refreshToken);
        }

        // Update API client with new token
        this.apiClient.setAuthToken(response.data.tokens.accessToken);

        return {
          success: true,
          data: {
            user: response.data.user,
            tokens: response.data.tokens,
          },
          message: response.data.message || 'Registration successful',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      // Clear tokens from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
      }

      // Clear token from API client
      this.apiClient.setAuthToken(undefined);

      // Optional: Call backend logout endpoint to invalidate refresh token
      try {
        await this.apiClient.post('/logout');
      } catch {
        // Ignore logout endpoint errors - local logout is sufficient
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  async validateToken(): Promise<AuthResponse<AuthUser>> {
    try {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem(this.tokenKey) : null;
      
      if (!token) {
        return {
          success: false,
          error: 'No token found',
        };
      }

      // Set token in API client
      this.apiClient.setAuthToken(token);

      const response = await this.apiClient.get<{
        success: boolean;
        user?: AuthUser;
        error?: string;
      }>('/validate');

      if (response.data.success && response.data.user) {
        return {
          success: true,
          data: response.data.user,
          message: 'Token is valid',
        };
      } else {
        // Token is invalid, clear it
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.refreshTokenKey);
        }
        this.apiClient.setAuthToken(undefined);

        return {
          success: false,
          error: response.data.error || 'Token validation failed',
        };
      }
    } catch (error) {
      // Token validation failed, clear tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
      }
      this.apiClient.setAuthToken(undefined);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }

  async refreshToken(): Promise<AuthResponse<AuthTokens>> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(this.refreshTokenKey) : null;
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token found',
        };
      }

      const response = await this.apiClient.post<{
        success: boolean;
        tokens?: AuthTokens;
        error?: string;
      }>('/refresh', { refreshToken });

      if (response.data.success && response.data.tokens) {
        // Store new tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, response.data.tokens.accessToken);
          localStorage.setItem(this.refreshTokenKey, response.data.tokens.refreshToken);
        }

        // Update API client with new token
        this.apiClient.setAuthToken(response.data.tokens.accessToken);

        return {
          success: true,
          data: response.data.tokens,
          message: 'Token refreshed successfully',
        };
      } else {
        // Refresh failed, clear tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.refreshTokenKey);
        }
        this.apiClient.setAuthToken(undefined);

        return {
          success: false,
          error: response.data.error || 'Token refresh failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async getCurrentUser(): Promise<AuthResponse<AuthUser>> {
    return this.validateToken();
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<AuthResponse<AuthUser>> {
    try {
      const response = await this.apiClient.put<{
        success: boolean;
        user?: AuthUser;
        error?: string;
      }>('/profile', updates);

      if (response.data.success && response.data.user) {
        return {
          success: true,
          data: response.data.user,
          message: 'Profile updated successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Profile update failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      };
    }
  }

  async checkPermission(permission: PermissionCheck): Promise<AuthResponse<boolean>> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        hasPermission?: boolean;
        error?: string;
      }>('/permissions/check', permission);

      return {
        success: response.data.success,
        data: response.data.hasPermission || false,
        error: response.data.error,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      };
    }
  }

  async getUserPermissions(): Promise<AuthResponse<string[]>> {
    try {
      const response = await this.apiClient.get<{
        success: boolean;
        permissions?: string[];
        error?: string;
      }>('/permissions');

      return {
        success: response.data.success,
        data: response.data.permissions || [],
        error: response.data.error,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to get permissions',
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        error?: string;
        message?: string;
      }>('/change-password', { currentPassword, newPassword });

      return {
        success: response.data.success,
        message: response.data.message || (response.data.success ? 'Password changed successfully' : 'Password change failed'),
        error: response.data.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        error?: string;
        message?: string;
      }>('/reset-password', { email });

      return {
        success: response.data.success,
        message: response.data.message || (response.data.success ? 'Password reset email sent' : 'Password reset failed'),
        error: response.data.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        error?: string;
        message?: string;
      }>('/reset-password/confirm', { token, newPassword });

      return {
        success: response.data.success,
        message: response.data.message || (response.data.success ? 'Password reset successfully' : 'Password reset failed'),
        error: response.data.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset confirmation failed',
      };
    }
  }

  async getHealthCheck(): Promise<ServiceHealthCheck> {
    try {
      const start = Date.now();
      await this.apiClient.get('/health');
      
      return {
        service: 'auth',
        status: 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'auth',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}