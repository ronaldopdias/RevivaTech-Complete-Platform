import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getConfig } from '../../config/environment';

const config = getConfig();

// Encryption service for sensitive data
export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;
  
  // Generate a random encryption key
  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }
  
  // Derive key from password using PBKDF2
  static deriveKey(password: string, salt: string, iterations: number = 100000): string {
    return crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, 'sha256').toString('hex');
  }
  
  // Encrypt data
  static encrypt(data: string, key: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, Buffer.from(key, 'hex'));
    cipher.setAAD(Buffer.from(key, 'hex'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }
  
  // Decrypt data
  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }, key: string): string {
    const decipher = crypto.createDecipher(
      this.algorithm,
      Buffer.from(key, 'hex')
    );
    
    decipher.setAAD(Buffer.from(key, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Encrypt object (JSON)
  static encryptObject(obj: any, key: string): string {
    const json = JSON.stringify(obj);
    const result = this.encrypt(json, key);
    return Buffer.from(JSON.stringify(result)).toString('base64');
  }
  
  // Decrypt object (JSON)
  static decryptObject<T>(encryptedData: string, key: string): T {
    const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    const decrypted = this.decrypt(data, key);
    return JSON.parse(decrypted);
  }
}

// Password hashing service
export class PasswordService {
  // Hash password with bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = config.BCRYPT_ROUNDS;
    return bcrypt.hash(password, saltRounds);
  }
  
  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Generate random password
  static generateRandomPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  // Check if password needs rehashing (for updating bcrypt rounds)
  static needsRehash(hash: string): boolean {
    return bcrypt.getRounds(hash) < config.BCRYPT_ROUNDS;
  }
}

// Token generation and validation
export class TokenService {
  // Generate JWT-style token (without using JWT library for custom implementation)
  static generateToken(payload: any, secret: string, expiresIn: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  // Verify and decode token
  static verifyToken(token: string, secret: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }
    
    return payload;
  }
  
  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Generate URL-safe token
  static generateURLSafeToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  // Generate numeric OTP
  static generateOTP(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}

// API key management
export class APIKeyService {
  private static readonly keyPrefix = 'rtech_';
  private static readonly keyLength = 32;
  
  // Generate API key
  static generateAPIKey(): {
    key: string;
    hash: string;
  } {
    const randomBytes = crypto.randomBytes(this.keyLength);
    const key = this.keyPrefix + randomBytes.toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    return { key, hash };
  }
  
  // Verify API key
  static verifyAPIKey(providedKey: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(providedKey).digest('hex');
    return hash === storedHash;
  }
  
  // Generate key with scopes
  static generateScopedAPIKey(scopes: string[]): {
    key: string;
    hash: string;
    scopes: string[];
  } {
    const { key, hash } = this.generateAPIKey();
    return { key, hash, scopes };
  }
}

// Data anonymization
export class AnonymizationService {
  // Hash personal identifiers
  static hashPII(data: string, salt: string): string {
    return crypto.createHash('sha256').update(data + salt).digest('hex');
  }
  
  // Mask email address
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.substring(0, 2)}***@${domain}`;
  }
  
  // Mask phone number
  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '***';
    return `***-***-${cleaned.slice(-4)}`;
  }
  
  // Mask credit card number
  static maskCreditCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    return `****-****-****-${cleaned.slice(-4)}`;
  }
  
  // Generate synthetic data for testing
  static generateSyntheticEmail(): string {
    const domains = ['example.com', 'test.com', 'demo.com'];
    const randomString = crypto.randomBytes(8).toString('hex');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `user_${randomString}@${domain}`;
  }
  
  static generateSyntheticPhone(): string {
    return `+44 7${Math.floor(Math.random() * 900000000 + 100000000)}`;
  }
}

// Secure file handling
export class SecureFileService {
  private static readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];
  
  // Calculate file hash
  static calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  // Validate file signature
  static validateFileSignature(buffer: Buffer, mimeType: string): boolean {
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    };
    
    const fileSignatures = signatures[mimeType];
    if (!fileSignatures) return false;
    
    return fileSignatures.some(signature =>
      signature.every((byte, index) => buffer[index] === byte)
    );
  }
  
  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, 255);
  }
  
  // Generate secure filename
  static generateSecureFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}.${ext}`;
  }
  
  // Check if file type is allowed
  static isAllowedFileType(mimeType: string): boolean {
    return this.allowedMimeTypes.includes(mimeType);
  }
}

// Audit logging for security events
export class SecurityAuditLogger {
  private static events: Array<{
    timestamp: Date;
    event: string;
    details: any;
    ip?: string;
    userId?: string;
  }> = [];
  
  static logSecurityEvent(
    event: string,
    details: any,
    ip?: string,
    userId?: string
  ): void {
    this.events.push({
      timestamp: new Date(),
      event,
      details,
      ip,
      userId,
    });
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // In production, this should be persisted to a secure audit log
    console.log('Security Event:', {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip,
      userId,
    });
  }
  
  static getAuditTrail(limit: number = 100): Array<any> {
    return this.events.slice(-limit);
  }
  
  static exportAuditLog(): string {
    return JSON.stringify(this.events, null, 2);
  }
}