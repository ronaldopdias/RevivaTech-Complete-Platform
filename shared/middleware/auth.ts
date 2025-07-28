import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cache } from '../config/redis';
import { SecurityLogger } from '../config/logger';
import { getConfig } from '../config/environment';
import { TokenService } from '../services/security/encryption';

const config = getConfig();

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'technician' | 'admin' | 'manager';
  permissions: string[];
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  user: User;
  token: string;
  sessionId: string;
  permissions: string[];
  isAuthenticated: boolean;
}

// JWT token verification
export async function verifyToken(token: string): Promise<any> {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(cleanToken, config.JWT_SECRET) as any;
    
    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${cleanToken}`);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }
    
    // Check if user session is still valid
    const sessionData = await cache.get(`session:${decoded.sessionId}`);
    if (!sessionData) {
      throw new Error('Session has expired');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Authentication middleware
export async function authenticate(req: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('auth-token')?.value;
    
    const token = authHeader || cookieToken;
    if (!token) {
      return null;
    }
    
    const decoded = await verifyToken(token);
    
    // Get user data from cache or database
    const userData = await cache.get(`user:${decoded.userId}`);
    if (!userData) {
      throw new Error('User not found');
    }
    
    const user: User = userData;
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    
    // Update last activity
    await cache.set(`last_activity:${user.id}`, Date.now(), 300); // 5 minutes
    
    return {
      user,
      token: token.replace('Bearer ', ''),
      sessionId: decoded.sessionId,
      permissions: user.permissions,
      isAuthenticated: true,
    };
  } catch (error) {
    SecurityLogger.logAuthAttempt(
      'unknown',
      false,
      req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      req.headers.get('user-agent') || undefined
    );
    return null;
  }
}

// Authorization middleware
export function authorize(requiredPermissions: string[], requireAll: boolean = false) {
  return async (req: NextRequest, authContext: AuthContext): Promise<boolean> => {
    if (!authContext.isAuthenticated) {
      return false;
    }
    
    const userPermissions = authContext.permissions;
    
    if (requireAll) {
      // User must have all required permissions
      return requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
    } else {
      // User must have at least one required permission
      return requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );
    }
  };
}

// Role-based access control
export function requireRole(allowedRoles: User['role'][]) {
  return async (req: NextRequest, authContext: AuthContext): Promise<boolean> => {
    if (!authContext.isAuthenticated) {
      return false;
    }
    
    return allowedRoles.includes(authContext.user.role);
  };
}

// Resource ownership check
export function requireOwnership(getResourceOwnerId: (req: NextRequest) => Promise<string>) {
  return async (req: NextRequest, authContext: AuthContext): Promise<boolean> => {
    if (!authContext.isAuthenticated) {
      return false;
    }
    
    // Admins can access any resource
    if (authContext.user.role === 'admin') {
      return true;
    }
    
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      return resourceOwnerId === authContext.user.id;
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return false;
    }
  };
}

// Session management
export class SessionManager {
  // Create new session
  static async createSession(user: User, deviceInfo?: any): Promise<{
    token: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const sessionId = TokenService.generateSecureToken();
    const tokenPayload = {
      userId: user.id,
      sessionId,
      role: user.role,
      permissions: user.permissions,
    };
    
    // Generate tokens
    const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
    
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // Store session data
    const sessionData = {
      userId: user.id,
      sessionId,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
      isActive: true,
    };
    
    await cache.set(`session:${sessionId}`, sessionData, 7 * 24 * 3600); // 7 days
    await cache.set(`user:${user.id}`, user, 3600); // 1 hour
    
    SecurityLogger.logAuthAttempt(
      user.email,
      true,
      deviceInfo?.ip || 'unknown',
      deviceInfo?.userAgent
    );
    
    return { token, refreshToken, sessionId };
  }
  
  // Refresh token
  static async refreshSession(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      
      // Check if session exists
      const sessionData = await cache.get(`session:${decoded.sessionId}`);
      if (!sessionData || !sessionData.isActive) {
        throw new Error('Session not found or inactive');
      }
      
      // Get user data
      const user = await cache.get(`user:${decoded.userId}`);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Generate new tokens
      const newTokenPayload = {
        userId: user.id,
        sessionId: decoded.sessionId,
        role: user.role,
        permissions: user.permissions,
      };
      
      const newToken = jwt.sign(newTokenPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
      });
      
      const newRefreshToken = jwt.sign(
        { userId: user.id, sessionId: decoded.sessionId, type: 'refresh' },
        config.JWT_SECRET,
        { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN }
      );
      
      // Update session activity
      sessionData.lastAccessAt = new Date().toISOString();
      await cache.set(`session:${decoded.sessionId}`, sessionData, 7 * 24 * 3600);
      
      // Blacklist old refresh token
      await cache.set(
        `blacklist:${refreshToken}`,
        true,
        7 * 24 * 3600 // Same as refresh token expiry
      );
      
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
  
  // Revoke session
  static async revokeSession(sessionId: string): Promise<void> {
    // Mark session as inactive
    const sessionData = await cache.get(`session:${sessionId}`);
    if (sessionData) {
      sessionData.isActive = false;
      await cache.set(`session:${sessionId}`, sessionData, 3600); // Keep for audit
    }
    
    // Remove from active sessions
    await cache.del(`session:${sessionId}`);
  }
  
  // Revoke all user sessions
  static async revokeAllUserSessions(userId: string): Promise<void> {
    // Get all sessions for user (this would require additional indexing in production)
    const sessionKeys = await cache.keys(`session:*`);
    
    for (const key of sessionKeys) {
      const sessionData = await cache.get(key);
      if (sessionData && sessionData.userId === userId) {
        sessionData.isActive = false;
        await cache.set(key, sessionData, 3600);
        await cache.del(key);
      }
    }
  }
  
  // Get active sessions for user
  static async getUserSessions(userId: string): Promise<any[]> {
    const sessionKeys = await cache.keys(`session:*`);
    const userSessions = [];
    
    for (const key of sessionKeys) {
      const sessionData = await cache.get(key);
      if (sessionData && sessionData.userId === userId && sessionData.isActive) {
        userSessions.push({
          sessionId: sessionData.sessionId,
          deviceInfo: sessionData.deviceInfo,
          createdAt: sessionData.createdAt,
          lastAccessAt: sessionData.lastAccessAt,
        });
      }
    }
    
    return userSessions;
  }
}

// Password reset functionality
export class PasswordResetManager {
  // Generate password reset token
  static async generateResetToken(email: string): Promise<string> {
    const token = TokenService.generateURLSafeToken(32);
    const expires = Date.now() + 3600000; // 1 hour
    
    await cache.set(`password_reset:${token}`, {
      email,
      expires,
      used: false,
    }, 3600);
    
    SecurityLogger.logPasswordReset(email, 'unknown');
    
    return token;
  }
  
  // Verify reset token
  static async verifyResetToken(token: string): Promise<string | null> {
    const resetData = await cache.get(`password_reset:${token}`);
    
    if (!resetData || resetData.used || resetData.expires < Date.now()) {
      return null;
    }
    
    return resetData.email;
  }
  
  // Use reset token (mark as used)
  static async useResetToken(token: string): Promise<boolean> {
    const resetData = await cache.get(`password_reset:${token}`);
    
    if (!resetData || resetData.used || resetData.expires < Date.now()) {
      return false;
    }
    
    resetData.used = true;
    await cache.set(`password_reset:${token}`, resetData, 3600);
    
    return true;
  }
}

// Two-factor authentication
export class TwoFactorAuth {
  // Generate TOTP secret
  static generateSecret(): string {
    return TokenService.generateSecureToken(20);
  }
  
  // Generate backup codes
  static generateBackupCodes(count: number = 8): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(TokenService.generateOTP(8));
    }
    return codes;
  }
  
  // Store 2FA setup temporarily
  static async storeTempSetup(userId: string, secret: string, backupCodes: string[]): Promise<string> {
    const setupToken = TokenService.generateURLSafeToken();
    
    await cache.set(`2fa_setup:${setupToken}`, {
      userId,
      secret,
      backupCodes,
      expires: Date.now() + 600000, // 10 minutes
    }, 600);
    
    return setupToken;
  }
  
  // Complete 2FA setup
  static async completeSetup(setupToken: string, verificationCode: string): Promise<boolean> {
    const setupData = await cache.get(`2fa_setup:${setupToken}`);
    
    if (!setupData || setupData.expires < Date.now()) {
      return false;
    }
    
    // Verify the code (simplified - in production use a proper TOTP library)
    const isValidCode = this.verifyTOTP(setupData.secret, verificationCode);
    
    if (!isValidCode) {
      return false;
    }
    
    // Store 2FA data for user
    await cache.set(`2fa:${setupData.userId}`, {
      secret: setupData.secret,
      backupCodes: setupData.backupCodes,
      enabled: true,
    });
    
    // Clean up setup data
    await cache.del(`2fa_setup:${setupToken}`);
    
    return true;
  }
  
  // Verify TOTP code (simplified implementation)
  private static verifyTOTP(secret: string, code: string): boolean {
    // In production, use a proper TOTP library like 'speakeasy'
    // This is a simplified verification for demonstration
    return code.length === 6 && /^\d{6}$/.test(code);
  }
  
  // Verify 2FA code for login
  static async verify2FA(userId: string, code: string): Promise<boolean> {
    const twoFAData = await cache.get(`2fa:${userId}`);
    
    if (!twoFAData || !twoFAData.enabled) {
      return false;
    }
    
    // Check TOTP code
    if (this.verifyTOTP(twoFAData.secret, code)) {
      return true;
    }
    
    // Check backup codes
    if (twoFAData.backupCodes.includes(code)) {
      // Remove used backup code
      twoFAData.backupCodes = twoFAData.backupCodes.filter((c: string) => c !== code);
      await cache.set(`2fa:${userId}`, twoFAData);
      return true;
    }
    
    return false;
  }
}

// Permission definitions
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Repair management
  REPAIRS_VIEW: 'repairs:view',
  REPAIRS_CREATE: 'repairs:create',
  REPAIRS_UPDATE: 'repairs:update',
  REPAIRS_DELETE: 'repairs:delete',
  REPAIRS_ASSIGN: 'repairs:assign',
  
  // Quote management
  QUOTES_VIEW: 'quotes:view',
  QUOTES_CREATE: 'quotes:create',
  QUOTES_UPDATE: 'quotes:update',
  QUOTES_APPROVE: 'quotes:approve',
  
  // Booking management
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_UPDATE: 'bookings:update',
  BOOKINGS_CANCEL: 'bookings:cancel',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Admin functions
  ADMIN_PANEL: 'admin:panel',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
} as const;

// Role-based permission assignments
export const ROLE_PERMISSIONS = {
  customer: [
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_CANCEL,
  ],
  technician: [
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.REPAIRS_UPDATE,
    PERMISSIONS.QUOTES_CREATE,
    PERMISSIONS.QUOTES_UPDATE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_UPDATE,
  ],
  manager: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.REPAIRS_ASSIGN,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_APPROVE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  admin: Object.values(PERMISSIONS),
};