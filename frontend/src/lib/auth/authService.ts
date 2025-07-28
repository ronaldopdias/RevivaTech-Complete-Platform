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
  Permission,
  RolePermissions,
} from './types';
import { enhancedAuthService } from './api-auth-service';

// Role-based permissions configuration
const rolePermissions: RolePermissions = {
  [UserRole.CUSTOMER]: [
    { resource: 'bookings', actions: ['create', 'read:own', 'update:own', 'cancel:own'] },
    { resource: 'profile', actions: ['read:own', 'update:own'] },
    { resource: 'quotes', actions: ['read:own', 'accept:own', 'reject:own'] },
    { resource: 'messages', actions: ['create', 'read:own'] },
    { resource: 'invoices', actions: ['read:own'] },
  ],
  [UserRole.TECHNICIAN]: [
    { resource: 'repairs', actions: ['read', 'update', 'complete'] },
    { resource: 'inventory', actions: ['read', 'request'] },
    { resource: 'customers', actions: ['read'] },
    { resource: 'messages', actions: ['create', 'read'] },
    { resource: 'schedule', actions: ['read:own', 'update:own'] },
  ],
  [UserRole.ADMIN]: [
    { resource: 'repairs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'technicians', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
  ],
  [UserRole.SUPER_ADMIN]: [
    { resource: '*', actions: ['*'] }, // Super admin has all permissions
  ],
};

class AuthService {
  private baseUrl = '/api/auth'; // Use relative URL to leverage Next.js rewrites
  private storagePrefix = 'revivatech_auth_';

  // Storage helpers
  private setStorage(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  private getStorage(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.storagePrefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  private removeStorage(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  clearStorage(): void {
    this.removeStorage('tokens');
    this.removeStorage('user');
  }

  getStoredTokens(): AuthTokens | null {
    return this.getStorage('tokens');
  }

  getStoredUser(): User | null {
    return this.getStorage('user');
  }

  // API calls using enhanced auth service
  async login(credentials: LoginCredentials): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    return enhancedAuthService.login(credentials);
  }

  async register(data: RegisterData): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    return enhancedAuthService.register(data);
  }

  async logout(): Promise<void> {
    return enhancedAuthService.logout();
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    return enhancedAuthService.resetPassword(data);
  }

  async confirmResetPassword(data: ResetPasswordConfirm): Promise<AuthResponse> {
    return enhancedAuthService.confirmResetPassword(data);
  }

  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    return enhancedAuthService.changePassword(data);
  }

  async refreshToken(): Promise<AuthResponse<AuthTokens>> {
    return enhancedAuthService.refreshToken();
  }

  async validateSession(): Promise<AuthResponse<User>> {
    return enhancedAuthService.validateSession();
  }

  async updateUser(updates: Partial<User>): Promise<AuthResponse<User>> {
    return enhancedAuthService.updateUser(updates);
  }

  // Permission checking
  checkPermission(role: UserRole, resource: string, action: string): boolean {
    return enhancedAuthService.checkPermission(role, resource, action);
  }

  // Additional API integration methods
  async getActiveSessions() {
    return enhancedAuthService.getActiveSessions();
  }

  async getSecurityEvents(options?: any) {
    return enhancedAuthService.getSecurityEvents(options);
  }

  async checkPermissionAPI(resource: string, action: string) {
    return enhancedAuthService.checkPermissionAPI(resource, action);
  }
}

export const authService = new AuthService();