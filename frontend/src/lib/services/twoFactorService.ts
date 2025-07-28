'use client';

// Enhanced Two-Factor Authentication Service
import { generateSecretKey, verifyTOTP, generateBackupCodes } from '@/lib/crypto/totp';
import { auditLogger } from '@/lib/security/audit-logger';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

interface TwoFactorVerification {
  token: string;
  backup?: boolean;
  trustDevice?: boolean;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  lastUsed: number;
  trustedDevices: string[];
  setupDate: number;
}

interface TrustedDevice {
  id: string;
  name: string;
  userAgent: string;
  ipAddress: string;
  createdAt: number;
  lastUsed: number;
}

class TwoFactorService {
  private readonly issuer = 'RevivaTech';
  private readonly algorithm = 'SHA1';
  private readonly digits = 6;
  private readonly period = 30;

  // Generate 2FA setup data
  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret key
      const secret = this.generateSecret();
      
      // Create account name
      const accountName = `${email} (RevivaTech)`;
      
      // Generate QR code URL
      const qrCodeUrl = this.generateQRCodeUrl(secret, accountName);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Log setup attempt
      await auditLogger.log({
        userId,
        action: '2fa_setup_initiated',
        category: 'Security',
        details: { email, accountName },
        riskScore: 20
      });

      return {
        secret,
        qrCodeUrl,
        backupCodes,
        issuer: this.issuer,
        accountName
      };
    } catch (error) {
      await auditLogger.log({
        userId,
        action: '2fa_setup_failed',
        category: 'Security',
        details: { error: error.message },
        riskScore: 60
      });
      throw error;
    }
  }

  // Verify 2FA token during setup
  async verifySetup(
    userId: string, 
    secret: string, 
    token: string
  ): Promise<boolean> {
    try {
      const isValid = this.verifyTOTPToken(secret, token);
      
      if (isValid) {
        await auditLogger.log({
          userId,
          action: '2fa_setup_completed',
          category: 'Security',
          details: { success: true },
          riskScore: 10
        });
        
        // In real implementation, save secret to database
        await this.saveTwoFactorSecret(userId, secret);
        
        return true;
      } else {
        await auditLogger.log({
          userId,
          action: '2fa_setup_verification_failed',
          category: 'Security',
          details: { reason: 'invalid_token' },
          riskScore: 40
        });
        
        return false;
      }
    } catch (error) {
      await auditLogger.log({
        userId,
        action: '2fa_setup_error',
        category: 'Security',
        details: { error: error.message },
        riskScore: 50
      });
      throw error;
    }
  }

  // Verify 2FA token during login
  async verifyLogin(
    userId: string, 
    verification: TwoFactorVerification
  ): Promise<{ success: boolean; trustDeviceToken?: string }> {
    try {
      let isValid = false;
      let usedBackupCode = false;

      if (verification.backup) {
        // Verify backup code
        isValid = await this.verifyBackupCode(userId, verification.token);
        usedBackupCode = true;
      } else {
        // Verify TOTP token
        const secret = await this.getTwoFactorSecret(userId);
        isValid = this.verifyTOTPToken(secret, verification.token);
      }

      if (isValid) {
        await auditLogger.log({
          userId,
          action: '2fa_verification_success',
          category: 'Authentication',
          details: { 
            method: verification.backup ? 'backup_code' : 'totp',
            trustDevice: verification.trustDevice 
          },
          riskScore: 10
        });

        // Update last used timestamp
        await this.updateLastUsed(userId);

        // Remove used backup code
        if (usedBackupCode) {
          await this.removeUsedBackupCode(userId, verification.token);
        }

        // Generate trust device token if requested
        let trustDeviceToken: string | undefined;
        if (verification.trustDevice) {
          trustDeviceToken = await this.trustDevice(userId);
        }

        return { success: true, trustDeviceToken };
      } else {
        await auditLogger.log({
          userId,
          action: '2fa_verification_failed',
          category: 'Authentication',
          details: { 
            method: verification.backup ? 'backup_code' : 'totp',
            reason: 'invalid_token' 
          },
          riskScore: 70
        });

        return { success: false };
      }
    } catch (error) {
      await auditLogger.log({
        userId,
        action: '2fa_verification_error',
        category: 'Authentication',
        details: { error: error.message },
        riskScore: 80
      });
      throw error;
    }
  }

  // Check if device is trusted
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const trustedDevices = await this.getTrustedDevices(userId);
      return trustedDevices.some(device => device.id === deviceFingerprint);
    } catch (error) {
      // Fail secure - require 2FA if check fails
      return false;
    }
  }

  // Generate backup codes
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();
      
      // In real implementation, save to database
      await this.saveBackupCodes(userId, backupCodes);
      
      await auditLogger.log({
        userId,
        action: '2fa_backup_codes_generated',
        category: 'Security',
        details: { count: backupCodes.length },
        riskScore: 30
      });

      return backupCodes;
    } catch (error) {
      await auditLogger.log({
        userId,
        action: '2fa_backup_codes_generation_failed',
        category: 'Security',
        details: { error: error.message },
        riskScore: 60
      });
      throw error;
    }
  }

  // Disable 2FA
  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    try {
      // Verify password before disabling
      const passwordValid = await this.verifyPassword(userId, password);
      
      if (!passwordValid) {
        await auditLogger.log({
          userId,
          action: '2fa_disable_failed',
          category: 'Security',
          details: { reason: 'invalid_password' },
          riskScore: 80
        });
        return false;
      }

      // Remove 2FA data
      await this.removeTwoFactorData(userId);
      
      await auditLogger.log({
        userId,
        action: '2fa_disabled',
        category: 'Security',
        details: { confirmed: true },
        riskScore: 70
      });

      return true;
    } catch (error) {
      await auditLogger.log({
        userId,
        action: '2fa_disable_error',
        category: 'Security',
        details: { error: error.message },
        riskScore: 90
      });
      throw error;
    }
  }

  // Get 2FA status
  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const userData = await this.getUserTwoFactorData(userId);
      
      return {
        enabled: !!userData.secret,
        backupCodesRemaining: userData.backupCodes?.length || 0,
        lastUsed: userData.lastUsed || 0,
        trustedDevices: userData.trustedDevices?.map(d => d.id) || [],
        setupDate: userData.setupDate || 0
      };
    } catch (error) {
      // Return safe defaults on error
      return {
        enabled: false,
        backupCodesRemaining: 0,
        lastUsed: 0,
        trustedDevices: [],
        setupDate: 0
      };
    }
  }

  // Get trusted devices
  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    try {
      const userData = await this.getUserTwoFactorData(userId);
      return userData.trustedDevices || [];
    } catch (error) {
      return [];
    }
  }

  // Remove trusted device
  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      await this.removeTrustedDeviceFromStorage(userId, deviceId);
      
      await auditLogger.log({
        userId,
        action: 'trusted_device_removed',
        category: 'Security',
        details: { deviceId },
        riskScore: 30
      });

      return true;
    } catch (error) {
      await auditLogger.log({
        userId,
        action: 'trusted_device_removal_failed',
        category: 'Security',
        details: { deviceId, error: error.message },
        riskScore: 50
      });
      return false;
    }
  }

  // Private helper methods
  private generateSecret(): string {
    // Generate a base32 secret (32 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateQRCodeUrl(secret: string, accountName: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.issuer,
      algorithm: this.algorithm,
      digits: this.digits.toString(),
      period: this.period.toString()
    });

    return `otpauth://totp/${encodeURIComponent(accountName)}?${params.toString()}`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    try {
      // Implement TOTP verification
      const window = 1; // Allow 1 time step tolerance
      const currentTime = Math.floor(Date.now() / 1000);
      
      for (let i = -window; i <= window; i++) {
        const timeStep = Math.floor(currentTime / this.period) + i;
        const expectedToken = this.generateTOTP(secret, timeStep);
        
        if (expectedToken === token) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // This is a simplified implementation
    // In production, use a proper TOTP library like speakeasy
    const hash = this.hmacSha1(secret, timeStep.toString());
    const offset = hash.charCodeAt(hash.length - 1) & 0xf;
    const code = ((hash.charCodeAt(offset) & 0x7f) << 24) |
                 ((hash.charCodeAt(offset + 1) & 0xff) << 16) |
                 ((hash.charCodeAt(offset + 2) & 0xff) << 8) |
                 (hash.charCodeAt(offset + 3) & 0xff);
    return (code % Math.pow(10, this.digits)).toString().padStart(this.digits, '0');
  }

  private hmacSha1(key: string, data: string): string {
    // Simplified HMAC-SHA1 - use crypto library in production
    return btoa(key + data);
  }

  private async trustDevice(userId: string): Promise<string> {
    const deviceId = this.generateDeviceFingerprint();
    const trustToken = this.generateSecureToken();
    
    const device: TrustedDevice = {
      id: deviceId,
      name: this.getDeviceName(),
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP(),
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    await this.addTrustedDevice(userId, device, trustToken);
    return trustToken;
  }

  private generateDeviceFingerprint(): string {
    // Generate device fingerprint based on browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substr(0, 16);
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile Device';
    if (ua.includes('Tablet')) return 'Tablet';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Database interaction placeholders
  private async saveTwoFactorSecret(userId: string, secret: string): Promise<void> {
    // Implement database save
  }

  private async getTwoFactorSecret(userId: string): Promise<string> {
    // Implement database retrieval
    return '';
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Implement backup code verification
    return false;
  }

  private async saveBackupCodes(userId: string, codes: string[]): Promise<void> {
    // Implement backup codes save
  }

  private async removeUsedBackupCode(userId: string, code: string): Promise<void> {
    // Implement backup code removal
  }

  private async updateLastUsed(userId: string): Promise<void> {
    // Implement last used update
  }

  private async verifyPassword(userId: string, password: string): Promise<boolean> {
    // Implement password verification
    return false;
  }

  private async removeTwoFactorData(userId: string): Promise<void> {
    // Implement 2FA data removal
  }

  private async getUserTwoFactorData(userId: string): Promise<any> {
    // Implement user 2FA data retrieval
    return {};
  }

  private async addTrustedDevice(userId: string, device: TrustedDevice, token: string): Promise<void> {
    // Implement trusted device addition
  }

  private async removeTrustedDeviceFromStorage(userId: string, deviceId: string): Promise<void> {
    // Implement trusted device removal
  }
}

// Create singleton instance
export const twoFactorService = new TwoFactorService();

// React hook for 2FA operations
export function useTwoFactor() {
  const [status, setStatus] = React.useState<TwoFactorStatus>({
    enabled: false,
    backupCodesRemaining: 0,
    lastUsed: 0,
    trustedDevices: [],
    setupDate: 0
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setupTwoFactor = async (userId: string, email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const setup = await twoFactorService.setupTwoFactor(userId, email);
      return setup;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async (userId: string, secret: string, token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFactorService.verifySetup(userId, secret, token);
      if (result) {
        await refreshStatus(userId);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (userId: string, verification: TwoFactorVerification) => {
    setLoading(true);
    setError(null);
    
    try {
      return await twoFactorService.verifyLogin(userId, verification);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async (userId: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await twoFactorService.disableTwoFactor(userId, password);
      if (result) {
        await refreshStatus(userId);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (userId: string) => {
    try {
      const newStatus = await twoFactorService.getTwoFactorStatus(userId);
      setStatus(newStatus);
    } catch (err) {
      console.error('Failed to refresh 2FA status:', err);
    }
  };

  return {
    status,
    loading,
    error,
    setupTwoFactor,
    verifySetup,
    verifyLogin,
    disableTwoFactor,
    refreshStatus
  };
}

export default twoFactorService;