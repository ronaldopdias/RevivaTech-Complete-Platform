// Enhanced Auth Service for API Integration
// Connects frontend RBAC system with Week 5 backend APIs

import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  ChangePasswordData,
  AuthResponse,
  UserRole,
  Session,
  SecurityEvent,
  SecurityEventType,
  TwoFactorAuthSetup,
  TwoFactorVerification,
} from './types';
import { AuthErrorHandler } from './error-handler';
import { authLogger } from './auth-logger';

// API Configuration
// Dynamic URL detection based on hostname for proper routing with fallback support
const getApiBaseUrl = (useDirectFallback = false) => {
  if (typeof window === 'undefined') {
    // Server-side: use backend URL directly
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
  }

  // Client-side: Dynamic detection based on hostname
  const hostname = window.location.hostname;
  
  if (hostname.includes('revivatech.co.uk') || hostname.includes('revivatech.com.br')) {
    // External domains: use relative URLs (Next.js rewrites handle backend routing)
    return '';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development - direct to backend
    return 'http://localhost:3011';
  }
  
  // Fallback for other local environments
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
};

// Get fallback URLs for robust API access
const getApiFallbackUrls = () => {
  if (typeof window === 'undefined') {
    return [process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'];
  }

  const hostname = window.location.hostname;
  
  if (hostname.includes('revivatech.co.uk') || hostname.includes('revivatech.com.br')) {
    // External domains: use relative URLs only (Next.js handles routing)
    return [''];
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development - direct to backend
    return ['http://localhost:3011'];
  }
  
  // Default fallback for other environments
  return [process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'];
};

const API_VERSION = 'v1';

// Dynamic endpoint generation
const getAuthEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  return {
    login: `${baseUrl}/api/auth/login`,
    register: `${baseUrl}/api/auth/register`,
    logout: `${baseUrl}/api/auth/logout`,
    refresh: `${baseUrl}/api/auth/refresh`,
    validate: `${baseUrl}/api/auth/validate`,
    resetPassword: `${baseUrl}/api/auth/reset-password`,
    confirmReset: `${baseUrl}/api/auth/confirm-reset`,
    changePassword: `${baseUrl}/api/auth/change-password`,
    updateProfile: `${baseUrl}/api/auth/profile`,
    sessions: `${baseUrl}/api/auth/sessions`,
    securityEvents: `${baseUrl}/api/auth/security-events`,
    twoFactor: {
      setup: `${baseUrl}/api/auth/2fa/setup`,
      verify: `${baseUrl}/api/auth/2fa/verify`,
      disable: `${baseUrl}/api/auth/2fa/disable`,
      backupCodes: `${baseUrl}/api/auth/2fa/backup-codes`,
    },
    permissions: `${baseUrl}/api/auth/permissions`,
    roles: `${baseUrl}/api/auth/roles`,
  };
};

// Enhanced API client with authentication
class ApiAuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Initialize from storage
    this.loadTokensFromStorage();
  }

  // Session cookie detection (similar to website project)
  private hasSessionCookie(): boolean {
    if (typeof window === 'undefined') return false;
    
    const cookies = document.cookie;
    return cookies.includes('refreshToken') || 
           cookies.includes('connect.sid') ||
           cookies.includes('session');
  }

  // Token management
  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const tokens = localStorage.getItem('revivatech_auth_tokens');
      if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        this.accessToken = parsedTokens.accessToken;
        // refreshToken no longer stored in localStorage - it's in httpOnly cookies
      }
    } catch (error) {
      // Token loading failed - continue with unauthenticated state
    }
  }

  private saveTokensToStorage(tokens: AuthTokens, user?: User): void {
    if (typeof window === 'undefined') return;

    try {
      // Only store accessToken in localStorage - refreshToken is now in httpOnly cookies
      const tokensToStore = { 
        accessToken: tokens.accessToken, 
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType || 'Bearer'
      };
      localStorage.setItem('revivatech_auth_tokens', JSON.stringify(tokensToStore));
      if (user) {
        localStorage.setItem('revivatech_auth_user', JSON.stringify(user));
      }
      this.accessToken = tokens.accessToken;
      // Don't store refreshToken in memory - it's in httpOnly cookies
    } catch (error) {
      // Token saving failed - authentication may not persist
    }
  }

  private clearTokensFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('revivatech_auth_tokens');
      localStorage.removeItem('revivatech_auth_user');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      // Token clearing failed - logout may be incomplete
    }
  }

  // HTTP client with automatic token refresh and enhanced fallback
  private async request<T>(
    url: string,
    options: RequestInit = {},
    skipAuth = false,
    isRetry = false
  ): Promise<AuthResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication header if available and not skipped
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session persistence
      });

      // Handle 401 - try to refresh token only once per request
      // Check for session cookies instead of refreshToken in memory
      if (response.status === 401 && !skipAuth && this.hasSessionCookie() && !isRetry) {
        console.log('🔄 401 detected, attempting token refresh...');
        const refreshResult = await this.refreshTokens();
        if (refreshResult.success) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          console.log('✅ Request retry after refresh successful');
          return this.parseResponse<T>(retryResponse);
        } else {
          console.log('❌ Token refresh failed during 401 retry');
        }
      }

      const result = this.parseResponse<T>(response);

      // Log API request
      authLogger.logApiRequest(url, options.method || 'GET', response.ok, {
        status: response.status,
        statusText: response.statusText,
      });

      return result;
    } catch (error) {
      // Smart fallback mechanism - be less aggressive, focus on real network issues
      const isNetworkError = error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ERR_NAME_NOT_RESOLVED') ||
         error.message.includes('net::ERR_') ||
         error.name === 'TypeError');
      
      // Only try fallbacks for network errors and only once
      if (!isRetry && isNetworkError) {
        console.log('🌐 Network error detected, trying fallback URLs...');
        
        const fallbackUrls = getApiFallbackUrls();
        const currentBaseUrl = url.split('/api/')[0];
        
        // Find other URLs to try
        const alternativeUrls = fallbackUrls.filter(fallbackBase => 
          fallbackBase !== currentBaseUrl
        );
        
        if (alternativeUrls.length > 0) {
          console.log(`🔄 Primary URL failed, trying ${alternativeUrls.length} fallback(s)`);
          
          for (const fallbackBase of alternativeUrls) {
            try {
              const fallbackUrl = url.replace(currentBaseUrl, fallbackBase);
              console.log(`🌐 Attempting fallback: ${fallbackBase}`);
              
              return await this.request(fallbackUrl, options, skipAuth, true);
            } catch (fallbackError) {
              console.log(`❌ Fallback failed: ${fallbackBase}`);
              continue;
            }
          }
          
          console.log('❌ All fallback URLs failed');
        }
      }

      const authError = AuthErrorHandler.handleError(error, `API request to ${url}`);

      // Log API error with better context
      authLogger.logApiRequest(url, options.method || 'GET', false, {
        error: authError.code,
        message: authError.message,
        isNetworkError,
        isRetry,
      });

      console.log(`🔥 API request failed: ${authError.code} - ${authError.userMessage}`);

      return {
        success: false,
        error: {
          code: authError.code,
          message: authError.userMessage,
          details: authError.details,
        },
      };
    }
  }

  private async parseResponse<T>(response: Response): Promise<AuthResponse<T>> {
    try {
      const data = await response.json();

      if (response.ok) {
        // Success response - handle different backend response formats
        if (data.success !== undefined) {
          // Backend returns { success: true, user: {...}, tokens: {...}, message: "..." }
          return {
            success: true,
            data: {
              user: data.user,
              tokens: data.tokens,
            },
            message: data.message,
          };
        } else {
          // Fallback for other response formats
          return {
            success: true,
            data: data.data || data,
            message: data.message,
          };
        }
      } else {
        // Error response - backend returns { error: "message", code: "CODE" }
        // Backend error response - check error handling
        
        const authError = AuthErrorHandler.handleError({
          code: data.code,
          message: data.error || data.message,
          details: data.details,
          status: response.status,
        });

        return {
          success: false,
          error: {
            code: authError.code,
            message: authError.userMessage,
            details: authError.details,
          },
        };
      }
    } catch (error) {
      const authError = AuthErrorHandler.handleError(error, 'Response parsing');

      return {
        success: false,
        error: {
          code: authError.code,
          message: authError.userMessage,
          details: authError.details,
        },
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    authLogger.info('LOGIN_ATTEMPT', { email: credentials.email });

    const endpoints = getAuthEndpoints();
    
    // Only send fields the backend expects
    const loginData = {
      email: credentials.email,
      password: credentials.password
    };
    
    const response = await this.request<{ user: User; tokens: AuthTokens }>(
      endpoints.login,
      {
        method: 'POST',
        body: JSON.stringify(loginData),
      },
      true // Skip auth for login
    );

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens, response.data.user);
      authLogger.logLoginAttempt(credentials.email, true, {
        userId: response.data.user.id,
        role: response.data.user.role,
      });
      
      // Don't fetch permissions immediately after login to avoid 404 errors
      // Permissions will be checked when needed
    } else {
      authLogger.logLoginAttempt(credentials.email, false, {
        error: response.error,
      });
    }

    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    const endpoints = getAuthEndpoints();
    const response = await this.request<{ user: User; tokens: AuthTokens }>(
      endpoints.register,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true // Skip auth for registration
    );

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens, response.data.user);
    }

    return response;
  }

  async logout(): Promise<AuthResponse> {
    authLogger.info('LOGOUT_ATTEMPT');

    const endpoints = getAuthEndpoints();
    const response = await this.request(
      endpoints.logout,
      { method: 'POST' }
    );

    // Clear tokens regardless of response
    this.clearTokensFromStorage();

    if (response.success) {
      authLogger.logLogout();
    } else {
      authLogger.error('LOGOUT_ERROR', { error: response.error });
    }

    return response;
  }

  async refreshTokens(): Promise<AuthResponse<{tokens: AuthTokens; user?: User}>> {
    // Check for session cookies instead of in-memory refreshToken
    if (!this.hasSessionCookie()) {
      return {
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available',
        },
      };
    }

    const endpoints = getAuthEndpoints();
    const response = await this.request<{tokens: AuthTokens; user?: User}>(
      endpoints.refresh,
      {
        method: 'POST',
        // No body needed - refreshToken is sent via httpOnly cookie
      },
      true
    );

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens, response.data.user);
    } else {
      // Clear invalid tokens
      this.clearTokensFromStorage();
    }

    return response;
  }

  async validateSession(): Promise<AuthResponse<User>> {
    const endpoints = getAuthEndpoints();
    return this.request<User>(endpoints.validate);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      endpoints.resetPassword,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async confirmResetPassword(data: ResetPasswordConfirm): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      endpoints.confirmReset,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      endpoints.changePassword,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateProfile(updates: Partial<User>): Promise<AuthResponse<User>> {
    const endpoints = getAuthEndpoints();
    return this.request<User>(
      endpoints.updateProfile,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  }

  // Session management
  async getActiveSessions(): Promise<AuthResponse<Session[]>> {
    const endpoints = getAuthEndpoints();
    return this.request<Session[]>(endpoints.sessions);
  }

  async terminateSession(sessionId: string): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      `${endpoints.sessions}/${sessionId}`,
      { method: 'DELETE' }
    );
  }

  async terminateAllSessions(): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      `${endpoints.sessions}/all`,
      { method: 'DELETE' }
    );
  }

  // Two-factor authentication
  async setupTwoFactor(): Promise<AuthResponse<TwoFactorAuthSetup>> {
    const endpoints = getAuthEndpoints();
    return this.request<TwoFactorAuthSetup>(
      endpoints.twoFactor.setup,
      { method: 'POST' }
    );
  }

  async verifyTwoFactor(data: TwoFactorVerification): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      endpoints.twoFactor.verify,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async disableTwoFactor(verificationCode: string): Promise<AuthResponse> {
    const endpoints = getAuthEndpoints();
    return this.request(
      endpoints.twoFactor.disable,
      {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode }),
      }
    );
  }

  async regenerateBackupCodes(): Promise<AuthResponse<string[]>> {
    const endpoints = getAuthEndpoints();
    return this.request<string[]>(
      endpoints.twoFactor.backupCodes,
      { method: 'POST' }
    );
  }

  // Security monitoring
  async getSecurityEvents(options?: {
    limit?: number;
    offset?: number;
    eventType?: SecurityEventType;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuthResponse<{ events: SecurityEvent[]; total: number }>> {
    const params = new URLSearchParams();

    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.eventType) params.append('eventType', options.eventType);
    if (options?.dateFrom) params.append('dateFrom', options.dateFrom.toISOString());
    if (options?.dateTo) params.append('dateTo', options.dateTo.toISOString());

    const endpoints = getAuthEndpoints();
    const url = `${endpoints.securityEvents}?${params.toString()}`;
    return this.request<{ events: SecurityEvent[]; total: number }>(url);
  }

  // RBAC integration
  async getUserPermissions(): Promise<AuthResponse<Array<{ resource: string; actions: string[] }>>> {
    const endpoints = getAuthEndpoints();
    return this.request<Array<{ resource: string; actions: string[] }>>(
      endpoints.permissions
    );
  }

  async checkPermission(resource: string, action: string): Promise<AuthResponse<boolean>> {
    const endpoints = getAuthEndpoints();
    return this.request<boolean>(
      `${endpoints.permissions}/check?resource=${resource}&action=${action}`
    );
  }

  async getRoleHierarchy(): Promise<AuthResponse<Record<UserRole, number>>> {
    const endpoints = getAuthEndpoints();
    return this.request<Record<UserRole, number>>(
      `${endpoints.roles}/hierarchy`
    );
  }

  // Health check
  async healthCheck(): Promise<AuthResponse<{ status: string; timestamp: string }>> {
    const baseUrl = getApiBaseUrl();
    return this.request<{ status: string; timestamp: string }>(
      `${baseUrl}/health`,
      { method: 'GET' },
      true
    );
  }
}

// Enhanced Auth Service with API integration
class EnhancedAuthService {
  private apiClient: ApiAuthClient;
  private storagePrefix = 'revivatech_auth_';

  constructor() {
    this.apiClient = new ApiAuthClient();
  }

  // Storage helpers
  private setStorage(key: string, value: any): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
    } catch (error) {
      // Storage error - authentication may not persist
    }
  }

  private getStorage(key: string): any {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.storagePrefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      // Storage error - authentication may not persist
      return null;
    }
  }

  private removeStorage(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      // Storage error - authentication may not persist
    }
  }

  // Public API methods
  clearStorage(): void {
    this.removeStorage('tokens');
    this.removeStorage('user');
    this.removeStorage('permissions');
  }

  getStoredTokens(): AuthTokens | null {
    return this.getStorage('tokens');
  }

  getStoredUser(): User | null {
    return this.getStorage('user');
  }

  getStoredPermissions(): Array<{ resource: string; actions: string[] }> | null {
    return this.getStorage('permissions');
  }

  // Authentication methods with API integration
  async login(credentials: LoginCredentials): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.apiClient.login(credentials);

    if (response.success && response.data) {
      this.setStorage('user', response.data.user);
      this.setStorage('tokens', response.data.tokens);

      // Fetch user permissions
      await this.fetchUserPermissions();
    }

    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.apiClient.register(data);

    if (response.success && response.data) {
      this.setStorage('user', response.data.user);
      this.setStorage('tokens', response.data.tokens);

      // Fetch user permissions
      await this.fetchUserPermissions();
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.logout();
    } catch (error) {
      // Logout error - cleanup may be incomplete
    } finally {
      this.clearStorage();
    }
  }

  async refreshToken(): Promise<AuthResponse<{tokens: AuthTokens; user?: User}>> {
    const response = await this.apiClient.refreshTokens();

    if (response.success && response.data) {
      this.setStorage('tokens', response.data.tokens);
      if (response.data.user) {
        this.setStorage('user', response.data.user);
      }
    }

    return response;
  }

  async validateSession(): Promise<AuthResponse<User>> {
    const response = await this.apiClient.validateSession();

    if (response.success && response.data) {
      this.setStorage('user', response.data);
      // Refresh permissions
      await this.fetchUserPermissions();
    }

    return response;
  }

  async updateUser(updates: Partial<User>): Promise<AuthResponse<User>> {
    const response = await this.apiClient.updateProfile(updates);

    if (response.success && response.data) {
      this.setStorage('user', response.data);
    }

    return response;
  }

  // Permission methods
  async fetchUserPermissions(): Promise<void> {
    try {
      const response = await this.getUserPermissions();
      if (response.success && response.data) {
        // Handle API response structure: {success: true, permissions: [...], role: "ADMIN"}
        const permissions = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).permissions || [];
        this.setStorage('permissions', permissions);
      } else {
        // Fallback to default permissions
        this.setDefaultPermissions();
      }
    } catch (error) {
      // Failed to fetch user permissions, using defaults
      this.setDefaultPermissions();
    }
  }

  private setDefaultPermissions(): void {
    const user = this.getStoredUser();
    if (!user) return;

    let defaultPermissions: Array<{ resource: string; actions: string[] }> = [];

    switch (user.role) {
      case 'SUPER_ADMIN':
        defaultPermissions = [{ resource: '*', actions: ['*'] }];
        break;
      case 'ADMIN':
        defaultPermissions = [
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'repairs', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'reports', actions: ['read', 'create'] },
          { resource: 'settings', actions: ['read', 'update'] },
        ];
        break;
      case 'TECHNICIAN':
        defaultPermissions = [
          { resource: 'repairs', actions: ['read', 'update'] },
          { resource: 'customers', actions: ['read'] },
        ];
        break;
      case 'CUSTOMER':
        defaultPermissions = [
          { resource: 'bookings', actions: ['create', 'read:own', 'update:own'] },
          { resource: 'profile', actions: ['read:own', 'update:own'] },
        ];
        break;
    }

    this.setStorage('permissions', defaultPermissions);
  }

  checkPermission(role: UserRole, resource: string, action: string): boolean {
    try {
      const permissions = this.getStoredPermissions();

      // Ensure permissions is an array and has proper structure
      if (!permissions || !Array.isArray(permissions)) {
        // Permissions not available or not an array, using default permissions for role
        // Fallback to default permissions based on role
        this.setDefaultPermissions();
        const fallbackPermissions = this.getStoredPermissions();
        if (!fallbackPermissions || !Array.isArray(fallbackPermissions)) {
          // Failed to set default permissions, denying access
          return false;
        }
        return this.checkPermissionWithValidArray(fallbackPermissions, role, resource, action);
      }

      return this.checkPermissionWithValidArray(permissions, role, resource, action);
    } catch (error) {
      // Error checking permissions - access denied
      // Clear corrupted permissions from storage
      this.removeStorage('permissions');
      return false;
    }
  }

  private checkPermissionWithValidArray(
    permissions: Array<{ resource: string; actions: string[] }>, 
    role: UserRole, 
    resource: string, 
    action: string
  ): boolean {
    try {
      // Super admin has all permissions
      if (role === UserRole.SUPER_ADMIN) return true;

      // Validate input parameters
      if (!Array.isArray(permissions)) {
        // Permissions parameter is not an array
        return false;
      }

      // Validate each permission object before using find
      const validPermissions = permissions.filter(p => 
        p && 
        typeof p === 'object' && 
        typeof p.resource === 'string' && 
        Array.isArray(p.actions)
      );

      if (validPermissions.length === 0) {
        // No valid permissions found, denying access
        return false;
      }

      // Check stored permissions
      const resourcePermission = validPermissions.find(p => p.resource === resource || p.resource === '*');

      if (!resourcePermission || !Array.isArray(resourcePermission.actions)) return false;

      return resourcePermission.actions.includes(action) || resourcePermission.actions.includes('*');
    } catch (error) {
      // Error in permission check - access denied
      return false;
    }
  }

  // Delegate other methods to API client
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    return this.apiClient.resetPassword(data);
  }

  async confirmResetPassword(data: ResetPasswordConfirm): Promise<AuthResponse> {
    return this.apiClient.confirmResetPassword(data);
  }

  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    return this.apiClient.changePassword(data);
  }

  async getActiveSessions(): Promise<AuthResponse<Session[]>> {
    return this.apiClient.getActiveSessions();
  }

  async terminateSession(sessionId: string): Promise<AuthResponse> {
    return this.apiClient.terminateSession(sessionId);
  }

  async terminateAllSessions(): Promise<AuthResponse> {
    return this.apiClient.terminateAllSessions();
  }

  async setupTwoFactor(): Promise<AuthResponse<TwoFactorAuthSetup>> {
    return this.apiClient.setupTwoFactor();
  }

  async verifyTwoFactor(data: TwoFactorVerification): Promise<AuthResponse> {
    return this.apiClient.verifyTwoFactor(data);
  }

  async disableTwoFactor(verificationCode: string): Promise<AuthResponse> {
    return this.apiClient.disableTwoFactor(verificationCode);
  }

  async regenerateBackupCodes(): Promise<AuthResponse<string[]>> {
    return this.apiClient.regenerateBackupCodes();
  }

  async getSecurityEvents(options?: any): Promise<AuthResponse<{ events: SecurityEvent[]; total: number }>> {
    return this.apiClient.getSecurityEvents(options);
  }

  async checkPermissionAPI(resource: string, action: string): Promise<AuthResponse<boolean>> {
    return this.apiClient.checkPermission(resource, action);
  }

  async getRoleHierarchy(): Promise<AuthResponse<Record<UserRole, number>>> {
    return this.apiClient.getRoleHierarchy();
  }

  async healthCheck(): Promise<AuthResponse<{ status: string; timestamp: string }>> {
    return this.apiClient.healthCheck();
  }

  async getUserPermissions(): Promise<AuthResponse<Array<{ resource: string; actions: string[] }>>> {
    return this.apiClient.getUserPermissions();
  }
}

export const enhancedAuthService = new EnhancedAuthService();
export { ApiAuthClient };
export default enhancedAuthService;