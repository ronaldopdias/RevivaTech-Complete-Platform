// Try bcryptjs first (pure JS), fallback to bcrypt
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (err) {
  bcrypt = require('bcrypt');
}
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random token in hex format
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a numeric OTP (One-Time Password)
 * @param {number} length - OTP length (default: 6)
 * @returns {string} - Numeric OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generate a password reset code (short, user-friendly)
 * @returns {string} - 8-character alphanumeric code
 */
const generateResetCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return code;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with score and feedback
 */
const validatePasswordStrength = (password) => {
  const result = {
    score: 0,
    feedback: [],
    isValid: false
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  // Check length
  if (password.length >= 8) {
    result.score += 1;
  } else {
    result.feedback.push('Password must be at least 8 characters long');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one lowercase letter');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one uppercase letter');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one number');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain at least one special character');
  }

  // Check for length > 12 (bonus point)
  if (password.length >= 12) {
    result.score += 1;
  }

  // Minimum score of 4 required (length + 3 character types)
  result.isValid = result.score >= 4;

  if (result.isValid && result.feedback.length === 0) {
    result.feedback.push('Password strength: Strong');
  }

  return result;
};

/**
 * Check if password has been pwned (common passwords)
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is commonly used
 */
const isCommonPassword = (password) => {
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'shadow', 'football', 'baseball',
    'superman', 'batman', 'trustno1', 'hello', 'welcome123'
  ];

  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Create a hash for rate limiting (email + IP combination)
 * @param {string} email - User email
 * @param {string} ip - User IP address
 * @returns {string} - Hash for rate limiting key
 */
const createRateLimitHash = (email, ip) => {
  return crypto
    .createHash('sha256')
    .update(`${email}:${ip}`)
    .digest('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateSecureToken,
  generateOTP,
  generateResetCode,
  validatePasswordStrength,
  isCommonPassword,
  createRateLimitHash
};