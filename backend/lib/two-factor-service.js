/**
 * Enhanced Two-Factor Authentication Service
 * Implements TOTP, backup codes, and advanced 2FA management
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { prisma } = require('./prisma');

class TwoFactorService {
  constructor() {
    this.appName = 'RevivaTech';
    this.backupCodeLength = 8;
    this.backupCodesCount = 10;
  }

  /**
   * Generate TOTP secret and QR code for user setup
   */
  async generateTOTPSetup(userId, userEmail) {
    try {
      const secret = speakeasy.generateSecret({
        name: `${this.appName} (${userEmail})`,
        issuer: this.appName,
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Store secret temporarily (not yet active)
      await prisma.userTwoFactor.upsert({
        where: { userId },
        update: {
          totpSecret: secret.base32,
          isEnabled: false, // Not enabled until verified
          backupCodes: null,
          updatedAt: new Date()
        },
        create: {
          userId,
          totpSecret: secret.base32,
          isEnabled: false,
          backupCodes: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        backupCodes: null // Only generated after verification
      };
    } catch (error) {
      throw new Error(`Failed to generate TOTP setup: ${error.message}`);
    }
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnableTOTP(userId, token) {
    try {
      const twoFactorRecord = await prisma.userTwoFactor.findUnique({
        where: { userId }
      });

      if (!twoFactorRecord || !twoFactorRecord.totpSecret) {
        throw new Error('No TOTP secret found for user');
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: twoFactorRecord.totpSecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!verified) {
        throw new Error('Invalid TOTP token');
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      // Enable 2FA and save backup codes
      await prisma.userTwoFactor.update({
        where: { userId },
        data: {
          isEnabled: true,
          backupCodes: hashedBackupCodes,
          enabledAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        backupCodes: backupCodes // Return plaintext codes ONLY once
      };
    } catch (error) {
      throw new Error(`Failed to verify TOTP: ${error.message}`);
    }
  }

  /**
   * Verify TOTP token for authentication
   */
  async verifyTOTP(userId, token) {
    try {
      const twoFactorRecord = await prisma.userTwoFactor.findUnique({
        where: { userId }
      });

      if (!twoFactorRecord || !twoFactorRecord.isEnabled) {
        throw new Error('2FA not enabled for user');
      }

      // Check if it's a backup code first
      if (token.length === this.backupCodeLength) {
        return this.verifyBackupCode(userId, token);
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: twoFactorRecord.totpSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      return { success: verified };
    } catch (error) {
      throw new Error(`Failed to verify TOTP: ${error.message}`);
    }
  }

  /**
   * Verify backup code and mark as used
   */
  async verifyBackupCode(userId, code) {
    try {
      const twoFactorRecord = await prisma.userTwoFactor.findUnique({
        where: { userId }
      });

      if (!twoFactorRecord || !twoFactorRecord.backupCodes) {
        return { success: false };
      }

      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      const backupCodes = twoFactorRecord.backupCodes;

      if (!backupCodes.includes(hashedCode)) {
        return { success: false };
      }

      // Remove used backup code
      const updatedCodes = backupCodes.filter(c => c !== hashedCode);
      
      await prisma.userTwoFactor.update({
        where: { userId },
        data: {
          backupCodes: updatedCodes,
          updatedAt: new Date()
        }
      });

      // Check if backup codes are running low
      const remainingCodes = updatedCodes.length;
      const lowCodeWarning = remainingCodes <= 3;

      return { 
        success: true, 
        remainingBackupCodes: remainingCodes,
        lowCodeWarning
      };
    } catch (error) {
      throw new Error(`Failed to verify backup code: ${error.message}`);
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId) {
    try {
      const twoFactorRecord = await prisma.userTwoFactor.findUnique({
        where: { userId }
      });

      if (!twoFactorRecord || !twoFactorRecord.isEnabled) {
        throw new Error('2FA not enabled for user');
      }

      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      await prisma.userTwoFactor.update({
        where: { userId },
        data: {
          backupCodes: hashedBackupCodes,
          updatedAt: new Date()
        }
      });

      return { backupCodes };
    } catch (error) {
      throw new Error(`Failed to regenerate backup codes: ${error.message}`);
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId) {
    try {
      await prisma.userTwoFactor.delete({
        where: { userId }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId) {
    try {
      const twoFactorRecord = await prisma.userTwoFactor.findUnique({
        where: { userId }
      });

      return {
        enabled: twoFactorRecord?.isEnabled || false,
        backupCodesRemaining: twoFactorRecord?.backupCodes?.length || 0
      };
    } catch (error) {
      return { enabled: false, backupCodesRemaining: 0 };
    }
  }

  /**
   * Generate secure backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < this.backupCodesCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

module.exports = new TwoFactorService();