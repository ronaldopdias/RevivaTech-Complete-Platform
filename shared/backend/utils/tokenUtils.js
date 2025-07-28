const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User object with id, email, role
 * @returns {Object} - Object containing access and refresh tokens
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'revivatech-api',
    audience: 'revivatech-app'
  });

  const refreshToken = jwt.sign(
    { 
      userId: user.id, 
      tokenId: uuidv4(),
      type: 'refresh'
    }, 
    JWT_REFRESH_SECRET, 
    {
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRY,
    tokenType: 'Bearer'
  };
};

/**
 * Verify an access token
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    });
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} - Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    });
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Generate a password reset token
 * @param {string} userId - User ID
 * @returns {string} - Password reset token
 */
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { 
      userId, 
      type: 'password_reset',
      tokenId: uuidv4()
    },
    JWT_SECRET,
    {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    }
  );
};

/**
 * Verify a password reset token
 * @param {string} token - Password reset token
 * @returns {Object} - Decoded token payload
 */
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    });
    
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Invalid password reset token: ${error.message}`);
  }
};

/**
 * Generate an email verification token
 * @param {string} userId - User ID
 * @returns {string} - Email verification token
 */
const generateEmailVerificationToken = (userId) => {
  return jwt.sign(
    { 
      userId, 
      type: 'email_verification',
      tokenId: uuidv4()
    },
    JWT_SECRET,
    {
      expiresIn: '24h', // Email verification tokens expire in 24 hours
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    }
  );
};

/**
 * Verify an email verification token
 * @param {string} token - Email verification token
 * @returns {Object} - Decoded token payload
 */
const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    });
    
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Invalid email verification token: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  extractTokenFromHeader
};