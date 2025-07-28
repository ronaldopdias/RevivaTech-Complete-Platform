// Time-based One-Time Password (TOTP) Implementation
// Provides 2FA functionality with authenticator app integration

import * as crypto from 'crypto';

// TOTP Configuration
export const TOTP_CONFIG = {
  algorithm: 'SHA256',
  digits: 6,
  period: 30,
  issuer: 'RevivaTech',
  window: 1, // Allow 1 time step before/after current time
};

// Base32 encoding/decoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

class TOTPService {
  // Generate a random secret for new 2FA setup
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  // Generate TOTP URI for QR code
  generateTOTPUri(secret: string, userEmail: string, issuer = TOTP_CONFIG.issuer): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits.toString(),
      period: TOTP_CONFIG.period.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userEmail)}?${params.toString()}`;
  }

  // Generate QR code data URL
  generateQRCodeDataURL(uri: string): Promise<string> {
    // In a real implementation, you would use a QR code library like 'qrcode'
    // For now, we'll return a placeholder
    return Promise.resolve(`data:image/png;base64,${this.generateQRCodePlaceholder(uri)}`);
  }

  // Generate TOTP code for current time
  generateTOTP(secret: string, timeStep?: number): string {
    const time = timeStep || Math.floor(Date.now() / 1000 / TOTP_CONFIG.period);
    const key = this.base32Decode(secret);
    
    // Create time buffer (8 bytes, big-endian)
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
    timeBuffer.writeUInt32BE(time & 0xffffffff, 4);

    // Generate HMAC
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(timeBuffer);
    const digest = hmac.digest();

    // Dynamic truncation
    const offset = digest[digest.length - 1] & 0x0f;
    const code = ((digest[offset] & 0x7f) << 24) |
                 ((digest[offset + 1] & 0xff) << 16) |
                 ((digest[offset + 2] & 0xff) << 8) |
                 (digest[offset + 3] & 0xff);

    // Return last 6 digits
    return (code % Math.pow(10, TOTP_CONFIG.digits)).toString().padStart(TOTP_CONFIG.digits, '0');
  }

  // Verify TOTP code with time window
  verifyTOTP(secret: string, code: string): boolean {
    const currentTime = Math.floor(Date.now() / 1000 / TOTP_CONFIG.period);
    
    // Check current time step and adjacent steps (for clock drift)
    for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
      const timeStep = currentTime + i;
      const validCode = this.generateTOTP(secret, timeStep);
      
      if (validCode === code) {
        return true;
      }
    }
    
    return false;
  }

  // Generate backup codes
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  // Validate backup code format
  validateBackupCode(code: string): boolean {
    // Check if code is 8 characters, alphanumeric
    return /^[A-Fa-f0-9]{8}$/.test(code);
  }

  // Base32 encoding
  private base32Encode(buffer: Buffer): string {
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += BASE32_CHARS[(value << (5 - bits)) & 31];
    }

    return result;
  }

  // Base32 decoding
  private base32Decode(encoded: string): Buffer {
    encoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let result = Buffer.alloc(Math.floor(encoded.length * 5 / 8));
    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i];
      const charValue = BASE32_CHARS.indexOf(char);
      
      if (charValue === -1) continue;
      
      value = (value << 5) | charValue;
      bits += 5;

      if (bits >= 8) {
        result[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }

    return result.slice(0, index);
  }

  // Generate QR code placeholder (in real implementation, use a proper QR library)
  private generateQRCodePlaceholder(uri: string): string {
    // This is a placeholder - in production, use a library like 'qrcode'
    const placeholder = Buffer.from(`QR Code for: ${uri}`).toString('base64');
    return placeholder;
  }

  // Validate secret format
  validateSecret(secret: string): boolean {
    try {
      const decoded = this.base32Decode(secret);
      return decoded.length >= 10; // Minimum 10 bytes for security
    } catch (error) {
      return false;
    }
  }

  // Time remaining until next TOTP rotation
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(now / TOTP_CONFIG.period);
    const nextStep = (timeStep + 1) * TOTP_CONFIG.period;
    return nextStep - now;
  }

  // Get current time step
  getCurrentTimeStep(): number {
    return Math.floor(Date.now() / 1000 / TOTP_CONFIG.period);
  }
}

// Export singleton instance
export const totpService = new TOTPService();

// Export class for testing
export { TOTPService };

// Utility functions for frontend use
export const totpUtils = {
  // Format secret for display (with spaces every 4 characters)
  formatSecret: (secret: string): string => {
    return secret.replace(/(.{4})/g, '$1 ').trim();
  },

  // Validate TOTP code format
  isValidCodeFormat: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },

  // Clean user input (remove spaces, non-digits)
  cleanCodeInput: (input: string): string => {
    return input.replace(/\D/g, '');
  },

  // Check if TOTP is enabled for user
  isTOTPEnabled: (user: any): boolean => {
    return user?.twoFactorEnabled === true && user?.twoFactorSecret;
  },

  // Generate device fingerprint for trusted devices
  generateDeviceFingerprint: (): string => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ];
    
    // Simple hash - in production, use a proper hashing library
    return btoa(components.join('|')).slice(0, 16);
  },
};

export default totpService;