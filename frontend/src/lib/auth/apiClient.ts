// Simple API client for authentication
import { AuthTokens, User } from './types';

// 🚀 Dynamic API URL detection - supports all access methods
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3011';
  }
  
  const hostname = window.location.hostname;
  
  // External domain access - use relative URLs (Next.js rewrites handle routing)
  if (hostname.includes('revivatech.co.uk') || hostname.includes('revivatech.com.br')) {
    return '';
  }
  
  // Local development fallback
  return 'http://localhost:3011';
};

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  emailVerificationRequired: boolean;
}

export interface RefreshResponse {
  message: string;
  tokens: AuthTokens;
}

export interface UserResponse {
  user: User;
}

class AuthApiClient {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Network error',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.message || error.error || 'An error occurred');
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const url = `${getApiBaseUrl()}/api/auth/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await this.handleResponse<any>(response);
    
    // Map backend response to frontend interface
    return {
      message: data.message,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        isActive: true,
        isVerified: data.user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }
    };
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<RegisterResponse>(response);
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    return this.handleResponse<RefreshResponse>(response);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({ refreshToken }),
    });

    await this.handleResponse(response);
  }

  async getMe(accessToken: string): Promise<UserResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(accessToken),
    });

    return this.handleResponse<UserResponse>(response);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, password }),
    });

    return this.handleResponse<{ message: string }>(response);
  }
}

export const authApiClient = new AuthApiClient();